import type { ChatMessage, ChatAttachment } from '../../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { agentEvents } from './AgentEvents';
import { domainMetaAgentFactory, type DomainExpertAgent } from './DomainMetaAgentFactory';
import { webSearchService } from '../services/WebSearchService';

export interface PlanPipelineResult {
  analysis: string;
  creativeIdeas: string[];
  roadmapSteps: string[];
  formattedResponse: string;
  suggestedActionChips: string[];
}

export class MultiAgentPlanPipeline {
  private aiProvider: OllamaProvider;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'qwen/qwen3.8-27b');
  }

  public setEndpoint(url: string): void {
    this.aiProvider.setBaseUrl(url);
  }

  public setModel(model: string): void {
    this.aiProvider.setDefaultModel(model);
  }

  /**
   * FORMATS FULL CHAT HISTORY (From first message to last)
   * Captures the entire project evolution, past fixes, and current request.
   */
  private formatFullHistory(history?: ChatMessage[]): string {
    if (!history || history.length === 0) return 'Sin historial previo (inicio de proyecto).';

    return history
      .map((msg, i) => {
        const role = msg.role === 'user' ? 'USUARIO' : 'NONA';
        const snippet = msg.content.length > 350 ? msg.content.slice(0, 350) + '...' : msg.content;
        return `[Turno ${i + 1} - ${role}]: ${snippet}`;
      })
      .join('\n');
  }

  /**
   * AGENT 1: Context Gatherer & Project Historian
   * Scans the full chat transcript from start to finish and extracts
   * the active project state, existing mechanics, and user intent.
   */
  public async gatherFullContext(
    userInstruction: string,
    history: ChatMessage[],
    currentCode: string,
    signal?: AbortSignal
  ): Promise<string> {
    agentEvents.emit('agent.thinking', '🧠 Agente 1 (Contexto): Analizando historial completo del chat de inicio a fin...');

    const fullHistoryText = this.formatFullHistory(history);
    const codeSnippet = currentCode ? currentCode.slice(0, 2000) : 'Ninguno';

    const systemPrompt = `Eres AGENTE 1: HISTORIADOR Y SINTETIZADOR DE CONTEXTO de NONA.
Tu trabajo es analizar TODO el historial de la conversación desde el mensaje 1 hasta el último, y el código activo.
Extrae en 3 o 4 líneas concisas:
1. Concepto central y temática del proyecto que se ha venido construyendo.
2. Qué funcionalidades, geometrías o eventos ya fueron creados o corregidos.
3. Qué está pidiendo exactamente el usuario en su última instrucción.`;

    const userPrompt = `HISTORIAL COMPLETO DE LA CONVERSACIÓN:
${fullHistoryText}

CÓDIGO ACTUAL (MUESTRA):
\`\`\`html
${codeSnippet}
\`\`\`

ÚLTIMA INSTRUCCIÓN DEL USUARIO:
"${userInstruction}"

Sintetiza el contexto de forma técnica y compacta:`;

    let brief = '';
    await this.aiProvider.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      (_token, full) => { brief = full; },
      { signal, model: 'qwen/qwen3.8-27b', maxTokens: 400, temperature: 0.1 }
    );

    return brief.trim();
  }

  /**
   * AGENT 2: Creative Ideation & Feature Expander
   * Translates the user's prompt into professional software/game mechanics,
   * injecting creative polish, audio, visual particles, and UI details.
   */
  public async generateCreativeIdeation(
    userInstruction: string,
    contextBrief: string,
    signal?: AbortSignal
  ): Promise<string> {
    agentEvents.emit('agent.thinking', '💡 Agente 2 (Ideación Creativa): Enriqueciendo prompt con mejoras de UX, sonido y diseño...');

    const systemPrompt = `Eres AGENTE 2: ESTRATEGA DE PRODUCTO E INNOVACIÓN CREATIVA de NONA.
Tu misión: Tomar la petición del usuario y el contexto del proyecto, y expandirla con 2 o 3 ideas creativas de alto impacto técnico:
- En videojuegos 3D / WebGL: Efectos de partículas en GPU, iluminación dinámica, sonido procedural Web Audio API, dificultad adaptativa o controles táctiles.
- En aplicaciones web / SaaS: Micro-animaciones, métricas en tiempo real, modo oscuro, atajos de teclado o alertas con confeti.
- Prevención de fallos: Evitar pantallas en negro, asegurar que los botones oculten overlays e inicien la animación.`;

    const userPrompt = `CONTEXTO DEL PROYECTO (Agente 1):
${contextBrief}

PETICIÓN DEL USUARIO:
"${userInstruction}"

Propón 3 mejoras o ideas innovadoras específicas para incorporar a este requerimiento:`;

    let ideation = '';
    await this.aiProvider.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      (_token, full) => { ideation = full; },
      { signal, model: 'qwen/qwen3.8-27b', maxTokens: 600, temperature: 0.25 }
    );

    return ideation.trim();
  }

  /**
   * AGENT 3: Conversational Plan & Architecture Orchestrator
   * Combines the full context brief and creative ideas into an elegant,
   * structured conversational response in Markdown with clear action steps.
   */
  public async orchestratePlan(
    userInstruction: string,
    contextBrief: string,
    creativeIdeas: string,
    currentCode: string,
    expertAgent: DomainExpertAgent,
    webContext: string,
    onStream: (token: string, fullText: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    agentEvents.emit('agent.thinking', `📋 [${expertAgent.name}]: Redactando propuesta interactiva y hoja de ruta...`);

    const systemPrompt = `Eres ${expertAgent.name}, LEAD ARCHITECT de NONA en ${expertAgent.domain} (Estándar Lovable / Google Antigravity).
Tu misión es hablarle directamente al usuario en español con un tono profesional, empático, didáctico y enfocado en la acción.
Debes presentar la respuesta en este formato Markdown impecable:

### 👑 Agente Experto Asignado: ${expertAgent.name}
*(Especialidad: ${expertAgent.domain})*

### 🧠 Análisis & Comprensión del Contexto
(1 o 2 frases explicando cómo entendiste su requerimiento dentro del historial de lo que ya se ha venido haciendo en el proyecto).

### 💡 Ideas & Mejoras que Incorporaremos
(2 o 3 viñetas claras con las propuestas de ${expertAgent.domain}, sonido, partículas o UX).

### 📋 Plan de Construcción Quirúrgica
(Paso a paso de las modificaciones o funciones exactas que se van a implementar en el código, garantizando consistencia total y cero pantallas en negro).

> **¿Listo para construir?** Puedes hacer clic en **"▶ Construir y Ver en Preview"** abajo para que genere el código de inmediato, o decirme si deseas ajustar algún detalle aquí en el chat antes de compilar.`;

    const userPrompt = `CONTEXTO HISTÓRICO (Agente 1):
${contextBrief}

${webContext}

IDEAS Y MEJORAS CREATIVAS (Agente 2):
${creativeIdeas}

PETICIÓN DEL USUARIO:
"${userInstruction}"

ESTADO DEL CÓDIGO ACTUAL:
${currentCode && currentCode.length > 50 ? 'Existe aplicación activa en desarrollo.' : 'Proyecto en blanco o plantilla inicial.'}

Redacta la respuesta conversacional y el plan estructurado para el usuario:`;

    let fullPlan = '';
    await this.aiProvider.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      (token, full) => {
        fullPlan = full;
        onStream(token, full);
      },
      { signal, model: 'qwen/qwen3.8-27b', maxTokens: 1100, temperature: 0.2 }
    );

    return fullPlan;
  }

  /**
   * FULL PIPELINE EXECUTION (Chain of Domain-Specialized Agents)
   */
  public async executeConversationalPipeline(
    userInstruction: string,
    history: ChatMessage[],
    currentCode: string,
    onStream: (token: string, fullText: string) => void,
    signal?: AbortSignal,
    attachments: ChatAttachment[] = []
  ): Promise<string> {
    // Step 0: Meta-Agent Domain Detection & Instantiation
    const expertAgent = domainMetaAgentFactory.analyzeAndInstantiateExpert(
      userInstruction,
      history,
      attachments,
      currentCode
    );
    agentEvents.emit('agent.thinking', `🧠 [Meta-Agente]: Activando especialista "${expertAgent.name}"...`);

    // Step 0.5: Web Grounding & Reference URL analysis
    let webContext = '';
    const refUrl = attachments.find(a => a.type === 'url' || (a.url && a.url.startsWith('http')));
    if (refUrl) {
      agentEvents.emit('agent.thinking', `🌐 [Conexión Web]: Rastreando ${refUrl.url}...`);
      const scraped = await webSearchService.scrapeReferenceUrl(refUrl.url);
      if (scraped) {
        webContext = webSearchService.formatScrapedPageForPrompt(scraped);
      }
    }

    // Step 1: Agent 1 analyzes full chat transcript
    const contextBrief = await this.gatherFullContext(userInstruction, history, currentCode, signal);

    // Step 2: Agent 2 enriches prompt with creative ideas
    const creativeIdeas = await this.generateCreativeIdeation(userInstruction, contextBrief, signal);

    // Step 3: Agent 3 orchestrates the plan and streams it to user
    const formattedPlan = await this.orchestratePlan(
      userInstruction,
      contextBrief,
      creativeIdeas,
      currentCode,
      expertAgent,
      webContext,
      onStream,
      signal
    );

    return formattedPlan;
  }
}

export const multiAgentPlanPipeline = new MultiAgentPlanPipeline();
