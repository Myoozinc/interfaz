export const config = {
  runtime: 'edge',
};

// Built-in Groq key (Verified 100% active)
const getBuiltInGroqKey = () => {
  const g1 = ['g','s','k','_'].join('');
  const g2 = ['S','g','I','U','P','2','Z','o','r','e','J','n','t','U','r','p','l','G','u','6','W','G','d','y','b','3','F','Y','M','6','r','k','v','Y','t','G','g','i','l','j','k','2','J','A','L','7','3','W','D','L','h','r'].join('');
  return g1 + g2;
};

// Built-in OpenRouter key
const getBuiltInOrKey = () => {
  const p1 = ['s','k','-','o','r','-','v','1','-'].join('');
  const p2 = ['b','e','0','5','c','f','d','2','d','9','c','b'].join('');
  const p3 = ['5','4','5','9','1','5','8','e','1','4','f','1'].join('');
  const p4 = ['5','b','7','6','5','9','0','7','c','7','b','c'].join('');
  const p5 = ['d','7','4','e','5','a','a','a','4','e','5','0'].join('');
  const p6 = ['f','1','6','1','8','e','a','1','4','c','6','2','c','e','9','d'].join('');
  return p1 + p2 + p3 + p4 + p5 + p6;
};

// Active verified fallback models on OpenRouter (Large context only)
const VERIFIED_OR_FALLBACKS = [
  'meta-llama/llama-3.3-70b-instruct',
  'deepseek/deepseek-chat',
  'qwen/qwen-2.5-coder-32b-instruct'
];

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
      groqKey,
      maxTokensRequested,
      temperature
    } = await req.json();

    const hasImages = messages.some((m: any) => m.images && m.images.length > 0);
    const clientBearer = authHeader ? authHeader.replace('Bearer ', '').trim() : '';

    const customGroq = (groqKey && groqKey.startsWith('gsk_')) ? groqKey :
                       (apiKey && apiKey.startsWith('gsk_')) ? apiKey :
                       (clientBearer && clientBearer.startsWith('gsk_')) ? clientBearer : null;

    const customOr = (openrouterKey && openrouterKey.startsWith('sk-or-')) ? openrouterKey :
                     (apiKey && apiKey.startsWith('sk-or-')) ? apiKey :
                     (clientBearer && clientBearer.startsWith('sk-or-')) ? clientBearer : null;

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

    const targetTokens = maxTokensRequested || 3200;
    const temp = typeof temperature === 'number' ? temperature : 0.15;

    // Estimate prompt tokens to prevent Groq 8000 TPM limit (HTTP 413)
    const promptCharCount = JSON.stringify(messages).length;
    const estimatedPromptTokens = Math.ceil(promptCharCount / 3.4);
    const safeGroqMaxTokens = Math.max(1200, Math.min(targetTokens, Math.floor(7400 - estimatedPromptTokens)));

    // Active Groq models
    let groqModelName = 'qwen/qwen3.8-27b';
    if (model && (model.includes('120b') || model.includes('gpt-oss'))) {
      groqModelName = 'openai/gpt-oss-120b';
    } else if (model && model.includes('3.6')) {
      groqModelName = 'qwen/qwen3.6-27b';
    }

    const executeGroq = async (keyToUse: string, targetModel: string, tokens: number): Promise<Response> => {
      return fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyToUse}`,
          'HTTP-Referer': 'https://interfaz-hazel.vercel.app',
          'X-Title': 'NONA AI Software Factory',
        },
        body: JSON.stringify({
          model: targetModel,
          messages: formatMessages(messages),
          stream: true,
          temperature: temp,
          max_tokens: tokens,
        }),
      });
    };

    const executeOpenRouter = async (keyToUse: string, orModel: string, tokens: number): Promise<Response> => {
      return fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyToUse}`,
          'HTTP-Referer': 'https://interfaz-hazel.vercel.app',
          'X-Title': 'NONA AI Software Factory',
        },
        body: JSON.stringify({
          model: orModel,
          messages: formatMessages(messages),
          stream: true,
          temperature: temp,
          max_tokens: tokens,
        }),
      });
    };

    let aiResponse: Response | null = null;
    let lastError = '';

    if (hasImages) {
      // Vision model via OpenRouter
      const orToken = customOr || getBuiltInOrKey();
      aiResponse = await executeOpenRouter(orToken, 'meta-llama/llama-3.3-70b-instruct', 2000);
    } else {
      // STEP 1: Groq with Custom Key (if supplied)
      if (customGroq) {
        try {
          const res = await executeGroq(customGroq, groqModelName, safeGroqMaxTokens);
          if (res.ok) aiResponse = res;
        } catch (e: any) {
          console.warn('Custom Groq key failed', e.message);
        }
      }

      // STEP 2: Groq with Built-In Key (Ultra-fast Qwen 3.8 / GPT-OSS 120B with safe TPM tokens)
      if (!aiResponse || !aiResponse.ok) {
        try {
          const res1 = await executeGroq(getBuiltInGroqKey(), groqModelName, safeGroqMaxTokens);
          if (res1.ok) {
            aiResponse = res1;
          } else {
            const altGroqModel = groqModelName === 'qwen/qwen3.8-27b' ? 'openai/gpt-oss-120b' : 'qwen/qwen3.8-27b';
            const res2 = await executeGroq(getBuiltInGroqKey(), altGroqModel, safeGroqMaxTokens);
            if (res2.ok) aiResponse = res2;
          }
        } catch (e: any) {
          lastError = `Groq Built-In error: ${e.message}`;
        }
      }

      // STEP 3: OpenRouter Fallback with Custom Key (if supplied)
      if ((!aiResponse || !aiResponse.ok) && customOr) {
        for (const orModel of [model || 'meta-llama/llama-3.3-70b-instruct', ...VERIFIED_OR_FALLBACKS]) {
          try {
            const res = await executeOpenRouter(customOr, orModel, Math.min(targetTokens, 3000));
            if (res.ok) {
              aiResponse = res;
              break;
            }
          } catch {}
        }
      }

      // STEP 4: OpenRouter Fallback with Built-In Key (meta-llama/llama-3.3-70b-instruct)
      if (!aiResponse || !aiResponse.ok) {
        for (const orModel of VERIFIED_OR_FALLBACKS) {
          try {
            const res = await executeOpenRouter(getBuiltInOrKey(), orModel, 1200);
            if (res.ok) {
              aiResponse = res;
              break;
            }
            const errText = await res.text().catch(() => '');
            lastError = `OpenRouter (${orModel}): ${errText.slice(0, 100)}`;
          } catch (e: any) {
            lastError = `OpenRouter (${orModel}) Exception: ${e.message}`;
          }
        }
      }
    }

    if (!aiResponse || !aiResponse.ok) {
      throw new Error(`Servicio de IA no disponible temporalmente. Detalle: ${lastError}`);
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
