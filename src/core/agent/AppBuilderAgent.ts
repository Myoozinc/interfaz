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
- Paquetes disponibles: react, lucide-react (iconos), framer-motion, clsx, tailwind-merge, zustand, date-fns, three, tone, canvas-confetti, recharts. No uses ningún otro paquete.
- Sin backend: guarda datos con localStorage cuando haga falta persistencia. Datos de ejemplo realistas escritos en el código.
- Juegos: usa <canvas> con requestAnimationFrame y controles de teclado + botones táctiles.
- Todos los imports relativos deben apuntar a archivos que TÚ entregas (ej: import { Board } from './components/Board').`;

const QUALITY_RULES = `CALIDAD:
- Usa EXACTAMENTE los nombres, textos, colores y estilo que pide el usuario (si pide que se llame "X", la app se llama "X").
- Interfaz moderna y cuidada: jerarquía tipográfica clara, espaciado generoso, estados hover/activos, diseño responsive (móvil y escritorio).
- Todo debe funcionar de verdad: nada de botones decorativos, "TODO", "lorem ipsum" ni funciones vacías.
- Código organizado en varios archivos pequeños (componentes en src/components/, lógica en src/hooks/ o src/lib/), tipado con TypeScript.
- Sé conciso: código completo pero sin comentarios largos ni repeticiones, para que quepa en una sola respuesta.`;

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

function filesAsContext(files: Record<string, string>, maxChars = 120000): string {
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
