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

    const hasImages = messages.some((m: any) => m.images && m.images.length > 0);

    let token = (apiKey && apiKey.trim()) || (authHeader ? authHeader.replace('Bearer ', '').trim() : '');

    if (!token) {
      token = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    }

    if (!token) {
      return new Response(JSON.stringify({ 
        error: '⚠️ Claves no configuradas en Vercel o en Ajustes (⚙️).' 
      }), { status: 401 });
    }

    const isOpenRouter = token.startsWith('sk-or-') || !token.startsWith('gsk_');

    // High-capacity models with up to 12,000 completion tokens
    let endpoint = isOpenRouter
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.groq.com/openai/v1/chat/completions';

    let targetModel = isOpenRouter
      ? (hasImages ? 'google/gemini-2.0-flash-001' : 'qwen/qwen3.8-27b')
      : 'qwen/qwen3.8-27b';

    let maxTokens = isOpenRouter ? 12000 : 4096;

    // Format messages for OpenAI / OpenRouter schema
    const formattedMessages = messages.map((m: any) => {
      if (m.images && m.images.length > 0 && isOpenRouter) {
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

    const requestPayload: any = {
      model: targetModel,
      messages: formattedMessages,
      stream: true,
      temperature: 0.3,
      max_tokens: maxTokens,
    };

    if (isOpenRouter) {
      requestPayload.include_reasoning = false;
    }

    let aiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'HTTP-Referer': 'https://interfaz-hazel.vercel.app',
        'X-Title': 'NONA AI Software Factory',
      },
      body: JSON.stringify(requestPayload),
    });

    // Fallback: If primary request fails, try secondary engine
    if (!aiResponse.ok) {
      const fallbackToken = token.startsWith('sk-or-') ? process.env.GROQ_API_KEY : process.env.OPENROUTER_API_KEY;
      if (fallbackToken) {
        const fallbackIsOpenRouter = fallbackToken.startsWith('sk-or-');
        const fallbackEndpoint = fallbackIsOpenRouter 
          ? 'https://openrouter.ai/api/v1/chat/completions' 
          : 'https://api.groq.com/openai/v1/chat/completions';
        const fallbackModel = fallbackIsOpenRouter ? 'qwen/qwen3.8-27b' : 'qwen/qwen3.8-27b';

        const fallbackPayload: any = {
          model: fallbackModel,
          messages: formattedMessages,
          stream: true,
          temperature: 0.3,
          max_tokens: fallbackIsOpenRouter ? 12000 : 4096,
        };
        if (fallbackIsOpenRouter) {
          fallbackPayload.include_reasoning = false;
        }

        aiResponse = await fetch(fallbackEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${fallbackToken}`,
            'HTTP-Referer': 'https://interfaz-hazel.vercel.app',
            'X-Title': 'NONA AI Software Factory',
          },
          body: JSON.stringify(fallbackPayload),
        });
      }
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`Error en API (${aiResponse.status}): ${errText}`);
    }

    const reader = aiResponse.body?.getReader();
    if (!reader) throw new Error('No se pudo abrir el stream de lectura');

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
                const delta = parsed.choices?.[0]?.delta;
                const deltaContent = delta?.content || (delta?.reasoning ? '' : '');
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
