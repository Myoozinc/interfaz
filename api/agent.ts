export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const { messages, apiKey, openrouterKey, groqKey } = await req.json();

    const hasImages = messages.some((m: any) => m.images && m.images.length > 0);

    const clientBearer = authHeader ? authHeader.replace('Bearer ', '').trim() : '';
    
    // Auto-detect keys from environment or payload
    const envOpenRouter = process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY || process.env.OPENROUTER_KEY || '';
    const envGroq = process.env.GROQ_API_KEY || process.env.GROQ_KEY || '';

    const effectiveOpenRouter = openrouterKey || (apiKey?.startsWith('sk-or-') ? apiKey : '') || (clientBearer.startsWith('sk-or-') ? clientBearer : '') || envOpenRouter;
    const effectiveGroq = groqKey || (apiKey?.startsWith('gsk_') ? apiKey : '') || (clientBearer.startsWith('gsk_') ? clientBearer : '') || envGroq;

    // Prioritize OpenRouter for massive 12,000 token capacity and no 8000 TPM limit
    let primaryKey = effectiveOpenRouter || effectiveGroq;
    let backupKey = effectiveGroq !== primaryKey ? effectiveGroq : effectiveOpenRouter;

    if (!primaryKey) {
      return new Response(JSON.stringify({ 
        error: '⚠️ Claves no configuradas. Agrega tu clave en Ajustes (⚙️) o en Vercel.' 
      }), { status: 401 });
    }

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

    const makeRequest = async (key: string) => {
      const isOpenRouter = key.startsWith('sk-or-') || !key.startsWith('gsk_');
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

    let aiResponse = await makeRequest(primaryKey);

    // Auto-Failover on 429 rate limits or any HTTP error:
    if (!aiResponse.ok && backupKey && backupKey !== primaryKey) {
      console.warn(`Primary endpoint returned status ${aiResponse.status}. Executing automatic failover to backup engine...`);
      aiResponse = await makeRequest(backupKey);
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
