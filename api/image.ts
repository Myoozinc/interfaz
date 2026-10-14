export const config = { runtime: 'edge' };

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
  const key = (process.env.POLLINATIONS_API_KEY || '').trim();
  const q = `width=${w}&height=${h}&seed=${seed}&nologo=true`;
  const urls = key
    ? [`https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${q}`, `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${q}`]
    : [`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${q}`];
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: key && url.includes('gen.') ? { Authorization: `Bearer ${key}` } : {} });
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
  return new Response('No se pudo generar la imagen', { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } });
}
