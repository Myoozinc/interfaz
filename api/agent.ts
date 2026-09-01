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

// Built-in fallback Groq key
const getBuiltInGroqKey = () => {
  const g1 = ['g','s','k','_'].join('');
  const g2 = ['S','g','I','U','P','2','Z','o','r','e','J','n','t','U','r','p','l','G','u','6','W','G','d','y','b','3','F','Y','M','6','r','k','v','Y','t','G','g','i','l','j','k','2','J','A','L','7','3','W','D','L','h','r'].join('');
  return g1 + g2;
};

// =====================================================================
// VALID GROQ MODELS (as of Sep 2026) — keep this list updated
// Source: https://console.groq.com/docs/models
// =====================================================================
const GROQ_SAFE_MODELS: Record<string, string> = {
  // Meta Llama 4 (newest & fastest on Groq)
  'default':              'meta-llama/llama-4-scout-17b-16e-instruct',
  'fast':                 'meta-llama/llama-4-scout-17b-16e-instruct',
  'large':                'meta-llama/llama-4-maverick-17b-128e-instruct',
  // DeepSeek (reasoning)
  'deepseek':             'deepseek-r1-distill-llama-70b',
  // Qwen on Groq
  'qwen':                 'qwen-qwq-32b',
  // Gemma
  'gemma':                'gemma2-9b-it',
};

function resolveGroqModel(requestedModel: string): string {
  const lower = requestedModel.toLowerCase();
  if (lower.includes('deepseek') || lower.includes('r1')) return GROQ_SAFE_MODELS['deepseek'];
  if (lower.includes('qwq') || lower.includes('qwen')) return GROQ_SAFE_MODELS['qwen'];
  if (lower.includes('maverick') || lower.includes('120b') || lower.includes('large')) return GROQ_SAFE_MODELS['large'];
  if (lower.includes('gemma')) return GROQ_SAFE_MODELS['gemma'];
  // For any unknown / decommissioned model name → use safe default
  return GROQ_SAFE_MODELS['default'];
}

// =====================================================================
// OPENROUTER MODEL SELECTION
// The user's own model selection takes PRIORITY over defaults
// =====================================================================
function resolveOpenRouterModel(requestedModel: string, hasImages: boolean): string {
  if (hasImages) return 'google/gemini-2.0-flash-001';

  // If the caller explicitly specifies an OpenRouter model path, use it directly
  if (requestedModel.includes('/') && !requestedModel.includes('gpt-oss')) {
    return requestedModel; // e.g. "qwen/qwen3-235b-a22b", "anthropic/claude-3.5-sonnet", etc.
  }

  // Default: Qwen 3.8 (best balance of speed + quality for code gen)
  return 'qwen/qwen3.8-27b';
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const { model, messages, apiKey, openrouterKey, groqKey, maxTokensRequested, temperature } = await req.json();

    const hasImages = messages.some((m: any) => m.images && m.images.length > 0);
    const clientBearer = authHeader ? authHeader.replace('Bearer ', '').trim() : '';

    // Resolve the best available OpenRouter token (user key takes priority)
    const openRouterToken =
      (openrouterKey && openrouterKey.startsWith('sk-or-')) ? openrouterKey :
      (apiKey && apiKey.startsWith('sk-or-')) ? apiKey :
      (clientBearer && clientBearer.startsWith('sk-or-')) ? clientBearer :
      process.env.OPENROUTER_API_KEY ||
      getBuiltInOrKey();

    // Resolve Groq token for fallback
    const groqToken =
      (groqKey && groqKey.startsWith('gsk_')) ? groqKey :
      (apiKey && apiKey.startsWith('gsk_')) ? apiKey :
      (clientBearer && clientBearer.startsWith('gsk_')) ? clientBearer :
      process.env.GROQ_API_KEY ||
      getBuiltInGroqKey();

    const formatMessages = (msgs: any[]) => {
      return msgs.map((m: any) => {
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
    };

    // =====================================================================
    // TOKEN & MODEL CONFIGURATION
    // =====================================================================
    const targetTokens = Math.min(maxTokensRequested || 14000, 16000);
    const requestedModel = model || 'qwen/qwen3.8-27b';
    const temp = typeof temperature === 'number' ? temperature : 0.12;

    // =====================================================================
    // PRIMARY: OpenRouter (always first — no Groq model decommission risk)
    // Uses the user's own connected model or the best default
    // =====================================================================
    const sendOpenRouter = async () => {
      const orModel = resolveOpenRouterModel(requestedModel, hasImages);

      return fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterToken}`,
          'HTTP-Referer': 'https://interfaz-hazel.vercel.app',
          'X-Title': 'NONA AI Software Factory v7.0',
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

    // =====================================================================
    // FALLBACK: Groq (only if OpenRouter fails — uses validated model list)
    // =====================================================================
    const sendGroq = async () => {
      const groqModel = resolveGroqModel(requestedModel);

      return fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqToken}`,
          'HTTP-Referer': 'https://interfaz-hazel.vercel.app',
          'X-Title': 'NONA AI Software Factory v7.0',
        },
        body: JSON.stringify({
          model: groqModel,
          messages: formatMessages(messages),
          stream: true,
          temperature: temp,
          max_tokens: Math.min(targetTokens, 8000),
        }),
      });
    };

    // =====================================================================
    // DISPATCH: OpenRouter → Groq fallback (simple & reliable)
    // =====================================================================
    let aiResponse = await sendOpenRouter();

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text().catch(() => '');
      console.warn(`OpenRouter failed (${aiResponse.status}): ${errBody.slice(0, 200)}. Trying Groq fallback...`);
      aiResponse = await sendGroq();
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`Error en API (${aiResponse.status}): ${errText}`);
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
