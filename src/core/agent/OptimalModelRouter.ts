import type { ChatAttachment, ChatMessage } from '../../types';

export interface ModelRoutingDecision {
  server: 'groq' | 'openrouter' | 'ollama';
  model: string;
  rationale: string;
  maxTokens: number;
  temperature: number;
  complexityScore?: number;
  estimatedAffectedFiles?: number;
  requirementsCount?: number;
  routeCategory?: 'multimodal' | 'incremental_edit' | 'standard_build' | 'complex_build' | 'custom_ollama';
}

export interface ModelRoutingContext {
  history?: ChatMessage[];
  isEdit?: boolean;
  hasExistingProject?: boolean;
  projectFileCount?: number;
  existingFileNames?: string[];
}

/**
 * ===================================================================================================
 * TABLA DE DECISIÓN FINAL DE ENRUTAMIENTO DE MODELOS (NONA — FASE 3: SMART ROUTING)
 * ===================================================================================================
 *
 * | # | Condición / Escenario                  | Señales Clave Identificadas                       | Servidor   | Modelo                      | maxTokens | Temp | Rationale Técnico                                                                             |
 * |---|----------------------------------------|---------------------------------------------------|------------|-----------------------------|-----------|------|-----------------------------------------------------------------------------------------------|
 * | 1 | Multimodal / Capturas / UI Mockup      | `attachments.some(a => image/video)`              | openrouter | google/gemini-2.5-flash     | 4000      | 0.20 | Visión computacional de alta resolución y baja latencia para transformar diseños a código.   |
 * | 2 | Ollama Local Privado                   | `hasCustomOllama && requestedModel === 'ollama'`  | ollama     | qwen2.5-coder:7b            | 4000      | 0.20 | Ejecución 100% en máquina local del desarrollador sin transmitir datos a la nube.            |
 * | 3 | Override Explícito del Usuario         | `requestedModel && != 'default' && != 'auto'`     | variable   | requestedModel              | 8192      | 0.15 | Respeto determinista a la selección explícita del usuario desde la barra de modelos.         |
 * | 4 | Edición Incremental Chica              | `hasExistingProject && affectedFiles <= 2 &&`     | groq       | llama-3.3-70b-versatile     | 4000      | 0.10 | Modificación puntual y acotada (color, texto, botón, fix). Máxima velocidad (~450 t/s).      |
 * |   | (Color, botón, título, fix puntual)    | `requirementsCount <= 2 && promptLength < 250`    |            |                             |           |      |                                                                                               |
 * | 5 | Edición Multi-Archivo / Refactor       | `hasExistingProject && (affectedFiles > 2 ||`     | openrouter | deepseek/deepseek-chat      | 8192      | 0.15 | Modificación con impacto en múltiples componentes interdependientes o lógica de estado/API.   |
 * |   | (Nuevas pantallas, rutas, store)       | `requirementsCount > 2 || promptLength >= 250)`  |            |                             |           |      |                                                                                               |
 * | 6 | Generación Inicial / App Nueva         | `!hasExistingProject || isExplicitNewProject ||`  | openrouter | deepseek/deepseek-chat      | 12000     | 0.15 | Construcción completa multi-archivo React+Vite+TS con ventana amplia (8,000 - 16,000 tokens).|
 * |   | (Proyecto desde cero, varias pantallas)| `requirementsCount >= 3`                          |            |                             |           |      |                                                                                               |
 * ===================================================================================================
 */

