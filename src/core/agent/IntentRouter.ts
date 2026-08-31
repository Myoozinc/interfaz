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
   * High-Precision Semantic & Heuristic Classifier (Google Antigravity & Lovable Standard).
   * Classifies user prompts into:
   * 1. SURGICAL_EDIT: Specific bug fixes, visual tweaks or localized modifications.
   * 2. INTERACTIVE_PLAN: Vague ideas, brainstorming, asking for advice/features.
   * 3. CHAT_CONSULT: Conceptual questions, code explanations, technology inquiries.
   * 4. FULL_BUILD: Explicit new software / 3D game creation requests.
   */
  public classifyIntent(
    userInstruction: string,
    currentCode: string,
    _history?: ChatMessage[]
  ): IntentClassificationResult {
    const raw = userInstruction.trim();
    const lower = raw.toLowerCase();
    const hasExistingApp = !!(currentCode && currentCode.trim().length > 30 && !currentCode.includes('Lienzo Listo'));

    // Priority 0: Click-to-Inspect or explicitly selected element in UI
    if (lower.startsWith('[elemento seleccionado') || lower.startsWith('modifica este elemento')) {
      return {
        type: 'SURGICAL_EDIT',
        confidence: 0.99,
        reason: 'Elemento de interfaz seleccionado mediante el Inspector Visual.'
      };
    }

    // Priority 1: Bug Fixes & Localized Edits on Existing App (SURGICAL_EDIT)
    const bugFixKeywords = [
      'no funciona', 'no pasa nada', 'no inicia', 'no responde', 'no hace nada',
      'corrige', 'arregla', 'repara', 'edita eso', 'cuando presiono',
      'al hacer click', 'al hacer clic', 'el boton', 'el botón',
      'cambia el', 'cambia la', 'cambia el color', 'cambia la velocidad',
      'hazlo más rápido', 'hazlo más lento', 'aumenta el', 'agrega un sonido',
      'agrega una función', 'quita el', 'elimina el', 'modifica el', 'modifica la'
    ];

    const hasExplicitNewVerb = [
      'crea una nueva', 'crea un nuevo', 'haz un nuevo', 'haz una nueva',
      'nuevo proyecto', 'desde cero', 'reinicia todo', 'crea otro juego'
    ].some(nv => lower.startsWith(nv));

    if (hasExistingApp && !hasExplicitNewVerb && bugFixKeywords.some(bk => lower.includes(bk))) {
      return {
        type: 'SURGICAL_EDIT',
        confidence: 0.96,
        reason: 'Reporte de bug o solicitud de modificación sobre la aplicación activa.'
      };
    }

    // Priority 2: Interactive Planning & Brainstorming (INTERACTIVE_PLAN)
    const planKeywords = [
      'no se como', 'no sé cómo', 'no se por donde', 'no sé por dónde',
      'que me recomiendas', 'qué me recomiendas', 'dame ideas', 'sugerencias para',
      'como deberiamos estructurar', 'cómo deberíamos estructurar',
      'ayudame a planear', 'ayúdame a planear', 'que funciones le pondrias',
      'qué funciones le pondrías', 'opciones para', 'proponme', 'propónme',
      'ideas para', 'como planearias', 'cómo planearías'
    ];

    if (planKeywords.some(pk => lower.includes(pk))) {
      return {
        type: 'INTERACTIVE_PLAN',
        confidence: 0.92,
        reason: 'Solicitud de co-creación, ideas y planificación arquitectónica interactiva.',
        suggestedActionChips: [
          '🚀 Desarrollar Opción A (Recomendada)',
          '🎨 Probar con Estilo Cyberpunk / Neón',
          '📱 Optimizar para Móviles y Pantalla Táctil'
        ]
      };
    }

    // Priority 3: Pure Conversational / Consultation Inquiries (CHAT_CONSULT)
    const questionPatterns = [
      '¿', '?', 'que es', 'qué es', 'como funciona', 'cómo funciona',
      'que librerias', 'qué librerías', 'que tecnologias', 'qué tecnologías',
      'explicame', 'explícame', 'por que', 'por qué', 'para que sirve',
      'diferencia entre', 'quien eres', 'quién eres', 'puedes explicar',
      'cual es', 'cuál es', 'dime como', 'dime cómo', 'como hiciste', 'cómo hiciste'
    ];

    const hasCreationVerb = ['crea', 'haz', 'has', 'construye', 'desarrolla', 'genera'].some(v => lower.startsWith(v));

    if (questionPatterns.some(q => lower.includes(q)) && !hasCreationVerb) {
      return {
        type: 'CHAT_CONSULT',
        confidence: 0.95,
        reason: 'Consulta conceptual o pregunta sobre la arquitectura sin solicitud directa de código.'
      };
    }

    // Priority 4: Explicit Full App / Game Creation (FULL_BUILD)
    return {
      type: 'FULL_BUILD',
      confidence: 0.9,
      reason: 'Instrucción para generar una nueva aplicación o videojuego 3D completo.'
    };
  }
}

export const intentRouter = new IntentRouter();
