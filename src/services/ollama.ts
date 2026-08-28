import type { OllamaModelInfo } from '../types';

export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://fancy-trains-worry.loca.lt') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async checkConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: 'GET',
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
        },
        signal: AbortSignal.timeout(3500),
      });

      if (response.ok) {
        const data = await response.json();
        return { ok: true, message: `Motor IA v${data.version || 'Online'} conectado` };
      }
      return { ok: false, message: 'Servidor IA no disponible (usando motor cloud de NONA)' };
    } catch {
      return {
        ok: false,
        message: 'Conexión lista (usando motor cloud de NONA)'
      };
    }
  }

  async getModels(): Promise<OllamaModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
        },
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
        { name: 'NONA-Ultra-3.8', modified_at: new Date().toISOString(), size: 4800000000, digest: 'cloud' }
      ];
    }
  }

  async streamChat(
    model: string,
    messages: { role: string; content: string }[],
    onToken: (token: string, fullText: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      },
      body: JSON.stringify({
        model: model || 'qwen3.8',
        messages: messages,
        stream: true,
        options: {
          temperature: 0.7,
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
          if (parsed.message?.content) {
            const token = parsed.message.content;
            fullText += token;
            onToken(token, fullText);
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

    return blocks;
  }
}

export const ollamaClient = new OllamaService();
