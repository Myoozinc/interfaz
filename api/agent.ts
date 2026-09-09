// Standard Node.js Serverless runtime on Vercel with 60s timeout limit (Paso 1)
export const maxDuration = 60;


// Verified active 100% FREE models on OpenRouter (when an OpenRouter key is configured)
const VERIFIED_FREE_OR_MODELS = [
  'nvidia/nemotron-3.5-lightning:free',
  'inclusionai/ling-3.0-flash-fin:free',
  'dots-studio/dots-3-note-preview:free',
  'liquid/lfm-2.5-2.6b:free'
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

    // Server-side environment variables (Vercel / .env)
    const envGroqKeys: string[] = [
      process.env.GROQ_API_KEY || '',
      ...(process.env.GROQ_API_KEYS ? process.env.GROQ_API_KEYS.split(',') : [])
    ].map(k => k.trim()).filter(Boolean);

    const envOrKey = (process.env.OPENROUTER_API_KEY || '').trim();

    const groqKeysToTry = customGroq ? [customGroq, ...envGroqKeys] : envGroqKeys;
    const orKeyToUse = customOr || envOrKey;

    const formatMessages = (msgs: any[]) => {
      return msgs.map((m: any) => {
        let textContent = m.content || '';
        // If message text is excessively large (e.g. huge code payload), compact to prevent HTTP 413
        if (textContent.length > 14000) {
          textContent = textContent.slice(0, 9000) + '\n\n/* ... [contexto comprimido por seguridad] ... */\n\n' + textContent.slice(-4000);
        }

        if (m.images && m.images.length > 0) {
          const contentParts: any[] = [{ type: 'text', text: textContent }];
          m.images.forEach((img: string) => {
            const url = img.startsWith('data:') ? img : `data:image/png;base64,${img}`;
            contentParts.push({ type: 'image_url', image_url: { url } });
          });
          return { role: m.role, content: contentParts };
        }
        return { role: m.role, content: textContent };
      });
    };

    const targetTokens = maxTokensRequested || 3000;
    const temp = typeof temperature === 'number' ? temperature : 0.15;

    // Paso 4: Reajuste del presupuesto de tokens.
    // Garantizamos un piso robusto de 6,000 a 8,192 tokens en Groq para evitar respuestas JSON
    // truncadas a la mitad. Groq LPU soporta 8,192 tokens de salida sin cortes por TPM
    // cuando el prompt se mantiene dentro del context window estándar.
    const safeGroqMaxTokens = Math.max(6000, Math.min(targetTokens, 8192));

    const executeGroq = async (keyToUse: string, targetModel: string, tokens: number): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout para Groq LPU ultra rápido
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return res;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    const executeOpenRouter = async (keyToUse: string, orModel: string, tokens: number): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout permitido por runtime Serverless Node.js

      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return res;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    let aiResponse: Response | null = null;
    let lastError = '';

    if (hasImages) {
      // Vision model: Prefer OpenRouter gemini-2.5-flash or Groq vision
      if (orKeyToUse) {
        aiResponse = await executeOpenRouter(orKeyToUse, 'google/gemini-2.5-flash', 2000);
      } else if (groqKeysToTry.length > 0) {
        aiResponse = await executeGroq(groqKeysToTry[0], 'llama-3.2-11b-vision-preview', 2000);
      } else {
        throw new Error('Para procesar imágenes se requiere OPENROUTER_API_KEY o GROQ_API_KEY configurada.');
      }
    } else {
      let resolvedModel = model;
      if (
        !resolvedModel ||
        resolvedModel === 'qwen/qwen3.8-27b' ||
        resolvedModel === 'qwen3.8-27b' ||
        resolvedModel === 'qwen3.8'
      ) {
        resolvedModel = targetTokens >= 5000 ? 'deepseek/deepseek-chat' : 'llama-3.3-70b-versatile';
      }

      const isExplicitGroq = resolvedModel && (
        resolvedModel.includes('llama') ||
        resolvedModel.includes('mixtral') ||
        resolvedModel.includes('gemma') ||
        resolvedModel.startsWith('groq/')
      );

      const isOpenRouterPreferred = (resolvedModel && (
        resolvedModel.includes('/') &&
        !resolvedModel.startsWith('groq/') &&
        !isExplicitGroq
      )) || (targetTokens >= 5000);

      const standardGroqModels = [
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant'
      ];

      if (isOpenRouterPreferred && orKeyToUse) {
        // TIER 1 (High-Capacity / OpenRouter preferred): DeepSeek-V3, Qwen Coder (max 2 attempts before Groq fallback)
        const targetModels = Array.from(new Set([
          resolvedModel,
          'deepseek/deepseek-chat',
          'qwen/qwen-2.5-coder-32b-instruct',
        ].filter(Boolean))).slice(0, 2);

        for (const orModel of targetModels) {
          try {
            // Permitir hasta 16,000 tokens en OpenRouter para generación completa multi-archivo
            const openRouterTokens = Math.max(8000, Math.min(targetTokens, 16000));
            const res = await executeOpenRouter(orKeyToUse, orModel, openRouterTokens);
            if (res.ok) {
              aiResponse = res;
              break;
            } else {
              const errText = await res.text().catch(() => '');
              lastError = `OpenRouter (${orModel}): ${errText.slice(0, 100)}`;
            }
          } catch (e: any) {
            lastError = `OpenRouter (${orModel}) Exception: ${e.message}`;
          }
        }

        // Fallback to Groq LPU if OpenRouter models fail
        if ((!aiResponse || !aiResponse.ok) && groqKeysToTry.length > 0) {
          for (const key of groqKeysToTry) {
            for (const targetM of standardGroqModels) {
              try {
                const res = await executeGroq(key, targetM, safeGroqMaxTokens);
                if (res.ok) {
                  aiResponse = res;
                  break;
                } else {
                  const errTxt = await res.text().catch(() => '');
                  lastError = `Groq (${targetM}): ${errTxt.slice(0, 100)}`;
                }
              } catch (e: any) {
                lastError = `Groq (${targetM}) error: ${e.message}`;
              }
            }
            if (aiResponse && aiResponse.ok) break;
          }
        }
      } else {
        // TIER 1 (Fast Low-Latency / Groq preferred): Llama 3.3 70B, Llama 3.1 8B Instant
        if (groqKeysToTry.length > 0) {
          for (const key of groqKeysToTry) {
            for (const targetM of standardGroqModels) {
              try {
                const res = await executeGroq(key, targetM, safeGroqMaxTokens);
                if (res.ok) {
                  aiResponse = res;
                  break;
                } else {
                  const errTxt = await res.text().catch(() => '');
                  lastError = `Groq (${targetM}): ${errTxt.slice(0, 100)}`;
                }
              } catch (e: any) {
                lastError = `Groq (${targetM}) error: ${e.message}`;
              }
            }
            if (aiResponse && aiResponse.ok) break;
          }
        }

        // TIER 2: Fallback to OpenRouter
        if ((!aiResponse || !aiResponse.ok) && orKeyToUse) {
          const targetModels = [
            resolvedModel || 'deepseek/deepseek-chat',
            'deepseek/deepseek-chat',
            'qwen/qwen-2.5-coder-32b-instruct',
            'meta-llama/llama-3.3-70b-instruct',
            ...VERIFIED_FREE_OR_MODELS
          ];
          for (const orModel of targetModels) {
            try {
              const openRouterTokens = Math.max(6000, Math.min(targetTokens, 12000));
              const res = await executeOpenRouter(orKeyToUse, orModel, openRouterTokens);
              if (res.ok) {
                aiResponse = res;
                break;
              } else {
                const errText = await res.text().catch(() => '');
                lastError = `OpenRouter (${orModel}): ${errText.slice(0, 100)}`;
              }
            } catch (e: any) {
              lastError = `OpenRouter (${orModel}) Exception: ${e.message}`;
            }
          }
        }
      }
    }

    if (!aiResponse || !aiResponse.ok) {
      if (groqKeysToTry.length === 0 && !orKeyToUse) {
        return new Response(JSON.stringify({
          error: 'No se detectó ninguna clave de API. Configura GROQ_API_KEY o OPENROUTER_API_KEY en las variables de entorno de Vercel (.env) o ingresa tu API Key en los Ajustes de NONA.'
        }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
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
