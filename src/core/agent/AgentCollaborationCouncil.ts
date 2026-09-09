import type { ChatMessage, ChatAttachment } from '../../types';
import type { FullStackProject } from '../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { agentEvents } from './AgentEvents';
import { domainMetaAgentFactory, type DomainExpertAgent } from './DomainMetaAgentFactory';
import { optimalModelRouter } from './OptimalModelRouter';
import { webSearchService } from '../services/WebSearchService';
import { formatConversationHistory } from './historyUtils';
import { ActionStreamParser } from '../parser/ActionStreamParser';
import { ProjectJSONParser } from '../parser/ProjectJSONParser';
import { qaTesterAgent } from './QATesterAgent';

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

    const reqLower = (effectiveInstruction + ' ' + userInstruction).toLowerCase();
    const isNewAppOrGameCreation = 
      /^(?:puedes\s+)?(?:hacer|crear|haz|has|construir|desarrollar|armar|programar|genera|generar)\s+(?:un|una)\s+(?:juego|app|aplicaci[oó]n|videojuego|landing|dashboard|sistema|tienda|clon|herramienta)/i.test(reqLower) &&
      !/(?:dentro\s+de|en\s+el|en\s+la|al\s+juego|a\s+la\s+app|este\s+juego|esta\s+app)/i.test(reqLower);

    const isNewBuildRequest = 
      isNewAppOrGameCreation ||
      reqLower.includes('has una app') ||
      reqLower.includes('haz una app') ||
      reqLower.includes('has un juego') ||
      reqLower.includes('haz un juego') ||
      reqLower.includes('nuevo') ||
      reqLower.includes('desde cero') ||
      reqLower.includes('de cero') ||
      currentCode.length === 0;

    // STAGE 3: Optimal AI Model & Server Routing
    const routingDecision = optimalModelRouter.selectOptimalModel(
      effectiveInstruction,
      attachments,
      false,
      undefined,
      {
        history,
        isEdit: !isNewBuildRequest && Object.keys(project.files).length > 2,
        hasExistingProject: Object.keys(project.files).length > 2,
        projectFileCount: Object.keys(project.files).length,
        existingFileNames: Object.keys(project.files)
      }
    );
    onProgress(`${routingDecision.rationale}`, true);
    agentEvents.emit('agent.thinking', routingDecision.rationale);

    // STAGE 4: Specialist Code Synthesis (Full chat context & structured project file tree)
    const historyText = formatConversationHistory(history, 8);
    const historySection = historyText ? `\nHISTORIAL COMPLETO DE LA CONVERSACIÓN:\n${historyText}\n` : '';

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

    const specialistSystemPrompt = `Eres ${expertAgent.name}, arquitecto de software senior para NONA (Estándar Lovable / bolt.new / v0).
Tu objetivo es generar una aplicación COMPLETA, PROFESIONAL, MULTI-ARCHIVO Y 100% FUNCIONAL.

${expertAgent.systemPromptAdditions}

REGLAS DE ORO DEL DOMINIO:
${expertAgent.guardrails.map(g => '- ' + g).join('\n')}

LIBRERÍAS DISPONIBLES:
${expertAgent.recommendedLibraries.map(lib => `- ${lib}`).join('\n')}
- @supabase/supabase-js (Para BaaS, base de datos y autenticación)
- lucide-react (Iconos vectoriales limpios)
- clsx & tailwind-merge (Utilidades de estilos dinámicos)

ARQUITECTURA DE CARPETAS CONVENCIONAL (OBLIGATORIA):
Organiza el código de forma limpia y predecible:
- "src/components/": Componentes UI reutilizables (nombres en PascalCase, ej: Navbar.tsx, Hero.tsx, UserCard.tsx).
- "src/pages/": Vistas o pantallas completas si el proyecto tiene múltiples pantallas/rutas (ej: Home.tsx, Dashboard.tsx, Settings.tsx).
- "src/lib/": Utilidades compartidas (ej: src/lib/utils.ts) y clientes de APIs externas / BaaS.
- "src/types/": Definiciones de tipos e interfaces TypeScript (ej: src/types/index.ts).
- "src/App.tsx": Componente raíz que orquesta vistas, navegación y estado global.
- "src/index.css" e "index.html": Estilos base y contenedor HTML.

INTEGRACIÓN BACKEND-AS-A-SERVICE (SUPABASE):
Si el usuario solicita persistencia, base de datos, guardar usuarios, autenticación o comentarios:
- NO improvises un servidor Express/Node propio dentro de NONA.
- Integra Supabase creando "src/lib/supabase.ts" importando { createClient } de '@supabase/supabase-js'.
- Utiliza variables de entorno seguras con fallback mock:
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://mock-project.supabase.co';
  const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'mock-anon-key-nona';
- Proporciona en comentarios SQL al inicio de "src/lib/supabase.ts" la sentencia DDL para crear las tablas necesarias (ej: CREATE TABLE ...).

CONSISTENCIA DE DISEÑO Y TAILWIND:
- Utiliza una paleta moderna y cohesiva: fondos oscuros premium (bg-slate-950, bg-slate-900, bordes border-slate-800/80), tipografía nítida con contraste adecuado (text-slate-100, text-slate-400), y acentos vibrantes bien definidos (indigo-500/600, violet-500 o emerald-500).
- Emplea iconos de 'lucide-react' para enriquecer botones y menús.

CONTRATO OBLIGATORIO DE SALIDA (JSON ESTRUCTURADO):
Debes responder ÚNICAMENTE con un objeto JSON válido (puedes encerrarlo en un bloque \`\`\`json ... \`\`\`) con la siguiente estructura exacta:
{
  "files": [
    { "path": "src/App.tsx", "content": "..." },
    { "path": "src/components/MiComponente.tsx", "content": "..." },
    { "path": "src/lib/utils.ts", "content": "..." },
    { "path": "src/index.css", "content": "..." },
    { "path": "index.html", "content": "..." }
  ],
  "explanation": "Resumen conciso y claro en español de qué se construyó y qué características interactivas están listas para probar."
}

REGLAS TÉCNICAS ESTRICTAS:
1. El campo "files" debe ser un array que contenga TODOS los archivos necesarios para ejecutar la aplicación de inmediato.
2. Cada archivo debe tener su ruta ("path") y su código fuente ("content") COMPLETO. Prohibido código truncado, funciones vacías o comentarios "// TODO".
3. Incluye un punto de entrada ejecutable (ej. "index.html" y archivos "src/..."), con Tailwind CSS, librerías requeridas y scripts interactivos.
4. El JSON debe ser 100% válido y parseable: escapa correctamente comillas dobles y caracteres de escape dentro de "content".
5. NO agregues texto conversacional antes ni después del bloque JSON. Todo tu resumen explicativo para el usuario debe ir dentro del campo "explanation".`;

    const maxRetries = 2;
    let attempt = 0;
    let files: Record<string, string> = {};
    let fullCode = '';
    let conversationalSummary = '';
    let lastFailureReason = '';
    let generationSucceeded = false;

    while (attempt <= maxRetries && !generationSucceeded) {
      const isRetry = attempt > 0;
      if (isRetry) {
        onProgress(`🔄 [Reintento ${attempt}/${maxRetries}]: ${lastFailureReason}. Solicitando corrección técnica a ${expertAgent.name}...`, true);
        agentEvents.emit('agent.thinking', `🔄 Reintento de generación #${attempt}: ${lastFailureReason}`);
      } else {
        onProgress(`🛠️ [${expertAgent.name}]: Generando arquitectura de archivos y código fuente estructurado...`, true);
      }

      let attemptUserPrompt = `${historySection}
${webGroundingContext}
ESTADO DEL PROYECTO:
${projectContext}

INSTRUCCIÓN DEL USUARIO:
"${effectiveInstruction}"`;

      if (isRetry) {
        attemptUserPrompt += `\n\n[CORRECCIÓN TÉCNICA OBLIGATORIA - INTENTO ${attempt + 1}/${maxRetries + 1}]:
El intento anterior no cumplió con el contrato estructurado: ${lastFailureReason}.
Por favor devuelve EXCLUSIVAMENTE el objeto JSON válido con la clave "files" (array de { "path": string, "content": string }) y "explanation" (string). Asegúrate de incluir código 100% interactivo y funcional, sin omitir ningún archivo.`;
      } else {
        attemptUserPrompt += `\n\nGenera la aplicación completa ahora respondiendo estrictamente en el formato JSON especificado:`;
      }

      let generatedCodeRaw = '';
      await this.aiProvider.streamChat(
        [
          { role: 'system', content: specialistSystemPrompt },
          { role: 'user', content: attemptUserPrompt }
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

      // Sanitize reasoning tokens
      generatedCodeRaw = generatedCodeRaw
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/^[\s\S]*?<\/think>/gi, '')
        .trim();

      // 1. Primary verification: Parse strictly using ProjectJSONParser
      let candidateFiles: Record<string, string> = {};
      let candidateSummary = '';

      const parseResult = ProjectJSONParser.parseFullBuild(generatedCodeRaw);
      if (parseResult.success) {
        for (const fileEntry of parseResult.contract.files) {
          const normPath = ProjectJSONParser.normalizePath(fileEntry.path);
          candidateFiles[normPath] = fileEntry.content;
        }
        candidateSummary = parseResult.contract.explanation;
      } else {
        // 2. Secondary resilient check: ActionStreamParser for XML / markdown blocks
        const fallbackParsed = ActionStreamParser.parse(generatedCodeRaw);
        if (Object.keys(fallbackParsed.files).length > 0) {
          candidateFiles = fallbackParsed.files;
          candidateSummary = fallbackParsed.conversationalSummary || `He generado la aplicación con ${Object.keys(candidateFiles).length} archivo(s) modulares.`;
        } else {
          lastFailureReason = parseResult.error;
          attempt++;
          continue;
        }
      }

      // 3. Deep static & semantic project validation (QA Tester Agent)
      const qaValidation = qaTesterAgent.validateTypeScriptProject(candidateFiles);
      if (!qaValidation.valid) {
        lastFailureReason = qaValidation.errors.join('. ');
        attempt++;
        continue;
      }

      // Verification passed completely
      files = candidateFiles;
      fullCode = files['index.html'] || files['src/App.tsx'] || Object.values(files)[0] || '';
      conversationalSummary = candidateSummary;
      generationSucceeded = true;
      break;
    }

    // If generation failed after all retries, return an honest error (NEVER substitute unrequested templates!)
    if (!generationSucceeded) {
      onProgress(`⚠️ No fue posible generar la aplicación tras ${attempt} intentos.`, false);
      agentEvents.emit('agent.error', `Falló la síntesis de código tras ${attempt} intentos: ${lastFailureReason}`);

      const failureNotice = `⚠️ **No fue posible generar la aplicación solicitada** tras ${attempt} intentos técnicos con ${routingDecision.model}.

**Causa detectada:** ${lastFailureReason}

Por favor, intenta reformular tu solicitud o especificar con más detalle la estructura o componentes deseados.`;

      return {
        fullCode: '',
        files: {},
        conversationalSummary: failureNotice,
        expertAgent,
        collaboratingAgents: [expertAgent.name, 'QA Guard'],
        thinkingStages: [
          { name: 'Planificación de arquitectura y archivos', status: 'done', detail: expertAgent.name },
          { name: 'Generación de código multi-archivo', status: 'pending', detail: `Fallo: ${lastFailureReason}` },
          { name: 'Validación de contrato y esquema', status: 'pending', detail: 'Cancelado por fallo' },
        ]
      };
    }

    // Ensure basic index.html wrapper if only modular JS/TS exists
    if (!files['index.html']) {
      const mainScript = Object.keys(files).find(k => k.endsWith('.js') || k.endsWith('.ts') || k.endsWith('.tsx'));
      const mainCss = Object.keys(files).find(k => k.endsWith('.css'));
      files['index.html'] = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${expertAgent.domain}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${mainCss ? `<link rel="stylesheet" href="./${mainCss}">` : ''}
</head>
<body class="bg-slate-950 text-white min-h-screen">
  <div id="root"></div>
  <div id="app"></div>
  ${mainScript ? `<script type="module" src="./${mainScript}"></script>` : ''}
</body>
</html>`;
      fullCode = files['index.html'];
    }

    onProgress(`🛡️ [Validación]: Verificando ${Object.keys(files).length} archivo(s) generados...`, true);
    agentEvents.emit('agent.thinking', `🛡️ [Validación]: Comprobando estructura modular de ${Object.keys(files).join(', ')}.`);

    if (!conversationalSummary || conversationalSummary.length < 20) {
      conversationalSummary = `He construido la aplicación de **${expertAgent.domain}** (${Object.keys(files).join(', ')}) siguiendo tus requerimientos. El código está sincronizado y listo para interactuar en la Vista Previa.`;
    }

    return {
      fullCode,
      files,
      conversationalSummary: conversationalSummary.trim(),
      expertAgent,
      collaboratingAgents: [expertAgent.name, 'QA Guard'],
      thinkingStages: [
        { name: 'Planificación de arquitectura y archivos', status: 'done', detail: expertAgent.name },
        { name: 'Generación de código multi-archivo', status: 'done', detail: `${Object.keys(files).length} archivo(s)` },
        { name: 'Validación de contrato y esquema', status: 'done', detail: '100% Conforme' },
      ]
    };
  }
}

export const agentCollaborationCouncil = new AgentCollaborationCouncil();
