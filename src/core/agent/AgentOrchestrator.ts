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

  private async generateNaturalSummary(userInstruction: string, actionType: string, detailContext: string): Promise<string> {
    try {
      const prompt = `Eres el asistente de ingeniería de NONA AI (estilo Lovable / Google Antigravity).
El usuario solicitó: "${userInstruction}".
Acción realizada: ${actionType} (${detailContext}).

Escribe una respuesta corta, natural, conversacional y profesional en español (2 a 3 frases máximo):
1. Explica directamente qué se construyó o qué problema técnico se corrigió.
2. Menciona qué está listo para interactuar en la vista previa.
3. Sugiere una posible siguiente mejora.
Sé conciso, empático, sin plantillas robóticas ni encabezados genéricos.`;

      const res = await this.aiProvider.streamChat(
        [{ role: 'user', content: prompt }],
        () => {},
        { maxTokens: 250, temperature: 0.3 }
      );
      return res.trim() || `Listo. He aplicado los cambios solicitados para "${userInstruction.slice(0, 40)}" y la vista previa ya está actualizada y funcional.`;
    } catch {
      return `He actualizado la aplicación con base en tu instrucción: "${userInstruction.slice(0, 50)}". Todos los eventos, controles y vistas previas están sincronizados y listos para probar.`;
    }
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
Responde de forma clara, natural, didáctica, precisa y bien formateada en Markdown.
1. NO generes el documento HTML completo a menos que te pidan explícitamente un snippet.
2. Da respuestas concisas, profesionales y empáticas orientadas a la acción.
3. Si la pregunta es sobre el código actual, analiza el contexto del proyecto y explica exactamente cómo está estructurado.`;

      const consultUserPrompt = `CÓDIGO ACTUAL DE LA APLICACIÓN:
\`\`\`html
${currentCode.slice(0, 3500)}
\`\`\`

PREGUNTA DEL USUARIO:
"${userInstruction}"

Responde de forma clara, natural y profesional:`;

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
        { signal: options?.signal, model: 'qwen/qwen3.8-27b', temperature: 0.3 }
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
1. Presenta un plan conciso y natural con 2 o 3 opciones claras de implementación (Opción A, Opción B).
2. Pregúntale al usuario cuál prefiere o qué detalle desea priorizar.
3. Sé conversacional, cálido y enfocado en resolver el objetivo del usuario.`;

      const planUserPrompt = `IDEA O CONSULTA DEL USUARIO:
"${userInstruction}"

CÓDIGO ACTUAL (si existe):
\`\`\`html
${currentCode.slice(0, 2000)}
\`\`\`

Propón la arquitectura y opciones interactivas de forma natural:`;

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
        { signal: options?.signal, model: 'qwen/qwen3.8-27b', temperature: 0.3 }
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

      const { fullCode } = await multiAgentEngine.executeAutonomousPipeline(
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

      const naturalSummary = await this.generateNaturalSummary(
        userInstruction,
        'Creación de nueva aplicación completa',
        'Se generó la estructura HTML5, estilos Tailwind, escena 3D / lógica de estado y controles interactivos'
      );

      agentEvents.emit('agent.completed', 'Software construido y desplegado en vivo con éxito.');
      return { responseText: naturalSummary, updatedProject: project, intent };
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

    const naturalEditSummary = await this.generateNaturalSummary(
      userInstruction,
      'Corrección quirúrgica de componentes y eventos',
      intent.reason || 'Se actualizaron los listeners, botones y lógica en caliente'
    );

    agentEvents.emit('agent.completed', 'Modificación quirúrgica finalizada.');
    return { responseText: naturalEditSummary, updatedProject: project, intent };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
