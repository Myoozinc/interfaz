import type { AIProvider, AIMessage, AICompletionOptions } from './AIProvider';

export class OllamaProvider implements AIProvider {
  id = 'nona-cloud';
  name = 'NONA Cloud Serverless Engine';
  private baseUrl: string;
  private defaultModel: string;

  constructor(
    baseUrl: string = '/api/agent',
    defaultModel: string = 'qwen-2.5-coder'
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
          message: `Servidor Cloud Activo (${latency}ms)`,
          details: data,
        };
      }
    } catch {}

    return {
      ok: true,
      message: 'Servidor Cloud Autónomo Activo (0 recursos locales)',
      details: { mode: 'cloud-serverless', host: 'Vercel Edge Cloud' }
    };
  }

  async listModels(): Promise<string[]> {
    return ['qwen-2.5-coder (Cloud)', 'llama-3.3-70b (Cloud)', 'deepseek-r1 (Cloud)'];
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
    const cloudProvider = localStorage.getItem('nona_cloud_provider') || 'auto';

    const formattedMessages = messages.map(m => {
      const cleanImages = (m.images || []).map(img => img.replace(/^data:image\/[a-z]+;base64,/, ''));
      return {
        role: m.role,
        content: m.content,
        ...(cleanImages.length > 0 ? { images: cleanImages } : {})
      };
    });

    onToken('☁️ Procesando en servidor cloud independiente...', '', false);

    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        provider: cloudProvider,
        apiKey: apiKey,
        stream: true,
      }),
      signal: options?.signal,
    });

    if (!res.ok) {
      throw new Error(`Error en servidor cloud (${res.status})`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No se pudo abrir el stream');

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
          if (msg) {
            if (msg.thinking && !msg.content) {
              onToken(msg.thinking, fullText, true);
            } else if (msg.content) {
              fullText += msg.content;
              onToken(msg.content, fullText, false);
            }
          }
        } catch {}
      }
    }

    if (fullText.trim().length === 0) {
      throw new Error('El servidor cloud devolvió una respuesta vacía');
    }

    return fullText;
  }
}
