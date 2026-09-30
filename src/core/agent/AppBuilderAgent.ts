/**
 * AppBuilderAgent — generación y edición de apps con IA, sin plantillas guardadas.
 *
 * Flujo (igual para crear y para editar):
 *   1. La IA recibe el pedido (y, si es edición, TODOS los archivos actuales).
 *   2. Responde con archivos en bloques <file path="...">código</file> (sin JSON: los modelos
 *      rompen mucho menos el formato y no hay que escapar comillas ni saltos de línea).
 *   3. Se valida cada archivo con el mismo compilador de la vista previa (sintaxis real) y se
 *      comprueba que todos los imports relativos existan.
 *   4. Si hay errores, se le devuelven a la IA para que los corrija (hasta 2 rondas).
 *   5. Si aun así falla, se informa el error real. NUNCA se sustituye por una plantilla.
 */
import type { FullStackProject } from '../types';
import type { ChatMessage } from '../../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { VirtualMultiFileBundler } from '../sandbox/VirtualMultiFileBundler';
import { formatConversationHistory } from './historyUtils';

export interface BuildResult {
  files: Record<string, string>;
  summary: string;
  changedPaths: string[];
}

type Progress = (text: string, isThinking?: boolean) => void;

const RUNTIME_RULES = `ENTORNO DE EJECUCIÓN (la vista previa corre en el navegador, sin npm install ni servidor):
- React 18 + TypeScript (.tsx). Importa hooks desde 'react' (import { useState } from 'react').
- Punto de entrada OBLIGATORIO: "src/App.tsx" con "export default function App()". NO crees main.tsx ni index.html: la vista previa monta App sola.
- Estilos con clases de Tailwind CSS (ya cargado). CSS propio opcional en "src/index.css" (CSS normal, sin @apply ni @tailwind).
- Puedes importar cualquier paquete npm que funcione en el navegador (se carga automáticamente desde esm.sh; no hace falta instalar nada). Usa librerías probadas en vez de reescribir lógica compleja:
  · varias páginas/pantallas: react-router-dom (BrowserRouter, Routes, Route, Link, useNavigate) · iconos: lucide-react · animación: framer-motion · gráficos: recharts · estado: zustand · fechas: date-fns · 3D: three · audio: tone o howler · física 2D: matter-js · markdown: marked
  · AJEDREZ: usa SIEMPRE 'chess.js' (import { Chess } from 'chess.js') para reglas, movimientos legales, jaque y fin de partida; la IA rival elige entre chess.moves() con minimax sobre copias de Chess.
  · Damas, sudoku, tetris, etc.: implementa la lógica en un archivo aparte (src/lib/) con funciones puras y pruébala mentalmente con un caso antes de escribir la interfaz.
- IA INCLUIDA (sin API keys): si la app necesita un modelo de lenguaje (chatbot, asistente, generar/resumir/traducir/clasificar texto, recomendaciones), usa el helper ya disponible:
    import { askAI, chatAI } from './lib/ai';   // ruta relativa desde el archivo que lo usa
    const texto = await askAI('prompt', { system: 'instrucciones opcionales' });
    const respuesta = await chatAI([{ role: 'user', content: 'hola' }], { onToken: (parcial) => setTexto(parcial) });
  NO crees src/lib/ai.ts: NONA lo añade solo. Muestra un estado de carga mientras responde y maneja errores con un mensaje amable.
  Esto es para modelos de LENGUAJE. La "IA" de un juego (rival de ajedrez, enemigos) se programa con algoritmos (minimax, reglas), no con askAI.
- Sin backend: guarda datos con localStorage cuando haga falta persistencia. Datos de ejemplo realistas escritos en el código.
- Juegos: usa <canvas> con requestAnimationFrame y controles de teclado + botones táctiles.
- Usa la API ACTUAL de cada librería con imports nombrados cuando corresponda (import { create } from 'zustand'; import { Chess } from 'chess.js'; import { motion } from 'framer-motion').
- Todos los imports relativos deben apuntar a archivos que TÚ entregas (ej: import { Board } from './components/Board').`;

