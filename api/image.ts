export const config = { runtime: 'edge' };

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Imagen de respaldo (degradado según el texto) para que una app nunca se rompa si el generador está saturado. */
function fallbackSvg(prompt: string, w: number, h: number): string {
  let x = 0; for (const ch of prompt) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
  const h1 = x % 360, h2 = (h1 + 40 + (x >> 8) % 80) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><radialGradient id="g" cx="35%" cy="35%" r="80%"><stop offset="0" stop-color="hsl(${h1},70%,62%)"/><stop offset="1" stop-color="hsl(${h2},55%,22%)"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
}

/**
 * Imágenes generadas con IA para las apps de NONA (gratis, sin llave para el usuario).
 * GET /api/image?prompt=texto&w=800&h=600&seed=7
 * Pasa por aquí (y no directo a Pollinations) para añadir CORS (texturas de three.js, canvas) y caché.
 */
export default async function handler(req: Request) {
  const u = new URL(req.url);
  const prompt = (u.searchParams.get('prompt') || u.searchParams.get('p') || 'abstract colorful background').slice(0, 600);
  const w = Math.min(Math.max(parseInt(u.searchParams.get('w') || u.searchParams.get('width') || '800', 10) || 800, 64), 1536);
  const h = Math.min(Math.max(parseInt(u.searchParams.get('h') || u.searchParams.get('height') || '600', 10) || 600, 64), 1536);
  const seed = parseInt(u.searchParams.get('seed') || '7', 10) || 7;
  // 1) Cloudflare Workers AI · FLUX.1 schnell (10.000 neuronas/día gratis): rápido y sin marca de agua
  const cfAccount = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  const cfToken = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
  if (cfAccount && cfToken) {
    try {
      const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, steps: 4, seed }),
        signal: AbortSignal.timeout(15000),
      });
      const j: any = r.ok ? await r.json() : null;
      const b64 = j?.result?.image;
      if (b64) {
        const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        return new Response(bin, {
          headers: { 'Content-Type': 'image/jpeg', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable' },
        });
      }
    } catch {}
  }

  // 2) Pollinations (respaldo)
  const key = (process.env.POLLINATIONS_API_KEY || '').trim();
  const q = `width=${w}&height=${h}&seed=${seed}&nologo=true`;
  const urls = key
    ? [`https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${q}`, `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${q}`]
    : [`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${q}`];
  // El plan gratuito limita peticiones simultáneas: se reintenta con espera (una app puede pedir 8-10 imágenes a la vez)
  const tries = [...urls, ...urls, ...urls, ...urls].slice(0, 5);
  const t0 = Date.now();
  for (let i = 0; i < tries.length; i++) {
    const url = tries[i];
    if (i > 0) await sleep(1200 * i + Math.random() * 800);
    const left = 22000 - (Date.now() - t0); // las funciones edge deben empezar a responder antes de ~25 s
    if (left < 3000) break;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(Math.min(left, 15000)), headers: key && url.includes('gen.') ? { Authorization: `Bearer ${key}` } : {} });
      const type = r.headers.get('content-type') || '';
      if (r.ok && type.startsWith('image/')) {
        return new Response(r.body, {
          headers: {
            'Content-Type': type,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
          },
        });
      }
    } catch {}
  }
  return new Response(fallbackSvg(prompt, w, h), {
    headers: { 'Content-Type': 'image/svg+xml', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' },
  });
}
