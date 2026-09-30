import type { ChatMessage, ChatAttachment } from '../../types';
import type { FullStackProject } from '../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { agentEvents } from './AgentEvents';
import { multiAgentEngine } from './MultiAgentEngine';
import { surgicalDiffAgent } from './SurgicalDiffAgent';
import { intentRouter, type IntentClassificationResult } from './IntentRouter';
import { formatConversationHistory } from './historyUtils';
import { multiAgentPlanPipeline } from './MultiAgentPlanPipeline';
import { agentCollaborationCouncil } from './AgentCollaborationCouncil';
import { appBuilderAgent, filesAsContext } from './AppBuilderAgent';

export interface AgentExecutionResult {
  responseText: string;
  updatedProject: FullStackProject;
  intent: IntentClassificationResult;
  actionChips?: string[];
  activeAgentDomain?: string;
  collaboratingAgents?: string[];
}

export class AgentOrchestrator {
  private aiProvider: OllamaProvider;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'qwen/qwen3.8-27b');
  }

  setEndpoint(url: string) {
    this.aiProvider.setBaseUrl(url);
    multiAgentEngine.setEndpoint(url);
    surgicalDiffAgent.setEndpoint(url);
    multiAgentPlanPipeline.setEndpoint(url);
    agentCollaborationCouncil.setEndpoint(url);
    appBuilderAgent.setEndpoint(url);
  }

  setModel(model: string) {
    this.aiProvider.setDefaultModel(model);
    surgicalDiffAgent.setModel(model);
    multiAgentPlanPipeline.setModel(model);
    agentCollaborationCouncil.setModel(model);
  }



  async run(
    userInstruction: string,
    project: FullStackProject,
    onProgress: (text: string, isThinking?: boolean) => void,
    options?: {
      images?: string[];
      links?: string[];
      attachments?: ChatAttachment[];
      signal?: AbortSignal;
      history?: ChatMessage[];
      mode?: 'chat' | 'builder';
      model?: string;
    }
  ): Promise<AgentExecutionResult> {
    // Determine target file context
    let targetPath = 'index.html';
    if (!project.files['index.html'] && Object.keys(project.files).length > 0) {
      targetPath = Object.keys(project.files)[0];
    }
    for (const p of Object.keys(project.files)) {
      if (userInstruction.toLowerCase().includes(p.toLowerCase())) {
        targetPath = p;
        break;
      }
    }
    const targetFile = project.files[targetPath] || project.files['index.html'] || Object.values(project.files)[0];
    const currentCode = targetFile?.content || '';

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
4. Si la pregunta es sobre el proyecto actual, tienes TODOS sus archivos: respóndela leyéndolos (nunca digas que necesitas ver el código).
5. Si el usuario describe algo que no funciona, explica en 2-4 frases la causa concreta que ves en el código y termina diciendo: "Escribe *arréglalo* y lo corrijo." No pegues bloques de código largos.`;

      const consultUserPrompt = `${historyContext}
ARCHIVOS ACTUALES DE LA APLICACIÓN:
${filesAsContext(Object.fromEntries(Object.entries(project.files).map(([p, f]) => [p, f.content])), 60000)}

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
    // If the user requested an architectural planning request, or chat mode without an explicit build/edit intent,
    // execute the 3-agent chain (Context Gatherer -> Creative Ideator -> Plan Orchestrator)
    if ((options?.mode === 'chat' && intent.type !== 'FULL_BUILD' && intent.type !== 'SURGICAL_EDIT') || intent.type === 'INTERACTIVE_PLAN') {
      onProgress('🧠 Cadena Multi-Agente NONA\n*(Agente 1: Analizando historial completo del chat...)*', true);

      const planResponse = await multiAgentPlanPipeline.executeConversationalPipeline(
        userInstruction,
        options?.history || [],
        currentCode,
        (_token, full) => {
          onProgress(full, false);
        },
        options?.signal,
        options?.attachments || []
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
    // MODE 3 y 4: 🚀 CONSTRUIR / ⚡ EDITAR — un único agente, sin plantillas guardadas.
    // Si la generación falla se lanza el error real (la app lo muestra y reembolsa créditos).
    // =========================================================================
    const hasProject = Object.keys(project.files).some(p => /src\/App\.(tsx|jsx)$/.test(p)) ||
      Object.values(project.files).some(f => f.content && f.content.length > 400 && !f.content.includes('Lienzo Listo'));
    const isEdit = intent.type === 'SURGICAL_EDIT' && hasProject;

    const result = await appBuilderAgent.run(userInstruction, project, isEdit, onProgress, {
      history: options?.history,
      signal: options?.signal,
    });

    agentEvents.emit('agent.completed', isEdit
      ? `Edición aplicada en ${result.changedPaths.length} archivo(s).`
      : `App construida con ${Object.keys(result.files).length} archivo(s).`);

    return {
      responseText: result.summary,
      updatedProject: project,
      intent: { ...intent, type: isEdit ? 'SURGICAL_EDIT' : 'FULL_BUILD' },
      activeAgentDomain: isEdit ? 'Edición' : 'Construcción',
      actionChips: isEdit ? undefined : ['👁️ Probar en Preview en Vivo', '💻 Ver Código en Editor', '💬 Refinar en Chat'],
    };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
