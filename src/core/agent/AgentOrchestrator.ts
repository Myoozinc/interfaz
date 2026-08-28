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
    signal?: AbortSignal
  ): Promise<{ responseText: string; updatedProject: FullStackProject }> {
    agentEvents.emit('agent.started', `Iniciando tarea: "${userInstruction.slice(0, 50)}..."`);

    // 1. Gather Project Context
    const existingFileNames = Object.keys(project.files);
    const mainFile = project.files['index.html'] || project.files['src/App.tsx'] || Object.values(project.files)[0];
    const currentCode = mainFile?.content || '';

    const systemPrompt = `Eres NONA AGENT, una fábrica de software e inteligencia artificial de clase mundial.
REGLAS OBLIGATORIAS:
1. Analiza con máxima fidelidad lo que pide el usuario (si pide un juego, crea un juego 100% interactivo con Three.js o Canvas 2D; si pide una tienda, crea e-commerce; si pide un restaurante, crea reservas; si pide pintar, crea paint).
2. Devuelve TODO el código HTML/CSS/JS autocontenido en un ÚNICO bloque \`\`\`html con <!DOCTYPE html> con Tailwind CSS (https://cdn.tailwindcss.com) y Lucide Icons (https://unpkg.com/lucide@latest).
3. NUNCA copies textos del sistema en los títulos ni pongas 'ARCHIVOS ACTUALES DEL PROYECTO:'. Pon un título profesional acorde a la app.
4. El código debe ser 100% ejecutable y funcional de inmediato.`;

    const userPrompt = existingFileNames.length > 0 && currentCode.length > 30 && !currentCode.includes('Nuevo Archivo')
      ? `MODIFICACIÓN SOBRE CÓDIGO EXISTENTE:
\`\`\`html
${currentCode}
\`\`\`

INSTRUCCIÓN DEL USUARIO:
${userInstruction}

Genera la versión completa actualizada del código con los cambios integrados en un bloque \`\`\`html.`
      : `CREACIÓN DESDE CERO:
Desarrolla la siguiente aplicación web completa, profesional, interactiva y con diseño moderno: "${userInstruction}". Devuelve todo el código en un único bloque \`\`\`html listo para renderizar.`;

    agentEvents.emit('agent.thinking', 'Razonando y programando aplicación...');

    let fullText = '';
    try {
      fullText = await this.aiProvider.streamChat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        (chunk, full, isThinking) => {
          if (isThinking) {
            onProgress(chunk, true);
          } else {
            onProgress(full, false);
          }
        },
        { signal }
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
