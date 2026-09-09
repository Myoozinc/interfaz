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

    // Check if current code is the default placeholder or starter template
    const isStarterOrPlaceholder = !currentCode ||
      currentCode.includes('AURA.store') ||
      currentCode.includes('Lienzo Listo') ||
      currentCode.trim().length < 30;

    const hasExistingCustomApp = !!(currentCode && currentCode.trim().length >= 30 && !isStarterOrPlaceholder);

    // Priority -1: Direct Action Chips to Build or Preview
    if (
      lower.startsWith('▶') ||
      lower.includes('construir y ver en preview') ||
      lower.includes('construye la aplicación') ||
      lower.includes('construye la aplicacion') ||
      lower.includes('construir aplicación') ||
      lower.includes('construir aplicacion')
    ) {
      return {
        type: 'FULL_BUILD',
        confidence: 0.99,
        reason: 'Acción directa solicitada para construir y desplegar la aplicación completa en Live Preview.',
        isExplicitNew: true
      };
    }

    // Explicit project reset / new project phrases
    const newProjectPhrases = [
      'nuevo proyecto', 'nueva app', 'nueva aplicacion', 'nueva aplicación',
      'desde cero', 'de cero', 'empezar de cero', 'empecemos de nuevo',
      'borra todo', 'borrar todo', 'reiniciar proyecto', 'reinicia todo', 'crear desde cero',
      'otro proyecto', 'otra app diferente', 'borra este proyecto', 'haz otra app', 'has otra app'
    ];

    // Generic creation verbs when there is no custom app yet
    const creationVerbs = [
      'crea', 'haz', 'has', 'crear', 'hacer', 'desarrolla', 'desarrollar', 
      'construye', 'construir', 'genera', 'generar', 'quiero una app', 'quiero un juego',
      'quiero hacer', 'programa una', 'diseña una', 'disena una'
    ];

    const isExplicitNew = isStarterOrPlaceholder ||
      newProjectPhrases.some(p => lower.includes(p)) ||
      (!hasExistingCustomApp && creationVerbs.some(v => lower.startsWith(v) || lower.includes(` ${v} `)));

    // Modification / Fix keywords that specifically indicate repairing existing code
    const repairKeywords = [
      'corrige', 'arregla', 'repara', 'soluciona', 'pantalla en negro', 'pantalla negra',
      'no funciona', 'no inicia', 'no responde', 'no hace nada', 'falla el',
      'el error', 'un error', 'bug', 'cuando presiono', 'al hacer click',
      'da una pantalla', 'se queda en negro', 'se ve negro'
    ];
    const isExplicitRepair = repairKeywords.some(rk => lower.includes(rk));

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

    if (planKeywords.some(pk => lower.includes(pk)) && !isExplicitRepair && !isExplicitNew) {
      return {
        type: 'INTERACTIVE_PLAN',
        confidence: 0.92,
        reason: 'Solicitud de co-creación, ideas y planificación arquitectónica interactiva.',
        isExplicitNew: false,
        suggestedActionChips: [
          '▶ Construir y Ver en Preview',
          '🎨 Personalizar Diseño y Estructura',
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
      'pon', 'quita', 'elimina', 'haz', 'has', 'crea', 'construye', 'programa', 'actualiza', 'pantalla'
    ].some(a => lower.includes(a));

    if (questionPatterns.some(q => lower.includes(q)) && !hasCodeAction && !isExplicitNew) {
      return {
        type: 'CHAT_CONSULT',
        confidence: 0.95,
        reason: 'Consulta conceptual o pregunta sobre la arquitectura sin solicitud directa de código.',
        isExplicitNew: false,
        suggestedActionChips: [
          '▶ Construir y Ver en Preview',
          '🎨 Ver Estilos Disponibles',
          '✨ Agregar Funciones Avanzadas'
        ]
      };
    }

    // Priority 3: Explicit New App / Game Creation (FULL_BUILD)
    if (isExplicitNew) {
      return {
        type: 'FULL_BUILD',
        confidence: 0.96,
        reason: hasExistingCustomApp
          ? 'El usuario solicitó explícitamente iniciar una nueva aplicación o videojuego con un estilo diferente.'
          : 'Creación inicial de la aplicación o videojuego completo.',
        isExplicitNew: true
      };
    }

    // Priority 4: GOLDEN RULE — If user has an existing custom app AND is repairing/modifying, ITERATE!
    if (hasExistingCustomApp) {
      return {
        type: 'SURGICAL_EDIT',
        confidence: 0.98,
        reason: 'Modificación, corrección de errores o evolución sobre la aplicación existente.',
        isExplicitNew: false
      };
    }

    // Default Fallback: FULL_BUILD
    return {
      type: 'FULL_BUILD',
      confidence: 0.9,
      reason: 'Creación inicial de la aplicación o videojuego.',
      isExplicitNew: true
    };
  }
}

export const intentRouter = new IntentRouter();
