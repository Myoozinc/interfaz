export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

/**
 * NONA Cloud Gateway — enrutador multi-proveedor "mejor modelo gratis disponible".
 *
 * Principios:
 *  1. Calidad primero: para construir apps completas se prueban primero los modelos con más capacidad y
 *     más tokens de salida (Gemini → Cerebras → SambaNova → OpenRouter free → Groq). Para ediciones pequeñas
 *     se prioriza la velocidad (Groq → Cerebras → Gemini ...).
 *  2. Nada de listas de modelos escritas a mano que caducan: los modelos disponibles se DESCUBREN en cada
 *     proveedor (/models) y se ordenan con un ranking por calidad. Si el descubrimiento falla, hay respaldo estático.
 *  3. Disponibilidad: cualquier fallo (429, 4xx/5xx, timeout, stream vacío o con error antes del primer token)
 *     conmuta al siguiente candidato y deja el modelo en "enfriamiento" para no volver a probarlo enseguida.
 *  4. Honestidad con el cliente: si la salida se corta (límite de tokens o tiempo de la función) se avisa con
 *     {"meta":{"truncated":true}} para que el cliente reintente con otro proveedor en vez de usar código a medias.
 *
 * Protocolo de respuesta (NDJSON, una línea por evento):
 *   {"message":{"content":"..."}}                       texto
 *   {"meta":{"provider":"gemini","model":"..."}}        proveedor elegido (primera línea)
 *   {"meta":{"truncated":true,"reason":"length|time"}}  salida incompleta
 *   {"error":"..."}                                     fallo a mitad del stream
 */

type Kind = 'groq' | 'gemini' | 'cerebras' | 'sambanova' | 'openrouter';

interface Attempt {
  kind: Kind;
  key: string;
  model: string;
  maxOut: number;
}

type Ev =
  | { t: 'think'; v: string }
  | { t: 'text'; v: string }
  | { t: 'finish'; reason: string }
  | { t: 'error'; v: string };

const BASE: Record<Kind, string> = {
  groq: 'https://api.groq.com/openai/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  cerebras: 'https://api.cerebras.ai/v1',
  sambanova: 'https://api.sambanova.ai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
};

// Respaldo si el descubrimiento de modelos falla (ids estables conocidos).
const STATIC_MODELS: Record<Kind, string[]> = {
  groq: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  gemini: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'],
  cerebras: ['gpt-oss-120b', 'llama-3.3-70b'],
  sambanova: ['DeepSeek-V3.1', 'Meta-Llama-3.3-70B-Instruct'],
  openrouter: ['openrouter/free'],
};

// Límite de caracteres por mensaje: los proveedores con TPM bajo necesitan compactar; los de contexto grande no.
const MSG_LIMIT: Record<Kind, number> = {
  groq: 14000,
  cerebras: 20000,
  sambanova: 24000,
  gemini: 200000,
  openrouter: 80000,
};

const START_BUDGET_MS = 30000;   // tiempo máximo para encontrar un proveedor que responda
const FIRST_TOKEN_MS = 20000;    // espera máxima al primer token de cada intento
const STREAM_DEADLINE_MS = 56000; // Vercel corta a los 60 s: cerramos limpio antes

// ---------------------------------------------------------------------------------------------
// Estado en memoria (persiste mientras la instancia serverless esté caliente)
// ---------------------------------------------------------------------------------------------
const modelCache = new Map<string, { at: number; models: any[] }>();
const cooldown = new Map<string, number>();

const isCooling = (id: string) => (cooldown.get(id) || 0) > Date.now();
const cool = (id: string, ms: number) => cooldown.set(id, Date.now() + ms);

function coolByStatus(a: Attempt, status: number, body: string) {
  const mid = `${a.kind}:${a.model}`;
  const kid = `${a.kind}:key:${a.key.slice(-6)}`;
  if (status === 401 || status === 403) cool(kid, 10 * 60_000);
  else if (status === 404 || (status === 400 && /model|not found|does not exist|decommission/i.test(body))) cool(mid, 30 * 60_000);
  else if (status === 413) cool(mid, 5 * 60_000);
  else if (status === 429) cool(mid, /quota|per day|daily/i.test(body) ? 30 * 60_000 : 45_000);
  else if (status >= 500) cool(mid, 30_000);
  else cool(mid, 60_000);
}

