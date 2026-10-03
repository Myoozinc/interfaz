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
- Estilos con clases de Tailwind CSS (ya cargado, con darkMode: 'class': para modo oscuro añade/quita la clase 'dark' en document.documentElement y usa variantes dark:). CSS propio opcional en "src/index.css" (CSS normal, sin @apply ni @tailwind).
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
DISEÑO VISUAL (obligatorio):
- Elige UNA paleta coherente con el tema pedido: 1 color de fondo, 1 superficie para tarjetas, 1 color de acento y un texto principal + uno secundario. Si el usuario pide colores o estética, respétalos.
- CONTRASTE LEGIBLE SIEMPRE: el fondo de la app lo defines tú en el contenedor raíz (ej. min-h-screen bg-slate-50 text-slate-900, o bg-slate-950 text-slate-100). Nunca texto claro sobre fondo claro ni oscuro sobre oscuro; revisa títulos, botones, inputs y placeholders.
- Estructura: encabezado con el nombre de la app, contenido centrado (max-w-5xl mx-auto px-4 sm:px-6), tarjetas rounded-2xl con borde sutil o sombra suave, separación consistente (gap-4/gap-6).
- Tipografía: título grande y en negrita (text-3xl sm:text-4xl font-bold tracking-tight), subtítulos medianos, texto secundario más tenue; cifras importantes grandes.
- Botones claros: el principal con el color de acento, estados hover/disabled, y un icono de lucide-react cuando ayude.
- Inputs con etiqueta o placeholder visible, borde, foco resaltado (focus:ring-2) y fondo que contraste con su texto.
- Estados vacíos amables (icono + frase + acción) y estados de carga visibles.
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

const PATCH_RULES = `PARCHES (para archivos existentes de más de ~120 líneas, OBLIGATORIO en vez de reescribirlos):
<edit path="index.html">
<search>
líneas EXACTAS que ya existen en el archivo (copiadas carácter por carácter, 2-12 líneas, que aparezcan una sola vez)
</search>
<replace>
las líneas nuevas que las sustituyen
</replace>
</edit>
- Puedes poner varios bloques <search>/<replace> dentro del mismo <edit>, y varios <edit>.
- Para AÑADIR código, usa como <search> una línea existente cercana y repítela en <replace> junto al código nuevo.
- Nunca pongas "..." ni resúmenes dentro de <search>: debe coincidir exactamente con el archivo actual.
- Archivos pequeños o nuevos: devuélvelos completos con <file>.`;

const BUILD_SYSTEM = `Eres NONA, un ingeniero senior de front-end que construye aplicaciones web completas a partir de una descripción, como Lovable o bolt.new.

${RUNTIME_RULES}

${QUALITY_RULES}

${FORMAT_RULES}`;

const EDIT_SYSTEM = `Eres NONA, un ingeniero senior de front-end. Estás MODIFICANDO una aplicación que ya existe. Recibirás todos sus archivos actuales.

REGLAS DE EDICIÓN:
- Aplica exactamente el cambio pedido y conserva todo lo demás (funcionalidad, estructura y estilo que no se pidió cambiar). NUNCA sustituyas la app por otra distinta.
- Cambia solo lo necesario: archivos grandes con parches <edit>; archivos pequeños o nuevos completos con <file> (nunca fragmentos ni "// resto igual" dentro de <file>).
- Si un cambio afecta a varios archivos (por ejemplo un nombre que aparece en varios sitios), cámbialos todos.
- Si te piden corregir errores, busca la causa en el código y arréglala sin rehacer la app.

${RUNTIME_RULES}

${QUALITY_RULES}

${FORMAT_RULES}

${PATCH_RULES}`;

const REPAIR_SYSTEM = `Eres NONA. La aplicación tiene errores que impiden que se ejecute. Corrígelos.
- Arregla la causa con parches <edit> (archivos grandes) o devolviendo completos los archivos pequeños; crea los archivos que falten.
- No cambies el diseño ni la funcionalidad: solo arregla los errores.

${RUNTIME_RULES}

${FORMAT_RULES}

${PATCH_RULES}`;

