import type { ChatMessage } from '../../types';

export type UserIntentType = 'CHAT_CONSULT' | 'INTERACTIVE_PLAN' | 'FULL_BUILD' | 'SURGICAL_EDIT';

export interface IntentClassificationResult {
  type: UserIntentType;
  confidence: number;
  reason: string;
  suggestedActionChips?: string[];
  isExplicitNew?: boolean;
}

export class IntentRouter {
  /**
   * High-Precision Semantic & Heuristic Classifier (Google Antigravity & Lovable Standard).
   * 
   * GOLDEN RULE:
   * If the project already has an active codebase and the user does NOT explicitly ask
   * to start from scratch ("nuevo proyecto", "desde cero", "borra todo"), any request
   * is treated as an ITERATION / MODIFICATION on the existing application, preserving
   * the game/app theme and mechanics.
   */
  public classifyIntent(
    userInstruction: string,
    currentCode: string,
    _history?: ChatMessage[]
  ): IntentClassificationResult {
    const raw = userInstruction.trim();
    const lower = raw.toLowerCase();
    const hasExistingApp = !!(currentCode && currentCode.trim().length > 30 && !currentCode.includes('Lienzo Listo'));

    // Check for explicit new project verbs
    const explicitNewKeywords = [
      'crea una nueva', 'crea un nuevo', 'haz un nuevo', 'haz una nueva',
      'nuevo proyecto', 'desde cero', 'reinicia todo', 'crea otro juego',
      'crea otra app', 'empezar de cero', 'empecemos de nuevo', 'borra todo',
      'cambia de juego', 'juego nuevo', 'app nueva', 'haz otra cosa',
      'olvida el juego', 'reiniciar proyecto', 'borra este juego'
    ];
    const isExplicitNew = explicitNewKeywords.some(kw => lower.includes(kw));

    // Priority 0: Click-to-Inspect or explicitly selected element in UI
    if (lower.startsWith('[elemento seleccionado') || lower.startsWith('modifica este elemento')) {
      return {
        type: 'SURGICAL_EDIT',
        confidence: 0.99,
        reason: 'Elemento de interfaz seleccionado mediante el Inspector Visual.',
        isExplicitNew: false
      };
    }

    // Priority 1: Interactive Planning & Brainstorming (INTERACTIVE_PLAN)
    const planKeywords = [
      'no se como', 'no sé cómo', 'no se por donde', 'no sé por dónde',
      'que me recomiendas', 'qué me recomiendas', 'dame ideas', 'sugerencias para',
      'como deberiamos estructurar', 'cómo deberíamos estructurar',
      'ayudame a planear', 'ayúdame a planear', 'que funciones le pondrias',
      'qué funciones le pondrías', 'opciones para', 'proponme', 'propónme',
      'ideas para', 'como planearias', 'cómo planearías'
    ];

    if (planKeywords.some(pk => lower.includes(pk)) && !isExplicitNew) {
      return {
        type: 'INTERACTIVE_PLAN',
        confidence: 0.92,
        reason: 'Solicitud de co-creación, ideas y planificación arquitectónica interactiva.',
        isExplicitNew: false,
        suggestedActionChips: [
          '🚀 Desarrollar Opción A (Recomendada)',
          '🎨 Probar con Estilo Cyberpunk / Neón',
          '📱 Optimizar para Móviles y Pantalla Táctil'
        ]
      };
    }

    // Priority 2: Pure Conversational / Consultation Inquiries (CHAT_CONSULT)
    const questionPatterns = [
      '¿', '?', 'que es', 'qué es', 'como funciona', 'cómo funciona',
      'que librerias', 'qué librerías', 'que tecnologias', 'qué tecnologías',
      'explicame', 'explícame', 'por que', 'por qué', 'para que sirve',
      'diferencia entre', 'quien eres', 'quién eres', 'puedes explicar',
      'cual es', 'cuál es', 'dime como', 'dime cómo', 'como hiciste', 'cómo hiciste'
    ];

    const hasCodeAction = [
      'corrige', 'arregla', 'repara', 'cambia', 'modifica', 'agrega', 'añade',
      'pon', 'quita', 'elimina', 'haz', 'crea', 'construye', 'programa', 'actualiza'
    ].some(a => lower.includes(a));

    if (questionPatterns.some(q => lower.includes(q)) && !hasCodeAction) {
      return {
        type: 'CHAT_CONSULT',
        confidence: 0.95,
        reason: 'Consulta conceptual o pregunta sobre la arquitectura sin solicitud directa de código.',
        isExplicitNew: false
      };
    }

    // Priority 3: GOLDEN RULE — If existing code is present and NOT explicit new, ITERATE!
    if (hasExistingApp && !isExplicitNew) {
      return {
        type: 'SURGICAL_EDIT',
        confidence: 0.98,
        reason: 'Modificación, corrección de errores o evolución sobre la aplicación existente.',
        isExplicitNew: false
      };
    }

    // Priority 4: Explicit Full App / Game Creation (FULL_BUILD)
    return {
      type: 'FULL_BUILD',
      confidence: 0.9,
      reason: hasExistingApp && isExplicitNew
        ? 'El usuario solicitó explícitamente iniciar una nueva aplicación desde cero.'
        : 'Creación inicial de la aplicación o videojuego.',
      isExplicitNew: true
    };
  }
}

export const intentRouter = new IntentRouter();
