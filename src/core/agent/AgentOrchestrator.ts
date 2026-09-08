import type { ChatMessage } from '../../types';
import type { FullStackProject, ToolCall } from '../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { ToolRegistry } from './ToolRegistry';
import { agentEvents } from './AgentEvents';
import { multiAgentEngine } from './MultiAgentEngine';
import { surgicalDiffAgent } from './SurgicalDiffAgent';
import { intentRouter, type IntentClassificationResult } from './IntentRouter';
import { formatConversationHistory } from './historyUtils';
import { multiAgentPlanPipeline } from './MultiAgentPlanPipeline';

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
    surgicalDiffAgent.setEndpoint(url);
    multiAgentPlanPipeline.setEndpoint(url);
  }

  setModel(model: string) {
    this.aiProvider.setDefaultModel(model);
    surgicalDiffAgent.setModel(model);
    multiAgentPlanPipeline.setModel(model);
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
      history?: ChatMessage[];
      mode?: 'chat' | 'builder';
    }
  ): Promise<AgentExecutionResult> {
    const mainFile = project.files['index.html'] || Object.values(project.files)[0];
    const currentCode = mainFile?.content || '';

    // Step 1: Intelligent Intent Classification & Routing with History
    const intent = intentRouter.classifyIntent(userInstruction, currentCode, options?.history);
    agentEvents.emit('agent.started', `NONA Autonomous Engine [${intent.type}]: "${userInstruction.slice(0, 45)}..."`);

    // =========================================================================
    // MODE 1: 💬 CHAT_CONSULT (Consultation / Code Explanation / Advice)
    // =========================================================================
    if (intent.type === 'CHAT_CONSULT') {
      onProgress('💬 NONA Senior AI Consultant\n*(Analizando consulta y respondiendo...)*', true);

      const historyText = formatConversationHistory(options?.history, 6);
      const historyContext = historyText ? `\nHISTORIAL DE CONVERSACIÓN:\n${historyText}\n` : '';

      const consultSystemPrompt = `Eres NONA (No-Code & Natural Architecture AI — Estándar Google Antigravity & Lovable).
El usuario te está haciendo una pregunta o consulta técnica sobre tu funcionamiento, arquitectura o sobre el desarrollo de su aplicación.

TU IDENTIDAD Y ARQUITECTURA TÉCNICA REAL:
- MOTOR DE GENERACIÓN DE CÓDIGO: Tu motor principal es **Qwen 3.8 27B** ejecutado sobre chips LPU de **Groq** para inferencia en tiempo real de ultra-baja latencia (~300-500 tokens/s).
- VISIÓN COMPUTACIONAL (MULTIMODAL): Cuando el usuario adjunta capturas o imágenes, utilizas **Google Gemini 2.5 Flash** para análisis visual.
- MOTOR DE PARCHES Y CONSISTENCIA: Utilizas un **PatchEngine Quirúrgico (Search & Replace Diff)** que modifica únicamente las líneas afectadas sin reescribir todo el código.
- SANDBOX Y EJECUCIÓN: Todo el software se compila y ejecuta en un sandbox seguro de iframe en el navegador con soporte para Three.js (WebGL), Tailwind CSS, Canvas Confetti y Web Audio API.
- CONEXIONES OPCIONALES: Puedes conectarte a modelos locales mediante **Ollama** si el usuario lo configura en Ajustes.

REGLAS ABSOLUTAS DE TRANSPARENCIA:
1. NUNCA inventes que utilizas OpenAI GPT-4, Anthropic Claude 3.5, Microsoft Copilot, Notion AI o OpenAI Code Interpreter. Sé 100% honesta, técnica y veraz sobre tu arquitectura real (Groq + Qwen 3.8 27B + Gemini Flash + PatchEngine).
2. NO generes el documento HTML completo en una consulta conceptual a menos que te pidan explícitamente un snippet.
3. Da respuestas concisas, didácticas, directas y bien formateadas en Markdown.
4. Si la pregunta es sobre el código del proyecto actual, analiza el contexto y explica directamente cómo está estructurado.`;

      const consultUserPrompt = `${historyContext}
CÓDIGO ACTUAL DE LA APLICACIÓN:
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
    // MODE 2: 🗺️ INTERACTIVE_PLAN / CHAT MODE (Chain of 3 Specialized Agents)
    // =========================================================================
    // If the user selected 'chat' mode or asked an architectural planning request,
    // execute the 3-agent chain (Context Gatherer -> Creative Ideator -> Plan Orchestrator)
    if (options?.mode === 'chat' || intent.type === 'INTERACTIVE_PLAN') {
      onProgress('🧠 Cadena Multi-Agente NONA\n*(Agente 1: Analizando historial completo del chat...)*', true);

      const planResponse = await multiAgentPlanPipeline.executeConversationalPipeline(
        userInstruction,
        options?.history || [],
        currentCode,
        (_token, full) => {
          onProgress(full, false);
        },
        options?.signal
      );

      agentEvents.emit('agent.completed', 'Propuesta de arquitectura y plan interactivo generados.');
      return {
        responseText: planResponse,
        updatedProject: project,
        intent: { ...intent, type: 'INTERACTIVE_PLAN' },
        actionChips: [
          '▶ Construir y Ver en Preview',
          '👁️ Ver Preview Actual',
          '💬 Refinar Enfoque en Chat'
        ]
      };
    }

    // =========================================================================
    // MODE 3: 🚀 FULL_BUILD (Full Software / 3D Game Synthesis)
    // =========================================================================
    if (intent.type === 'FULL_BUILD') {
      let agentStepsLog = '';
      const isExplicitNew = intent.isExplicitNew ?? (currentCode.trim().length < 50);

      const { fullCode } = await multiAgentEngine.executeAutonomousPipeline(
        userInstruction,
        currentCode,
        isExplicitNew,
        (stepName, detail, streamToken) => {
          if (stepName !== agentStepsLog) {
            agentStepsLog = stepName;
            onProgress(`**${stepName}**\n${detail}`, true);
          } else if (streamToken) {
            onProgress(`**${stepName}**\n*(Escribiendo código...)*`, false);
          }
        },
        options?.signal,
        options?.history
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
        isExplicitNew ? 'Creación de nueva aplicación completa' : 'Evolución y actualización completa de la aplicación',
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
      options?.signal,
      options?.history
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
      intent.reason || 'Se actualizaron los listeners, botones y lógica en caliente manteniendo el juego original'
    );

    agentEvents.emit('agent.completed', 'Modificación quirúrgica finalizada.');
    return { responseText: naturalEditSummary, updatedProject: project, intent };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
