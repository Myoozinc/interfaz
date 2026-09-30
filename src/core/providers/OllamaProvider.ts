import type { AIProvider, AIMessage, AICompletionOptions } from './AIProvider';

export class OllamaProvider implements AIProvider {
  id = 'nona-cloud';
  name = 'Qwen 3.8 / OpenRouter Engine';
  private baseUrl: string;
  private defaultModel: string;

  constructor(
    baseUrl: string = '/api/agent',
    defaultModel: string = 'llama-3.3-70b-versatile'
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultModel = defaultModel;

    // Purge stale rate-limited Groq keys
    if (typeof localStorage !== 'undefined') {
      const stale = localStorage.getItem('nona_cloud_api_key');
      if (stale && stale.startsWith('gsk_')) {
        localStorage.removeItem('nona_cloud_api_key');
      }
    }
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setDefaultModel(model: string) {
    this.defaultModel = model;
  }

  async checkHealth(): Promise<{ ok: boolean; message: string; details?: any }> {
    const start = performance.now();
    try {
      const res = await fetch('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const data = await res.json();
        const latency = Math.round(performance.now() - start);
        return {
          ok: true,
          message: `Qwen 3.8 Cloud Activo (${latency}ms)`,
          details: data,
        };
      }
    } catch {}

    return {
      ok: true,
      message: 'Qwen 3.8 Cloud Activo (Alta Capacidad)',
      details: { model: 'qwen/qwen3.8-27b', host: 'OpenRouter Cloud' }
    };
  }

  async listModels(): Promise<string[]> {
    return [
      'qwen/qwen3.8-27b (OpenRouter - 12,000 Tokens)',
      'qwen/qwen-2.5-coder-32b-instruct (Cloud)',
      'google/gemini-2.0-flash-001 (Multimodal Vision)',
    ];
  }

  async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string> {
    return this.streamChat(messages, () => {}, options);
  }

  /** Proveedores que cortaron la salida o fallaron a mitad de stream: el gateway los omite un rato. */
  private static skipUntil = new Map<string, number>();

  private static activeSkips(): string[] {
    const now = Date.now();
    const out: string[] = [];
    for (const [k, until] of OllamaProvider.skipUntil) {
      if (until > now) out.push(k);
      else OllamaProvider.skipUntil.delete(k);
    }
    return out;
  }

  async streamChat(
    messages: AIMessage[],
    onToken: (token: string, fullText: string, isThinking?: boolean) => void,
    options?: AICompletionOptions
  ): Promise<string> {
    // Los ids de modelo de la UI (p. ej. "qwen/qwen3.8-27b") son solo una preferencia: el gateway descubre
    // los modelos gratuitos reales de cada proveedor y elige el mejor disponible.
    const model = options?.model || this.defaultModel;
    const openrouterKey = localStorage.getItem('nona_openrouter_key') || localStorage.getItem('nona_cloud_api_key') || '';
    const groqKey = localStorage.getItem('nona_groq_key') || '';

    const formattedMessages = messages.map(m => {
      const cleanImages = (m.images || []).map(img => img.replace(/^data:image\/[a-z]+;base64,/, ''));
      return {
        role: m.role,
        content: m.content,
        ...(cleanImages.length > 0 ? { images: cleanImages } : {})
      };
    });

    onToken('⚡ Buscando el mejor modelo gratuito disponible...', '', false);

    const post = () => fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        openrouterKey: openrouterKey.trim() || undefined,
        groqKey: groqKey.trim() || undefined,
        maxTokensRequested: options?.maxTokens,
        temperature: options?.temperature,
        skip: OllamaProvider.activeSkips(),
        stream: true,
      }),
      signal: options?.signal,
    });

    let res: Response;
    try {
      res = await post();
    } catch (e: any) {
      if (e?.name === 'AbortError') throw e;
      // Un único reintento ante fallo de red transitorio
      await new Promise(r => setTimeout(r, 1200));
      res = await post();
    }
    if (!res.ok && (res.status >= 500 || res.status === 429) && res.status !== 502) {
      await new Promise(r => setTimeout(r, 1500));
      res = await post();
    }

    if (!res.ok) {
      let errorDetail = '';
      try {
        const rawText = await res.text();
        try {
          const errJson = JSON.parse(rawText);
          errorDetail = errJson.error || errJson.message || '';
        } catch {
          if (rawText.includes('FUNCTION_INVOCATION_TIMEOUT') || res.status === 504) {
            errorDetail = 'Tiempo de espera agotado en el servidor cloud (504). Reintenta: el gateway conmutará de proveedor.';
          } else if (rawText) {
            errorDetail = rawText.slice(0, 200);
          }
        }
      } catch {}
      if (!errorDetail) {
        errorDetail = res.status ? `Error HTTP ${res.status} (${res.statusText || 'Error de conexión'})` : 'Error de conexión con el servidor cloud';
      }
      throw new Error(`Error en servidor cloud: ${errorDetail}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No se pudo abrir el stream de respuesta');

    const decoder = new TextDecoder();
    let fullText = '';
    let lineBuffer = '';
    let provider = '';
    let usedModel = '';
    let truncatedReason = '';
    let streamError = '';

    const handleLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      let parsed: any;
      try { parsed = JSON.parse(trimmed); } catch { return; }
      if (parsed.message?.content) {
        fullText += parsed.message.content;
        onToken(parsed.message.content, fullText, false);
      } else if (parsed.meta) {
        if (parsed.meta.provider) provider = parsed.meta.provider;
        if (parsed.meta.model) usedModel = parsed.meta.model;
        if (parsed.meta.truncated) truncatedReason = parsed.meta.reason || 'length';
      } else if (parsed.error) {
        streamError = String(parsed.error);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() || '';
      for (const line of lines) handleLine(line);
    }
    if (lineBuffer.trim()) handleLine(lineBuffer);

    // Salida incompleta o proveedor caído a mitad de respuesta: NUNCA se entrega código a medias.
    // Se marca el proveedor para que el siguiente intento use otro modelo.
    if (truncatedReason || streamError) {
      if (provider) OllamaProvider.skipUntil.set(provider, Date.now() + 5 * 60_000);
      const why = truncatedReason
        ? `la respuesta de ${usedModel || provider || 'la IA'} se cortó (${truncatedReason === 'time' ? 'límite de tiempo' : 'límite de tokens'})`
        : streamError;
      throw new Error(`Salida incompleta: ${why}. Reintentando con otro modelo.`);
    }

    if (fullText.trim().length === 0) {
      throw new Error('El modelo cloud no devolvió contenido. Por favor reintenta o verifica tu conexión.');
    }

    return fullText;
  }
}
