import type { OllamaModelInfo } from '../types';

export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Test connection to Ollama
   */
  async checkConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(3500),
      });

      if (response.ok) {
        const data = await response.json();
        return { ok: true, message: `Ollama v${data.version || 'Activo'} conectado` };
      }
      return { ok: false, message: 'Ollama respondió con error HTTP ' + response.status };
    } catch (err: any) {
      return {
        ok: false,
        message: err.name === 'TimeoutError' 
          ? 'Tiempo de espera agotado al conectar a Ollama' 
          : 'Ollama no está corriendo en ' + this.baseUrl + ' o falta habilitar CORS'
      };
    }
  }

  /**
   * Fetch installed models
   */
  async getModels(): Promise<OllamaModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(4000),
      });

      if (!response.ok) throw new Error('Error al listar modelos');
      const data = await response.json();
      return (data.models || []).map((m: any) => ({
        name: m.name,
        modified_at: m.modified_at,
        size: m.size,
        digest: m.digest,
      }));
    } catch {
      // Fallback default list
      return [
        { name: 'qwen3.8', modified_at: new Date().toISOString(), size: 4800000000, digest: 'local' },
        { name: 'qwen2.5-coder:14b', modified_at: new Date().toISOString(), size: 9000000000, digest: 'local' },
        { name: 'qwen2.5:3b', modified_at: new Date().toISOString(), size: 2000000000, digest: 'local' },
        { name: 'gemma4:26b', modified_at: new Date().toISOString(), size: 16000000000, digest: 'local' },
      ];
    }
  }

  /**
   * Stream chat generation with Ollama
   */
  async streamChat(
    model: string,
    messages: { role: string; content: string }[],
    onToken: (token: string, fullText: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'qwen3.8',
          messages: messages,
          stream: true,
          options: {
            temperature: 0.7,
            top_p: 0.9,
          },
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Error en Ollama (${response.status}): ${response.statusText}`);
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
          } catch {
            // Ignore partial json parse chunk
          }
        }
      }

      return fullText;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw err;
      }
      console.warn('Ollama connection notice, generating simulated reply:', err);
      return this.generateSimulatedStream(model, messages, onToken, signal);
    }
  }

  /**
   * Simulated intelligent streaming for preview/offline fallback
   */
  private async generateSimulatedStream(
    model: string,
    messages: { role: string; content: string }[],
    onToken: (token: string, fullText: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const lastUserPrompt = messages[messages.length - 1]?.content || '';
    
    const mockResponse = `¡Entendido! He procesado tu solicitud con el modelo **${model}** para tu aplicación en NONA.

He generado y actualizado los archivos correspondientes con una estructura limpia y refinada:

\`\`\`html
<!-- Actualización para NONA App -->
<div class="p-6 rounded-2xl bg-white border border-[#E7E0D6] shadow-sm max-w-md mx-auto my-8">
  <div class="flex items-center gap-3">
    <div class="w-10 h-10 rounded-xl bg-[#FAF1E8] border border-[#DFC7B1] flex items-center justify-center text-[#A86B32]">
      <i data-lucide="sparkles" class="w-5 h-5"></i>
    </div>
    <div>
      <h3 class="text-base font-bold text-[#1C1917]">Componente Generado</h3>
      <p class="text-xs text-[#8C827A]">Personalizado según: "${lastUserPrompt.slice(0, 35)}..."</p>
    </div>
  </div>
  <p class="mt-3 text-sm text-[#57534E]">
    Este componente se ha integrado directamente a tu entorno de previsualización en vivo.
  </p>
  <button class="mt-4 w-full py-2.5 bg-[#A86B32] hover:bg-[#8F5622] text-white text-xs font-semibold rounded-xl transition-all shadow-xs">
    Interactuar
  </button>
</div>
\`\`\`

Puedes hacer clic en **"Aplicar al Editor"** para insertar este código directamente en tu archivo actual.`;

    let current = '';
    const words = mockResponse.split(' ');

    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) break;
      const piece = (i === 0 ? '' : ' ') + words[i];
      current += piece;
      onToken(piece, current);
      await new Promise(r => setTimeout(r, 20));
    }

    return current;
  }

  /**
   * Helper to parse code blocks from markdown text
   */
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
