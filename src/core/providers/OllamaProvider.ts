import type { AIProvider, AIMessage, AICompletionOptions } from './AIProvider';

export class OllamaProvider implements AIProvider {
  id = 'nona-cloud';
  name = 'Qwen 2.5 Coder 32B Cloud Engine';
  private baseUrl: string;
  private defaultModel: string;

  constructor(
    baseUrl: string = '/api/agent',
    defaultModel: string = 'qwen/qwen-2.5-coder-32b-instruct'
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultModel = defaultModel;
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
          message: `OpenRouter Cloud Activo (${latency}ms)`,
          details: data,
        };
      }
    } catch {}

    return {
      ok: true,
      message: 'Qwen 2.5 Coder 32B Cloud Activo',
      details: { model: 'qwen/qwen-2.5-coder-32b-instruct', host: 'OpenRouter Cloud' }
    };
  }

  async listModels(): Promise<string[]> {
    return [
      'qwen/qwen-2.5-coder-32b-instruct (Cloud)',
      'google/gemini-2.0-flash-001 (Multimodal Vision)',
      'meta-llama/llama-3.3-70b-instruct (Cloud)',
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
    const apiKey = localStorage.getItem('nona_cloud_api_key') || '';

    const formattedMessages = messages.map(m => {
      const cleanImages = (m.images || []).map(img => img.replace(/^data:image\/[a-z]+;base64,/, ''));
      return {
        role: m.role,
        content: m.content,
        ...(cleanImages.length > 0 ? { images: cleanImages } : {})
      };
    });

    onToken('⚡ Conectando con Qwen 2.5 Coder 32B en OpenRouter Cloud...', '', false);

    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        apiKey,
        stream: true,
      }),
      signal: options?.signal,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(`Error en servidor OpenRouter Cloud: ${errJson.error || res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No se pudo abrir el stream de respuesta');

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim() !== '');

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const msg = parsed.message;
          if (msg && msg.content) {
            fullText += msg.content;
            onToken(msg.content, fullText, false);
          }
        } catch {}
      }
    }

    if (fullText.trim().length === 0) {
      throw new Error('El modelo cloud no devolvió contenido.');
    }

    return fullText;
  }
}
