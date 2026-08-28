import { OllamaService } from './ollama';

export class AIGenerator {
  private ollama: OllamaService;
  private selectedModel: string = 'qwen3.8:latest';

  constructor() {
    this.ollama = new OllamaService();
  }

  setModel(model: string) {
    this.selectedModel = model;
  }

  getModel(): string {
    return this.selectedModel;
  }

  setOllamaUrl(url: string) {
    this.ollama.setBaseUrl(url);
  }

  async checkOllamaStatus() {
    return await this.ollama.checkConnection();
  }

  async getAvailableModels() {
    return await this.ollama.getModels();
  }

  async generateAppCode(
    prompt: string,
    currentCode: string = '',
    onToken: (chunk: string, fullText: string, isThinking?: boolean) => void,
    signal?: AbortSignal
  ): Promise<{ codeBlocks: { language: string; code: string; filename?: string }[] }> {
    
    // Build context-aware prompt with current code if modifying
    const hasExistingCode = currentCode && currentCode.trim().length > 30 && !currentCode.includes('Nuevo Archivo');
    
    const systemPrompt = `Eres NONA AI, un ingeniero senior y diseñador de software de élite. 
Tu objetivo es crear o modificar aplicaciones web completas, interactivas, bellas y funcionales.
REGLAS OBLIGATORIAS:
1. Devuelve TODO el código HTML/CSS/JS autocontenido en un ÚNICO bloque de código \`\`\`html con <!DOCTYPE html>.
2. Usa Tailwind CSS (vía CDN https://cdn.tailwindcss.com) y librerías modernas como Three.js o Lucide icons si son útiles.
3. Si el usuario pide modificar o agregar una función a un código existente, MANTÉN todo el código previo intacto y aplica los cambios solicitados.
4. Escribe código 100% real, funcional y ejecutable en el navegador.`;

    const userPrompt = hasExistingCode
      ? `CÓDIGO ACTUAL DEL PROYECTO:
\`\`\`html
${currentCode}
\`\`\`

INSTRUCCIÓN DEL USUARIO:
${prompt}

Genera el código HTML completo actualizado aplicando la modificación solicitada sobre el código existente. Incluye todo en un bloque \`\`\`html.`
      : `Desarrolla la siguiente aplicación web completa, interactiva y con diseño moderno: "${prompt}". Devuelve todo el código en un bloque \`\`\`html completo listo para renderizar.`;

    // Try local Ollama endpoints
    const endpointsToTry = [
      '/api/ollama',
      'http://127.0.0.1:11434',
      'http://localhost:11434',
      this.ollama.getBaseUrl()
    ];

    let lastError: any = null;

    for (const endpoint of endpointsToTry) {
      try {
        this.ollama.setBaseUrl(endpoint);
        onToken('⏳ Conectando con tu modelo ' + this.selectedModel + '...', '', false);

        const ollamaRes = await this.ollama.streamChat(
          this.selectedModel,
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          (chunk, fullText, isThinking) => {
            onToken(chunk, fullText, isThinking);
          },
          signal
        );

        const blocks = OllamaService.extractCodeBlocks(ollamaRes);
        if (blocks.length > 0 && blocks[0].code.length > 50) {
          return { codeBlocks: blocks };
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('No se pudo conectar con el motor local en tu Mac');
  }
}

export const aiEngine = new AIGenerator();