const QUALITY_RULES = `CALIDAD:
- Usa EXACTAMENTE los nombres, textos, colores y estilo que pide el usuario (si pide que se llame "X", la app se llama "X").
- Interfaz moderna y cuidada: jerarquía tipográfica clara, espaciado generoso, estados hover/activos, diseño responsive (móvil y escritorio).
- Todo debe funcionar de verdad: nada de botones decorativos, "TODO", "lorem ipsum" ni funciones vacías. La interacción principal (mover una pieza, enviar un mensaje, añadir un elemento) debe funcionar al primer intento.
- En juegos de tablero distingue visualmente los dos bandos (colores de pieza distintos) y resalta la selección y los movimientos posibles.
- Código organizado en varios archivos pequeños (componentes en src/components/, lógica en src/hooks/ o src/lib/), tipado con TypeScript.
- Sé conciso: entre 3 y 7 archivos, unas 300-450 líneas en total, sin comentarios largos ni repeticiones, para que quepa en una sola respuesta. Escribe src/App.tsx PRIMERO.`;

const FORMAT_RULES = `FORMATO DE RESPUESTA (obligatorio, nada fuera de esto):
<summary>Una o dos frases en español explicando lo que hiciste.</summary>
<file path="src/App.tsx">
...código completo del archivo, sin bloques \`\`\`...
</file>
<file path="src/components/Ejemplo.tsx">
...
</file>
Para borrar un archivo: <delete path="ruta/del/archivo.tsx" />`;

const BUILD_SYSTEM = `Eres NONA, un ingeniero senior de front-end que construye aplicaciones web completas a partir de una descripción, como Lovable o bolt.new.

${RUNTIME_RULES}

${QUALITY_RULES}

${FORMAT_RULES}`;

const EDIT_SYSTEM = `Eres NONA, un ingeniero senior de front-end. Estás MODIFICANDO una aplicación que ya existe. Recibirás todos sus archivos actuales.

REGLAS DE EDICIÓN:
- Aplica exactamente el cambio pedido y conserva todo lo demás (funcionalidad, estructura y estilo que no se pidió cambiar).
- Devuelve SOLO los archivos que cambian o que creas, y cada uno COMPLETO (nunca fragmentos, nunca "// resto igual").
- Si el proyecto es un único "index.html", edita y devuelve ese index.html completo.
- Si un cambio afecta a varios archivos (por ejemplo un nombre que aparece en varios sitios), devuélvelos todos.

${RUNTIME_RULES}

${QUALITY_RULES}

${FORMAT_RULES}`;

const REPAIR_SYSTEM = `Eres NONA. La aplicación que generaste tiene errores que impiden que se ejecute. Corrígelos.
- Devuelve COMPLETOS los archivos que corrijas y crea los archivos que falten.
- No cambies el diseño ni la funcionalidad: solo arregla los errores.

${RUNTIME_RULES}

${FORMAT_RULES}`;

const languageOf = (path: string): string => {
  if (/\.(tsx|ts)$/.test(path)) return 'typescript';
  if (/\.(jsx|js|mjs)$/.test(path)) return 'javascript';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.md')) return 'markdown';
  return 'text';
};

