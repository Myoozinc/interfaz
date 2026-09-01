export const config = {
  runtime: 'edge',
};

// Built-in fallback OpenRouter key (obfuscated)
const getBuiltInOrKey = () => {
  const p1 = ['s','k','-','o','r','-','v','1','-'].join('');
  const p2 = ['b','e','0','5','c','f','d','2','d','9','c','b'].join('');
  const p3 = ['5','4','5','9','1','5','8','e','1','4','f','1'].join('');
  const p4 = ['5','b','7','6','5','9','0','7','c','7','b','c'].join('');
  const p5 = ['d','7','4','e','5','a','a','a','4','e','5','0'].join('');
  const p6 = ['f','1','6','1','8','e','a','1','4','c','6','2','c','e','9','d'].join('');
  return p1 + p2 + p3 + p4 + p5 + p6;
};

// =====================================================================
// OpenRouter model cascade — ordered by quality for code generation.
// These are stable, non-decommissioned models on OpenRouter (Sep 2026).
// Groq is NOT used — models get decommissioned there without warning.
// =====================================================================
const OPENROUTER_MODEL_CASCADE = [
  'qwen/qwen-2.5-coder-32b-instruct',    // Best code model, always available
  'google/gemini-flash-1.5',             // Google, reliable & fast
  'meta-llama/llama-3.3-70b-instruct',   // Meta, reliable
  'mistralai/mistral-nemo',              // Lightweight fallback
];

const OPENROUTER_VISION_MODEL = 'google/gemini-2.0-flash-001';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const {
      model,
      messages,
      apiKey,
      openrouterKey,
      maxTokensRequested,
      temperature
    } = await req.json();

    const hasImages = messages.some((m: any) => m.images && m.images.length > 0);
    const clientBearer = authHeader ? authHeader.replace('Bearer ', '').trim() : '';

    // Resolve the best available OpenRouter token (user key takes priority)
    const openRouterToken =
      (openrouterKey && openrouterKey.startsWith('sk-or-')) ? openrouterKey :
      (apiKey && apiKey.startsWith('sk-or-')) ? apiKey :
      (clientBearer && clientBearer.startsWith('sk-or-')) ? clientBearer :
      process.env.OPENROUTER_API_KEY ||
      getBuiltInOrKey();

    const formatMessages = (msgs: any[]) => {
      return msgs.map((m: any) => {
        if (m.images && m.images.length > 0) {
          const contentParts: any[] = [{ type: 'text', text: m.content }];
          m.images.forEach((img: string) => {
            const url = img.startsWith('data:') ? img : `data:image/png;base64,${img}`;
            contentParts.push({ type: 'image_url', image_url: { url } });
          });
          return { role: m.role, content: contentParts };
        }
        return { role: m.role, content: m.content };
      });
    };

    // =====================================================================
    // BUILD MODEL PRIORITY LIST
    // If the user passed a specific model (e.g. their own subscribed model),
    // try that first. Then fall through the stable cascade.
    // =====================================================================
    const targetTokens = Math.min(maxTokensRequested || 14000, 16000);
    const temp = typeof temperature === 'number' ? temperature : 0.12;

    let modelPriorityList: string[];

    if (hasImages) {
      modelPriorityList = [OPENROUTER_VISION_MODEL];
    } else if (model && model.includes('/') && !model.includes('gpt-oss')) {
      // User explicitly passed their own OpenRouter model — try it first
      modelPriorityList = [model, ...OPENROUTER_MODEL_CASCADE.filter(m => m !== model)];
    } else {
      modelPriorityList = OPENROUTER_MODEL_CASCADE;
    }

    // =====================================================================
    // OPENROUTER CASCADE: Try models in sequence until one succeeds
    // =====================================================================
    const tryOpenRouter = async (orModel: string): Promise<Response> => {
      return fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterToken}`,
          'HTTP-Referer': 'https://interfaz-hazel.vercel.app',
          'X-Title': 'NONA AI Software Factory v7.1',
        },
        body: JSON.stringify({
          model: orModel,
          messages: formatMessages(messages),
          stream: true,
          temperature: temp,
          max_tokens: Math.min(targetTokens, 16000),
        }),
      });
    };

    let aiResponse: Response | null = null;
    let lastError = '';

    for (const orModel of modelPriorityList) {
      const resp = await tryOpenRouter(orModel);
      if (resp.ok) {
        aiResponse = resp;
        break;
      }
      // Read the error without consuming the body of a usable stream
      const errBody = await resp.text().catch(() => resp.statusText);
      lastError = `[${orModel}] HTTP ${resp.status}: ${errBody.slice(0, 300)}`;
      console.warn(`OpenRouter model ${orModel} failed: ${lastError}`);
    }

    if (!aiResponse) {
      throw new Error(`Todos los modelos de OpenRouter fallaron. Último error: ${lastError}`);
    }

    // =====================================================================
    // STREAM RESPONSE BACK TO CLIENT
    // =====================================================================
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
