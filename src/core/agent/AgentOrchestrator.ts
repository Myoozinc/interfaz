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

    const systemPrompt = `Eres NONA AGENT, el cerebro de una Fábrica de Software con IA (AI Software Factory).
Tu misión es diseñar, construir, modificar, probar y desplegar aplicaciones web full-stack completas y reales.
REGLAS:
1. Analiza los requerimientos del usuario y crea código 100% funcional.
2. Devuelve TODO el código HTML/CSS/JS autocontenido en un ÚNICO bloque \`\`\`html con <!DOCTYPE html> con Tailwind CSS, componentes interactivos y lógica JS completa.
3. Si el usuario pide crear schemas de BD o rutas de API, inclúyelos en bloques etiquetados como \`\`\`sql filename=schema.sql o \`\`\`javascript filename=api/routes.js.
4. Si estás modificando una app existente, mantén la funcionalidad previa e integra los nuevos cambios.`;

    const userPrompt = existingFileNames.length > 0 && currentCode.length > 30
      ? `ARCHIVOS ACTUALES DEL PROYECTO: ${existingFileNames.join(', ')}

CÓDIGO PRINCIPAL EXISTENTE:
\`\`\`html
${currentCode}
\`\`\`

INSTRUCCIÓN DEL USUARIO:
${userInstruction}

Genera la aplicación actualizada completa con las modificaciones solicitadas.`
      : `INSTRUCCIÓN DEL USUARIO:
${userInstruction}

Crea una aplicación completa, profesional e interactiva que cumpla todos los requerimientos solicitados.`;

    agentEvents.emit('agent.thinking', 'Razonando arquitectura y componentes...');

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

    // If no markdown fence was used but raw HTML was output
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

    // 3. Run Build & Syntax Verification Tool
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