export class OptimalModelRouter {
  /**
   * Estima la cantidad de archivos probablemente afectados según la semántica
   * del pedido del usuario y los archivos del proyecto existente.
   */
  public static estimateAffectedFiles(instruction: string, context?: ModelRoutingContext): number {
    const lower = instruction.toLowerCase().trim();

    // 1. Cambios cosméticos o de estilo ultra-acotados -> 1 archivo
    const isCosmeticOrMinor = /(color|fondo|bot[oó]n|texto|t[ií]tulo|padding|margin|espaciado|borde|icono|icon|placeholder|hover|fuente|centrar|ocultar|mostrar|alineaci[oó]n)/i.test(lower);
    const hasBroadStructuralScope = /(pantalla|vista|p[aá]gina|ruta|route|navegaci[oó]n|auth|login|registro|database|base de datos|supabase|store|context|carrito|dashboard)/i.test(lower);

    if (isCosmeticOrMinor && !hasBroadStructuralScope && lower.length < 180) {
      return 1;
    }

    // 2. Modificaciones de componente local -> 1 a 2 archivos
    const isLocalComponent = /(contador|modal|dialog|toast|alerta|spinner|toggle|tooltip|dropdown|input|formulario|tabla)/i.test(lower);
    if (isLocalComponent && !hasBroadStructuralScope && lower.length < 250) {
      return 2;
    }

    // 3. Estructuras multi-pantalla, módulos o nuevas vistas -> 3 a 6 archivos
    let affectedCount = 2;
    if (/(pantalla|vista|p[aá]gina|tabs)/i.test(lower)) affectedCount += 2;
    if (/(navegaci[oó]n|rutas|routes)/i.test(lower)) affectedCount += 1;
    if (/(auth|login|registro|usuarios)/i.test(lower)) affectedCount += 1;
    if (/(database|base de datos|supabase|localstorage|persist)/i.test(lower)) affectedCount += 1;
    if (/(dashboard|panel|anal[ií]tica)/i.test(lower)) affectedCount += 1;

    // Si es un proyecto nuevo sin archivos previos, el impacto abarca todo el scaffold
    const hasExisting = context?.hasExistingProject ?? ((context?.projectFileCount || 0) > 1);
    if (!hasExisting) {
      return Math.max(4, affectedCount);
    }

    return affectedCount;
  }

  /**
   * Cuenta la cantidad de requisitos o funcionalidades distintas solicitadas en el prompt.
   */
  public static countDistinctRequirements(instruction: string): number {
    const raw = instruction.trim();
    if (!raw) return 1;

    let count = 0;

    // A. Conteo de oraciones o cláusulas estructuradas
    const sentences = raw.split(/[.;\n]+/).filter(s => s.trim().length > 8);
    count += Math.max(1, sentences.length);

    // B. Conteo de viñetas explícitas
    const bullets = raw.match(/^\s*[-*•\d+.]\s+/gm);
    if (bullets && bullets.length > 0) {
      count = Math.max(count, bullets.length);
    }

    // C. Conectores de funcionalidades adicionales
    const lower = raw.toLowerCase();
    const connectors = [
      'y además', 'y ademas', 'también', 'tambien', 'incluye', 'debe tener', 
      'con pantalla de', 'con soporte para', 'con sistema de', 'permite', 
      'y que tenga', 'por último', 'por ultimo', 'agrega una secci[oó]n'
    ];
    for (const c of connectors) {
      if (lower.includes(c)) count++;
    }

    return count;
  }

