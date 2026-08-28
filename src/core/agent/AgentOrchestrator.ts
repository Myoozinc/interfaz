import type { FullStackProject, ToolCall } from '../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { ToolRegistry } from './ToolRegistry';
import { agentEvents } from './AgentEvents';

export class AgentOrchestrator {
  private aiProvider: OllamaProvider;
  private toolRegistry: ToolRegistry;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'qwen/qwen3.8-27b');
    this.toolRegistry = new ToolRegistry();
  }

  setEndpoint(url: string) {
    this.aiProvider.setBaseUrl(url);
  }

  setModel(model: string) {
    this.aiProvider.setDefaultModel(model);
  }

  async run(
    userInstruction: string,
    project: FullStackProject,
    onProgress: (text: string, isThinking?: boolean) => void,
    options?: {
      images?: string[];
      links?: string[];
      signal?: AbortSignal;
    }
  ): Promise<{ responseText: string; updatedProject: FullStackProject }> {
    agentEvents.emit('agent.started', `Iniciando tarea con Qwen 3.8: "${userInstruction.slice(0, 45)}..."`);

    // 1. Gather Project Context
    const existingFileNames = Object.keys(project.files);
    const mainFile = project.files['index.html'] || project.files['src/App.tsx'] || Object.values(project.files)[0];
    let currentCode = mainFile?.content || '';

    if (currentCode.length > 7000) {
      currentCode = currentCode.slice(0, 7000) + '\n<!-- [código previo truncado para optimización] -->';
    }

    const hasImages = (options?.images || []).length > 0;
    const hasLinks = (options?.links || []).length > 0;

    let instructionAugmented = userInstruction;
    if (hasLinks) {
      instructionAugmented += `\nENLACES Y REFERENCIAS: ${options!.links!.join(', ')}`;
    }
    if (hasImages) {
      instructionAugmented += `\n[El usuario ha adjuntado captura(s) de pantalla. Analízalas y corrige/adapta la interfaz fielmente]`;
    }

    const systemPrompt = `Eres NONA AGENT, una fábrica de software e inteligencia artificial autónoma con Qwen 3.8.

FORMATO DE RESPUESTA OBLIGATORIO:
1. Primero escribe una breve explicación CONVERSACIONAL (2-3 párrafos) explicando qué creaste, las tecnologías usadas y cómo interactuar con la app.
2. Luego, inserta TODO el código en un ÚNICO bloque:
\`\`\`html filename=index.html
<!DOCTYPE html>
<html lang="es">
...
</html>
\`\`\`
3. Usa Tailwind CSS (https://cdn.tailwindcss.com) y Lucide Icons (https://unpkg.com/lucide@latest).
4. El código debe ser 100% completo, interactivo y funcional con JavaScript.`;

    const userPrompt = existingFileNames.length > 0 && currentCode.length > 30 && !currentCode.includes('Nuevo Archivo')
      ? `MODIFICA EL SIGUIENTE PROYECTO:
\`\`\`html
${currentCode}
\`\`\`

INSTRUCCIÓN DEL USUARIO:
${instructionAugmented}

Genera la explicación conversacional y el bloque de código actualizado completo \`\`\`html filename=index.html.`
      : `CREA DESDE CERO LA SIGUIENTE APLICACIÓN:
${instructionAugmented}

Genera la explicación conversacional y el bloque de código completo interactivo \`\`\`html filename=index.html.`;

    agentEvents.emit('agent.thinking', hasImages ? 'Analizando imagen multimodal...' : 'Qwen 3.8 programando aplicación en tiempo real...');

    let fullText = '';
    try {
      fullText = await this.aiProvider.streamChat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt, images: options?.images }
        ],
        (chunk, full, isThinking) => {
          if (isThinking) {
            onProgress(chunk, true);
          } else {
            // Filter raw HTML code block from streaming in chat so user only reads conversational text during generation
            let chatDisplay = full;
            if (chatDisplay.includes('```html')) {
              const parts = chatDisplay.split('```html');
              chatDisplay = parts[0].trim() + '\n\n*(⚡ Escribiendo código e inyectando a la Vista Previa...)*';
            }
            onProgress(chatDisplay || full, false);
          }
        },
        { signal: options?.signal, model: 'qwen/qwen3.8-27b' }
      );
    } catch (err: any) {
      agentEvents.emit('agent.error', `Error en motor Qwen 3.8: ${err.message}`);
      throw err;
    }

    // 2. Parse Code Blocks and apply to Workspace Files
    let blocksFound = 0;
    const codeBlockRegex = /```(\w+)?(?:\s+filename=([^\n]+))?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(fullText)) !== null) {
      blocksFound++;
      const lang = match[1] || 'html';
      const filename = match[2];
      const code = match[3].trim();

      const targetPath = filename || (
        lang === 'sql' ? 'schema.sql' : 
        lang === 'json' ? 'package.json' : 
        'index.html'
      );

      const toolCall: ToolCall = {
        id: 'tc_' + Date.now() + '_' + blocksFound,
        name: 'project_write_file',
        arguments: { path: targetPath, content: code }
      };

      await this.toolRegistry.executeTool(toolCall, project);
    }

    // Robust Fallback: Handles unclosed codeblocks or raw HTML output
    if (blocksFound === 0) {
      let rawCode = '';
      const openBlockMatch = fullText.match(/```(?:html)?(?:\s+filename=[^\n]+)?\s*\n([\s\S]+)/i);
      if (openBlockMatch) {
        rawCode = openBlockMatch[1];
      } else if (fullText.includes('<!DOCTYPE html>') || fullText.includes('<html')) {
        const start = fullText.indexOf('<!DOCTYPE html>') !== -1 ? fullText.indexOf('<!DOCTYPE html>') : fullText.indexOf('<html');
        rawCode = fullText.slice(start);
      }

      if (rawCode.trim().length > 20) {
        rawCode = rawCode.replace(/```\s*$/, '').trim();
        if (!rawCode.includes('</html>')) {
          if (rawCode.includes('<script') && !rawCode.includes('</script>')) {
            rawCode += '\n</script>';
          }
          if (rawCode.includes('<body') && !rawCode.includes('</body>')) {
            rawCode += '\n</body>';
          }
          rawCode += '\n</html>';
        }

        await this.toolRegistry.executeTool({
          id: 'tc_' + Date.now(),
          name: 'project_write_file',
          arguments: { path: 'index.html', content: rawCode }
        }, project);
        blocksFound++;
      }
    }

    // 3. Build & Validation Step
    const buildResult = await this.toolRegistry.executeTool({
      id: 'tc_build_' + Date.now(),
      name: 'build_project',
      arguments: {}
    }, project);

    if (buildResult.success) {
      agentEvents.emit('agent.completed', 'Aplicación generada y verificada con Qwen 3.8.');
    }

    // 4. Format Clean Conversational Response for Chat
    let conversationalResponse = fullText;
    if (fullText.includes('```html')) {
      const parts = fullText.split('```html');
      conversationalResponse = parts[0].trim();
      if (!conversationalResponse) {
        conversationalResponse = 'He generado y estructurado la aplicación solicitada con éxito.';
      }
    } else if (fullText.includes('<!DOCTYPE html>')) {
      const idx = fullText.indexOf('<!DOCTYPE html>');
      conversationalResponse = fullText.slice(0, idx).trim() || 'Aplicación generada con éxito.';
    }

    return { responseText: conversationalResponse, updatedProject: project };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
