import type { FullStackProject, ToolCall } from '../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { ToolRegistry } from './ToolRegistry';
import { agentEvents } from './AgentEvents';
import { multiAgentEngine } from './MultiAgentEngine';

export class AgentOrchestrator {
  private aiProvider: OllamaProvider;
  private toolRegistry: ToolRegistry;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'openai/gpt-oss-120b');
    this.toolRegistry = new ToolRegistry();
  }

  setEndpoint(url: string) {
    this.aiProvider.setBaseUrl(url);
    multiAgentEngine.setEndpoint(url);
  }

  setModel(model: string) {
    this.aiProvider.setDefaultModel(model);
  }

  private isNewAppRequest(instruction: string): boolean {
    const lower = instruction.toLowerCase().trim();
    if (lower.startsWith('[elemento seleccionado')) return false;

    const modificationStarts = [
      'cambia el', 'cambia la', 'modifica el', 'modifica la', 'pon de color',
      'haz el botón', 'añade un campo', 'agrega un campo', 'elimina el botón',
      'quita el botón', 'corrige el error', 'arregla el', 'hazlo más grande',
      'hazlo más pequeño', 'cambia el título', 'cambia el fondo'
    ];
    if (modificationStarts.some(m => lower.startsWith(m))) {
      return false;
    }

    return true; // Default to full generation
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
    agentEvents.emit('agent.started', `Iniciando Pipeline de Software NONA: "${userInstruction.slice(0, 45)}..."`);

    const mainFile = project.files['index.html'] || Object.values(project.files)[0];
    let currentCode = mainFile?.content || '';
    const isNew = this.isNewAppRequest(userInstruction) || currentCode.length < 50 || currentCode.includes('Lienzo Listo');

    let agentStepsLog = '';

    try {
      const { fullCode, summary } = await multiAgentEngine.executeAutonomousPipeline(
        userInstruction,
        currentCode,
        isNew,
        (stepName, detail, streamToken) => {
          if (stepName !== agentStepsLog) {
            agentStepsLog = stepName;
            onProgress(`**${stepName}**\n${detail}`, true);
          } else if (streamToken) {
            onProgress(`**${stepName}**\n*(Escribiendo software...)*`, false);
          }
        },
        options?.signal
      );

      // Save verified code to index.html
      const toolCall: ToolCall = {
        id: 'tc_' + Date.now(),
        name: 'project_write_file',
        arguments: { path: 'index.html', content: fullCode }
      };

      await this.toolRegistry.executeTool(toolCall, project);

      // Validate & Build
      await this.toolRegistry.executeTool({
        id: 'tc_build_' + Date.now(),
        name: 'build_project',
        arguments: {}
      }, project);

      agentEvents.emit('agent.completed', 'Software generado y validado con éxito.');

      return { responseText: summary, updatedProject: project };

    } catch (err: any) {
      agentEvents.emit('agent.error', `Error en generación: ${err.message}`);
      throw err;
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator();
