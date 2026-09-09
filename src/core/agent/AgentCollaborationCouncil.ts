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

/**
 * Detecta si el requerimiento del usuario implica persistencia, backend o base de datos (Supabase BaaS).
 */
export function detectBaaSRequirement(instruction: string): boolean {
  const lower = instruction.toLowerCase();
  return /(supabase|base de datos|database|persist|guardar en db|guardar usuarios|auth|autenticaci[oó]n|login|registro|signup)/i.test(lower);
}

/**
 * Extrae rutas de componentes importados relativos desde el código fuente (ej: src/App.tsx).
 */
export function extractRelativeComponentImports(code: string, fromDir: string = 'src'): string[] {
  const imports: string[] = [];
  const regex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"]((?:\.|\@\/)[^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(code)) !== null) {
    const spec = match[1];
    if (spec.endsWith('.css') || spec.endsWith('.svg') || spec.endsWith('.png') || spec.endsWith('.json')) {
      continue;
    }
    if (spec.includes('components') || spec.includes('pages') || spec.includes('views') || spec.startsWith('./')) {
      let resolved = spec;
      if (resolved.startsWith('@/')) {
        resolved = `src/${resolved.slice(2)}`;
      } else if (resolved.startsWith('./')) {
        resolved = `${fromDir}/${resolved.slice(2)}`;
      } else if (resolved.startsWith('../')) {
        resolved = resolved.replace(/^\.\.\//, '');
      }

      if (resolved.includes('lib/utils') || resolved.includes('lib/supabase')) {
        continue;
      }

      if (!resolved.endsWith('.tsx') && !resolved.endsWith('.ts') && !resolved.endsWith('.jsx') && !resolved.endsWith('.js')) {
        resolved += '.tsx';
      }
      imports.push(resolved);
    }
  }
  return Array.from(new Set(imports));
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

    // Paso 2: Detección condicional de BaaS Supabase y optimización de prompts
    const needsBaaS = detectBaaSRequirement(effectiveInstruction);
    const baasLibraryText = needsBaaS ? '- @supabase/supabase-js (Para BaaS, base de datos y autenticación)\n' : '';
    const baasPromptSection = needsBaaS ? `\n\nINTEGRACIÓN BACKEND-AS-A-SERVICE (SUPABASE):
- Importa { createClient } de '@supabase/supabase-js' en "src/lib/supabase.ts".
- Variables seguras con fallback mock:
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://mock-project.supabase.co';
  const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'mock-anon-key-nona';
- Proporciona en comentarios SQL al inicio de "src/lib/supabase.ts" el script DDL (CREATE TABLE ...).` : '';

    const specialistSystemPrompt = `Eres ${expertAgent.name}, arquitecto de software senior para NONA (Estándar Lovable / bolt.new / v0).
Tu objetivo es generar una aplicación COMPLETA, PROFESIONAL, MULTI-ARCHIVO Y 100% FUNCIONAL.

${expertAgent.systemPromptAdditions}

REGLAS DEL DOMINIO:
${expertAgent.guardrails.map(g => '- ' + g).join('\n')}

LIBRERÍAS DISPONIBLES:
${expertAgent.recommendedLibraries.map(lib => `- ${lib}`).join('\n')}
${baasLibraryText}- lucide-react (Iconos vectoriales)
- clsx & tailwind-merge (Estilos dinámicos)

ARQUITECTURA Y ESTILO:
- Estructura: "index.html", "src/App.tsx", "src/components/*.tsx", "src/lib/utils.ts", "src/index.css".
- Estilos Tailwind: Dark mode moderno (bg-slate-950/900, text-slate-100), bordes sutiles y acentos nítidos.${baasPromptSection}

CONTRATO OBLIGATORIO DE SALIDA (JSON ESTRUCTURADO):
Responde ÚNICAMENTE con un JSON válido con la siguiente estructura:
{
  "files": [
    { "path": "src/App.tsx", "content": "código completo" },
    { "path": "index.html", "content": "código completo" }
  ],
  "explanation": "Resumen técnico conciso en español de qué se construyó e interactividad lista para probar."
}

REGLAS TÉCNICAS:
1. El campo "files" debe contener código COMPLETO, ejecutable e interactivo. Prohibido código truncado o "// TODO".
2. JSON 100% válido: escapa comillas dobles y caracteres de escape dentro de "content". Cero texto conversacional fuera del JSON.`;

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
      } else if (isNewBuildRequest) {
        attemptUserPrompt += `\n\nFASE 1 (Scaffold y Raíz):
Genera la arquitectura base de la aplicación (al menos "index.html" y "src/App.tsx"). Diseña "src/App.tsx" completo con layout, navegación y componentes modulares importados desde "./components/NombreComponente".`;
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
          maxTokens: isNewBuildRequest ? 4000 : routingDecision.maxTokens,
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

      // =========================================================================
      // PASO 3: Generación Multi-Fase Secuencial para Proyectos Nuevos (FULL_BUILD)
      // =========================================================================
      if (isNewBuildRequest && candidateFiles['src/App.tsx']) {
        // Detectar si src/App.tsx importa componentes que aún no están en candidateFiles
        const importedComponents = extractRelativeComponentImports(candidateFiles['src/App.tsx'], 'src');
        const missingComponents = importedComponents.filter(c => !candidateFiles[c]);

        if (missingComponents.length > 0) {
          onProgress(`🧩 [${expertAgent.name}]: Sintetizando componentes modulares (Fase 2: ${missingComponents.map(p => p.split('/').pop()).join(', ')})...`, true);
          agentEvents.emit('agent.thinking', `🧩 Fase 2: Implementando componentes requeridos: ${missingComponents.join(', ')}`);

          const phase2Prompt = `FASE 2 (Componentes Reutilizables):
Implementa el código COMPLETO y 100% interactivo para los siguientes componentes requeridos por src/App.tsx:
${missingComponents.map(p => `- "${p}"`).join('\n')}

CONTEXTO DE src/App.tsx:
\`\`\`tsx
${candidateFiles['src/App.tsx']}
\`\`\`

Responde ÚNICAMENTE en formato JSON con la clave "files" (array de { "path": string, "content": string }) conteniendo estos componentes con sus tipos, interactividad y estilos Tailwind.`;

          try {
            let phase2Raw = '';
            await this.aiProvider.streamChat(
              [
                { role: 'system', content: specialistSystemPrompt },
                { role: 'user', content: phase2Prompt }
              ],
              (_tok, full) => { phase2Raw = full; },
              {
                signal: options?.signal,
                model: routingDecision.model,
                maxTokens: 4000,
                temperature: routingDecision.temperature
              }
            );

            phase2Raw = phase2Raw
              .replace(/<think>[\s\S]*?<\/think>/gi, '')
              .replace(/^[\s\S]*?<\/think>/gi, '')
              .trim();

            const p2Result = ProjectJSONParser.parseFullBuild(phase2Raw);
            if (p2Result.success) {
              for (const f of p2Result.contract.files) {
                candidateFiles[ProjectJSONParser.normalizePath(f.path)] = f.content;
              }
            } else {
              const fb2 = ActionStreamParser.parse(phase2Raw);
              for (const [p, c] of Object.entries(fb2.files)) {
                candidateFiles[ProjectJSONParser.normalizePath(p)] = c;
              }
            }
          } catch (e: any) {
            agentEvents.emit('agent.thinking', `Aviso en Fase 2: ${e.message}`);
          }
        }

        // Fase 3: Archivos de soporte y BaaS si faltan y se requieren
        const allCode = Object.values(candidateFiles).join('\n');
        const missingSupport: string[] = [];
        if (needsBaaS && !candidateFiles['src/lib/supabase.ts']) {
          missingSupport.push('src/lib/supabase.ts');
        }
        if (allCode.includes('lib/utils') && !candidateFiles['src/lib/utils.ts'] && !candidateFiles['src/lib/utils.js']) {
          missingSupport.push('src/lib/utils.ts');
        }

        if (missingSupport.length > 0) {
          onProgress(`🎨 [${expertAgent.name}]: Generando soporte y utilidades (Fase 3: ${missingSupport.map(p => p.split('/').pop()).join(', ')})...`, true);

          const phase3Prompt = `FASE 3 (Estilos y Utilidades):
Genera los siguientes archivos de soporte necesarios para completar el proyecto:
${missingSupport.map(p => `- "${p}"`).join('\n')}
${missingSupport.includes('src/lib/supabase.ts') ? '- "src/lib/supabase.ts": Cliente de Supabase (@supabase/supabase-js) con fallback seguro y DDL SQL en comentarios.' : ''}
${missingSupport.includes('src/lib/utils.ts') ? '- "src/lib/utils.ts": Utilidad cn() con clsx y tailwind-merge.' : ''}

Responde ÚNICAMENTE en formato JSON con la clave "files".`;

          try {
            let phase3Raw = '';
            await this.aiProvider.streamChat(
              [
                { role: 'system', content: specialistSystemPrompt },
                { role: 'user', content: phase3Prompt }
              ],
              (_tok, full) => { phase3Raw = full; },
              {
                signal: options?.signal,
                model: routingDecision.model,
                maxTokens: 3000,
                temperature: routingDecision.temperature
              }
            );

            phase3Raw = phase3Raw
              .replace(/<think>[\s\S]*?<\/think>/gi, '')
              .replace(/^[\s\S]*?<\/think>/gi, '')
              .trim();

            const p3Result = ProjectJSONParser.parseFullBuild(phase3Raw);
            if (p3Result.success) {
              for (const f of p3Result.contract.files) {
                candidateFiles[ProjectJSONParser.normalizePath(f.path)] = f.content;
              }
            } else {
              const fb3 = ActionStreamParser.parse(phase3Raw);
              for (const [p, c] of Object.entries(fb3.files)) {
                candidateFiles[ProjectJSONParser.normalizePath(p)] = c;
              }
            }
          } catch (e: any) {
            agentEvents.emit('agent.thinking', `Aviso en Fase 3: ${e.message}`);
          }
        }

        // Garantías locales de estilos y clientes sin llamadas adicionales a la IA
        if (!candidateFiles['src/index.css']) {
          candidateFiles['src/index.css'] = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody {\n  margin: 0;\n  font-family: system-ui, -apple-system, sans-serif;\n}`;
        }
        if (allCode.includes('lib/utils') && !candidateFiles['src/lib/utils.ts']) {
          candidateFiles['src/lib/utils.ts'] = `import { clsx, type ClassValue } from 'clsx';\nimport { twMerge } from 'tailwind-merge';\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n`;
        }
        if (needsBaaS && !candidateFiles['src/lib/supabase.ts']) {
          candidateFiles['src/lib/supabase.ts'] = `// DDL Supabase:\n// CREATE TABLE IF NOT EXISTS app_data (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), data jsonb, created_at timestamptz DEFAULT now());\n\nimport { createClient } from '@supabase/supabase-js';\n\nconst supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://mock-project.supabase.co';\nconst supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'mock-anon-key-nona';\n\nexport const supabase = createClient(supabaseUrl, supabaseAnonKey);\n`;
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
