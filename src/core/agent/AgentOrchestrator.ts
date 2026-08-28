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
    const currentCode = mainFile?.content || '';

    const hasImages = (options?.images || []).length > 0;
    const hasLinks = (options?.links || []).length > 0;

    let instructionAugmented = userInstruction;
    if (hasLinks) {
      instructionAugmented += `\nENLACES Y REFERENCIAS DE INSPIRACIÓN / DISEÑO: ${options!.links!.join(', ')}`;
    }
    if (hasImages) {
      instructionAugmented += `\n[El usuario ha adjuntado ${options!.images!.length} captura(s) o imagen(es) de referencia. Analízalas visualmente, detecta los componentes, colores y errores que deban corregirse en el código]`;
    }

    const systemPrompt = `Eres NONA AGENT, una fábrica de software e inteligencia artificial de clase mundial.
REGLAS OBLIGATORIAS:
1. Analiza con máxima fidelidad lo que pide el usuario (juegos interactivos con Three.js, e-commerce, apps de reservas, dashboards, etc.).
2. Si el usuario adjunta capturas de pantalla, analiza visualmente el diseño y corrige o replica la estructura fielmente.
3. Devuelve TODO el código HTML/CSS/JS autocontenido en un ÚNICO bloque \`\`\`html con <!DOCTYPE html> con Tailwind CSS (https://cdn.tailwindcss.com) y Lucide Icons (https://unpkg.com/lucide@latest).
4. NUNCA copies textos de depuración en los títulos. Pon títulos profesionales.
5. El código debe ser 100% interactivo y ejecutable de inmediato.`;

    const userPrompt = existingFileNames.length > 0 && currentCode.length > 30 && !currentCode.includes('Nuevo Archivo')
      ? `MODIFICACIÓN SOBRE CÓDIGO EXISTENTE:
\`\`\`html
${currentCode}
\`\`\`

INSTRUCCIÓN DEL USUARIO:
${instructionAugmented}

Genera la versión completa actualizada del código con los cambios integrados en un bloque \`\`\`html.`
      : `CREACIÓN DESDE CERO:
Desarrolla la siguiente aplicación web completa, profesional, interactiva y con diseño moderno: "${instructionAugmented}". Devuelve todo el código en un único bloque \`\`\`html listo para renderizar.`;

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
      const customFilename = match[2];
      const code = match[3].trim();

      const filename = customFilename || (lang === 'sql' ? 'schema.sql' : lang === 'json' ? 'package.json' : 'index.html');
      
      const toolCall: ToolCall = {
        id: 'tc_' + Date.now() + '_' + blocksFound,
        name: 'project_write_file',
        arguments: { path: filename, content: code }
      };

      await this.toolRegistry.executeTool(toolCall, project);
    }

    if (blocksFound === 0 && (fullText.includes('<!DOCTYPE html>') || fullText.includes('<html'))) {
      const start = fullText.indexOf('<!DOCTYPE html>') !== -1 ? fullText.indexOf('<!DOCTYPE html>') : fullText.indexOf('<html');
      const end = fullText.lastIndexOf('</html>') !== -1 ? fullText.lastIndexOf('</html>') + 7 : fullText.length;
      const code = fullText.slice(start, end).trim();

      await this.toolRegistry.executeTool({
        id: 'tc_' + Date.now(),
        name: 'project_write_file',
        arguments: { path: 'index.html', content: code }
      }, project);
    }

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
