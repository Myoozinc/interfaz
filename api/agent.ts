export const config = {
  runtime: 'nodejs',
  maxDuration: 300,
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

type Kind = 'groq' | 'gemini' | 'cerebras' | 'sambanova' | 'openrouter' | 'mistral' | 'nvidia' | 'github' | 'pollinations'
  | 'openai' | 'anthropic' | 'deepseek'; // estas tres solo con la llave propia del usuario

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
  mistral: 'https://api.mistral.ai/v1',          // plan gratuito "Experiment" (sin tarjeta)
  nvidia: 'https://integrate.api.nvidia.com/v1', // build.nvidia.com: acceso gratuito para desarrolladores
  github: 'https://models.github.ai/inference',  // GitHub Models: gratis con un token de GitHub
  pollinations: 'https://text.pollinations.ai/openai', // sin llave (último recurso); con POLLINATIONS_API_KEY usa gen.pollinations.ai
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1', // compatibilidad OpenAI de la API de Claude
  deepseek: 'https://api.deepseek.com/v1',
};
const chatUrl = (kind: Kind, key: string) =>
  kind === 'pollinations' ? (key === 'anon' ? BASE.pollinations : 'https://gen.pollinations.ai/v1/chat/completions') : `${BASE[kind]}/chat/completions`;

// Respaldo si el descubrimiento de modelos falla (ids estables conocidos).
const STATIC_MODELS: Record<Kind, string[]> = {
  groq: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'],
  cerebras: ['gpt-oss-120b', 'llama-3.3-70b'],
  sambanova: ['DeepSeek-V3.1', 'Meta-Llama-3.3-70B-Instruct'],
  openrouter: ['openrouter/free'],
  mistral: ['mistral-medium-latest', 'devstral-medium-latest', 'codestral-latest', 'mistral-large-latest'],
  nvidia: ['moonshotai/kimi-k3', 'deepseek-ai/deepseek-v4-pro-0813', 'qwen/qwen3-coder-480b-a35b-instruct', 'nvidia/nemotron-3-ultra-550b-a55b', 'openai/gpt-oss-120b'],
  github: ['openai/gpt-4.1', 'deepseek/DeepSeek-V3-0324', 'openai/gpt-4.1-mini'],
  pollinations: ['openai'],
  openai: ['gpt-5', 'gpt-4.1'],
  anthropic: ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-4-5-20251001'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
};

// Límite de caracteres por mensaje: los proveedores con TPM bajo necesitan compactar; los de contexto grande no.
// Nunca se recorta código a la mitad (rompería los parches): si no cabe, el proveedor lo rechaza y se pasa al siguiente.
const MSG_LIMIT: Record<Kind, number> = {
  groq: 400000,
  cerebras: 400000,
  sambanova: 400000,
  gemini: 400000,
  openrouter: 400000,
  mistral: 400000,
  nvidia: 400000,
  github: 28000, // GitHub Models gratis: ~8k tokens de entrada
  pollinations: 60000,
  openai: 400000,
  anthropic: 400000,
  deepseek: 400000,
};

// Tokens por minuto del plan gratuito de Groq (aprox.). Una petición (entrada + salida) debe caber en el TPM del modelo.
const GROQ_TPM: Array<[RegExp, number]> = [
  [/scout/i, 30000], [/qwen3\.[5-9]/i, 8000], [/llama-3\.3-70b/i, 12000], [/kimi/i, 10000], [/gpt-oss-120b/i, 8000],
  [/gpt-oss-20b/i, 8000], [/qwen3?.*32b/i, 6000], [/maverick/i, 6000], [/llama-3\.1-8b/i, 6000],
];
const groqTpm = (m: string) => (GROQ_TPM.find(([re]) => re.test(m)) || [null, 6000])[1];

