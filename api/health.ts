export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'https://timely-diane-frozen-described.trycloudflare.com';
  const comfyUrl = process.env.COMFYUI_BASE_URL || 'http://127.0.0.1:8188';

  let ollamaStatus = 'FAIL';
  let ollamaLatency = 0;
  let models: string[] = [];

  try {
    const start = Date.now();
    const res = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/tags`, {
      headers: { 'Bypass-Tunnel-Reminder': 'true' },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      ollamaStatus = 'PASS';
      ollamaLatency = Date.now() - start;
      models = (data.models || []).map((m: any) => m.name);
    }
  } catch {}

  let comfyStatus = 'FAIL';
  try {
    const res = await fetch(`${comfyUrl.replace(/\/$/, '')}/system_stats`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) comfyStatus = 'PASS';
  } catch {}

  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    subsystems: {
      backend: 'PASS',
      ollama: { status: ollamaStatus, latency: ollamaLatency, models, url: ollamaUrl },
      comfyui: { status: comfyStatus, url: comfyUrl },
      vercel: 'PASS',
    }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
