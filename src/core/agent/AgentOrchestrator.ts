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
    this.aiProvider = new OllamaProvider('/api/agent', 'auto');
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
    const classified = intentRouter.classifyIntent(userInstruction, currentCode, options?.history);
    // Modo "Preguntar": el usuario quiere una respuesta, nunca que se construya o modifique la app.
    // Confirmación ("hazlo", "dale", "ok") tras una propuesta de NONA en modo Preguntar: se construye.
    const hist: any[] = (options?.history as any[]) || [];
    const lastAssistant = [...hist].reverse().find(m => m?.role === 'assistant')?.content || '';
    const confirmsProposal = /hazlo/i.test(String(lastAssistant).slice(-200))
      && /^\s*(ok|okay|vale|s[ií]|dale|hazlo|adelante|constr[uú]ye(la|lo)?|perfecto|listo|de acuerdo)\b/i.test(userInstruction);
    const intent = options?.mode === 'chat' && classified.type !== 'INTERACTIVE_PLAN' && !confirmsProposal
      ? { ...classified, type: 'CHAT_CONSULT' as const }
      : classified;
    agentEvents.emit('agent.started', `NONA Autonomous Engine [${intent.type}]: "${userInstruction.slice(0, 45)}..."`);

    // =========================================================================
    // MODE 1: 💬 CHAT_CONSULT (Consultation / Code Explanation / Advice)
    // =========================================================================
    if (intent.type === 'CHAT_CONSULT') {
      onProgress('💬 NONA Senior AI Consultant\n*(Analizando consulta y respondiendo...)*', true);

      const historyText = formatConversationHistory(options?.history, 6);
      const historyContext = historyText ? `\nHISTORIAL DE CONVERSACIÓN:\n${historyText}\n` : '';

      const consultSystemPrompt = `Eres NONA, una plataforma que crea aplicaciones web y juegos a partir de una descripción en español, y que luego permite modificarlos conversando.
El usuario te hace una pregunta (sobre NONA, sobre su app o sobre desarrollo en general). Respóndela; no construyas ni modifiques nada.

CÓMO FUNCIONA NONA (sé fiel a esto si preguntan):
- Genera proyectos React + TypeScript + Tailwind con varios archivos, que se ven funcionando al instante en la vista previa y se pueden descargar como proyecto Vite o subir a GitHub/Vercel.
- Usa varios modelos de IA gratuitos (Groq, Google Gemini, NVIDIA, Mistral, SambaNova, OpenRouter y otros) y elige automáticamente el mejor disponible en cada momento.
- Las apps pueden mostrar o generar imágenes con IA gratis y escenas 3D (three.js / React Three Fiber).
- Construye por etapas: planifica diseño, pantallas y datos; escribe la base y luego cada pantalla; prueba la app y corrige errores sola.
- Las ediciones se aplican con parches sobre los archivos existentes, sin rehacer la app.
- Las apps pueden incluir IA (chat, generar o resumir texto) sin API keys, guardar datos en el navegador y usar fotos de la biblioteca de NONA.
- Tiene una galería con 12 apps profesionales y 20 juegos como punto de partida.

REGLAS ABSOLUTAS DE TRANSPARENCIA:
1. No inventes detalles técnicos que no aparecen arriba (modelos concretos, versiones, cifras de velocidad).
2. NO generes el documento HTML completo en una consulta conceptual a menos que te pidan explícitamente un snippet.
3. Da respuestas concisas, didácticas, directas y bien formateadas en Markdown.
4. Si la pregunta es sobre el proyecto actual, tienes TODOS sus archivos: respóndela leyéndolos (nunca digas que necesitas ver el código).
5. Si el usuario pide que crees una app, web o juego: resume en 4-6 viñetas cortas lo que construirás (pantallas y funciones realistas para una primera versión; no prometas VR, multijugador, backend ni modelos 3D descargados) y termina con: "Escribe *hazlo* y la construyo." No uses tablas.
6. Si el usuario describe algo que no funciona, explica en 2-4 frases la causa concreta que ves en el código y termina diciendo: "Escribe *arréglalo* y lo corrijo." No pegues bloques de código largos.`;

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
          // Los modelos de razonamiento envían <think>…</think>: no se muestra al usuario
          responseText = full.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim();
          onProgress(responseText || '💬 Pensando…', false);
        },
        { signal: options?.signal, model: 'auto', temperature: 0.3 }
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