const START_BUDGET_MS = 60000;   // tiempo máximo para encontrar un proveedor que responda
const FIRST_TOKEN_MS = 20000;    // espera máxima al primer token de cada intento
const STREAM_DEADLINE_MS = 285000; // maxDuration 300 s: cerramos limpio antes

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
  else if (status === 404 || status === 410 || (status === 400 && /model|not found|does not exist|decommission/i.test(body))) cool(mid, 6 * 60 * 60_000);
  else if (status === 413) cool(mid, 5 * 60_000);
  else if (status === 429) cool(mid, /limit:\s*0|free.?tier/i.test(body) ? 6 * 60 * 60_000 : /quota|per day|daily/i.test(body) ? 30 * 60_000 : 45_000);
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
  [/gpt-oss-120b/i, 100], [/qwen3\.[5-9]/i, 98], [/kimi-k2/i, 96], [/qwen3?-?.*32b/i, 90], [/llama-3\.3-70b/i, 86],
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
  const bad = /whisper|tts|guard|orpheus|playai|distil|compound|embed|allam|safeguard/i;
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
  const bad = /embed|tts|image|imagen|veo|live|audio|aqa|gemma|robotics|computer|learnlm|exp|thinking|latest-|deep-research|customtools|nano|banana|transcribe|translate|omni|argon/i;
  // Plan gratuito: los modelos "Pro" casi nunca tienen cuota gratis (429 / 404), así que se prueban al final.
  // Primero Flash (rápido, gratis y muy bueno en código), luego Flash-Lite, y por último Pro.
  const scored = ids
    .filter(id => /^gemini-/.test(id) && !bad.test(id))
    .map(id => {
      const ver = parseFloat((id.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || '1');
      const fam = /flash-lite/.test(id) ? 250 : /flash/.test(id) ? 300 : /pro/.test(id) ? 100 : 50;
      const preview = /preview|\d{2}-\d{2}/.test(id) ? -3 : 0;
      return { id, s: fam + ver * 20 + preview };
    })
    .sort((a, b) => b.s - a.s);
  return scored.map(x => x.id);
}

