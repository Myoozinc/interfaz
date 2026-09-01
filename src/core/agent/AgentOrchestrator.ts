import type { FullStackProject, ToolCall } from '../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { ToolRegistry } from './ToolRegistry';
import { agentEvents } from './AgentEvents';
import { multiAgentEngine } from './MultiAgentEngine';
import { surgicalDiffAgent } from './SurgicalDiffAgent';
import { intentRouter, type IntentClassificationResult } from './IntentRouter';

export interface AgentExecutionResult {
  responseText: string;
  updatedProject: FullStackProject;
  intent: IntentClassificationResult;
  actionChips?: string[];
}

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

  async run(
    userInstruction: string,
    project: FullStackProject,
    onProgress: (text: string, isThinking?: boolean) => void,
    options?: {
      images?: string[];
      links?: string[];
      signal?: AbortSignal;
    }
  ): Promise<AgentExecutionResult> {
    const mainFile = project.files['index.html'] || Object.values(project.files)[0];
    const currentCode = mainFile?.content || '';

    // Step 1: Intelligent Intent Classification & Routing
    const intent = intentRouter.classifyIntent(userInstruction, currentCode);
    agentEvents.emit('agent.started', `NONA Autonomous Engine [${intent.type}]: "${userInstruction.slice(0, 45)}..."`);

    // =========================================================================
    // MODE 1: 💬 CHAT_CONSULT (Consultation / Code Explanation / Advice)
    // =========================================================================
    if (intent.type === 'CHAT_CONSULT') {
      onProgress('💬 NONA Senior AI Consultant\n*(Analizando consulta y respondiendo...)*', true);

      const consultSystemPrompt = `Eres NONA SENIOR AI ARCHITECT & CONSULTANT (Google Antigravity & Lovable Standard).
El usuario te está haciendo una pregunta o consulta técnica sobre su aplicación o sobre desarrollo de software.
Tu misión es responder con explicaciones claras, didácticas, precisas y bien formateadas en Markdown (con bloques de código explicativos si aplica).

REGLAS CRÍTICAS:
1. NO generes el documento HTML completo a menos que te pidan explícitamente un snippet.
2. Da respuestas concisas, profesionales, entusiastas y orientadas a la acción.
3. Si la pregunta es sobre el código actual, analiza el contexto del proyecto y explica exactamente cómo está estructurado.`;

      const consultUserPrompt = `CÓDIGO ACTUAL DE LA APLICACIÓN:
\`\`\`html
${currentCode.slice(0, 4000)}
\`\`\`

PREGUNTA DEL USUARIO:
"${userInstruction}"

Responde de forma clara y profesional:`;

      let responseText = '';
      await this.aiProvider.streamChat(
        [
          { role: 'system', content: consultSystemPrompt },
          { role: 'user', content: consultUserPrompt }
        ],
        (_token, full) => {
          responseText = full;
          onProgress(full, false);
        },
        { signal: options?.signal, model: 'qwen/qwen-2.5-coder-32b-instruct', temperature: 0.3 }
      );

      agentEvents.emit('agent.completed', 'Consulta técnica respondida con éxito.');
      return { responseText, updatedProject: project, intent };
    }

    // =========================================================================
    // MODE 2: 🗺️ INTERACTIVE_PLAN (Co-Creation / Interactive Interview)
    // =========================================================================
    if (intent.type === 'INTERACTIVE_PLAN') {
      onProgress('🗺️ NONA Interactive Architect\n*(Diseñando propuesta y opciones de desarrollo...)*', true);

      const planSystemPrompt = `Eres NONA LEAD PRODUCT ARCHITECT (Estándar Lovable / Google Antigravity).
El usuario tiene una idea abierta o está buscando asesoramiento sobre cómo construir o evolucionar su proyecto.
Tu misión es:
1. Presentar un plan conciso y emocionante con 2 o 3 opciones claras de implementación (Opción A, Opción B).
2. Preguntarle al usuario cuál prefiere o qué detalle desea priorizar.
3. Al final, incluye una lista de 3 sugerencias accionables que el usuario puede pulsar directamente.`;

      const planUserPrompt = `IDEA O CONSULTA DEL USUARIO:
"${userInstruction}"

CÓDIGO ACTUAL (si existe):
\`\`\`html
${currentCode.slice(0, 2500)}
\`\`\`

Propón la arquitectura y opciones interactivas:`;

      let responseText = '';
      await this.aiProvider.streamChat(
        [
          { role: 'system', content: planSystemPrompt },
          { role: 'user', content: planUserPrompt }
        ],
        (_token, full) => {
          responseText = full;
          onProgress(full, false);
        },
        { signal: options?.signal, model: 'qwen/qwen-2.5-coder-32b-instruct', temperature: 0.3 }
      );

      agentEvents.emit('agent.completed', 'Propuesta de arquitectura y co-creación generada.');
      return {
        responseText,
        updatedProject: project,
        intent,
        actionChips: intent.suggestedActionChips || [
          '🚀 Desarrollar Opción A (Recomendada)',
          '🎨 Probar con Estilo Cyberpunk / Neón',
          '📱 Optimizar para Móviles y Pantalla Táctil'
        ]
      };
    }

    // =========================================================================
    // MODE 3: 🚀 FULL_BUILD (Full Software / 3D Game Synthesis)
    // =========================================================================
    if (intent.type === 'FULL_BUILD') {
      let agentStepsLog = '';

      const { fullCode, summary } = await multiAgentEngine.executeAutonomousPipeline(
        userInstruction,
        currentCode,
        true, // isNew
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

      agentEvents.emit('agent.completed', 'Software construido y desplegado en vivo con éxito.');
      return { responseText: summary, updatedProject: project, intent };
    }

    // =========================================================================
    // MODE 4: ⚡ SURGICAL_EDIT (Bug Fixes & Precision Tweaks)
    // =========================================================================
    onProgress('⚡ NONA Surgical Diff Engine\n*(Localizando y aplicando parche en caliente...)*', true);

    const patchedCode = await surgicalDiffAgent.applySurgicalEdit(
      userInstruction,
      currentCode,
      () => onProgress('⚡ NONA Surgical Diff Engine\n*(Escribiendo parche...)*', false),
      options?.signal
    );

    // Save patched code to index.html
    await this.toolRegistry.executeTool({
      id: 'tc_patch_' + Date.now(),
      name: 'project_write_file',
      arguments: { path: 'index.html', content: patchedCode }
    }, project);

    await this.toolRegistry.executeTool({
      id: 'tc_build_' + Date.now(),
      name: 'build_project',
      arguments: {}
    }, project);

    const editSummary = `⚡ **Modificación Quirúrgica Aplicada con Éxito**:\n- **Diagnóstico**: ${intent.reason}\n- **Estado**: Componentes y eventos actualizados en vivo sin regenerar el resto de la aplicación.`;
    agentEvents.emit('agent.completed', 'Modificación quirúrgica finalizada.');

    return { responseText: editSummary, updatedProject: project, intent };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