const normPath = (p: string) => p.trim().replace(/^\.?\//, '').replace(/\\/g, '/');

const stripFences = (code: string) => {
  let c = code.replace(/^\s*\n/, '').replace(/\s+$/, '');
  const fence = c.match(/^```[\w-]*\n([\s\S]*?)\n?```$/);
  if (fence) c = fence[1];
  return c + '\n';
};

interface Parsed {
  summary: string;
  files: Record<string, string>;
  deletes: string[];
  incomplete: string[];
}

export function parseBuilderOutput(raw: string): Parsed {
  const text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const files: Record<string, string> = {};
  const deletes: string[] = [];
  const incomplete: string[] = [];

  const summary = (text.match(/<summary>([\s\S]*?)<\/summary>/i)?.[1] || '').trim();

  const re = /<file\s+path\s*=\s*["']([^"']+)["']\s*>([\s\S]*?)<\/file>/gi;
  let m: RegExpExecArray | null;
  let lastEnd = 0;
  while ((m = re.exec(text)) !== null) {
    files[normPath(m[1])] = stripFences(m[2]);
    lastEnd = re.lastIndex;
  }
  // Archivo abierto y nunca cerrado (respuesta cortada)
  const tail = text.slice(lastEnd);
  const open = tail.match(/<file\s+path\s*=\s*["']([^"']+)["']\s*>/i);
  if (open) incomplete.push(normPath(open[1]));

  const delRe = /<delete\s+path\s*=\s*["']([^"']+)["']\s*\/?>/gi;
  while ((m = delRe.exec(text)) !== null) deletes.push(normPath(m[1]));

  // Respaldo: bloques markdown con la ruta en la línea de info (```tsx src/App.tsx)
  if (Object.keys(files).length === 0) {
    const md = /```[\w-]*\s+([\w./-]+\.(?:tsx|ts|jsx|js|css|html))\s*\n([\s\S]*?)```/g;
    while ((m = md.exec(text)) !== null) files[normPath(m[1])] = m[2].replace(/\s+$/, '') + '\n';
  }

  return { summary, files, deletes, incomplete };
}

const CODE_EXT = /\.(tsx|ts|jsx|js|mjs)$/;

function resolveRelative(from: string, spec: string, all: Set<string>): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = 'src/' + spec.slice(2);
  else {
    const dir = from.includes('/') ? from.slice(0, from.lastIndexOf('/')) : '';
    const parts = (dir ? dir.split('/') : []);
    for (const seg of spec.split('/')) {
      if (seg === '.' || seg === '') continue;
      if (seg === '..') parts.pop();
      else parts.push(seg);
    }
    base = parts.join('/');
  }
  const cands = [base, `${base}.tsx`, `${base}.ts`, `${base}.jsx`, `${base}.js`, `${base}/index.tsx`, `${base}/index.ts`, `${base}/index.jsx`, `${base}/index.js`];
  return cands.find(c => all.has(c)) || null;
}

/** Devuelve la lista de problemas que impedirían ejecutar el proyecto. */
export function validateProject(files: Record<string, string>): string[] {
  const problems: string[] = [];
  const all = new Set(Object.keys(files));
  const hasReact = Object.keys(files).some(p => /\.(tsx|jsx)$/.test(p));

  if (hasReact) {
    if (!files['src/App.tsx'] && !files['src/App.jsx']) problems.push('Falta el archivo de entrada "src/App.tsx" con export default App.');
    const app = files['src/App.tsx'] || files['src/App.jsx'];
    if (app && !/export\s+default/.test(app)) problems.push('"src/App.tsx" no tiene "export default".');
  } else if (!files['index.html']) {
    problems.push('El proyecto no contiene "src/App.tsx" ni "index.html".');
  }

  for (const [path, code] of Object.entries(files)) {
    if (!CODE_EXT.test(path)) continue;
    const err = VirtualMultiFileBundler.checkSyntax(code, path);
    if (err) { problems.push(`Error de sintaxis en "${path}": ${err}`); continue; }

    const importRe = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]((?:\.{1,2}\/|@\/)[^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = importRe.exec(code)) !== null) {
      const spec = m[1];
      if (/\.(css|svg|png|jpg|jpeg|gif|webp|json)$/.test(spec)) continue;
      if (!resolveRelative(path, spec, all)) problems.push(`"${path}" importa "${spec}", pero ese archivo no existe.`);
    }
  }
  return problems;
}

/** Quita imports de CSS/imágenes que no existen (la vista previa no los necesita). */
function dropMissingAssetImports(files: Record<string, string>) {
  const all = new Set(Object.keys(files));
  for (const [path, code] of Object.entries(files)) {
    if (!CODE_EXT.test(path)) continue;
    files[path] = code.replace(/^\s*import\s+['"]((?:\.{1,2}\/|@\/)[^'"]+\.(?:css|svg|png|jpg|jpeg|gif|webp))['"];?\s*$/gm, (line, spec) =>
      resolveRelative(path, spec, all) ? line : ''
    );
  }
}


