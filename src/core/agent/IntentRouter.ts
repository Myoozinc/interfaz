import type { ChatMessage } from '../../types';

export type UserIntentType = 'CHAT_CONSULT' | 'INTERACTIVE_PLAN' | 'FULL_BUILD' | 'SURGICAL_EDIT';

export interface IntentClassificationResult {
  type: UserIntentType;
  confidence: number;
  reason: string;
  suggestedActionChips?: string[];
}

export class IntentRouter {
  /**
   * Fast rule-based heuristic classifier with semantic intent detection.
   * Classifies user prompts into:
   * 1. CHAT_CONSULT: Conceptual questions, code explanations, technology inquiries.
   * 2. INTERACTIVE_PLAN: Vague ideas, brainstorming, asking for advice/features.
   * 3. FULL_BUILD: Explicit new software / 3D game creation requests.
   * 4. SURGICAL_EDIT: Specific bug fixes, visual tweaks or localized modifications.
   */
  public classifyIntent(
    userInstruction: string,
    currentCode: string,
    _history?: ChatMessage[]
  ): IntentClassificationResult {
    const raw = userInstruction.trim();
    const lower = raw.toLowerCase();

    // 0. Click-to-Inspect or explicitly selected element in UI
    if (lower.startsWith('[elemento seleccionado') || lower.startsWith('modifica este elemento')) {
      return {
        type: 'SURGICAL_EDIT',
        confidence: 0.99,
        reason: 'Elemento de interfaz seleccionado mediante el Inspector Visual.'
      };
    }

    // 1. Pure Conversational / Consultation Inquiries (CHAT_CONSULT)
    const questionPatterns = [
      '¿', '?', 'que es', 'qué es', 'como funciona', 'cómo funciona',
      'que librerias', 'qué librerías', 'que tecnologias', 'qué tecnologías',
      'explicame', 'explícame', 'por que', 'por qué', 'para que sirve',
      'diferencia entre', 'quien eres', 'quién eres', 'puedes explicar',
      'cual es', 'cuál es', 'dime como', 'dime cómo', 'como hiciste', 'cómo hiciste'
    ];

    const isQuestionWithoutCreationVerbs = questionPatterns.some(q => lower.includes(q)) &&
      !['crea', 'haz', 'has', 'construye', 'desarrolla', 'genera', 'agrega', 'cambia'].some(v => lower.startsWith(v));

    if (isQuestionWithoutCreationVerbs) {
      return {
        type: 'CHAT_CONSULT',
        confidence: 0.95,
        reason: 'Consulta conceptual o pregunta sobre la arquitectura sin solicitud directa de código.'
      };
    }

    // 2. Interactive Planning / Brainstorming (INTERACTIVE_PLAN)
    const planKeywords = [
      'quiero hacer una app pero no se', 'quiero hacer un juego pero no se',
      'que me recomiendas', 'qué me recomiendas', 'dame ideas', 'sugerencias para',
      'como deberiamos estructurar', 'cómo deberíamos estructurar',
      'ayudame a planear', 'ayúdame a planear', 'que funciones le pondrias',
      'qué funciones le pondrías', 'opciones para'
    ];

    if (planKeywords.some(pk => lower.includes(pk))) {
      return {
        type: 'INTERACTIVE_PLAN',
        confidence: 0.9,
        reason: 'Solicitud de co-creación, ideas y planificación arquitectónica interactiva.',
        suggestedActionChips: [
          '🚀 Comenzar Desarrollo Completo',
          '🎨 Definir Paleta y Estilo Visual',
          '🎮 Añadir Efectos de Sonido y Físicas'
        ]
      };
    }

    // 3. Bug Fixes & Localized Edits (SURGICAL_EDIT)
    const bugFixKeywords = [
      'no funciona', 'no pasa nada', 'no inicia', 'no responde', 'no hace nada',
      'corrige el error', 'arregla el', 'repara el', 'cuando presiono',
      'al hacer click', 'al hacer clic', 'el boton', 'el botón',
      'cambia el color', 'cambia la velocidad', 'hazlo más rápido',
      'hazlo más lento', 'aumenta el', 'agrega un sonido', 'quita el'
    ];

    const hasExistingApp = currentCode && currentCode.trim().length > 100 && !currentCode.includes('Lienzo Listo');

    if (hasExistingApp && bugFixKeywords.some(bk => lower.includes(bk))) {
      return {
        type: 'SURGICAL_EDIT',
        confidence: 0.95,
        reason: 'Reporte de bug o solicitud de modificación sobre la aplicación activa.'
      };
    }

    // 4. Explicit Full App / Game Creation (FULL_BUILD)
    const creationKeywords = [
      'crea', 'haz', 'has', 'hacer', 'genera', 'construye', 'desarrolla',
      'quiero un juego', 'quiero una app', 'quiero un saas', 'nuevo proyecto',
      'snake en 3d', 'juego 3d', 'simulador', 'tienda', 'e-commerce',
      'plataforma', 'calculadora', 'dashboard'
    ];

    if (creationKeywords.some(ck => lower.includes(ck)) || !hasExistingApp) {
      return {
        type: 'FULL_BUILD',
        confidence: 0.95,
        reason: 'Instrucción explícita para generar una nueva aplicación o videojuego 3D completo.'
      };
    }

    // Default Fallback
    if (hasExistingApp) {
      return {
        type: 'SURGICAL_EDIT',
        confidence: 0.75,
        reason: 'Modificación contextual sobre el proyecto existente.'
      };
    }

    return {
      type: 'FULL_BUILD',
      confidence: 0.8,
      reason: 'Construcción inicial de proyecto.'
    };
  }
}

export const intentRouter = new IntentRouter();
