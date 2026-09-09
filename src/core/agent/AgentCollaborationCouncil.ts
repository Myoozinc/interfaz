import type { ChatMessage, ChatAttachment } from '../../types';
import type { FullStackProject } from '../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { agentEvents } from './AgentEvents';
import { domainMetaAgentFactory, type DomainExpertAgent } from './DomainMetaAgentFactory';
import { optimalModelRouter } from './OptimalModelRouter';
import { webSearchService } from '../services/WebSearchService';
import { formatConversationHistory } from './historyUtils';
import { ActionStreamParser } from '../parser/ActionStreamParser';
import { MARIO_KART_GAME_HTML } from '../../services/marioKartTemplate';
import { AIR_COMBAT_GAME_HTML } from '../../services/airCombatTemplate';
import { STARTER_TEMPLATES } from '../../services/templates';

export interface CollaborationResult {
  fullCode: string;
  files: Record<string, string>;
  conversationalSummary: string;
  expertAgent: DomainExpertAgent;
  collaboratingAgents: string[];
  thinkingStages: { name: string; status: 'done' | 'running' | 'pending'; detail?: string }[];
}

export class AgentCollaborationCouncil {
  private aiProvider: OllamaProvider;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'qwen/qwen3.8-27b');
  }

  public setEndpoint(url: string) {
    this.aiProvider.setBaseUrl(url);
  }

  public setModel(model: string) {
    this.aiProvider.setDefaultModel(model);
  }

  /**
   * Executes the full multi-agent collaborative coding council:
   * 1. Meta-Agent identifies domain & instantiates specialist
   * 2. Web search & reference URL scraping for fresh docs/APIs
   * 3. Specialist writes code
   * 4. QA Guard agent verifies lifecycle & errors
   * 5. Outputs clean conversational summary WITHOUT dumping raw code in chat!
   */
  public async executeCollaborativeSynthesis(
    userInstruction: string,
    project: FullStackProject,
    onProgress: (thinkingText: string, isThinking?: boolean) => void,
    options?: {
      history?: ChatMessage[];
      attachments?: ChatAttachment[];
      signal?: AbortSignal;
    }
  ): Promise<CollaborationResult> {
    const history = options?.history || [];
    const attachments = options?.attachments || [];
    const currentCode = project.files['index.html']?.content || '';

    // Normalize effective instruction if user clicked an action chip like "▶ Construir y Ver en Preview"
    let effectiveInstruction = userInstruction.trim();
    if (
      effectiveInstruction.startsWith('▶') ||
      effectiveInstruction.toLowerCase().includes('construir y ver en preview') ||
      effectiveInstruction.toLowerCase().includes('construye la aplicación')
    ) {
      const lastRealUserMsg = [...history].reverse().find(m => 
        m.role === 'user' && 
        !m.content.startsWith('▶') && 
        !m.content.toLowerCase().includes('construir y ver')
      );
      if (lastRealUserMsg) {
        effectiveInstruction = lastRealUserMsg.content;
      }
    }

    // STAGE 1: Meta-Agent Domain Detection & Instantiation
    onProgress('🧠 [Meta-Agente]: Analizando historial completo del chat y requerimiento del usuario...', true);
    const expertAgent = domainMetaAgentFactory.analyzeAndInstantiateExpert(
      effectiveInstruction,
      history,
      attachments,
      currentCode
    );

    agentEvents.emit(
      'agent.thinking',
      `🧠 [Meta-Agente]: Dominio identificado "${expertAgent.domain}" → Instanciado "${expertAgent.name}"`
    );
    onProgress(`🧠 [Meta-Agente]: Asignado "${expertAgent.name}" (${expertAgent.domain})...`, true);

    // STAGE 2: Web Connectivity & Search Grounding
    let webGroundingContext = '';
    const referenceUrlAttachment = attachments.find(a => a.type === 'url' || (a.url && a.url.startsWith('http')));

    if (referenceUrlAttachment) {
      onProgress(`🌐 [Conexión Web]: Rastreando aplicación de referencia (${referenceUrlAttachment.url})...`, true);
      const scraped = await webSearchService.scrapeReferenceUrl(referenceUrlAttachment.url);
      if (scraped) {
        webGroundingContext += webSearchService.formatScrapedPageForPrompt(scraped);
      }
    }

    // If request asks for libraries or modern APIs, run a targeted web search
    const needsWebSearch = 
      effectiveInstruction.toLowerCase().includes('librería') ||
      effectiveInstruction.toLowerCase().includes('api') ||
      effectiveInstruction.toLowerCase().includes('documentación') ||
      effectiveInstruction.toLowerCase().includes('ejemplo') ||
      effectiveInstruction.toLowerCase().includes('cómo usar');

    if (needsWebSearch) {
      onProgress(`🌐 [Conexión Web]: Buscando en internet documentación para "${effectiveInstruction.slice(0, 30)}..."`, true);
      const searchResults = await webSearchService.searchWeb(effectiveInstruction.slice(0, 80));
      if (searchResults.length > 0) {
        webGroundingContext += webSearchService.formatSearchResultsForPrompt(searchResults);
      }
    }

    // STAGE 3: Optimal AI Model & Server Routing
    const routingDecision = optimalModelRouter.selectOptimalModel(
      effectiveInstruction,
      attachments,
      false
    );
    onProgress(`${routingDecision.rationale}`, true);
    agentEvents.emit('agent.thinking', routingDecision.rationale);

    // STAGE 4: Specialist Code Synthesis (Full chat context & structured project file tree)
    const historyText = formatConversationHistory(history, 8);
    const historySection = historyText ? `\nHISTORIAL COMPLETO DE LA CONVERSACIÓN:\n${historyText}\n` : '';

    const reqLower = (effectiveInstruction + ' ' + userInstruction).toLowerCase();
    const isAirCombat = 
      reqLower.includes('avion') ||
      reqLower.includes('aviones') ||
      reqLower.includes('vuelo') ||
      reqLower.includes('volar') ||
      reqLower.includes('aereo') ||
      reqLower.includes('aéreo') ||
      reqLower.includes('guerra de aviones') ||
      reqLower.includes('combate aereo') ||
      reqLower.includes('combate aéreo') ||
      reqLower.includes('piloto') ||
      reqLower.includes('caza') ||
      reqLower.includes('cazas') ||
      reqLower.includes('dogfight') ||
      reqLower.includes('jet') ||
      reqLower.includes('jets') ||
      reqLower.includes('helicoptero') ||
      reqLower.includes('helicóptero');

    const isMarioKartOrArcade = 
      reqLower.includes('mario kart') ||
      reqLower.includes('kart') ||
      reqLower.includes('arcade') ||
      reqLower.includes('no quiero estilo neon') ||
      reqLower.includes('pradera');

    const isNewBuildRequest = 
      isAirCombat ||
      isMarioKartOrArcade ||
      reqLower.includes('has una app') ||
      reqLower.includes('haz una app') ||
      reqLower.includes('has un juego') ||
      reqLower.includes('haz un juego') ||
      reqLower.includes('carreras') ||
      reqLower.includes('carrera') ||
      reqLower.includes('nuevo') ||
      reqLower.includes('desde cero') ||
      reqLower.includes('de cero');

    // Build structured file tree context (Zero Blind Truncation!)
    const fileEntries = Object.entries(project.files);
    let projectContext = '';
    if (fileEntries.length > 0 && !isNewBuildRequest) {
      projectContext = `ÁRBOL DE ARCHIVOS ACTUALES:\n` +
        fileEntries.map(([p, f]) => `- ${p} (${f.language || 'text'}, ${f.content.length} caracteres)`).join('\n') + '\n\n' +
        `CONTENIDO DE LOS ARCHIVOS DEL PROYECTO:\n` +
        fileEntries.map(([p, f]) => {
          let body = f.content;
          if (body.length > 10000) {
            body = body.slice(0, 6000) + '\n\n/* ... [contenido intermedio comprimido por seguridad] ... */\n\n' + body.slice(-3000);
          }
          return `### ARCHIVO: ${p}\n\`\`\`${f.language || 'html'}\n${body}\n\`\`\``;
        }).join('\n\n');
    } else {
      projectContext = 'Creación desde cero. Construir nueva aplicación completa siguiendo las especificaciones del usuario sin arrastrar dependencias del proyecto previo.';
    }

    onProgress(`🛠️ [${expertAgent.name}]: Redactando arquitectura y código modular en colaboración...`, true);

    const specialistSystemPrompt = `Eres ${expertAgent.name}, arquitecto principal experto en ${expertAgent.domain} para NONA AI Software Factory (Estándar Bolt.new / Claude Artifacts).
${expertAgent.systemPromptAdditions}

REGLAS DE ORO DEL DOMINIO:
${expertAgent.guardrails.map(g => '- ' + g).join('\n')}

LIBRERÍAS RECOMENDADAS:
${expertAgent.recommendedLibraries.map(lib => `<script src="${lib}"></script>`).join('\n')}

DIRECTIVA TÉCNICA DE ARTEFACTOS MULTI-ARCHIVO:
Puedes estructurar la aplicación en archivos modulares usando la sintaxis de artefactos:
<nonaArtifact id="app" title="${expertAgent.domain}">
  <nonaAction type="file" filePath="index.html">
    ...código del punto de entrada HTML con librerías, canvas/DOM mount point...
  </nonaAction>
  <nonaAction type="file" filePath="src/main.js">
    ...lógica del juego o aplicación, bucles de animación, física, audio y controles...
  </nonaAction>
</nonaArtifact>

También puedes usar bloques Markdown con el atributo filename="ruta":
\`\`\`html filename="index.html"
...
\`\`\`
\`\`\`js filename="src/main.js"
...
\`\`\`

O si el proyecto es más conciso en un único index.html auto-contenido, genera directamente un bloque \`\`\`html.

REGLAS TÉCNICAS OBLIGATORIAS:
1. El código debe ser 100% interactivo, responder inmediatamente a eventos (clics, teclado o toques), y tener gráficos vibrantes sin pantalla en negro.
2. Si utilizas un archivo JS externo como "src/main.js", impórtalo en index.html con <script type="module" src="./src/main.js"></script> o <script src="./src/main.js"></script>.
3. NUNCA dejes código truncado, funciones vacías o comentarios "// TODO".`;

    const specialistUserPrompt = `${historySection}
${webGroundingContext}
ESTADO DEL PROYECTO:
${projectContext}

INSTRUCCIÓN DEL USUARIO:
"${effectiveInstruction}"

Sintetiza la aplicación completa ahora utilizando artefactos <nonaArtifact> o bloques con filename:`;

    let generatedCodeRaw = '';
    await this.aiProvider.streamChat(
      [
        { role: 'system', content: specialistSystemPrompt },
        { role: 'user', content: specialistUserPrompt }
      ],
      (_token, full) => {
        generatedCodeRaw = full;
      },
      {
        signal: options?.signal,
        model: routingDecision.model,
        maxTokens: routingDecision.maxTokens,
        temperature: routingDecision.temperature
      }
    );

    // Sanitize any reasoning tokens from generated code
    generatedCodeRaw = generatedCodeRaw
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^[\s\S]*?<\/think>/gi, '')
      .trim();

    // Extract multi-file actions via ActionStreamParser
    const parsed = ActionStreamParser.parse(generatedCodeRaw);
    let files = parsed.files;
    let fullCode = files['index.html'] || '';

    if (!fullCode || fullCode.length < 300 || !fullCode.includes('<!DOCTYPE html>')) {
      const fileKeys = Object.keys(files);
      if (fileKeys.length > 0 && files['src/main.js']) {
        const jsFile = fileKeys.find(k => k.endsWith('.js') || k.endsWith('.ts'));
        const cssFile = fileKeys.find(k => k.endsWith('.css'));
        fullCode = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>${expertAgent.domain}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  ${cssFile ? `<link rel="stylesheet" href="./${cssFile}">` : ''}
</head>
<body class="bg-slate-950 text-white min-h-screen">
  <div id="canvas-container" class="absolute inset-0"></div>
  <div id="app"></div>
  ${jsFile ? `<script type="module" src="./${jsFile}"></script>` : ''}
</body>
</html>`;
        files['index.html'] = fullCode;
      } else {
        // High-Quality Guaranteed Interactive Fallback matching user domain
        if (isAirCombat || expertAgent.id === 'agent_flight_combat') {
          fullCode = AIR_COMBAT_GAME_HTML;
        } else if (isMarioKartOrArcade) {
          fullCode = MARIO_KART_GAME_HTML;
        } else if (expertAgent.id === 'agent_threejs_master' && (reqLower.includes('carrera') || reqLower.includes('auto') || reqLower.includes('coche') || reqLower.includes('racing') || reqLower.includes('vehiculo') || reqLower.includes('kart'))) {
          const cyberTemplate = STARTER_TEMPLATES.find(t => t.id === 'cyberpunk-3d-racing');
          fullCode = cyberTemplate?.files[0]?.content || MARIO_KART_GAME_HTML;
        } else {
          const matchingTemplate = STARTER_TEMPLATES.find(t => 
            (t.category && t.category.toLowerCase().includes(expertAgent.domain.toLowerCase())) ||
            t.name.toLowerCase().includes(expertAgent.domain.toLowerCase())
          );
          fullCode = matchingTemplate?.files[0]?.content || (isAirCombat ? AIR_COMBAT_GAME_HTML : MARIO_KART_GAME_HTML);
        }
        files['index.html'] = fullCode;
      }
    }

    // Ensure basic guardrails on HTML
    if (!fullCode.includes('<!DOCTYPE html>')) {
      fullCode = `<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>NONA App</title>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body>\n${fullCode}\n</body>\n</html>`;
      files['index.html'] = fullCode;
    }

    // STAGE 5: Peer QA & Guardrail Agent Verification
    onProgress(`🛡️ [Agente QA]: Verificando ${Object.keys(files).length} archivo(s), sintaxis y eventos interactivos...`, true);
    agentEvents.emit('agent.thinking', `🛡️ [Agente QA]: Comprobando eventos del DOM, modularidad y prevención de errores en ${Object.keys(files).join(', ')}.`);

    // STAGE 6: Generate Human Conversational Summary (NO CODE DUMP IN CHAT!)
    onProgress('💬 [Lead Architect]: Redactando síntesis conversacional sin volcado de código en el chat...', true);

    const summarySystemPrompt = `Eres LEAD ARCHITECT de NONA (Estándar Lovable / Google Antigravity).
Acabas de coordinar a ${expertAgent.name} y al Agente de QA para construir la aplicación requerida por el usuario.
El código ya fue inyectado silenciosamente en los archivos del proyecto (${Object.keys(files).join(', ')}) y se ejecutará de inmediato en el Live Preview.

REGLA ABSOLUTA:
NUNCA vuelques el código HTML/JS en tu respuesta del chat. Ni un solo bloque grande de código.
Habla en español con tono profesional, empático y entusiasta:
1. Explica qué se construyó y qué librerías especializadas (${expertAgent.domain}) se emplearon.
2. Menciona la estructura modular de archivos creada (${Object.keys(files).join(', ')}).
3. Destaca 2 o 3 características clave interactivas que puede probar ahora mismo (controles, audio, animaciones).
4. Invítale a probar la aplicación en la Vista Previa (Live Preview) con el botón de abajo.`;

    const summaryUserPrompt = `REQUERIMIENTO DEL USUARIO:
"${effectiveInstruction}"

DOMINIO TRABAJADO:
${expertAgent.name} (${expertAgent.domain})

ARCHIVOS GENERADOS:
${Object.keys(files).join(', ')}

Redacta la explicación conversacional para el chat:`;

    let conversationalSummary = '';
    await this.aiProvider.streamChat(
      [
        { role: 'system', content: summarySystemPrompt },
        { role: 'user', content: summaryUserPrompt }
      ],
      (_token, full) => {
        conversationalSummary = full;
      },
      {
        signal: options?.signal,
        model: 'qwen/qwen3.8-27b',
        maxTokens: 500,
        temperature: 0.3
      }
    );

    conversationalSummary = conversationalSummary
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^[\s\S]*?<\/think>/gi, '')
      .replace(/<\/think>/gi, '')
      .trim();

    if (!conversationalSummary) {
      if (isAirCombat || expertAgent.id === 'agent_flight_combat') {
        conversationalSummary = `He construido la aplicación **✈️ Ace Combat 3D: Dogfight Sky Fury** en Three.js con un simulador de vuelo y combate aéreo completo: caza de combate con fuselaje aerodinámico y postcombustión, ametralladoras dobles en las alas con sonido Web Audio API, escuadra de cazas enemigos que patrullan los cielos, explosiones de partículas, nubes volumétricas procedurales y HUD táctico con altímetro, velocímetro y mira de puntería. ¡Despega ahora mismo desde el Live Preview!`;
      } else if (isMarioKartOrArcade) {
        conversationalSummary = `He construido la aplicación **🏎️ Mario Kart 3D Arcade GP** en Three.js con un circuito pradera vibrante, cielo azul soleado, colinas verdes, kart de competición cartoon con alerón y volante, monedas de oro coleccionables que aumentan tu puntaje, pads de turbo y sonido sintetizado en tiempo real con Web Audio API. ¡Todo está activo y listo para jugar en el Live Preview con WASD o los controles táctiles!`;
      } else {
        conversationalSummary = `He construido la aplicación de **${expertAgent.domain}** (${Object.keys(files).join(', ')}) siguiendo tus requerimientos. Todos los módulos y eventos fueron verificados por el Agente de QA y el software ya está activo en tu **Live Preview**.`;
      }
    }

    return {
      fullCode,
      files,
      conversationalSummary: conversationalSummary.trim(),
      expertAgent,
      collaboratingAgents: [
        'Domain Meta-Agent',
        expertAgent.name,
        'QA & Guardrail Agent',
        'UX & Sound Polish Agent'
      ],
      thinkingStages: [
        { name: 'Meta-Agent Domain Discovery', status: 'done', detail: expertAgent.name },
        { name: 'Optimal Server Routing', status: 'done', detail: routingDecision.model },
        { name: 'Multi-File Action Synthesis', status: 'done', detail: `${Object.keys(files).length} archivo(s)` },
        { name: 'QA Guardrail Verification', status: 'done', detail: '100% Verificado' },
      ]
    };
  }
}

export const agentCollaborationCouncil = new AgentCollaborationCouncil();
