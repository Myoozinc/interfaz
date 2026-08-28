export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const { messages, apiKey } = await req.json();
    const token = apiKey || (authHeader ? authHeader.replace('Bearer ', '') : '') || process.env.OPENROUTER_API_KEY;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Falta configurar OPENROUTER_API_KEY en Vercel o en los Ajustes' }), { status: 401 });
    }

    // Check if any message has attached images
    const hasImages = messages.some((m: any) => m.images && m.images.length > 0);

    // If multimodal images are attached, use Qwen 2.5 VL or Gemini 2.0 Flash; otherwise use Qwen 2.5 Coder 32B
    const targetModel = hasImages 
      ? 'google/gemini-2.0-flash-001' 
      : 'qwen/qwen-2.5-coder-32b-instruct';

    // Format messages for OpenRouter OpenAI-compatible schema
    const formattedMessages = messages.map((m: any) => {
      if (m.images && m.images.length > 0) {
        const contentParts: any[] = [{ type: 'text', text: m.content }];
        m.images.forEach((img: string) => {
          const formattedUrl = img.startsWith('data:') ? img : `data:image/png;base64,${img}`;
          contentParts.push({
            type: 'image_url',
            image_url: { url: formattedUrl }
          });
        });
        return { role: m.role, content: contentParts };
      }
      return { role: m.role, content: m.content };
    });

    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'HTTP-Referer': 'https://interfaz-hazel.vercel.app',
        'X-Title': 'NONA AI Software Factory',
      },
      body: JSON.stringify({
        model: targetModel,
        messages: formattedMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      throw new Error(`OpenRouter Cloud Error (${openRouterRes.status}): ${errText}`);
    }

    const reader = openRouterRes.body?.getReader();
    if (!reader) throw new Error('No se pudo abrir el stream de lectura de OpenRouter');

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed === 'data: [DONE]') {
              controller.close();
              return;
            }

            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const deltaContent = parsed.choices?.[0]?.delta?.content;
                if (deltaContent) {
                  const payload = JSON.stringify({ message: { content: deltaContent } }) + '\n';
                  controller.enqueue(encoder.encode(payload));
                }
              } catch {}
            }
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
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