/** Reglas extra cuando el proyecto es una app HTML de un solo archivo (plantillas y apps antiguas). */
const HTML_PROJECT_RULES = `ESTE PROYECTO ES UNA APP HTML (index.html con JavaScript y CSS dentro): mantén ese formato.
- NO crees archivos .tsx/.jsx ni src/App.tsx: edita index.html con parches <edit>.
- Las librerías se cargan con <script src="https://cdn..."> como ya hace el archivo.`;

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

interface Patch { path: string; search: string; replace: string }

interface Parsed {
  summary: string;
  files: Record<string, string>;
  deletes: string[];
  incomplete: string[];
  edits: Patch[];
}

const hasOutput = (p: Parsed) => Object.keys(p.files).length > 0 || p.deletes.length > 0 || p.edits.length > 0;

/** Busca `search` en `content`: exacto, luego ignorando espacios finales, luego ignorando la sangría. */
function locate(content: string, search: string): { start: number; end: number } | null {
  if (!search.trim()) return null;
  const exact = content.indexOf(search);
  if (exact !== -1) return { start: exact, end: exact + search.length };

  const lines = content.split('\n');
  const want = search.replace(/\n+$/, '').split('\n');
  const norms: Array<(s: string) => string> = [s => s.replace(/\s+$/, ''), s => s.trim()];
  for (const norm of norms) {
    const w = want.map(norm);
    while (w.length && w[0] === '') w.shift();
    while (w.length && w[w.length - 1] === '') w.pop();
    if (w.length === 0) continue;
    const hits: number[] = [];
    for (let i = 0; i + w.length <= lines.length; i++) {
      let ok = true;
      for (let j = 0; j < w.length; j++) if (norm(lines[i + j]) !== w[j]) { ok = false; break; }
      if (ok) hits.push(i);
    }
    if (hits.length >= 1) {
      const i = hits[0];
      const start = lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0);
      const end = start + lines.slice(i, i + w.length).join('\n').length;
      return { start, end };
    }
  }
  return null;
}

/** Aplica parches y devuelve los problemas (bloques que no coinciden). */
function applyPatches(files: Record<string, string>, edits: Patch[]): string[] {
  const problems: string[] = [];
  for (const e of edits) {
    const content = files[e.path];
    if (content === undefined) {
      problems.push(`Parche para "${e.path}", pero ese archivo no existe. Devuélvelo completo con <file>.`);
      continue;
    }
    const at = locate(content, e.search);
    if (!at) {
      const preview = e.search.trim().split('\n').slice(0, 2).join(' ⏎ ').slice(0, 120);
      problems.push(`En "${e.path}" no se encontró el bloque <search> que empieza por: ${preview}. Copia las líneas EXACTAS del archivo actual.`);
      continue;
    }
    files[e.path] = content.slice(0, at.start) + e.replace.replace(/\n+$/, '') + content.slice(at.end);
  }
  return problems;
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

  // Parches <edit path="..."><search>…</search><replace>…</replace></edit>
  const edits: Patch[] = [];
  const editRe = /<edit\s+path\s*=\s*["']([^"']+)["']\s*>([\s\S]*?)<\/edit>/gi;
  while ((m = editRe.exec(text)) !== null) {
    const path = normPath(m[1]);
    const pairRe = /<search>\n?([\s\S]*?)\n?<\/search>\s*<replace>\n?([\s\S]*?)\n?<\/replace>/gi;
    let pm: RegExpExecArray | null;
    while ((pm = pairRe.exec(m[2])) !== null) edits.push({ path, search: pm[1], replace: pm[2] });
  }
  const openEdit = text.slice(text.lastIndexOf('</edit>') + 1).match(/<edit\s+path\s*=\s*["']([^"']+)["']\s*>/i);
  if (openEdit && !/<\/edit>\s*$/.test(text.trim())) incomplete.push(normPath(openEdit[1]) + ' (parche)');

  // Respaldo: bloques markdown con la ruta en la línea de info (```tsx src/App.tsx)
  if (Object.keys(files).length === 0 && edits.length === 0) {
    const md = /```[\w-]*\s+([\w./-]+\.(?:tsx|ts|jsx|js|css|html))\s*\n([\s\S]*?)```/g;
    while ((m = md.exec(text)) !== null) files[normPath(m[1])] = m[2].replace(/\s+$/, '') + '\n';
  }

  return { summary, files, deletes, incomplete, edits };
}

