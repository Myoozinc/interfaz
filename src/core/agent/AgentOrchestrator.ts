import type { FullStackProject, ToolCall } from '../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { ToolRegistry } from './ToolRegistry';
import { agentEvents } from './AgentEvents';

export class AgentOrchestrator {
  private aiProvider: OllamaProvider;
  private toolRegistry: ToolRegistry;

  constructor() {
    this.aiProvider = new OllamaProvider();
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
    agentEvents.emit('agent.started', `Iniciando tarea: "${userInstruction.slice(0, 50)}..."`);

    // 1. Gather Project Context
    const existingFileNames = Object.keys(project.files);
    const mainFile = project.files['index.html'] || project.files['src/App.tsx'] || Object.values(project.files)[0];
    let currentCode = mainFile?.content || '';

    // If code is overly large (> 12000 chars), trim comments or compress slightly to prevent TPM limits
    if (currentCode.length > 14000) {
      currentCode = currentCode.slice(0, 14000) + '\n<!-- [rest of codebase] -->';
    }

    const hasImages = (options?.images || []).length > 0;
    const hasLinks = (options?.links || []).length > 0;

    let instructionAugmented = userInstruction;
    if (hasLinks) {
      instructionAugmented += `\nENLACES Y REFERENCIAS: ${options!.links!.join(', ')}`;
    }
    if (hasImages) {
      instructionAugmented += `\n[El usuario ha adjuntado ${options!.images!.length} imagen(es) de referencia. Analiza los componentes visualmente y replica/corrige el diseño]`;
    }

    const systemPrompt = `Eres NONA AGENT, una fábrica de software e inteligencia artificial de clase mundial.
REGLAS:
1. Crea aplicaciones web completas, interactivas y profesionales con Tailwind CSS y Lucide Icons.
2. Devuelve TODO el código HTML/CSS/JS autocontenido en un ÚNICO bloque \`\`\`html con <!DOCTYPE html>.
3. El código debe ser 100% interactivo y ejecutable de inmediato sin placeholders ni funciones vacías.`;

    const userPrompt = existingFileNames.length > 0 && currentCode.length > 30 && !currentCode.includes('Nuevo Archivo')
      ? `MODIFICACIÓN SOBRE CÓDIGO EXISTENTE:
\`\`\`html
${currentCode}
\`\`\`

INSTRUCCIÓN DEL USUARIO:
${instructionAugmented}

Genera la versión completa actualizada del código con los cambios solicitados en un único bloque \`\`\`html.`
      : `CREACIÓN DESDE CERO:
Desarrolla la siguiente aplicación web completa, profesional e interactiva: "${instructionAugmented}". Devuelve todo el código en un único bloque \`\`\`html listo para renderizar.`;

    agentEvents.emit('agent.thinking', hasImages ? 'Analizando imagen multimodal y programando...' : 'Razonando y programando aplicación...');

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
            onProgress(full, false);
          }
        },
        { signal: options?.signal }
      );
    } catch (err: any) {
      agentEvents.emit('agent.error', `Error al comunicar con el motor IA: ${err.message}`);
      throw err;
    }

    // 2. Parse Code Blocks and apply to Workspace Files
    const codeBlockRegex = /```(\w+)?(?:\s+filename=([^\n]+))?\n([\s\S]*?)```/g;
    let match;
    let blocksFound = 0;

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

    // Fallback: If no codeblocks found but fullText is valid HTML
    if (blocksFound === 0 && (fullText.includes('<!DOCTYPE html>') || fullText.includes('<html'))) {
      const htmlStart = fullText.indexOf('<!DOCTYPE html>') === -1 ? fullText.indexOf('<html') : fullText.indexOf('<!DOCTYPE html>');
      const htmlEnd = fullText.lastIndexOf('</html>') === -1 ? fullText.length : fullText.lastIndexOf('</html>') + 7;
      const cleanHtml = fullText.slice(htmlStart, htmlEnd).trim();

      await this.toolRegistry.executeTool({
        id: 'tc_' + Date.now(),
        name: 'project_write_file',
        arguments: { path: 'index.html', content: cleanHtml }
      }, project);
    }

    // 3. Build & Validation Step
    const buildResult = await this.toolRegistry.executeTool({
      id: 'tc_build_' + Date.now(),
      name: 'build_project',
      arguments: {}
    }, project);

    if (buildResult.success) {
      agentEvents.emit('agent.completed', 'Aplicación generada y verificada exitosamente.');
    }

    return { responseText: fullText, updatedProject: project };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
