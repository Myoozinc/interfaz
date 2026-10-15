export const config = { runtime: 'edge' };

/**
 * Fotos reales de Pexels para las apps de NONA (gratis: 200 peticiones/hora, 20.000/mes; requiere atribución).
 * GET /api/photo?q=cafeteria&orientation=landscape&i=0&size=large  → redirige a la foto (CORS) con atribución en cabeceras.
 * Sin PEXELS_API_KEY (o si falla) devuelve una imagen generada con IA para que la app nunca se rompa.
 */
export default async function handler(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get('q') || u.searchParams.get('query') || 'abstract').slice(0, 120);
  const orientation = ['landscape', 'portrait', 'square'].includes(u.searchParams.get('orientation') || '') ? u.searchParams.get('orientation')! : 'landscape';
  const i = Math.max(0, Math.min(14, parseInt(u.searchParams.get('i') || '0', 10) || 0));
  const size = ['original', 'large2x', 'large', 'medium', 'small', 'portrait', 'landscape', 'tiny'].includes(u.searchParams.get('size') || '') ? u.searchParams.get('size')! : 'large';
  const key = (process.env.PEXELS_API_KEY || '').trim();
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'X-Photographer, X-Photo-Url' };
  if (key) {
    try {
      const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=${orientation}&per_page=15`, { headers: { Authorization: key }, signal: AbortSignal.timeout(8000) });
      const j: any = r.ok ? await r.json() : null;
      const photos = j?.photos || [];
      const p = photos[i % Math.max(1, photos.length)];
      if (p?.src?.[size]) {
        return new Response(null, {
          status: 302,
          headers: { ...cors, Location: p.src[size], 'X-Photographer': encodeURIComponent(p.photographer || ''), 'X-Photo-Url': p.url || '', 'Cache-Control': 'public, max-age=86400, s-maxage=604800' },
        });
      }
    } catch {}
  }
  const w = orientation === 'portrait' ? 768 : 1024, h = orientation === 'portrait' ? 1024 : orientation === 'square' ? 1024 : 683;
  return new Response(null, {
    status: 302,
    headers: { ...cors, Location: `/api/image?prompt=${encodeURIComponent(q + ', professional photograph, natural light')}&w=${w}&h=${h}&seed=${i + 3}`, 'Cache-Control': 'public, max-age=3600' },
  });
}
