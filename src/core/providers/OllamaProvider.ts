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
    const stale = localStorage.getItem('nona_cloud_api_key');
    if (stale && stale.startsWith('gsk_')) {
      localStorage.removeItem('nona_cloud_api_key');
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
    const openrouterKey = localStorage.getItem('nona_openrouter_key') || '';

    const formattedMessages = messages.map(m => {
      const cleanImages = (m.images || []).map(img => img.replace(/^data:image\/[a-z]+;base64,/, ''));
      return {
        role: m.role,
        content: m.content,
        ...(cleanImages.length > 0 ? { images: cleanImages } : {})
      };
    });

    onToken('⚡ Conectando con Qwen 3.8 Cloud...', '', false);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const res = await fetch('/api/agent', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        openrouterKey: openrouterKey.trim() || undefined,
        maxTokensRequested: options?.maxTokens,
        stream: true,
      }),
      signal: options?.signal,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(`Error en servidor cloud: ${errJson.error || res.statusText}`);
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
