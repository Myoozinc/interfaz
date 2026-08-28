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
      if (hasImages && process.env.OPENROUTER_API_KEY) {
        token = process.env.OPENROUTER_API_KEY;
      } else {
        token = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;
      }
    }

    if (!token) {
      return new Response(JSON.stringify({ 
        error: '⚠️ Claves no configuradas en Vercel o en Ajustes (⚙️).' 
      }), { status: 401 });
    }

    const isGroq = token.startsWith('gsk_') && !hasImages;
    let endpoint = isGroq 
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';

    let targetModel = isGroq
      ? 'qwen/qwen3.8-27b'
      : (hasImages ? 'google/gemini-2.0-flash-001' : 'qwen/qwen-2.5-coder-32b-instruct');

    // Format messages for OpenAI / OpenRouter / Groq schema
    const formattedMessages = messages.map((m: any) => {
      if (m.images && m.images.length > 0 && !isGroq) {
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

    let aiResponse = await fetch(endpoint, {
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

    // Auto-fallback: If Groq hit its 8000 TPM limit or rate limit, automatically fallback to OpenRouter!
    if (!aiResponse.ok && isGroq && process.env.OPENROUTER_API_KEY) {
      console.warn('Groq TPM rate limit hit, automatically switching to OpenRouter Qwen 2.5 Coder 32B...');
      aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://interfaz-hazel.vercel.app',
          'X-Title': 'NONA AI Software Factory',
        },
        body: JSON.stringify({
          model: 'qwen/qwen-2.5-coder-32b-instruct',
          messages: formattedMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });
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