  /**
   * Enrutador inteligente basado en señales reales:
   * 1. Presencia de proyecto previo en la sesión.
   * 2. Cantidad de archivos probablemente afectados.
   * 3. Longitud y cantidad de requisitos distintos en el pedido.
   */
  public selectOptimalModel(
    userInstruction: string,
    attachments: ChatAttachment[] = [],
    hasCustomOllama: boolean = false,
    requestedModel?: string,
    context?: ModelRoutingContext
  ): ModelRoutingDecision {
    const instructionLower = userInstruction.toLowerCase().trim();
    const promptLength = instructionLower.length;
    const hasVisuals = attachments.some(a => a.type === 'image' || a.type === 'video');

    // ---------------------------------------------------------------------------------
    // CASO 1: Multimodal / Visión Computacional
    // ---------------------------------------------------------------------------------
    if (hasVisuals) {
      return {
        server: 'openrouter',
        model: 'google/gemini-2.5-flash',
        rationale: '⚡ Enrutado a Google Gemini 2.5 Flash por requerimiento de visión computacional y análisis multimodal.',
        maxTokens: 4000,
        temperature: 0.2,
        routeCategory: 'multimodal',
        complexityScore: 5,
        estimatedAffectedFiles: 3,
        requirementsCount: 1
      };
    }

    // ---------------------------------------------------------------------------------
    // CASO 2: Ollama Local Explícito
    // ---------------------------------------------------------------------------------
    if (hasCustomOllama && requestedModel === 'ollama') {
      return {
        server: 'ollama',
        model: 'qwen2.5-coder:7b',
        rationale: '🔒 Enrutado a servidor local Ollama para privacidad completa en máquina.',
        maxTokens: 4000,
        temperature: 0.2,
        routeCategory: 'custom_ollama',
        complexityScore: 3,
        estimatedAffectedFiles: 2,
        requirementsCount: 1
      };
    }

    // ---------------------------------------------------------------------------------
    // CASO 3: Selección Explícita de Modelo por el Usuario
    // ---------------------------------------------------------------------------------
    if (requestedModel && requestedModel !== 'default' && requestedModel !== 'auto') {
      const isGroqExclusive = requestedModel.startsWith('groq/') || 
                              requestedModel.includes('instant') || 
                              requestedModel.includes('llama') ||
                              requestedModel.includes('qwen');

      const resolvedModel = (requestedModel.includes('qwen') || requestedModel.includes('instant'))
        ? 'llama-3.3-70b-versatile'
        : requestedModel;

      return {
        server: isGroqExclusive ? 'groq' : 'openrouter',
        model: resolvedModel,
        rationale: `🎯 Enrutado al modelo específico seleccionado: ${resolvedModel}.`,
        maxTokens: isGroqExclusive ? 4000 : 8192,
        temperature: 0.15,
        routeCategory: 'complex_build',
        complexityScore: 5
      };
    }

    // ---------------------------------------------------------------------------------
    // ANÁLISIS DE SEÑALES REALES
    // ---------------------------------------------------------------------------------
    // Señal 1: Existencia de proyecto previo
    const hasExistingProject = context?.hasExistingProject ?? ((context?.projectFileCount || 0) > 1);

    // Señal 2: Solicitud explícita de reiniciar o empezar desde cero
    const isExplicitReset = /(nuevo proyecto|nueva app|nueva aplicaci[oó]n|desde cero|de cero|empezar de cero|borrar todo|reiniciar proyecto|haz otra app)/i.test(instructionLower);

    // Señal 3: Estimación de archivos afectados
    const estimatedAffectedFiles = OptimalModelRouter.estimateAffectedFiles(instructionLower, context);

    // Señal 4: Cantidad de requisitos y longitud
    const requirementsCount = OptimalModelRouter.countDistinctRequirements(instructionLower);

    // ---------------------------------------------------------------------------------
    // CASO 4: Edición Incremental Chica (Groq LPU Engine ~450 tokens/s)
    // Se activa cuando hay un proyecto existente, el pedido es puntual (color, botón, texto, fix),
    // afecta a 1-2 archivos y los requisitos son simples.
    // ---------------------------------------------------------------------------------
    const isSmallIncrementalEdit = 
      hasExistingProject && 
      !isExplicitReset && 
      estimatedAffectedFiles <= 2 &&
      requirementsCount <= 2 &&
      promptLength < 250;

    if (isSmallIncrementalEdit) {
      return {
        server: 'groq',
        model: 'llama-3.3-70b-versatile',
        rationale: '⚡ Enrutado a Groq LPU (Llama 3.3 70B Versatile) para iteración incremental rápida y económica (~450 tokens/s).',
        maxTokens: 4000,
        temperature: 0.10,
        routeCategory: 'incremental_edit',
        complexityScore: 1,
        estimatedAffectedFiles,
        requirementsCount
      };
    }

    // ---------------------------------------------------------------------------------
    // CASO 5: Edición Multi-Archivo / Refactor Mediano en Proyecto Existente
    // Cuando hay un proyecto pero se pide agregar múltiples pantallas, componentes o lógica profunda.
    // ---------------------------------------------------------------------------------
    const isMultiFileIncrementalEdit = 
      hasExistingProject && 
      !isExplicitReset && 
      (estimatedAffectedFiles > 2 || requirementsCount > 2 || promptLength >= 250);

    if (isMultiFileIncrementalEdit) {
      return {
        server: 'openrouter',
        model: 'deepseek/deepseek-chat',
        rationale: `🧠 Enrutado a OpenRouter (DeepSeek-V3, 8,192 tokens) por modificación compleja multi-archivo en proyecto existente (~${estimatedAffectedFiles} archivos afectados, ${requirementsCount} requisitos).`,
        maxTokens: 8192,
        temperature: 0.15,
        routeCategory: 'complex_build',
        complexityScore: 4,
        estimatedAffectedFiles,
        requirementsCount
      };
    }

    // ---------------------------------------------------------------------------------
    // CASO 6: Generación Inicial de Aplicación Nueva Completa (Máxima Capacidad)
    // Ventana de 12,000 tokens (rango extendido para generación multi-archivo completa).
    // ---------------------------------------------------------------------------------
    return {
      server: 'openrouter',
      model: 'deepseek/deepseek-chat',
      rationale: `🚀 Enrutado a OpenRouter (DeepSeek-V3) con ventana de 12,000 tokens para generación inicial completa multi-archivo React + Vite (~${estimatedAffectedFiles} archivos previstos).`,
      maxTokens: 12000,
      temperature: 0.15,
      routeCategory: 'complex_build',
      complexityScore: 5,
      estimatedAffectedFiles,
      requirementsCount
    };
  }
}

export const optimalModelRouter = new OptimalModelRouter();