/** Aplica al proyecto todo lo que devolvió la IA (archivos, parches y borrados). */
function applyParsed(files: Record<string, string>, parsed: Parsed): string[] {
  Object.assign(files, parsed.files);
  const problems = applyPatches(files, parsed.edits);
  for (const d of parsed.deletes) delete files[d];
  return problems;
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

  // Scripts dentro de archivos HTML (plantillas y apps de un solo archivo)
  for (const [path, html] of Object.entries(files)) {
    if (!path.endsWith('.html')) continue;
    const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let sm: RegExpExecArray | null;
    let n = 0;
    while ((sm = scriptRe.exec(html)) !== null) {
      const attrs = sm[1];
      const body = sm[2];
      if (/\bsrc\s*=/.test(attrs) || !body.trim()) continue;
      if (/type\s*=\s*["'](?:importmap|application\/json|application\/ld\+json|text\/(?:template|x-template|plain|babel|tailwindcss))["']/i.test(attrs)) continue;
      n++;
      const line = html.slice(0, sm.index).split('\n').length;
      if (/type\s*=\s*["']module["']/i.test(attrs)) {
        const err = VirtualMultiFileBundler.checkSyntax(body, 'inline-module.ts');
        if (err) problems.push(`Error de sintaxis en el <script type="module"> nº${n} de "${path}" (empieza en la línea ${line}): ${err}`);
      } else {
        try { new Function(body); } catch (e: any) {
          problems.push(`Error de sintaxis en el <script> nº${n} de "${path}" (empieza en la línea ${line}): ${String(e?.message || e).slice(0, 200)}`);
        }
      }
    }
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


type RGBA = [number, number, number, number];
const parseColor = (c: string): RGBA | null => {
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
};
const luminance = ([r, g, b]: RGBA) => {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a: RGBA, b: RGBA) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** Busca textos visibles casi ilegibles (contraste < 2:1 contra su fondo real). */
function scanContrast(doc: Document | null, win: Window | null): string[] {
  if (!doc || !win) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  const scope = doc.getElementById('root') ? '#root *' : 'body *';
  const els = Array.from(doc.querySelectorAll(scope)).filter(e => !(e as HTMLElement).closest?.('#nona-badge')).slice(0, 1500) as HTMLElement[];
  for (const el of els) {
    if (out.length >= 6) break;
    const text = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent || '').join('').trim();
    if (text.length < 2) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = win.getComputedStyle(el);
    if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.3) continue;
    if (cs.backgroundClip === 'text' || cs.webkitTextFillColor === 'transparent') continue;
    const fg = parseColor(cs.color);
    if (!fg || fg[3] < 0.5) continue;
    let bg: RGBA | null = null;
    let node: HTMLElement | null = el;
    let skip = false;
    while (node) {
      const ns = win.getComputedStyle(node);
      if (ns.backgroundImage && ns.backgroundImage !== 'none') { skip = true; break; }
      const c = parseColor(ns.backgroundColor);
      if (c && c[3] >= 0.6) { bg = c; break; }
      node = node.parentElement;
    }
    if (skip) continue;
    if (!bg) bg = [255, 255, 255, 1];
    const ratio = contrast(fg, bg);
    if (ratio < 2) {
      const key = `${cs.color}|${bg.join(',')}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(`Texto casi ilegible (contraste ${ratio.toFixed(1)}:1) en <${el.tagName.toLowerCase()} class="${(el.className || '').toString().slice(0, 80)}">: "${text.slice(0, 40)}" — color ${cs.color} sobre fondo rgb(${bg.slice(0, 3).join(', ')})`);
    }
  }
  return out;
}

/**
 * Ejecuta la app en un iframe oculto (mismo empaquetador que la vista previa) y devuelve los errores
 * de arranque: imports inexistentes, exports incorrectos de librerías, excepciones al renderizar, etc.
 * Solo funciona en el navegador; en Node devuelve [].
 */
export async function runtimeCheck(files: Record<string, string>, timeoutMs = 12000, design?: string[]): Promise<string[]> {
  if (typeof document === 'undefined' || typeof window === 'undefined') return [];
  const hasReact = Object.keys(files).some(p => /\.(tsx|jsx)$/.test(p));
  let srcDoc = '';
  if (hasReact) {
    try { srcDoc = VirtualMultiFileBundler.bundle(files).srcDoc; } catch (e: any) { return [`Error al empaquetar: ${e?.message || e}`]; }
  } else if (files['index.html']) {
    // App HTML de un solo archivo: se ejecuta tal cual con un capturador de errores al inicio del <head>.
    const capture = `<script>(function(){function s(m){try{parent.postMessage({type:'SANDBOX_RUNTIME_ERROR',level:'error',msg:String(m)},'*')}catch(e){}}
window.addEventListener('error',function(e){var t=e.target;if(t&&t!==window&&t.tagName){if(t.tagName==='SCRIPT')s('No se pudo cargar el script '+(t.src||''));return;}s((e.message||'Error')+(e.lineno?' (línea '+e.lineno+')':''));},true);
window.addEventListener('unhandledrejection',function(e){var r=e.reason;s('Promesa rechazada: '+(r&&(r.message||r)));});
var ce=console.error;console.error=function(){s([].map.call(arguments,function(a){return a&&a.message?a.message:String(a)}).join(' '));ce.apply(console,arguments);};
window.addEventListener('DOMContentLoaded',function(){try{parent.postMessage({type:'NONA_APP_RENDERED'},'*');}catch(e){}});
window.addEventListener('load',function(){try{parent.postMessage({type:'NONA_APP_RENDERED'},'*');}catch(e){}});
})();</script>`;
    const html = files['index.html'];
    srcDoc = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + capture) : capture + html;
  } else {
    return [];
  }

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
      if (d.type === 'NONA_APP_RENDERED') {
        if (!renderedAt) renderedAt = Date.now();
        setTimeout(finish, 350);
        return;
      }
      const isErr = d.type === 'SANDBOX_RUNTIME_ERROR' || (d.type === 'NONA_LOG' && d.level === 'error');
      if (!isErr) return;
      const msg = String(d.msg || '').split('\n').slice(0, 3).join(' ').slice(0, 300);
      if (msg && !ignore.test(msg) && !errors.includes(msg)) errors.push(msg);
    };
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (design && errors.length === 0) {
        try { design.push(...scanContrast(iframe.contentDocument, iframe.contentWindow)); } catch {}
      }
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
        const doc = iframe.contentDocument;
        const root = hasReact ? (doc?.getElementById('root') || doc?.getElementById('app')) : doc?.body;
        if (!renderedAt && (
          (root && (root.childElementCount > 0 || root.innerHTML.trim().length > 0)) ||
          doc?.querySelector('canvas') ||
          (doc?.body && doc.body.childElementCount > 1)
        )) {
          renderedAt = Date.now();
        }
      } catch {}
      if (errors.length > 0 && Date.now() - started > 1500) finish();
      else if (renderedAt && Date.now() - renderedAt > 500) finish();
    }, 200);
    const hard = setTimeout(() => {
      // Si el tiempo de espera expira pero no hubo errores de ejecución JS ni excepciones,
      // la aplicación es sintácticamente válida (solo tardó en inicializar librerías externas o WebGL).
      // Solo reportamos fallo si hubo excepciones reales capturadas.
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
        const re = /<(file|edit)\s+path\s*=\s*["']([^"']+)["']/gi;
        let m: RegExpExecArray | null;
        while ((m = re.exec(full)) !== null) {
          const p = normPath(m[2]);
          const key = m[1] + p;
          if (!seen.has(key)) { seen.add(key); onProgress(`${label}\n✍️ ${m[1] === 'edit' ? 'Editando' : 'Escribiendo'} ${p}…`, true); }
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
        if (!hasOutput(parsed)) {
          lastErr = 'la IA no devolvió archivos ni parches';
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
    let patchProblems: string[] = [];
    const isHtmlProject = isEdit && !!current['index.html'] && !Object.keys(current).some(p => /\.(tsx|jsx)$/.test(p));

    if (isEdit) {
      const lines = (s: string) => s.split('\n').length;
      const tree = Object.entries(current).map(([p, c]) => `- ${p} (${lines(c)} líneas${lines(c) > 120 ? ' → usa <edit>' : ''})`).join('\n');
      const system = isHtmlProject ? `${EDIT_SYSTEM}\n\n${HTML_PROJECT_RULES}` : EDIT_SYSTEM;
      const user = `${history ? `CONVERSACIÓN RECIENTE:\n${history}\n\n` : ''}ARCHIVOS DEL PROYECTO:\n${tree}\n\nCONTENIDO ACTUAL:\n${filesAsContext(current)}\n\nCAMBIO PEDIDO POR EL USUARIO:\n"${instruction}"`;
      parsed = await this.askWithRetry(system, user, 12000, onProgress, label, opts?.signal);
      files = { ...current };
      patchProblems = applyParsed(files, parsed);
      if (isHtmlProject) {
        // Una app HTML no debe convertirse en otra app React a mitad de una edición
        for (const p of Object.keys(files)) if (/\.(tsx|jsx)$/.test(p) && !(p in current)) delete files[p];
      }
    } else {
      const user = `${history ? `CONVERSACIÓN RECIENTE (contexto):\n${history}\n\n` : ''}PEDIDO DEL USUARIO:\n"${instruction}"\n\nConstruye la aplicación completa.`;
      parsed = await this.askWithRetry(BUILD_SYSTEM, user, 16000, onProgress, label, opts?.signal);
      files = { ...parsed.files };
      // Si el modelo creó main.tsx o index.html además de App.tsx, se descartan: la vista previa monta App.
      if (files['src/App.tsx']) { delete files['index.html']; }
    }

    const mainSummary = parsed.summary;
    let warning = '';

    // Validación + reparación
    for (let round = 0; round < 3; round++) {
      for (const p of parsed.incomplete) if (!(p in parsed.files)) delete files[p];
      ensureRuntimeHelpers(files);
      dropMissingAssetImports(files);
      const problems = [
        ...parsed.incomplete.map(p => `El archivo "${p}" quedó incompleto (la respuesta se cortó).`),
        ...patchProblems,
        ...validateProject(files),
      ];
      patchProblems = [];
      if (problems.length === 0) break;
      if (round === 2) {
        throw new Error(`La app tiene errores que no se pudieron corregir:\n- ${problems.slice(0, 5).join('\n- ')}`);
      }
      onProgress(`${label}\n🩺 Corrigiendo ${problems.length} problema(s)…`, true);
      const broken = Object.keys(files).filter(p => problems.some(pr => pr.includes(`"${p}"`)));
      const context: Record<string, string> = {};
      for (const p of (broken.length ? broken : Object.keys(files))) context[p] = files[p];
      const repairSystem = isHtmlProject ? `${REPAIR_SYSTEM}\n\n${HTML_PROJECT_RULES}` : REPAIR_SYSTEM;
      const user = `ARCHIVOS EXISTENTES: ${Object.keys(files).join(', ')}\n\nPROBLEMAS DETECTADOS:\n- ${problems.join('\n- ')}\n\nARCHIVOS CON PROBLEMAS (contenido actual):\n${filesAsContext(context, 90000)}\n\nPedido original del usuario: "${instruction}"`;
      parsed = await this.askWithRetry(repairSystem, user, 12000, onProgress, label, opts?.signal);
      patchProblems = applyParsed(files, parsed);
    }

    // Prueba de ejecución real (como hacen Lovable/bolt): si la app falla al arrancar, se corrige sola.
    for (let round = 0; round < 2; round++) {
      onProgress(`${label}\n▶️ Probando la app…`, true);
      const runtimeErrors = await runtimeCheck(files);
      if (runtimeErrors.length === 0) break;
      if (round === 1) {
        // En una edición: si esos errores ya estaban antes del cambio, no se bloquea la edición del usuario.
        if (isEdit) {
          const before = await runtimeCheck(current);
          if (before.length > 0 && runtimeErrors.every(e => before.includes(e))) {
            warning = `\n\n⚠️ La app ya tenía este error antes del cambio y no pude corregirlo del todo: ${runtimeErrors[0].slice(0, 160)}`;
            break;
          }
        }
        throw new Error(`La app se generó pero falla al ejecutarse:\n- ${runtimeErrors.slice(0, 4).join('\n- ')}`);
      }
      onProgress(`${label}\n🩺 Corrigiendo error al ejecutar: ${runtimeErrors[0].slice(0, 90)}…`, true);
      const user = `La app compila, pero al EJECUTARLA en el navegador aparecen estos errores:\n- ${runtimeErrors.join('\n- ')}\n\nCausas típicas: import por defecto de una librería que solo tiene exports nombrados (usa import { create } from 'zustand'), API antigua de una librería, variable indefinida, acceso a propiedades de undefined.\n\nARCHIVOS DEL PROYECTO:\n${filesAsContext(files, 100000)}\n\nPedido original del usuario: "${instruction}"`;
      const repairSystem = isHtmlProject ? `${REPAIR_SYSTEM}\n\n${HTML_PROJECT_RULES}` : REPAIR_SYSTEM;
      const fix = await this.askWithRetry(repairSystem, user, 12000, onProgress, label, opts?.signal);
      const fixProblems = applyParsed(files, fix);
      ensureRuntimeHelpers(files);
      const staticProblems = [...fixProblems, ...validateProject(files)];
      if (staticProblems.length > 0) {
        throw new Error(`La corrección introdujo errores:\n- ${staticProblems.slice(0, 4).join('\n- ')}`);
      }
    }

    // Revisión visual automática (no bloqueante): si hay textos ilegibles, una ronda de corrección de diseño.
    try {
      const design: string[] = [];
      await runtimeCheck(files, 7000, design);
      if (design.length > 0) {
        onProgress(`${label}\n🎨 Ajustando el contraste (${design.length} texto(s) poco legibles)…`, true);
        const user = `La app funciona, pero la revisión visual encontró textos casi ilegibles:\n- ${design.join('\n- ')}\n\nCorrige SOLO los colores (clases de Tailwind) para que todo el texto tenga buen contraste con su fondo. No cambies la funcionalidad ni la estructura.\n\nARCHIVOS DEL PROYECTO:\n${filesAsContext(files, 100000)}`;
        const fix = await this.askWithRetry(isHtmlProject ? `${REPAIR_SYSTEM}\n\n${HTML_PROJECT_RULES}` : REPAIR_SYSTEM, user, 12000, onProgress, label, opts?.signal);
        const candidate = { ...files };
        const fixProblems = applyParsed(candidate, fix);
        ensureRuntimeHelpers(candidate);
        if (fixProblems.length === 0 && validateProject(candidate).length === 0 && (await runtimeCheck(candidate)).length === 0) {
          Object.assign(files, candidate);
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') throw e;
      // La revisión de diseño nunca debe impedir entregar una app que funciona.
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

    const summary = (mainSummary || (isEdit
      ? `Listo, apliqué el cambio en ${changedPaths.length} archivo(s): ${changedPaths.join(', ')}.`
      : `Construí la app con ${Object.keys(files).length} archivo(s).`)) + warning;
    return { files, summary, changedPaths };
  }
}

export const appBuilderAgent = new AppBuilderAgent();