async function fetchJson(url: string, key: string | null, ms = 3500): Promise<any | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: key ? { Authorization: `Bearer ${key}` } : {}, signal: ctl.signal });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function discover(kind: Kind, key: string): Promise<any[]> {
  const hit = modelCache.get(kind);
  if (hit && Date.now() - hit.at < 10 * 60_000) return hit.models;
  const data = await fetchJson(`${BASE[kind]}/models`, kind === 'openrouter' ? null : key);
  const list: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : [];
  if (list.length > 0) modelCache.set(kind, { at: Date.now(), models: list });
  return list;
}

// ---------------------------------------------------------------------------------------------
// Ranking de calidad por proveedor (mayor puntaje = mejor para generar código)
// ---------------------------------------------------------------------------------------------
type Rule = [RegExp, number];

function scoreBy(id: string, rules: Rule[], fallback: number): number {
  for (const [re, s] of rules) if (re.test(id)) return s;
  return fallback;
}

const GROQ_RULES: Rule[] = [
  [/gpt-oss-120b/i, 100], [/kimi-k2/i, 96], [/qwen3?-?.*32b/i, 90], [/llama-3\.3-70b/i, 86],
  [/maverick/i, 82], [/scout/i, 72], [/gpt-oss-20b/i, 60], [/llama-3\.1-8b/i, 30],
];
const CEREBRAS_RULES: Rule[] = [
  [/qwen-3-coder/i, 100], [/gpt-oss-120b/i, 98], [/qwen-3-235b/i, 95], [/glm/i, 92],
  [/llama-3\.3-70b|llama3\.3-70b/i, 84], [/qwen-3-32b/i, 78], [/llama3\.1-8b|llama-3\.1-8b/i, 30],
];
const SAMBA_RULES: Rule[] = [
  [/DeepSeek-V3/i, 100], [/gpt-oss-120b/i, 96], [/Qwen3-235B/i, 93], [/Qwen3-32B/i, 85],
  [/Llama-3\.3-70B/i, 80], [/DeepSeek-R1/i, 70],
];

function rankGroq(list: any[], vision: boolean): string[] {
  const ids: string[] = list.map(m => m.id).filter(Boolean);
  const bad = /whisper|tts|guard|orpheus|playai|distil|compound|embed|allam/i;
  return ids
    .filter(id => !bad.test(id))
    .filter(id => (vision ? /vision|scout|maverick/i.test(id) : /llama|qwen|gpt-oss|kimi|deepseek|mixtral/i.test(id)))
    .sort((a, b) => scoreBy(b, GROQ_RULES, 10) - scoreBy(a, GROQ_RULES, 10));
}

function rankCerebras(list: any[]): string[] {
  const ids: string[] = list.map(m => m.id).filter(Boolean);
  return ids.filter(id => !/embed|whisper/i.test(id)).sort((a, b) => scoreBy(b, CEREBRAS_RULES, 10) - scoreBy(a, CEREBRAS_RULES, 10));
}

function rankSamba(list: any[]): string[] {
  const ids: string[] = list.map(m => m.id).filter(Boolean);
  return ids
    .filter(id => /llama|qwen|deepseek|gpt-oss/i.test(id) && !/embed|whisper|e5|vision|guard/i.test(id))
    .sort((a, b) => scoreBy(b, SAMBA_RULES, 10) - scoreBy(a, SAMBA_RULES, 10));
}

