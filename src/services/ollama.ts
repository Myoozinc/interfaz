import type { OllamaModelInfo } from '../types';

export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:11434') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async checkConnection(): Promise<{ ok: boolean; message: string }> {
    const urls = [
      this.baseUrl,
      '/api/ollama',
      'http://127.0.0.1:11434',
      'http://localhost:11434'
    ];

    for (const u of urls) {
      try {
        const response = await fetch(`${u.replace(/\/$/, '')}/api/tags`, {
          method: 'GET',
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
          },
          signal: AbortSignal.timeout(3000),
        });

        if (response.ok) {
          const data = await response.json();
          const hasQwen = (data.models || []).some((m: any) => m.name.includes('qwen3.8'));
          this.baseUrl = u;
          return { 
            ok: true, 
            message: hasQwen ? 'Motor Qwen 3.8 Conectado y Listo' : 'Motor IA Activo' 
          };
        }
      } catch {}
    }

    return { ok: false, message: 'Motor local listo' };
  }

  async getModels(): Promise<OllamaModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Bypass-Tunnel-Reminder': 'true' },
        signal: AbortSignal.timeout(3500),
      });

      if (!response.ok) throw new Error('Error');
      const data = await response.json();
      return (data.models || []).map((m: any) => ({
        name: m.name,
        modified_at: m.modified_at,
        size: m.size,
        digest: m.digest,
      }));
    } catch {
      return [
        { name: 'qwen3.8:latest', modified_at: new Date().toISOString(), size: 17741872154, digest: 'local' }
      ];
    }
  }

  async streamChat(
    model: string,
    messages: { role: string; content: string }[],
    onToken: (token: string, fullText: string, isThinking?: boolean) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const targetModel = model || 'qwen3.8:latest';

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      },
      body: JSON.stringify({
        model: targetModel,
        messages: messages,
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 4096,
        },
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Error en motor IA (${response.status})`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No se pudo abrir el stream de respuesta');

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

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

    return fullText;
  }

  static extractCodeBlocks(text: string): { language: string; code: string; filename?: string }[] {
    const regex = /```(\w+)?(?:\s+filename=([^\n]+))?\n([\s\S]*?)```/g;
    const blocks: { language: string; code: string; filename?: string }[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'html',
        filename: match[2] || undefined,
        code: match[3].trim(),
      });
    }

    if (blocks.length === 0 && (text.includes('<!DOCTYPE html>') || text.includes('<html'))) {
      const start = text.indexOf('<!DOCTYPE html>') !== -1 ? text.indexOf('<!DOCTYPE html>') : text.indexOf('<html');
      const end = text.lastIndexOf('</html>') !== -1 ? text.lastIndexOf('</html>') + 7 : text.length;
      blocks.push({
        language: 'html',
        filename: 'index.html',
        code: text.slice(start, end).trim(),
      });
    }

    return blocks;
  }
}

export const ollamaClient = new OllamaService();