/** Helper de IA incluido en toda app generada (usa el gateway de NONA; sin llaves para el usuario). */
export const NONA_AI_HELPER = `// Generado por NONA: acceso a IA sin API keys. No editar.
export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };
type Opts = { system?: string; onToken?: (textoParcial: string) => void; maxTokens?: number; temperature?: number };

const ENDPOINT = 'https://interfaz-hazel.vercel.app/api/agent';

export async function chatAI(messages: ChatMsg[], opts: Opts = {}): Promise<string> {
  const msgs = opts.system ? [{ role: 'system', content: opts.system }, ...messages] : messages;
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'auto', messages: msgs, maxTokensRequested: opts.maxTokens ?? 1500, temperature: opts.temperature ?? 0.7 }),
  });
  if (!res.ok || !res.body) {
    let msg = 'La IA no está disponible en este momento.';
    try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '', full = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      try {
        const j = JSON.parse(line);
        if (j.message?.content) {
          full += j.message.content;
          opts.onToken?.(full.replace(/<think>[\\s\\S]*?(<\\/think>|$)/g, '').trim());
        }
      } catch {}
    }
  }
  return full.replace(/<think>[\\s\\S]*?<\\/think>/g, '').trim();
}

export function askAI(prompt: string, opts: Opts = {}): Promise<string> {
  return chatAI([{ role: 'user', content: prompt }], opts);
}
`;

/** Añade src/lib/ai.ts si algún archivo lo importa. */
function ensureRuntimeHelpers(files: Record<string, string>) {
  const usesAI = Object.entries(files).some(([p, c]) => CODE_EXT.test(p) && /from\s+['"](?:\.{1,2}\/)+(?:src\/)?lib\/ai['"]|from\s+['"]@\/lib\/ai['"]/.test(c));
  if (usesAI) files['src/lib/ai.ts'] = NONA_AI_HELPER;
}


/**
 * Ejecuta la app en un iframe oculto (mismo empaquetador que la vista previa) y devuelve los errores
 * de arranque: imports inexistentes, exports incorrectos de librerías, excepciones al renderizar, etc.
 * Solo funciona en el navegador; en Node devuelve [].
 */
export async function runtimeCheck(files: Record<string, string>, timeoutMs = 7000): Promise<string[]> {
  if (typeof document === 'undefined' || typeof window === 'undefined') return [];
  const hasReact = Object.keys(files).some(p => /\.(tsx|jsx)$/.test(p));
  if (!hasReact) return [];
  let srcDoc = '';
  try { srcDoc = VirtualMultiFileBundler.bundle(files).srcDoc; } catch (e: any) { return [`Error al empaquetar: ${e?.message || e}`]; }

  return new Promise(resolve => {
    const errors: string[] = [];
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:1280px;height:800px;opacity:0;pointer-events:none;';
    const w = window as any;
    w.__nonaCheckFrames = w.__nonaCheckFrames || new Set();
    const ignore = /ResizeObserver|Tone\.js|favicon|AudioContext|autoplay|user gesture|Download the React DevTools/i;

    const onMsg = (ev: MessageEvent) => {
      if (ev.source !== iframe.contentWindow) return;
      const d = ev.data || {};
      const isErr = d.type === 'SANDBOX_RUNTIME_ERROR' || (d.type === 'NONA_LOG' && d.level === 'error');
      if (!isErr) return;
      const msg = String(d.msg || '').split('\n').slice(0, 3).join(' ').slice(0, 300);
      if (msg && !ignore.test(msg) && !errors.includes(msg)) errors.push(msg);
    };
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMsg);
      clearInterval(poll);
      clearTimeout(hard);
      w.__nonaCheckFrames.delete(iframe.contentWindow);
      iframe.remove();
      resolve(errors);
    };
    window.addEventListener('message', onMsg);
    document.body.appendChild(iframe);
    w.__nonaCheckFrames.add(iframe.contentWindow);
    iframe.srcdoc = srcDoc;

    const started = Date.now();
    let renderedAt = 0;
    const poll = setInterval(() => {
      try {
        const root = iframe.contentDocument?.getElementById('root');
        if (!renderedAt && root && root.innerHTML.trim().length > 0) renderedAt = Date.now();
      } catch {}
      if (errors.length > 0 && Date.now() - started > 1500) finish();
      else if (renderedAt && Date.now() - renderedAt > 1500) finish();
    }, 250);
    const hard = setTimeout(() => {
      if (!renderedAt && errors.length === 0) errors.push('La app no mostró nada en pantalla tras cargar (el componente App no renderizó contenido).');
      finish();
    }, timeoutMs);
  });
}

