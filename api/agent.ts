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

    let userKey = (apiKey && apiKey.trim()) || (authHeader ? authHeader.replace('Bearer ', '').trim() : '');

    // Preferred primary key: OpenRouter for 12,000 token capacity, with Groq as fast engine
    let openrouterKey = process.env.OPENROUTER_API_KEY || '';
    let groqKey = process.env.GROQ_API_KEY || '';

    let primaryKey = userKey || openrouterKey || groqKey;
    if (!primaryKey) {
      return new Response(JSON.stringify({ 
        error: '⚠️ Claves no configuradas en Vercel o en Ajustes (⚙️).' 
      }), { status: 401 });
    }

    const isPrimaryOpenRouter = primaryKey.startsWith('sk-or-') || !primaryKey.startsWith('gsk_');

    const formatMessages = (msgs: any[], forOpenRouter: boolean) => {
      return msgs.map((m: any) => {
        if (m.images && m.images.length > 0 && forOpenRouter) {
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
    };

    const makeRequest = async (key: string, isOpenRouter: boolean) => {
      const endpoint = isOpenRouter
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.groq.com/openai/v1/chat/completions';

      const model = isOpenRouter
        ? (hasImages ? 'google/gemini-2.0-flash-001' : 'qwen/qwen3.8-27b')
        : 'qwen/qwen3.8-27b';

      const payload: any = {
        model,
        messages: formatMessages(messages, isOpenRouter),
        stream: true,
        temperature: 0.3,
        max_tokens: isOpenRouter ? 12000 : 3800,
      };

      if (isOpenRouter) {
        payload.include_reasoning = false;
      }

      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': 'https://interfaz-hazel.vercel.app',
          'X-Title': 'NONA AI Software Factory',
        },
        body: JSON.stringify(payload),
      });
    };

    let aiResponse = await makeRequest(primaryKey, isPrimaryOpenRouter);

    // Auto-Failover on 429 rate limits or any HTTP error:
    if (!aiResponse.ok) {
      console.warn(`Primary endpoint returned status ${aiResponse.status}. Executing automatic failover...`);
      const backupKey = isPrimaryOpenRouter ? groqKey : openrouterKey;
      if (backupKey) {
        const isBackupOpenRouter = backupKey.startsWith('sk-or-') || !backupKey.startsWith('gsk_');
        aiResponse = await makeRequest(backupKey, isBackupOpenRouter);
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
                const deltaContent = delta?.content || '';
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
