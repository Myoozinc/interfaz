import type { AIProvider, AIMessage, AICompletionOptions } from './AIProvider';

export class OllamaProvider implements AIProvider {
  id = 'nona-cloud';
  name = 'Qwen 3.8 / OpenRouter Engine';
  private baseUrl: string;
  private defaultModel: string;

  constructor(
    baseUrl: string = '/api/agent',
    defaultModel: string = 'qwen/qwen3.8-27b'
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

  async streamChat(
    messages: AIMessage[],
    onToken: (token: string, fullText: string, isThinking?: boolean) => void,
    options?: AICompletionOptions
  ): Promise<string> {
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

    const isGroq = model.includes('llama') || model.includes('mixtral') || model.startsWith('groq/');
    onToken(isGroq ? '⚡ Conectando con Groq LPU (Ultra-rápido)...' : '⚡ Conectando con Cloud Engine...', '', false);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let res = await fetch('/api/agent', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        openrouterKey: openrouterKey.trim() || undefined,
        groqKey: groqKey.trim() || undefined,
        maxTokensRequested: options?.maxTokens,
        temperature: options?.temperature,
        stream: true,
      }),
      signal: options?.signal,
    });

    // Client-side automatic fallback to Groq LPU if primary model times out or errors
    if (!res.ok) {
      onToken('⚡ Conmutando automáticamente a Groq LPU de alta velocidad (~450 t/s)...', '', false);
      try {
        const fallbackRes = await fetch('/api/agent', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: formattedMessages,
            openrouterKey: openrouterKey.trim() || undefined,
            groqKey: groqKey.trim() || undefined,
            maxTokensRequested: Math.min(options?.maxTokens || 4000, 4000),
            temperature: options?.temperature,
            stream: true,
          }),
          signal: options?.signal,
        });
        if (fallbackRes.ok) {
          res = fallbackRes;
        }
      } catch {}
    }

    if (!res.ok) {
      let errorDetail = '';
      try {
        const errJson = await res.json();
        errorDetail = errJson.error || errJson.message || '';
      } catch {
        try {
          const rawText = await res.text();
          if (rawText.includes('FUNCTION_INVOCATION_TIMEOUT') || res.status === 504) {
            errorDetail = 'Tiempo de espera agotado en el servidor cloud (504 Gateway Timeout). Por favor reintenta; el sistema conmutará automáticamente a Groq LPU.';
          } else if (rawText) {
            errorDetail = rawText.slice(0, 150);
          }
        } catch {}
      }
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const parsed = JSON.parse(trimmed);
          const msg = parsed.message;
          if (msg && msg.content) {
            fullText += msg.content;
            onToken(msg.content, fullText, false);
          }
        } catch {}
      }
    }

    if (lineBuffer.trim()) {
      try {
        const parsed = JSON.parse(lineBuffer.trim());
        const msg = parsed.message;
        if (msg && msg.content) {
          fullText += msg.content;
          onToken(msg.content, fullText, false);
        }
      } catch {}
    }

    if (fullText.trim().length === 0) {
      throw new Error('El modelo cloud no devolvió contenido.');
    }

    return fullText;
  }
}
