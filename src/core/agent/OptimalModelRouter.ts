import type { ChatAttachment, ChatMessage } from '../../types';

export interface ModelRoutingDecision {
  server: 'groq' | 'openrouter' | 'ollama';
  model: string;
  rationale: string;
  maxTokens: number;
  temperature: number;
  complexityScore?: number;
  routeCategory?: 'multimodal' | 'incremental_edit' | 'standard_build' | 'complex_build' | 'custom_ollama';
}

export interface ModelRoutingContext {
  history?: ChatMessage[];
  isEdit?: boolean;
  projectFileCount?: number;
}

export class OptimalModelRouter {
  /**
   * Evaluates prompt complexity, attachments, feature count and build vs edit signals
   * to immediately route the request to the most capable AI model and server.
   *
   * Criteria:
   * - Incremental Edits / Small fixes: Groq LPU (Llama 3.3 70B Versatile, maxTokens 4000, ~450 tokens/s)
   * - Full App Creations (Standard): OpenRouter (DeepSeek-V3 / Qwen 2.5 Coder 32B, maxTokens 8192)
   * - Complex Architecture (3D, Physics, State, Auth, DB): OpenRouter (DeepSeek-V3 / Claude 3.5 Sonnet, maxTokens 8192+)
   * - Vision / Multimodal: OpenRouter (Google Gemini 2.5 Flash, maxTokens 4000)
   * - Local Ollama: Ollama (Qwen 2.5 Coder 7B, maxTokens 4000)
   */
  public selectOptimalModel(
    userInstruction: string,
    attachments: ChatAttachment[] = [],
    hasCustomOllama: boolean = false,
    requestedModel?: string,
    context?: ModelRoutingContext
  ): ModelRoutingDecision {
    const hasVisuals = attachments.some(a => a.type === 'image' || a.type === 'video');
    const instructionLower = userInstruction.toLowerCase().trim();
    const promptLength = instructionLower.length;

    // 1. Multimodal Vision or Video Frame Analysis
    if (hasVisuals) {
      return {
        server: 'openrouter',
        model: 'google/gemini-2.5-flash',
        rationale: '⚡ Enrutado a Google Gemini 2.5 Flash por requerimiento de visión computacional y análisis multimodal.',
        maxTokens: 4000,
        temperature: 0.2,
        routeCategory: 'multimodal',
        complexityScore: 5
      };
    }

    // 2. Custom Local Ollama (if explicitly requested)
    if (hasCustomOllama && requestedModel === 'ollama') {
      return {
        server: 'ollama',
        model: 'qwen2.5-coder:7b',
        rationale: '🔒 Enrutado a servidor local Ollama para privacidad completa en máquina.',
        maxTokens: 4000,
        temperature: 0.2,
        routeCategory: 'custom_ollama',
        complexityScore: 3
      };
    }

    // 3. Explicit Model Override by User
    if (requestedModel && requestedModel !== 'default' && requestedModel !== 'auto') {
      const isGroqExclusive = requestedModel.startsWith('groq/') || requestedModel.includes('instant');
      return {
        server: isGroqExclusive ? 'groq' : 'openrouter',
        model: requestedModel,
        rationale: `🎯 Enrutado al modelo específico seleccionado: ${requestedModel}.`,
        maxTokens: 8192,
        temperature: 0.15,
        routeCategory: 'complex_build',
        complexityScore: 5
      };
    }

    // 4. Signal Analysis: Incremental Edit vs Full Build
    const EDIT_VERBS = [
      'cambia', 'modifica', 'agrega', 'añade', 'elimina', 'quita', 'corrige', 
      'ajusta', 'renombra', 'mueve', 'pinta', 'reemplaza', 'aumenta', 'reduce', 
      'ponle', 'traduce', 'dale formato', 'arregla', 'sube', 'baja'
    ];

    const isExplicitEditVerb = EDIT_VERBS.some(v => 
      instructionLower.startsWith(v) || instructionLower.includes(` ${v} `)
    );

    const BUILD_KEYWORDS = [
      'crea', 'haz una app', 'haz un juego', 'has una app', 'has un juego', 
      'construye', 'desde cero', 'de cero', 'simulador', 'dashboard', 
      'plataforma', 'sistema', 'nuevo proyecto', 'nueva aplicacion'
    ];

    const hasBuildKeyword = BUILD_KEYWORDS.some(k => instructionLower.includes(k));

    // 5. Complexity Scoring Engine
    let complexityScore = 0;

    // A) Length contribution
    if (promptLength > 600) complexityScore += 3;
    else if (promptLength > 250) complexityScore += 2;
    else if (promptLength > 100) complexityScore += 1;

    // B) Feature Count Contribution
    // Auth & Security (+2)
    if (/(\bauth\b|login|registro|jwt|token|password|usuario|sesion|sesión|permisos|roles)/i.test(instructionLower)) {
      complexityScore += 2;
    }
    // Database & Persistence (+2)
    if (/(database|base de datos|indexeddb|localstorage|sql|crud|persist|guardar datos|api rest)/i.test(instructionLower)) {
      complexityScore += 2;
    }
    // State Management & Architecture (+2)
    if (/(estado|store|redux|zustand|context|reactivo|modular|arquitectura|componentes)/i.test(instructionLower)) {
      complexityScore += 2;
    }
    // 3D / Game Engine / Canvas Physics (+3)
    if (/(three\.js|canvas|webgl|shader|fisica|física|colisiones|colision|juego|arcade|simulador|particulas|partículas|graficos 3d)/i.test(instructionLower)) {
      complexityScore += 3;
    }
    // Web Audio (+1)
    if (/(audio|sonido|musica|música|sintetizador|web audio)/i.test(instructionLower)) {
      complexityScore += 1;
    }
    // Complex Data Viz / UI (+2)
    if (/(dashboard|graficos|gráficos|chart|metricas|métricas|filtros|tabla interactiva|tabs|pestañas)/i.test(instructionLower)) {
      complexityScore += 2;
    }
    // Deep Algorithm / Math (+3)
    if (/(algoritmo|grafos|arbol|cálculo|matematica|matemática|machine learning|ia|refactoriza todo)/i.test(instructionLower)) {
      complexityScore += 3;
    }

    // Determine if it qualifies as an incremental edit
    const isEditMode = context?.isEdit ?? (isExplicitEditVerb && !hasBuildKeyword && promptLength < 180 && complexityScore < 3);

    // ROUTE A: Rapid Incremental Edit (Groq LPU Engine)
    if (isEditMode) {
      return {
        server: 'groq',
        model: 'llama-3.3-70b-versatile',
        rationale: '⚡ Enrutado a Groq LPU (Llama 3.3 70B Versatile) para iteración incremental ultrarrápida a ~450 tokens/s.',
        maxTokens: 4000,
        temperature: 0.15,
        routeCategory: 'incremental_edit',
        complexityScore
      };
    }

    // ROUTE B: High-Complexity Architecture / 3D / Multi-Feature Applications
    if (complexityScore >= 4 || hasBuildKeyword) {
      return {
        server: 'openrouter',
        model: 'deepseek/deepseek-chat',
        rationale: `🧠 Enrutado a DeepSeek-V3 / OpenRouter (8,192 tokens) por requerimiento de construcción integral (Complejidad: ${complexityScore} pts).`,
        maxTokens: 8192,
        temperature: 0.15,
        routeCategory: 'complex_build',
        complexityScore
      };
    }

    // ROUTE C: Standard Full Generation Default
    return {
      server: 'openrouter',
      model: 'deepseek/deepseek-chat',
      rationale: '🚀 Enrutado a OpenRouter Cloud (DeepSeek-V3) con ventana extendida de 8,192 tokens para generación completa multi-archivo.',
      maxTokens: 8192,
      temperature: 0.15,
      routeCategory: 'standard_build',
      complexityScore
    };
  }
}

export const optimalModelRouter = new OptimalModelRouter();
