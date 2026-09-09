import type { ChatAttachment } from '../../types';

export interface ModelRoutingDecision {
  server: 'groq' | 'openrouter' | 'ollama';
  model: string;
  rationale: string;
  maxTokens: number;
  temperature: number;
}

export class OptimalModelRouter {
  /**
   * Evaluates prompt complexity, attachments and latency requirements
   * to immediately route the request to the most optimal AI server and model.
   */
  public selectOptimalModel(
    userInstruction: string,
    attachments: ChatAttachment[] = [],
    hasCustomOllama: boolean = false,
    requestedModel?: string
  ): ModelRoutingDecision {
    const hasVisuals = attachments.some(a => a.type === 'image' || a.type === 'video');
    const instructionLower = userInstruction.toLowerCase();

    // 1. Multimodal Vision or Video Frame Analysis
    if (hasVisuals) {
      return {
        server: 'openrouter',
        model: 'google/gemini-2.5-flash',
        rationale: '⚡ Enrutado a Google Gemini 2.5 Flash por requerimiento de visión computacional y análisis multimodal.',
        maxTokens: 3000,
        temperature: 0.2,
      };
    }

    // 2. Custom Local Ollama (if explicitly set and active)
    if (hasCustomOllama && requestedModel === 'ollama') {
      return {
        server: 'ollama',
        model: 'qwen2.5-coder:7b',
        rationale: '🔒 Enrutado a servidor local Ollama para privacidad completa.',
        maxTokens: 2500,
        temperature: 0.2,
      };
    }

    // 3. Heavy Architectural Deliberation / Deep Math
    if (
      instructionLower.includes('refactoriza todo el proyecto') ||
      instructionLower.includes('arquitectura compleja') ||
      instructionLower.includes('algoritmo de grafos')
    ) {
      return {
        server: 'openrouter',
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        rationale: '🧠 Enrutado a Qwen 2.5 Coder 32B para razonamiento algorítmico profundo.',
        maxTokens: 3500,
        temperature: 0.15,
      };
    }

    // 4. Ultra-Fast Code Generation & Interactive Response (DEFAULT GROQ LPU)
    return {
      server: 'groq',
      model: 'qwen/qwen3.8-27b',
      rationale: '⚡ Enrutado a Groq LPU (Qwen 3.8 27B) para inferencia ultrarrápida a ~450 tokens/segundo.',
      maxTokens: 3800,
      temperature: 0.15,
    };
  }
}

export const optimalModelRouter = new OptimalModelRouter();
