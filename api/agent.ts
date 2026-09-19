export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

// Verified active 100% FREE models on OpenRouter (when an OpenRouter key is configured)
const VERIFIED_FREE_OR_MODELS = [
  'poolside/laguna-s-2.1:free',
  'cohere/north-mini-code:free',
  'nex-agi/nex-n2.5-pro:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3.5-lightning:free'
];

export default async function handler(req: any, res?: any) {
  // Support both Node.js Serverless (@vercel/node with res) and Edge/Web Standard (req: Request -> Response)
  const isNode = Boolean(res && typeof res.status === 'function');

  if (req.method !== 'POST') {
    if (isNode) {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const sendResponse = (status: number, data: any) => {
    if (isNode) {
      return res.status(status).json(data);
    }
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    let body: any = {};
    if (isNode) {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    } else {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const authHeader = isNode 
      ? (req.headers?.['authorization'] || req.headers?.['Authorization'] || '')
      : (req.headers?.get ? (req.headers.get('Authorization') || '') : '');

    const {
      model,
      messages = [],
      apiKey,
      openrouterKey,
      groqKey,
      maxTokensRequested,
      temperature
    } = body;

    const safeMessages = Array.isArray(messages) ? messages : [];
    const hasImages = safeMessages.some((m: any) => m.images && m.images.length > 0);
    const clientBearer = authHeader ? String(authHeader).replace('Bearer ', '').trim() : '';

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

    const envSambaNovaKeys: string[] = [
      process.env.SAMBANOVA_API_KEY || '',
      ...(process.env.SAMBANOVA_API_KEYS ? process.env.SAMBANOVA_API_KEYS.split(',') : [])
    ].map(k => k.trim()).filter(Boolean);

    const envCerebrasKeys: string[] = [
      process.env.CEREBRAS_API_KEY || '',
      ...(process.env.CEREBRAS_API_KEYS ? process.env.CEREBRAS_API_KEYS.split(',') : [])
    ].map(k => k.trim()).filter(Boolean);

    const envGeminiKeys: string[] = [
      process.env.GEMINI_API_KEY || '',
      ...(process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [])
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

    // Presupuesto de tokens optimizado para Groq LPU y nubes open source (techo 16,000 / default 8,000)
    const safeGroqMaxTokens = maxTokensRequested
      ? Math.min(Math.max(maxTokensRequested, 200), 16000)
      : 8000;

    const executeGroq = async (keyToUse: string, targetModel: string, tokens: number): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout para conexión inicial con Groq LPU
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
            messages: formatMessages(safeMessages),
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

    const executeSambaNova = async (keyToUse: string, targetModel: string, tokens: number): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      try {
        const res = await fetch('https://api.sambanova.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyToUse}`,
            'HTTP-Referer': 'https://interfaz-hazel.vercel.app',
            'X-Title': 'NONA AI Software Factory',
          },
          body: JSON.stringify({
            model: targetModel || 'Meta-Llama-3.3-70B-Instruct',
            messages: formatMessages(safeMessages),
            stream: true,
            temperature: temp,
            max_tokens: Math.min(tokens, 8192),
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

    const executeCerebras = async (keyToUse: string, targetModel: string, tokens: number): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      try {
        const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyToUse}`,
            'HTTP-Referer': 'https://interfaz-hazel.vercel.app',
            'X-Title': 'NONA AI Software Factory',
          },
          body: JSON.stringify({
            model: targetModel || 'llama3.3-70b',
            messages: formatMessages(safeMessages),
            stream: true,
            temperature: temp,
            max_tokens: Math.min(tokens, 8192),
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

    const executeGemini = async (keyToUse: string, targetModel: string, tokens: number): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyToUse}`,
          },
          body: JSON.stringify({
            model: targetModel || 'gemini-2.5-flash',
            messages: formatMessages(safeMessages),
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
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
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
            messages: formatMessages(safeMessages),
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

    // =========================================================================
    // SMART ROUTING & MULTI-PROVIDER FAILOVER
    // =========================================================================

    if (hasImages) {
      // 1. Tarea Multimodal / Visión: Priorizar Gemini 2.5 Flash -> OpenRouter -> Groq Vision
      if (envGeminiKeys.length > 0) {
        for (const gemKey of envGeminiKeys) {
          try {
            const res = await executeGemini(gemKey, 'gemini-2.5-flash', 4000);
            if (res.ok) { aiResponse = res; break; }
          } catch (e: any) {
            lastError = `Gemini Vision error: ${e.message}`;
          }
        }
      }

      if ((!aiResponse || !aiResponse.ok) && orKeyToUse) {
        try {
          const res = await executeOpenRouter(orKeyToUse, 'google/gemini-2.5-flash', 4000);
          if (res.ok) aiResponse = res;
        } catch (e: any) {
          lastError += ` | OpenRouter Vision: ${e.message}`;
        }
      }

      if ((!aiResponse || !aiResponse.ok) && groqKeysToTry.length > 0) {
        for (const key of groqKeysToTry) {
          try {
            const res = await executeGroq(key, 'llama-3.2-11b-vision-preview', 2000);
            if (res.ok) { aiResponse = res; break; }
          } catch (e: any) {
            lastError += ` | Groq Vision: ${e.message}`;
          }
        }
      }
    } else {
      let resolvedModel = model;
      if (
        !resolvedModel ||
        resolvedModel === 'qwen/qwen3.8-27b' ||
        resolvedModel === 'qwen3.8-27b' ||
        resolvedModel === 'qwen3.8' ||
        resolvedModel === 'qwen/qwen3.6-27b'
      ) {
        resolvedModel = 'qwen/qwen3.8-27b';
      } else if (
        resolvedModel === 'llama-3.3-70b-versatile' ||
        resolvedModel === 'llama3-70b-8192' ||
        resolvedModel.includes('llama')
      ) {
        resolvedModel = 'llama-3.3-70b-versatile';
      } else if (
        resolvedModel === 'llama-3.1-8b-instant' ||
        resolvedModel === 'llama3-8b-8192'
      ) {
        resolvedModel = 'llama-3.1-8b-instant';
      }

      const groqPrimaryModel = (resolvedModel === 'llama-3.1-8b-instant' || (typeof model === 'string' && model.includes('instant')))
        ? 'llama-3.1-8b-instant'
        : 'llama-3.3-70b-versatile';

      const standardGroqModels = [
        groqPrimaryModel,
        groqPrimaryModel === 'llama-3.3-70b-versatile' ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile'
      ];

      // TIER 1: Groq LPU (Ultra-rápido ~450 tokens/s con pooling de keys)
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

      // TIER 2: SambaNova Cloud (Llama 3.3 70B & Qwen 2.5 72B en chips SN40L)
      if ((!aiResponse || !aiResponse.ok) && envSambaNovaKeys.length > 0) {
        const sambaModels = ['Meta-Llama-3.3-70B-Instruct', 'Qwen2.5-72B-Instruct'];
        for (const key of envSambaNovaKeys) {
          for (const sModel of sambaModels) {
            try {
              const res = await executeSambaNova(key, sModel, safeGroqMaxTokens);
              if (res.ok) {
                aiResponse = res;
                break;
              } else {
                const errTxt = await res.text().catch(() => '');
                lastError += ` | SambaNova (${sModel}): ${errTxt.slice(0, 100)}`;
              }
            } catch (e: any) {
              lastError += ` | SambaNova (${sModel}) error: ${e.message}`;
            }
          }
          if (aiResponse && aiResponse.ok) break;
        }
      }

      // TIER 3: Cerebras Cloud (Llama 3.3 70B a 1,800 tokens/s)
      if ((!aiResponse || !aiResponse.ok) && envCerebrasKeys.length > 0) {
        for (const key of envCerebrasKeys) {
          try {
            const res = await executeCerebras(key, 'llama3.3-70b', safeGroqMaxTokens);
            if (res.ok) {
              aiResponse = res;
              break;
            } else {
              const errTxt = await res.text().catch(() => '');
              lastError += ` | Cerebras: ${errTxt.slice(0, 100)}`;
            }
          } catch (e: any) {
            lastError += ` | Cerebras error: ${e.message}`;
          }
          if (aiResponse && aiResponse.ok) break;
        }
      }

      // TIER 4: OpenRouter Cloud (DeepSeek-V3, Qwen 2.5 Coder, modelos abiertos)
      if ((!aiResponse || !aiResponse.ok) && orKeyToUse) {
        const targetModels = [
          resolvedModel || 'deepseek/deepseek-chat',
          'deepseek/deepseek-chat',
          'qwen/qwen-2.5-coder-32b-instruct',
          ...VERIFIED_FREE_OR_MODELS
        ].slice(0, 3);

        for (const orModel of targetModels) {
          try {
            const openRouterTokens = Math.max(6000, Math.min(targetTokens, 12000));
            const res = await executeOpenRouter(orKeyToUse, orModel, openRouterTokens);
            if (res.ok) {
              aiResponse = res;
              break;
            } else {
              const errText = await res.text().catch(() => '');
              lastError += ` | OpenRouter (${orModel}): ${errText.slice(0, 100)}`;
            }
          } catch (e: any) {
            lastError += ` | OpenRouter (${orModel}) Exception: ${e.message}`;
          }
        }
      }
    }

    if (!aiResponse || !aiResponse.ok) {
      if (groqKeysToTry.length === 0 && !orKeyToUse && envSambaNovaKeys.length === 0 && envCerebrasKeys.length === 0) {
        return sendResponse(401, {
          error: 'NONA Cloud Gateway: Inferencia cloud no configurada. Agrega GROQ_API_KEY en las variables de entorno de tu proyecto en Vercel para activar el motor multi-IA automático sin pedir llaves a los usuarios.'
        });
      }
      throw new Error(`Servicio de IA temporalmente saturado en todos los proveedores. Detalle: ${lastError}`);
    }

    // =====================================================================
    // STREAM RESPONSE BACK TO CLIENT
    // =====================================================================
    const reader = aiResponse.body?.getReader();
    if (!reader) throw new Error('No se pudo abrir el stream de lectura');

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // IF NODE.JS SERVERLESS RUNTIME (@vercel/node with res)
    if (isNode) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      let buffer = '';
      let tokensEmitted = 0;

      const emitContentNode = (text: string) => {
        if (!text) return;
        tokensEmitted++;
        const payload = JSON.stringify({ message: { content: text } }) + '\n';
        res.write(payload);
      };

      const processChunkLineNode = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) return;
        if (trimmed === 'data: [DONE]') return;

        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.error) {
              const errMsg = parsed.error.message || JSON.stringify(parsed.error);
              emitContentNode(`\n[Error de proveedor: ${errMsg}]\n`);
              return;
            }
            const delta = parsed.choices?.[0]?.delta;
            const content = delta?.content || delta?.reasoning_content || delta?.reasoning || parsed.choices?.[0]?.text || '';
            if (content) {
              emitContentNode(content);
            }
          } catch {}
          return;
        }

        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.error) {
              const errMsg = parsed.error.message || JSON.stringify(parsed.error);
              emitContentNode(`\n[Error de proveedor: ${errMsg}]\n`);
              return;
            }
            const content = parsed.choices?.[0]?.message?.content || 
                            parsed.choices?.[0]?.delta?.content || 
                            parsed.choices?.[0]?.text || '';
            if (content) {
              emitContentNode(content);
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
          processChunkLineNode(line);
        }
      }

      if (buffer.trim()) {
        processChunkLineNode(buffer.trim());
      }

      if (tokensEmitted === 0) {
        emitContentNode('\n[Aviso: El modelo no emitió tokens en este intento. Reintentando automáticamente...]\n');
      }

      res.end();
      return;
    }

    // IF EDGE / WEB STANDARDS RUNTIME (req: Request -> Response)
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
          if (trimmed === 'data: [DONE]') return;

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
    if (isNode) {
      if (!res.headersSent) {
        return res.status(500).json({ error: err.message });
      } else {
        res.write(JSON.stringify({ error: err.message }) + '\n');
        return res.end();
      }
    }
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