function rankGemini(list: any[]): string[] {
  const ids: string[] = list.map(m => String(m.id || m.name || '').replace(/^models\//, '')).filter(Boolean);
  const bad = /embed|tts|image|imagen|veo|live|audio|aqa|gemma|robotics|computer|learnlm|exp|thinking|latest-|deep-research/i;
  const scored = ids
    .filter(id => /^gemini-/.test(id) && !bad.test(id))
    .map(id => {
      const ver = parseFloat((id.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || '1');
      const fam = /flash-lite/.test(id) ? 120 : /flash/.test(id) ? 200 : /pro/.test(id) ? 300 : 100;
      const preview = /preview|\d{2}-\d{2}/.test(id) ? -3 : 0;
      return { id, s: fam + ver * 20 + preview };
    })
    .sort((a, b) => b.s - a.s);
  return scored.map(x => x.id);
}

function rankOpenRouter(list: any[]): string[] {
  const rules: Rule[] = [
    [/coder/i, 60], [/(qwen3|qwen-3).*(235|480|next|max)/i, 58], [/kimi/i, 52], [/deepseek.*(v3|chat|r1)/i, 50],
    [/gpt-oss-120b/i, 50], [/glm-4/i, 46], [/gemini/i, 46], [/llama-3\.3-70b/i, 40], [/mistral.*(large|small-3|medium)/i, 32],
    [/nemotron/i, 25], [/gemma-?\d*-?(27|31)b/i, 22],
  ];
  const rows = list
    .filter(m => {
      const id: string = m.id || '';
      const free = id.endsWith(':free') || (Number(m.pricing?.prompt) === 0 && Number(m.pricing?.completion) === 0);
      if (!free || id === 'openrouter/free') return false;
      if (/embed|image|audio|lyria|guard|whisper|tts|vision-only/i.test(id)) return false;
      return (m.context_length || 0) >= 16000;
    })
    .map(m => {
      const id: string = m.id;
      let s = Math.min(m.context_length || 0, 131072) / 2000;
      s += scoreBy(id, rules, 0);
      if (/[^\d.](?:1|2|3|4|7|8|9)b\b/i.test(id.replace(/:free$/, ''))) s -= 30; // modelos diminutos
      return { id, s };
    })
    .sort((a, b) => b.s - a.s);
  return rows.map(r => r.id);
}

// ---------------------------------------------------------------------------------------------
// Utilidades de stream
// ---------------------------------------------------------------------------------------------
async function* streamEvents(resp: Response): AsyncGenerator<Ev> {
  const reader = resp.body?.getReader();
  if (!reader) return;
  const dec = new TextDecoder();
  let buf = '';

  const parse = (line: string): Ev[] => {
    const out: Ev[] = [];
    const s = line.trim();
    if (!s || s.startsWith(':') || s === 'data: [DONE]') return out;
    const raw = s.startsWith('data:') ? s.slice(5).trim() : s;
    if (!raw.startsWith('{')) return out;
    let j: any;
    try { j = JSON.parse(raw); } catch { return out; }
    if (j.error) {
      out.push({ t: 'error', v: j.error.message || JSON.stringify(j.error) });
      return out;
    }
    const c = j.choices?.[0];
    if (!c) return out;
    const d = c.delta || {};
    const reasoning = d.reasoning_content || d.reasoning || '';
    const text = d.content ?? c.message?.content ?? c.text ?? '';
    if (reasoning) out.push({ t: 'think', v: String(reasoning) });
    if (text) out.push({ t: 'text', v: String(text) });
    if (c.finish_reason) out.push({ t: 'finish', reason: String(c.finish_reason) });
    return out;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const l of lines) for (const e of parse(l)) yield e;
  }
  if (buf.trim()) for (const e of parse(buf)) yield e;
}

/** Lee eventos hasta obtener el primero con contenido (o un fallo). */
async function firstMeaningful(it: AsyncGenerator<Ev>): Promise<Ev | null> {
  while (true) {
    const n = await it.next();
    if (n.done) return null;
    if (n.value.t === 'think' || n.value.t === 'text' || n.value.t === 'error') return n.value;
    // 'finish' sin contenido previo => respuesta vacía
    if (n.value.t === 'finish') return null;
  }
}

// ---------------------------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------------------------
export default async function handler(req: any, res?: any) {
  const startedAt = Date.now();
  const isNode = Boolean(res && typeof res.status === 'function');

  const reply = (status: number, data: any) => {
    if (isNode) return res.status(status).json(data);
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  };

  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });

  try {
    let body: any = {};
    if (isNode) {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    } else {
      try { body = await req.json(); } catch { body = {}; }
    }

    const authHeader = isNode
      ? (req.headers?.['authorization'] || req.headers?.['Authorization'] || '')
      : (req.headers?.get ? (req.headers.get('Authorization') || '') : '');

    const { model, messages = [], apiKey, openrouterKey, groqKey, maxTokensRequested, temperature, skip } = body;
    const safeMessages: any[] = Array.isArray(messages) ? messages : [];
    const hasImages = safeMessages.some((m: any) => m.images && m.images.length > 0);
    const clientBearer = authHeader ? String(authHeader).replace('Bearer ', '').trim() : '';
    const skipSet = new Set<string>(Array.isArray(skip) ? skip.map(String) : []);

    // -------- Llaves (del usuario primero, luego las del servidor) --------
    const pickUser = (prefix: string) =>
      [groqKey, openrouterKey, apiKey, clientBearer].find(k => typeof k === 'string' && k.startsWith(prefix)) || '';
    const envKeys = (single: string, multi: string): string[] =>
      [process.env[single] || '', ...((process.env[multi] || '').split(','))].map(k => k.trim()).filter(Boolean);

    const uniq = (a: string[]) => Array.from(new Set(a.filter(Boolean)));
    const keys: Record<Kind, string[]> = {
      groq: uniq([pickUser('gsk_'), ...envKeys('GROQ_API_KEY', 'GROQ_API_KEYS')]).slice(0, 3),
      gemini: uniq(envKeys('GEMINI_API_KEY', 'GEMINI_API_KEYS')).slice(0, 3),
      cerebras: uniq(envKeys('CEREBRAS_API_KEY', 'CEREBRAS_API_KEYS')).slice(0, 2),
      sambanova: uniq(envKeys('SAMBANOVA_API_KEY', 'SAMBANOVA_API_KEYS')).slice(0, 2),
      openrouter: uniq([pickUser('sk-or-'), (process.env.OPENROUTER_API_KEY || '').trim()]).slice(0, 2),
    };

    const anyKey = (Object.values(keys) as string[][]).some(k => k.length > 0);
    if (!anyKey) {
      return reply(401, {
        error: 'NONA Cloud Gateway: no hay ninguna API key configurada. Agrega al menos GEMINI_API_KEY (gratis en aistudio.google.com) o GROQ_API_KEY en las variables de entorno de Vercel.',
      });
    }

    const want = Math.max(300, Math.min(Number(maxTokensRequested) || 8000, 32000));
    const totalChars = safeMessages.reduce((n, m) => n + String(m.content || '').length, 0);
    const big = want >= 6000 || totalChars > 20000;
    const temp = typeof temperature === 'number' ? temperature : 0.15;
    const hint = typeof model === 'string' && model !== 'auto' && model !== 'default' ? model : '';

    // -------- Construcción de la lista ordenada de candidatos --------
    const attempts: Attempt[] = [];
    const push = (kind: Kind, models: string[], n: number, maxOutFor: (m: string) => number) => {
      if (keys[kind].length === 0 || skipSet.has(kind)) return;
      const ordered = hint && models.includes(hint) ? [hint, ...models.filter(m => m !== hint)] : models;
      for (const m of ordered.slice(0, n)) {
        if (skipSet.has(`${kind}:${m}`)) continue;
        for (const key of keys[kind]) attempts.push({ kind, key, model: m, maxOut: Math.min(want, maxOutFor(m)) });
      }
    };

    const [gList, gemList, cList, sList, oList] = await Promise.all([
      keys.groq.length ? discover('groq', keys.groq[0]) : [],
      keys.gemini.length ? discover('gemini', keys.gemini[0]) : [],
      keys.cerebras.length ? discover('cerebras', keys.cerebras[0]) : [],
      keys.sambanova.length ? discover('sambanova', keys.sambanova[0]) : [],
      keys.openrouter.length ? discover('openrouter', '') : [],
    ]);

    const groqModels = gList.length ? rankGroq(gList, hasImages) : (hasImages ? ['llama-3.2-11b-vision-preview'] : STATIC_MODELS.groq);
    const gemModels = gemList.length ? rankGemini(gemList) : STATIC_MODELS.gemini;
    const cerModels = cList.length ? rankCerebras(cList) : STATIC_MODELS.cerebras;
    const samModels = sList.length ? rankSamba(sList) : STATIC_MODELS.sambanova;
    const orRanked = oList.length ? rankOpenRouter(oList) : [];
    const orModels = [...orRanked.slice(0, 6), 'openrouter/free'];

    // Groq: los modelos grandes tienen un TPM bajo en el plan gratis, así que su salida se limita.
    const groqOut = (m: string) => (/70b|120b|32b|maverick|kimi/i.test(m) ? 4000 : 8000);

    if (hasImages) {
      // Visión: Gemini → OpenRouter (gemini) → Groq vision
      push('gemini', gemModels.filter(m => !/lite/.test(m)), 2, () => 8000);
      if (keys.openrouter.length && !skipSet.has('openrouter')) {
        for (const key of keys.openrouter) attempts.push({ kind: 'openrouter', key, model: 'google/gemini-2.5-flash', maxOut: Math.min(want, 8000) });
      }
      push('groq', groqModels, 2, () => 2000);
    } else if (big) {
      // Construcciones grandes: capacidad y tokens de salida primero
      push('gemini', gemModels, 3, () => 32000);
      push('cerebras', cerModels, 2, () => 8000);
      push('sambanova', samModels, 2, () => 8000);
      push('openrouter', orModels, 5, () => 16000);
      push('groq', groqModels, 2, groqOut);
    } else {
      // Ediciones pequeñas: velocidad primero
      push('groq', groqModels, 2, groqOut);
      push('cerebras', cerModels, 1, () => 8000);
      push('gemini', gemModels.filter(m => /flash/.test(m)), 2, () => 16000);
      push('sambanova', samModels, 1, () => 8000);
      push('openrouter', orModels, 3, () => 12000);
    }

    // Quitar los que están en enfriamiento (salvo que no quede ninguno: disponibilidad ante todo)
    const usable = attempts.filter(a => !isCooling(`${a.kind}:${a.model}`) && !isCooling(`${a.kind}:key:${a.key.slice(-6)}`));
    const queue = usable.length > 0 ? usable : attempts;

    // -------- Ejecución con failover --------
    const compact = (msgs: any[], limit: number) =>
      msgs.map((m: any) => {
        let text = String(m.content || '');
        if (text.length > limit) {
          const head = Math.floor(limit * 0.64);
          const tail = Math.floor(limit * 0.28);
          text = text.slice(0, head) + '\n\n/* ... [contexto comprimido por seguridad] ... */\n\n' + text.slice(-tail);
        }
        if (m.images && m.images.length > 0) {
          const parts: any[] = [{ type: 'text', text }];
          m.images.forEach((img: string) => {
            parts.push({ type: 'image_url', image_url: { url: img.startsWith('data:') ? img : `data:image/png;base64,${img}` } });
          });
          return { role: m.role, content: parts };
        }
        return { role: m.role, content: text };
      });

    const errors: string[] = [];
    let chosen: { a: Attempt; it: AsyncGenerator<Ev>; first: Ev; ctl: AbortController } | null = null;

    for (const a of queue) {
      if (Date.now() - startedAt > START_BUDGET_MS) { errors.push('presupuesto de tiempo agotado'); break; }

      const callOnce = async (withReasoning: boolean) => {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), FIRST_TOKEN_MS);
        try {
          const payload: any = {
            model: a.model,
            messages: compact(safeMessages, MSG_LIMIT[a.kind]),
            stream: true,
            temperature: temp,
            max_tokens: a.maxOut,
          };
          if (a.kind === 'gemini' && withReasoning) payload.reasoning_effort = 'low';
          const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${a.key}` };
          if (a.kind === 'openrouter') {
            headers['HTTP-Referer'] = 'https://interfaz-hazel.vercel.app';
            headers['X-Title'] = 'NONA AI Software Factory';
          }
          const r = await fetch(`${BASE[a.kind]}/chat/completions`, { method: 'POST', headers, body: JSON.stringify(payload), signal: ctl.signal });
          if (!r.ok) {
            const txt = await r.text().catch(() => '');
            clearTimeout(timer);
            return { ok: false as const, status: r.status, txt };
          }
          const it = streamEvents(r);
          const first = await firstMeaningful(it);
          clearTimeout(timer);
          if (!first) return { ok: false as const, status: 0, txt: 'respuesta vacía' };
          if (first.t === 'error') return { ok: false as const, status: 502, txt: first.v };
          return { ok: true as const, it, first, ctl };
        } catch (e: any) {
          clearTimeout(timer);
          ctl.abort();
          return { ok: false as const, status: 0, txt: e?.name === 'AbortError' ? 'timeout esperando al modelo' : (e?.message || 'error de red') };
        }
      };

      let out = await callOnce(true);
      // Si Gemini rechaza reasoning_effort, reintenta el mismo modelo sin él
      if (!out.ok && a.kind === 'gemini' && out.status === 400 && /reasoning/i.test(out.txt)) out = await callOnce(false);

      if (out.ok) {
        chosen = { a, it: out.it, first: out.first, ctl: out.ctl };
        break;
      }
      coolByStatus(a, out.status, out.txt);
      errors.push(`${a.kind}/${a.model}: ${out.status || 'x'} ${out.txt.slice(0, 90).replace(/\s+/g, ' ')}`);
    }

    if (!chosen) {
      return reply(502, { error: `Todos los proveedores de IA están saturados o no responden. Detalle: ${errors.slice(-6).join(' | ')}` });
    }

    // -------- Streaming al cliente --------
    const { a, it, first, ctl } = chosen;
    const enc = new TextEncoder();
    let thinking = false;
    let truncated: string | null = null;

    const pump = async (write: (o: any) => void) => {
      write({ meta: { provider: a.kind, model: a.model } });

      const handle = (e: Ev) => {
        if (e.t === 'think') {
          if (!thinking) { write({ message: { content: '<think>\n' } }); thinking = true; }
          write({ message: { content: e.v } });
        } else if (e.t === 'text') {
          if (thinking) { write({ message: { content: '\n</think>\n' } }); thinking = false; }
          write({ message: { content: e.v } });
        } else if (e.t === 'finish') {
          if (e.reason === 'length') truncated = 'length';
        } else if (e.t === 'error') {
          write({ error: e.v });
        }
      };

      handle(first);
      try {
        while (true) {
          if (Date.now() - startedAt > STREAM_DEADLINE_MS) { truncated = 'time'; ctl.abort(); break; }
          const n = await it.next();
          if (n.done) break;
          handle(n.value);
        }
      } catch (e: any) {
        if (!truncated) write({ error: `Conexión con ${a.kind} interrumpida: ${e?.message || 'stream cortado'}` });
      }
      if (thinking) write({ message: { content: '\n</think>\n' } });
      if (truncated) write({ meta: { truncated: true, reason: truncated, provider: a.kind, model: a.model } });
    };

    if (isNode) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      await pump(o => res.write(JSON.stringify(o) + '\n'));
      res.end();
      return;
    }

    const stream = new ReadableStream({
      async start(controller) {
        await pump(o => controller.enqueue(enc.encode(JSON.stringify(o) + '\n')));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  } catch (err: any) {
    if (isNode) {
      if (!res.headersSent) return res.status(500).json({ error: err.message });
      res.write(JSON.stringify({ error: err.message }) + '\n');
      return res.end();
    }
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
