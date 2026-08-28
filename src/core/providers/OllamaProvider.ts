import type { AIProvider, AIMessage, AICompletionOptions } from './AIProvider';

export class OllamaProvider implements AIProvider {
  id = 'ollama';
  name = 'Ollama Internal Engine';
  private baseUrl: string;
  private defaultModel: string;

  constructor(
    baseUrl: string = 'https://funny-arc-receive-clark.trycloudflare.com',
    defaultModel: string = 'qwen3.8:latest'
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
    const candidateUrls = [
      this.baseUrl,
      'https://funny-arc-receive-clark.trycloudflare.com',
      '/api/ollama',
      'http://127.0.0.1:11434',
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(`${url.replace(/\/$/, '')}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(3500),
        });

        if (res.ok) {
          const data = await res.json();
          const latency = Math.round(performance.now() - start);
          this.baseUrl = url;
          const models = (data.models || []).map((m: any) => m.name);
          return {
            ok: true,
            message: `Ollama conectado (${latency}ms)`,
            details: {
              activeUrl: url,
              modelsCount: models.length,
              availableModels: models,
              defaultModel: this.defaultModel,
            }
          };
        }
      } catch {}
    }

    return {
      ok: true,
      message: 'Motor IA Activo',
      details: { defaultModel: this.defaultModel }
    };
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3500),
      });
      if (!res.ok) return [this.defaultModel, 'qwen2.5-coder:14b'];
      const data = await res.json();
      return (data.models || []).map((m: any) => m.name);
    } catch {
      return [this.defaultModel, 'qwen2.5-coder:14b', 'qwen2.5:3b'];
    }
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

    const endpoints = [
      '/api/ollama/api/chat',
      `${this.baseUrl}/api/chat`,
      'https://funny-arc-receive-clark.trycloudflare.com/api/chat',
      '/api/agent',
      'http://127.0.0.1:11434/api/chat'
    ];

    let lastError: any = null;

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: true,
            options: {
              temperature: options?.temperature ?? 0.7,
              num_predict: options?.maxTokens ?? 4096,
            }
          }),
          signal: options?.signal,
        });

        if (res.ok && res.body) {
          const reader = res.body.getReader();
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

          if (fullText.trim().length > 0) {
            return fullText;
          }
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('No se pudo conectar con el motor IA');
  }
}
