export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { prompt, endpoint } = await req.json();
    const targetUrl = endpoint || process.env.NONA_INFERENCE_ENDPOINT || 'http://127.0.0.1:11434';

    const response = await fetch(`${targetUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3.8',
        messages: [
          { role: 'system', content: 'Eres NONA AI. Genera el código completo en formato HTML listo para renderizar.' },
          { role: 'user', content: prompt }
        ],
        stream: true,
      }),
    });

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