export function filesAsContext(files: Record<string, string>, maxChars = 120000): string {
  let out = '';
  for (const [p, c] of Object.entries(files)) {
    const block = `<file path="${p}">\n${c}\n</file>\n`;
    if (out.length + block.length > maxChars) {
      out += `<!-- ${p} omitido por tamaño (${c.length} caracteres) -->\n`;
      continue;
    }
    out += block;
  }
  return out;
}

export class AppBuilderAgent {
  private ai = new OllamaProvider('/api/agent', 'auto');

  setEndpoint(url: string) { this.ai.setBaseUrl(url); }

  private async ask(system: string, user: string, maxTokens: number, onProgress: Progress, label: string, signal?: AbortSignal): Promise<string> {
    const seen = new Set<string>();
    return this.ai.streamChat(
      [{ role: 'system', content: system }, { role: 'user', content: user }],
      (_t, full) => {
        const re = /<file\s+path\s*=\s*["']([^"']+)["']/gi;
        let m: RegExpExecArray | null;
        while ((m = re.exec(full)) !== null) {
          const p = normPath(m[1]);
          if (!seen.has(p)) { seen.add(p); onProgress(`${label}\n✍️ Escribiendo ${p}…`, true); }
        }
      },
      { signal, model: 'auto', maxTokens, temperature: 0.2 }
    );
  }

