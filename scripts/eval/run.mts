/**
 * Banco de evaluación de NONA: genera apps con el motor real (contra el gateway publicado) y guarda los archivos.
 * Uso: npx tsx scripts/eval/run.mts <modo: single|staged> [desde] [hasta]
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.NONA_URL || 'https://interfaz-hazel.vercel.app';
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, String(v)),
  removeItem: (k: string) => store.delete(k), clear: () => store.clear(), key: () => null, length: 0,
};
const realFetch = globalThis.fetch;
const usedModels: string[] = [];
globalThis.fetch = (async (input: any, init?: any) => {
  const url = typeof input === 'string' && input.startsWith('/') ? BASE + input : input;
  const res = await realFetch(url, init);
  return res;
}) as any;

const { appBuilderAgent } = await import('../../src/core/agent/AppBuilderAgent.ts');

const mode = (process.argv[2] || 'staged') as 'single' | 'staged';
const prompts: string[] = JSON.parse(fs.readFileSync(new URL('./prompts.json', import.meta.url), 'utf8'));
const from = Number(process.argv[3] || 0), to = Number(process.argv[4] || prompts.length);
const outRoot = path.resolve('eval-out', mode);

for (let i = from; i < to; i++) {
  const prompt = prompts[i];
  const dir = path.join(outRoot, String(i + 1).padStart(2, '0'));
  fs.mkdirSync(dir, { recursive: true });
  const project: any = { id: 'eval', name: 'eval', files: {}, framework: 'react-vite' };
  const log: string[] = [];
  const t0 = Date.now();
  let result: any = null, error = '';
  try {
    result = await appBuilderAgent.run(prompt, project, false, (t) => { const l = String(t).split('\n').pop() || ''; if (log[log.length - 1] !== l) log.push(`${((Date.now() - t0) / 1000).toFixed(0)}s ${l}`); }, { mode });
  } catch (e: any) {
    error = e?.message || String(e);
  }
  const files: Record<string, string> = result?.files || {};
  for (const [p, c] of Object.entries(files)) {
    const f = path.join(dir, 'app', p);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, c);
  }
  const lines = Object.values(files).reduce((n, c) => n + c.split('\n').length, 0);
  const meta = { prompt, mode, seconds: Math.round((Date.now() - t0) / 1000), files: Object.keys(files).length, lines, error, summary: result?.summary || '', log };
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
  if (process.env.EVAL_PAUSE) await new Promise(r => setTimeout(r, Number(process.env.EVAL_PAUSE) * 1000));
  console.log(`[${mode}] ${i + 1}. ${prompt.slice(0, 50)} → ${error ? 'ERROR ' + error.slice(0, 120) : `${meta.files} archivos, ${lines} líneas, ${meta.seconds}s`}`);
}
