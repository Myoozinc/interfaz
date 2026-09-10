export const config = {
  runtime: 'edge',
};

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

    // Presupuesto de tokens optimizado para Groq LPU (respetando el límite de 6,000 TPM del tier gratuito)
    // Con la generación multi-fase, cada llamada genera 1,500 - 2,500 tokens.
    const safeGroqMaxTokens = maxTokensRequested 
      ? Math.min(Math.max(maxTokensRequested, 200), 4000) 
      : 3500;

    const executeGroq = async (keyToUse: string, targetModel: string, tokens: number): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout para Groq LPU (~450 t/s)
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
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout ágil para conmutar a Groq sin agotar la ventana de Vercel
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
        // Enrutamiento nativo a Groq LPU Llama 3.3 70B (~450 t/s) para latencia instantánea
        resolvedModel = 'llama-3.3-70b-versatile';
      }

      const isExplicitGroq = resolvedModel && (
        resolvedModel.includes('llama') ||
        resolvedModel.includes('mixtral') ||
        resolvedModel.includes('gemma') ||
        resolvedModel.startsWith('groq/')
      );

      // OpenRouter solo se prioriza si el usuario configuró explícitamente su clave personalizada
      const isOpenRouterPreferred = Boolean(
        customOr &&
        resolvedModel &&
        resolvedModel.includes('/') &&
        !resolvedModel.startsWith('groq/') &&
        !isExplicitGroq
      );

      const standardGroqModels = [
        'llama-3.3-70b-versatile',
        'llama3-70b-8192',
        'llama3-8b-8192',
        'llama-3.2-3b-preview'
      ];

      if (isOpenRouterPreferred && orKeyToUse) {
        // TIER 1 (OpenRouter): 1 intento con 4s timeout ágil
        const targetModels = Array.from(new Set([
          resolvedModel,
          'deepseek/deepseek-chat',
          'qwen/qwen-2.5-coder-32b-instruct',
          ...VERIFIED_FREE_OR_MODELS
        ]));
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

        // Si OpenRouter falla o expira, Fallback instantáneo a Groq LPU
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
                  lastError += ` | Groq (${targetM}): ${errTxt.slice(0, 100)}`;
                }
              } catch (e: any) {
                lastError += ` | Groq (${targetM}) error: ${e.message}`;
              }
            }
            if (aiResponse && aiResponse.ok) break;
          }
        }
      } else {
        // TIER 1 (Fast Low-Latency / Groq LPU preferred): Llama 3.3 70B (~450 tokens/s)
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
    let tokensEmitted = 0;

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';

        const emitContent = (text: string) => {
          if (!text) return;
          tokensEmitted++;
          const payload = JSON.stringify({ message: { content: text } }) + '\n';
          controller.enqueue(encoder.encode(payload));
        };

        const processChunkLine = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) return;
          if (trimmed === 'data: [DONE]') {
            return;
          }

          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              if (parsed.error) {
                const errMsg = parsed.error.message || JSON.stringify(parsed.error);
                emitContent(`\n[Error de proveedor: ${errMsg}]\n`);
                return;
              }
              const delta = parsed.choices?.[0]?.delta;
              const content = delta?.content || delta?.reasoning_content || delta?.reasoning || parsed.choices?.[0]?.text || '';
              if (content) {
                emitContent(content);
              }
            } catch {}
            return;
          }

          // Handle raw JSON response (non-SSE fallback)
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.error) {
                const errMsg = parsed.error.message || JSON.stringify(parsed.error);
                emitContent(`\n[Error de proveedor: ${errMsg}]\n`);
                return;
              }
              const content = parsed.choices?.[0]?.message?.content || 
                              parsed.choices?.[0]?.delta?.content || 
                              parsed.choices?.[0]?.text || '';
              if (content) {
                emitContent(content);
              }
            } catch {}
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            processChunkLine(line);
          }
        }

        if (buffer.trim()) {
          processChunkLine(buffer.trim());
        }

        if (tokensEmitted === 0) {
          emitContent('\n[Aviso: El modelo no emitió tokens en este intento. Reintentando automáticamente...]\n');
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