  /** Llama a la IA con reintentos: si un proveedor corta la respuesta o falla, el siguiente intento usa otro. */
  private async askWithRetry(system: string, user: string, maxTokens: number, onProgress: Progress, label: string, signal?: AbortSignal): Promise<Parsed> {
    let lastErr = '';
    for (let i = 0; i < 3; i++) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      try {
        if (i > 0) onProgress(`${label}\n🔁 Reintentando con otro modelo (${lastErr.slice(0, 80)})…`, true);
        const raw = await this.ask(system, user, maxTokens, onProgress, label, signal);
        const parsed = parseBuilderOutput(raw);
        if (Object.keys(parsed.files).length === 0 && parsed.deletes.length === 0) {
          lastErr = 'la IA no devolvió archivos';
          continue;
        }
        return parsed;
      } catch (e: any) {
        if (e?.name === 'AbortError') throw e;
        lastErr = e?.message || String(e);
      }
    }
    throw new Error(`No se pudo generar el código: ${lastErr}`);
  }

  async run(
    instruction: string,
    project: FullStackProject,
    isEdit: boolean,
    onProgress: Progress,
    opts?: { history?: ChatMessage[]; signal?: AbortSignal }
  ): Promise<BuildResult> {
    const current: Record<string, string> = {};
    for (const [p, f] of Object.entries(project.files)) current[normPath(p)] = f.content;

    const history = formatConversationHistory(opts?.history, 6);
    const label = isEdit ? '⚡ NONA · Editando tu app' : '🚀 NONA · Construyendo tu app';
    onProgress(`${label}\n🧠 Pensando la estructura…`, true);

    let parsed: Parsed;
    let files: Record<string, string>;

    if (isEdit) {
      const user = `${history ? `CONVERSACIÓN RECIENTE:\n${history}\n\n` : ''}ARCHIVOS ACTUALES DEL PROYECTO:\n${filesAsContext(current)}\n\nCAMBIO PEDIDO POR EL USUARIO:\n"${instruction}"`;
      parsed = await this.askWithRetry(EDIT_SYSTEM, user, 14000, onProgress, label, opts?.signal);
      files = { ...current, ...parsed.files };
      for (const d of parsed.deletes) delete files[d];
    } else {
      const user = `${history ? `CONVERSACIÓN RECIENTE (contexto):\n${history}\n\n` : ''}PEDIDO DEL USUARIO:\n"${instruction}"\n\nConstruye la aplicación completa.`;
      parsed = await this.askWithRetry(BUILD_SYSTEM, user, 16000, onProgress, label, opts?.signal);
      files = { ...parsed.files };
      // Si el modelo creó main.tsx o index.html además de App.tsx, se descartan: la vista previa monta App.
      if (files['src/App.tsx']) { delete files['index.html']; }
    }

    const mainSummary = parsed.summary;

    // Validación + reparación
    for (let round = 0; round < 3; round++) {
      for (const p of parsed.incomplete) if (!(p in parsed.files)) delete files[p];
      ensureRuntimeHelpers(files);
      dropMissingAssetImports(files);
      const problems = [
        ...parsed.incomplete.map(p => `El archivo "${p}" quedó incompleto (la respuesta se cortó).`),
        ...validateProject(files),
      ];
      if (problems.length === 0) break;
      if (round === 2) {
        throw new Error(`La app generada tiene errores que no se pudieron corregir:\n- ${problems.slice(0, 5).join('\n- ')}`);
      }
      onProgress(`${label}\n🩺 Corrigiendo ${problems.length} problema(s)…`, true);
      const broken = Object.keys(files).filter(p => problems.some(pr => pr.includes(`"${p}"`)));
      const context: Record<string, string> = {};
      for (const p of (broken.length ? broken : Object.keys(files))) context[p] = files[p];
      const user = `ARCHIVOS EXISTENTES: ${Object.keys(files).join(', ')}\n\nPROBLEMAS DETECTADOS:\n- ${problems.join('\n- ')}\n\nARCHIVOS CON PROBLEMAS:\n${filesAsContext(context, 90000)}\n\nPedido original del usuario: "${instruction}"`;
      parsed = await this.askWithRetry(REPAIR_SYSTEM, user, 14000, onProgress, label, opts?.signal);
      Object.assign(files, parsed.files);
      for (const d of parsed.deletes) delete files[d];
    }

    // Prueba de ejecución real (como hacen Lovable/bolt): si la app falla al arrancar, se corrige sola.
    for (let round = 0; round < 2; round++) {
      onProgress(`${label}\n▶️ Probando la app…`, true);
      const runtimeErrors = await runtimeCheck(files);
      if (runtimeErrors.length === 0) break;
      if (round === 1) {
        throw new Error(`La app se generó pero falla al ejecutarse:\n- ${runtimeErrors.slice(0, 4).join('\n- ')}`);
      }
      onProgress(`${label}\n🩺 Corrigiendo error al ejecutar: ${runtimeErrors[0].slice(0, 90)}…`, true);
      const user = `La app compila, pero al EJECUTARLA en el navegador aparecen estos errores:\n- ${runtimeErrors.join('\n- ')}\n\nCausas típicas: import por defecto de una librería que solo tiene exports nombrados (usa import { create } from 'zustand'), API antigua de una librería, variable indefinida, acceso a propiedades de undefined.\n\nARCHIVOS DEL PROYECTO:\n${filesAsContext(files, 100000)}\n\nPedido original del usuario: "${instruction}"`;
      const fix = await this.askWithRetry(REPAIR_SYSTEM, user, 14000, onProgress, label, opts?.signal);
      Object.assign(files, fix.files);
      for (const d of fix.deletes) delete files[d];
      ensureRuntimeHelpers(files);
      const staticProblems = validateProject(files);
      if (staticProblems.length > 0) {
        throw new Error(`La corrección introdujo errores:\n- ${staticProblems.slice(0, 4).join('\n- ')}`);
      }
    }

    const changedPaths = Object.keys(files).filter(p => files[p] !== current[p]);
    if (isEdit && changedPaths.length === 0) {
      throw new Error('La IA respondió pero no cambió ningún archivo. Intenta describir el cambio con más detalle.');
    }

    // Escribir en el proyecto (en una construcción nueva se reemplaza todo)
    if (!isEdit) for (const p of Object.keys(project.files)) delete project.files[p];
    for (const p of Object.keys(project.files)) if (!(normPath(p) in files)) delete project.files[p];
    for (const [p, content] of Object.entries(files)) {
      project.files[p] = { path: p, content, language: languageOf(p), isModified: changedPaths.includes(p) };
    }
    project.framework = files['src/App.tsx'] ? 'react-vite' : 'html-tailwind';
    project.updatedAt = new Date().toISOString();

    const summary = mainSummary || (isEdit
      ? `Listo, apliqué el cambio en ${changedPaths.length} archivo(s): ${changedPaths.join(', ')}.`
      : `Construí la app con ${Object.keys(files).length} archivo(s).`);
    return { files, summary, changedPaths };
  }
}

export const appBuilderAgent = new AppBuilderAgent();