function rankOpenRouter(list: any[]): string[] {
  // Medido en NONA (oct 2026, componente React completo): nemotron-3-super 10 s, dots-3 17 s, nemotron-3.5-lightning 21 s,
  // north-mini-code 33 s, nemotron-3-ultra 62 s (el más completo); laguna-s gasta la salida razonando; inkling da 403.
  const rules: Rule[] = [
    [/nemotron-3-super/i, 75], [/dots-3/i, 68], [/nemotron-3-ultra/i, 66], [/nemotron-3\.5-lightning/i, 62],
    [/north-mini-code/i, 55], [/laguna-s/i, 40], [/inkling/i, -40],
    [/coder/i, 60], [/(qwen3|qwen-3).*(235|480|next|max)/i, 58], [/kimi/i, 52], [/deepseek.*(v3|chat|r1)/i, 50],
    [/gpt-oss-120b/i, 50], [/glm-4/i, 46], [/gemini/i, 46], [/llama-3\.3-70b/i, 40], [/mistral.*(large|small-3|medium)/i, 32],
    [/nemotron/i, 25], [/gemma-?\d*-?(27|31)b/i, 22],
  ];
  const rows = list
    .filter(m => {
      const id: string = m.id || '';
      const free = id.endsWith(':free') || (Number(m.pricing?.prompt) === 0 && Number(m.pricing?.completion) === 0);
      if (!free || id === 'openrouter/free') return false;
      if (/embed|image|audio|lyria|guard|whisper|tts|vision-only|safety|lfm-|nano|laguna-xs/i.test(id)) return false;
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

// NVIDIA (build.nvidia.com): muchos modelos con "Free Endpoint"; se descubren y se ordenan por calidad para código.
const NVIDIA_RULES: Rule[] = [
  [/kimi-k3/i, 100], [/deepseek-v4-pro/i, 99], [/qwen3?-coder-480b|qwen3\.\d-coder/i, 97], [/deepseek-v4/i, 95],
  [/nemotron-3-ultra/i, 93], [/kimi-k2/i, 90], [/deepseek-v3\.\d/i, 88], [/gpt-oss-120b/i, 86], [/qwen3-235b|qwen3\.\d/i, 84],
  [/nemotron-3-super/i, 80], [/llama-4-maverick/i, 72], [/nemotron-3\.5-lightning/i, 70],
];
function rankNvidia(list: any[]): string[] {
  const ids: string[] = list.map(m => m.id).filter(Boolean);
  return ids
    .filter(id => !/embed|rerank|guard|safety|vision|vlm|parse|retriever|clip|whisper|tts|asr|reward|nano|mini|\b[1-9]b\b|cosmos|riva|bge|nv-embed/i.test(id))
    .filter(id => scoreBy(id, NVIDIA_RULES, 0) > 0)
    .sort((a, b) => scoreBy(b, NVIDIA_RULES, 0) - scoreBy(a, NVIDIA_RULES, 0));
}

function rankOpenAI(list: any[]): string[] {
  const ids: string[] = list.map(m => m.id).filter(Boolean);
  return ids
    .filter(id => /^(gpt-|o\d)/.test(id) && !/audio|realtime|tts|transcribe|image|search|embed|instruct|chat-latest|codex|\d{4}-\d{2}-\d{2}/.test(id))
    .map(id => {
      const v = parseFloat((id.match(/^gpt-(\d+(?:\.\d+)?)/) || [])[1] || (/^o\d/.test(id) ? '4.5' : '3'));
      const size = /nano/.test(id) ? -12 : /mini/.test(id) ? -6 : 0;
      return { id, s: v * 10 + size };
    })
    .sort((a, b) => b.s - a.s)
    .map(x => x.id);
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

  // CORS: las apps generadas (preview y exportadas) llaman a este endpoint vía src/lib/ai.ts
  const CORS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (isNode) for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
  if (req.method === 'OPTIONS') {
    if (isNode) return res.status(204).end();
    return new Response(null, { status: 204, headers: CORS });
  }
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

    const { model, messages = [], apiKey, openrouterKey, groqKey, maxTokensRequested, temperature, skip, prefer } = body;
    // Llaves propias del usuario (opcionales; se guardan solo en su navegador): OpenAI, Anthropic, Gemini, DeepSeek
    const uk = (body.userKeys && typeof body.userKeys === 'object') ? body.userKeys : {};
    const userKey = (k: string) => (typeof uk[k] === 'string' ? uk[k].trim() : '');
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
      gemini: uniq([userKey('gemini'), ...envKeys('GEMINI_API_KEY', 'GEMINI_API_KEYS')]).slice(0, 4),
      cerebras: uniq(envKeys('CEREBRAS_API_KEY', 'CEREBRAS_API_KEYS')).slice(0, 2),
      sambanova: uniq(envKeys('SAMBANOVA_API_KEY', 'SAMBANOVA_API_KEYS')).slice(0, 2),
      openrouter: uniq([pickUser('sk-or-'), (process.env.OPENROUTER_API_KEY || '').trim()]).slice(0, 2),
      mistral: uniq(envKeys('MISTRAL_API_KEY', 'MISTRAL_API_KEYS')).slice(0, 2),
      nvidia: uniq(envKeys('NVIDIA_API_KEY', 'NVIDIA_API_KEYS')).slice(0, 2),
      github: uniq(envKeys('GITHUB_MODELS_TOKEN', 'GITHUB_MODELS_TOKENS')).slice(0, 2),
      // Siempre disponible (sin llave): garantiza que NONA responda aunque todo lo demás esté al límite
      pollinations: uniq([(process.env.POLLINATIONS_API_KEY || '').trim() || 'anon']),
      openai: uniq([userKey('openai')]),
      anthropic: uniq([userKey('anthropic')]),
      deepseek: uniq([userKey('deepseek')]),
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

    const [gList, gemList, cList, sList, oList, aiList, nvList] = await Promise.all([
      keys.groq.length ? discover('groq', keys.groq[0]) : [],
      keys.gemini.length ? discover('gemini', keys.gemini[0]) : [],
      keys.cerebras.length ? discover('cerebras', keys.cerebras[0]) : [],
      keys.sambanova.length ? discover('sambanova', keys.sambanova[0]) : [],
      keys.openrouter.length ? discover('openrouter', '') : [],
      keys.openai.length ? discover('openai', keys.openai[0]) : [],
      keys.nvidia.length ? discover('nvidia', keys.nvidia[0]) : [],
    ]);
    const oaModels = aiList.length ? rankOpenAI(aiList) : STATIC_MODELS.openai;

    const groqModels = gList.length ? rankGroq(gList, hasImages) : (hasImages ? ['llama-3.2-11b-vision-preview'] : STATIC_MODELS.groq);
    const gemModels = gemList.length ? rankGemini(gemList) : STATIC_MODELS.gemini;
    const cerModels = cList.length ? rankCerebras(cList) : STATIC_MODELS.cerebras;
    const samModels = sList.length ? rankSamba(sList) : STATIC_MODELS.sambanova;
    const orRanked = oList.length ? rankOpenRouter(oList) : [];
    const orModels = [...orRanked.slice(0, 6), 'openrouter/free'];
    const nvRanked = nvList.length ? rankNvidia(nvList) : [];
    const misModels = STATIC_MODELS.mistral, nvModels = nvRanked.length ? nvRanked : STATIC_MODELS.nvidia, ghModels = STATIC_MODELS.github, poModels = STATIC_MODELS.pollinations;
    const ghFits = totalChars < 26000; // GitHub Models gratis: entrada pequeña, salida ~4k

    // Diagnóstico (sin llaves): qué proveedores están configurados y qué modelos se eligen en cada uno
    if (body.diag) {
      return reply(200, {
        configured: Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, v.length])),
        discovered: { nvidia: nvList.length, groq: gList.length, gemini: gemList.length, cerebras: cList.length, sambanova: sList.length, openrouter: oList.length },
        ranked: { groq: groqModels, gemini: gemModels, cerebras: cerModels, sambanova: samModels, openrouter: orModels, mistral: misModels, nvidia: nvModels, github: ghModels },
        allGroq: gList.map((m: any) => m.id),
        allGemini: gemList.map((m: any) => String(m.id || m.name)),
        allOpenRouterFree: oList.filter((m: any) => String(m.id).endsWith(':free')).map((m: any) => `${m.id} (${m.context_length})`),
        byok: { openai: keys.openai.length, anthropic: keys.anthropic.length, deepseek: keys.deepseek.length },
        cooling: [...cooldown.entries()].filter(([, t]) => t > Date.now()).map(([k, t]) => `${k} ${Math.round((t - Date.now()) / 1000)}s`),
      });
    }

    // Groq: la entrada + salida debe caber en el TPM del modelo. Se estima la entrada y se eligen solo modelos
    // donde quepa (p. ej. editar una plantilla de 40 KB solo cabe en Llama 4 Scout), con la salida que quede libre.
    const inTokens = Math.ceil(totalChars / 3.2) + 300;
    // Solo modelos de Groq que puedan escribir al menos ~3/4 de lo pedido: si no, la respuesta sale cortada
    const groqFit = groqModels.filter(m => groqTpm(m) - inTokens - 200 >= Math.min(want * 0.75, 4000));
    // Salida: la de siempre para peticiones normales (medido: funciona), reducida solo si la entrada es muy grande.
    const groqOut = (m: string) => {
      const usual = /120b|70b|32b|maverick|kimi/i.test(m) ? 6000 : 8000;
      return inTokens < 4000 ? usual : Math.max(1000, Math.min(usual, groqTpm(m) - inTokens - 200));
    };

    // -------- Plan de ejecución por papeles --------
    // Cada etapa de NONA pide un papel: planificar (razonar), escribir código, corregir o conversar.
    // Cada papel tiene su orden de proveedores (medido), y las partes que se escriben en paralelo
    // llegan con un "carril" distinto para repartirse entre proveedores en vez de agotar uno solo.
    type Role = 'plan' | 'code' | 'fix' | 'chat';
    const role: Role = ['plan', 'code', 'fix', 'chat'].includes(body.role) ? body.role
      : (prefer === 'quality' || big) ? 'code' : 'chat';
    const lane = Math.max(0, Math.floor(Number(body.lane) || 0));
    const geminiFlash = gemModels.filter(m => /flash/.test(m) && !/lite/.test(m));
    const geminiLite = gemModels.filter(m => /lite/.test(m));

    type Group = () => void;
    const g = {
      // Llaves propias del usuario (de pago): si las hay, van primero
      anthropic: () => push('anthropic', STATIC_MODELS.anthropic, role === 'chat' ? 1 : 2, () => 16000),
      openai: () => push('openai', oaModels, 2, () => 16000),
      deepseek: () => push('deepseek', role === 'plan' ? ['deepseek-reasoner', 'deepseek-chat'] : ['deepseek-chat'], 1, () => 8000),
      // Gratuitos
      groq: () => push('groq', groqFit, 2, groqOut),
      gemini: () => push('gemini', geminiFlash, 2, () => 16000),
      nvidia: () => push('nvidia', nvModels, 3, () => 16000),
      mistral: () => push('mistral', misModels, 2, () => 16000),
      cerebras: () => push('cerebras', cerModels, 1, () => 8000),
      sambanova: () => push('sambanova', samModels, 1, () => 8000),
      openrouter: () => push('openrouter', orModels, role === 'code' ? 4 : 3, () => 16000),
      github: () => { if (ghFits) push('github', ghModels, 2, () => 4000); },
      geminiLite: () => push('gemini', geminiLite, 1, () => 16000),
      pollinations: () => push('pollinations', poModels, 1, () => 12000),
    };
    const userFirst: Group[] = [g.anthropic, g.openai, g.deepseek];
    const free: Record<Role, Group[]> = {
      plan: [g.groq, g.gemini, g.nvidia, g.openrouter, g.mistral, g.cerebras, g.sambanova, g.github],
      code: [g.nvidia, g.gemini, g.mistral, g.cerebras, g.groq, g.openrouter, g.sambanova, g.github],
      fix: [g.groq, g.nvidia, g.gemini, g.mistral, g.cerebras, g.openrouter, g.sambanova, g.github],
      chat: [g.groq, g.openrouter, g.gemini, g.github, g.mistral, g.nvidia, g.cerebras, g.sambanova],
    };

    if (hasImages) {
      // Visión: Gemini → OpenRouter (gemini) → Groq vision (y los de pago del usuario si los hay)
      if (keys.openai.length) push('openai', oaModels, 1, () => 8000);
      if (keys.anthropic.length) push('anthropic', STATIC_MODELS.anthropic, 1, () => 8000);
      push('gemini', geminiFlash, 3, () => 8000);
      if (keys.openrouter.length && !skipSet.has('openrouter')) {
        for (const key of keys.openrouter) attempts.push({ kind: 'openrouter', key, model: 'google/gemini-2.5-flash', maxOut: Math.min(want, 8000) });
      }
      push('groq', groqModels, 2, () => 2000);
    } else {
      for (const grp of userFirst) grp();
      // Reparto: rotar los proveedores gratuitos según el carril (solo entre los que tienen llave)
      const order = free[role].filter(grp => { const before = attempts.length; grp(); const added = attempts.length > before; attempts.length = before; return added; });
      const k = order.length ? lane % order.length : 0;
      for (const grp of [...order.slice(k), ...order.slice(0, k)]) grp();
      g.geminiLite();
      g.pollinations();
    }

    // Diagnóstico: respuesta cruda de un proveedor (para depurar formatos de stream)
    if (body.rawProbe && typeof body.only === 'string' && body.only.includes(':')) {
      const i = body.only.indexOf(':');
      const kind = body.only.slice(0, i) as Kind, m = body.only.slice(i + 1);
      const key = (keys[kind] || [])[0];
      if (!key) return reply(200, { error: 'sin llave' });
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (key !== 'anon') headers.Authorization = `Bearer ${key}`;
      const r = await fetch(chatUrl(kind, key), { method: 'POST', headers, body: JSON.stringify({ model: m, messages: [{ role: 'user', content: 'di hola' }], stream: true, max_tokens: 50 }), signal: AbortSignal.timeout(25000) }).catch((e: any) => ({ status: 0, text: async () => String(e?.message) } as any));
      const t = await r.text();
      return reply(200, { status: r.status, head: t.slice(0, 900) });
    }

    if (body.diagOrder) return reply(200, { role, lane, order: attempts.map(a => `${a.kind}:${a.model}`) });

    // Prueba de un modelo concreto (diagnóstico/medición): body.only = "proveedor:modelo"
    if (typeof body.only === 'string' && body.only.includes(':')) {
      const i = body.only.indexOf(':');
      const kind = body.only.slice(0, i) as Kind, m = body.only.slice(i + 1);
      attempts.length = 0;
      for (const key of (userKey(kind) ? [userKey(kind)] : keys[kind] || [])) attempts.push({ kind, key, model: m, maxOut: want });
    }

    // Si el cliente pidió omitir proveedores y eso deja la lista vacía (p. ej. solo hay Gemini),
    // se ignora la omisión: es mejor reintentar el mismo proveedor que no probar ninguno.
    if (attempts.length === 0 && skipSet.size > 0) {
      skipSet.clear();
      return handler({ ...req, method: 'POST', body: { ...body, skip: [] }, headers: req.headers, json: async () => ({ ...body, skip: [] }) }, res);
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
          if (withReasoning && (a.kind === 'gemini' || /gpt-oss/.test(a.model))) payload.reasoning_effort = 'low';
          if (a.kind === 'openai') {
            // Los modelos recientes de OpenAI usan max_completion_tokens y solo la temperatura por defecto
            payload.max_completion_tokens = payload.max_tokens;
            delete payload.max_tokens;
            if (/^(gpt-5|o\d)/.test(a.model)) { delete payload.temperature; if (withReasoning) payload.reasoning_effort = 'low'; }
          }
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (a.key !== 'anon') headers.Authorization = `Bearer ${a.key}`;
          if (a.kind === 'openrouter') {
            headers['HTTP-Referer'] = 'https://interfaz-hazel.vercel.app';
            headers['X-Title'] = 'NONA AI Software Factory';
          }
          const r = await fetch(chatUrl(a.kind, a.key), { method: 'POST', headers, body: JSON.stringify(payload), signal: ctl.signal });
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
      if (!out.ok && out.status === 400 && /reasoning/i.test(out.txt)) out = await callOnce(false);

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
    let finishReason = '';

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
          finishReason = e.reason;
          if (!/^(stop|end_turn|eos|STOP)$/i.test(e.reason)) truncated = e.reason === 'length' ? 'length' : e.reason;
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
      // Stream cerrado sin finish_reason: el proveedor cortó la conexión (visto en Gemini free).
      if (!truncated && !finishReason) truncated = 'eof';
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
