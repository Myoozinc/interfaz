import type { FullStackProject, ToolCall } from '../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { ToolRegistry } from './ToolRegistry';
import { agentEvents } from './AgentEvents';
import { multiAgentEngine } from './MultiAgentEngine';

export class AgentOrchestrator {
  private aiProvider: OllamaProvider;
  private toolRegistry: ToolRegistry;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'qwen/qwen3.8-27b');
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
    const creationKeywords = [
      'haz una', 'haz un', 'crea una', 'crea un', 'crear', 'hacer', 'desarrolla',
      'construye', 'quiero una', 'quiero un', 'quiero hacer', 'nuevo proyecto',
      'juego de', 'app de', 'saas de', 'plataforma de', 'simulador de', 'juego 3d',
      'carrera', 'carreras', 'mario kart'
    ];
    const isModification = [
      'cambia', 'modifica', 'agrega', 'añade', 'elimina', 'quita', 'pon de color',
      'corrige', 'arregla', 'ajusta', 'reemplaza', 'mejora este', 'actualiza'
    ].some(k => lower.startsWith(k));

    if (isModification) return false;
    return creationKeywords.some(k => lower.includes(k));
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
    agentEvents.emit('agent.started', `Iniciando Pipeline Multi-Agente Antigravity: "${userInstruction.slice(0, 45)}..."`);

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
            onProgress(`**${stepName}**\n*(Escribiendo código...)*`, false);
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

      agentEvents.emit('agent.completed', 'Pipeline Multi-Agente finalizado con éxito.');

      return { responseText: summary, updatedProject: project };

    } catch (err: any) {
      agentEvents.emit('agent.error', `Error en Pipeline Multi-Agente: ${err.message}`);
      throw err;
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator();
