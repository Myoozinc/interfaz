import { OllamaProvider } from '../providers/OllamaProvider';
import { NONA_MASTER_SYSTEM_PROMPT_V5 } from './PromptGuardrails';
import { qaTesterAgent } from './QATesterAgent';

export class SurgicalDiffAgent {
  private aiProvider: OllamaProvider;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'qwen/qwen3.8-27b');
  }

  /**
   * Determines whether the user instruction is a localized surgical edit / bug fix
   * or a full new application generation.
   */
  public isSurgicalEdit(userInstruction: string, currentCode: string, isExplicitNew: boolean): boolean {
    if (isExplicitNew || !currentCode || currentCode.trim().length < 50 || currentCode.includes('Lienzo Listo')) {
      return false;
    }

    const lower = userInstruction.toLowerCase().trim();

    // 1. If user used Click-to-Inspect or attached images
    if (lower.startsWith('[elemento seleccionado') || lower.startsWith('modifica este elemento')) {
      return true;
    }

    // 2. Explicit bug fixes or modification requests on the current screen
    const fixAndEditKeywords = [
      'no pasa nada', 'no funciona', 'no inicia', 'edita eso', 'arregla', 'corrige',
      'cuando presiono', 'al hacer click', 'al hacer clic', 'el botón', 'el boton',
      'cambia', 'modifica', 'agrega', 'añade', 'elimina', 'quita', 'pon de color',
      'haz que', 'más rápido', 'más lento', 'aumenta', 'reduce', 'error', 'bug',
      'cambia el color', 'rosado', 'azul', 'verde', 'nubes', 'universo', 'fondo'
    ];

    if (fixAndEditKeywords.some(kw => lower.includes(kw))) {
      return true;
    }

    // 3. New project explicit verbs
    const fullCreationStarts = [
      'crea una nueva', 'crea un nuevo', 'haz un nuevo', 'haz una nueva',
      'nuevo proyecto', 'desde cero', 'reinicia todo', 'crea otro', 'crea otra'
    ];

    if (fullCreationStarts.some(kw => lower.startsWith(kw))) {
      return false;
    }

    return false;
  }

  private isCodeIncomplete(code: string): boolean {
    if (!code || code.length < 100) return true;
    const trimmed = code.trim();
    if (!trimmed.endsWith('</html>') && !trimmed.endsWith('</script>')) return true;
    if (code.includes('<script') && !code.includes('</script>')) return true;
    if (!code.includes('</html>')) return true;
    return false;
  }

  private cleanCodeBlock(raw: string): string {
    const match = raw.match(/```html(?:\s+filename=[^\n]+)?\n([\s\S]*)/);
    if (match) {
      return match[1].replace(/```\s*$/, '').trim();
    }
    if (raw.includes('<!DOCTYPE html>')) {
      const idx = raw.indexOf('<!DOCTYPE html>');
      return raw.slice(idx).replace(/```\s*$/, '').trim();
    }
    return raw.replace(/```\s*$/, '').trim();
  }

  /**
   * Executes a surgical component / bug fix edit on the existing code with Auto-Continuation.
   */
  public async applySurgicalEdit(
    userInstruction: string,
    currentCode: string,
    onStream: (token: string, fullText: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const systemPrompt = `${NONA_MASTER_SYSTEM_PROMPT_V5}

Eres NONA SURGICAL DIFF & PRECISION EDIT AGENT (Arquitectura v10.0).
Tu misión es aplicar la modificación o corrección solicitada por el usuario sobre el código existente.

REGLAS CRÍTICAS:
1. El código resultante debe ser 100% COMPLETO, PULIDO Y CON TODAS SUS FUNCIONES JAVASCRIPT FUNCIONANDO.
2. Si es una calculadora: DEBE tener la lógica de cálculo completa (sumar, restar, multiplicar, dividir, borrar, decimales, soporte de teclado), visualizador LCD y sonidos. NUNCA dejes una calculadora sin su lógica de cálculo en JavaScript.
3. Si es un juego o escena 3D (Three.js): DEBE tener la escena completa (cámara, luces, bucle de animación \`requestAnimationFrame\`, partículas de nubes/universo y controles).
4. Usa Tailwind CSS para la interfaz visual para no malgastar tokens en bloques CSS gigantes.
5. Inicia DIRECTAMENTE con \`\`\`html filename=index.html y concluye con </html>\`\`\`. Cero texto de conversación.`;

    const userPrompt = `CÓDIGO ACTUAL EXISTENTE:
\`\`\`html
${currentCode}
\`\`\`

MODIFICACIÓN / SOLICITUD DEL USUARIO:
"${userInstruction}"

Aplica la modificación con precisión y entrega el archivo index.html COMPLETO, con toda su lógica JavaScript, eventos y Three.js 100% funcionales. Inicia con \`\`\`html filename=index.html:`;

    let fullResponse = '';
    await this.aiProvider.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      (token, full) => {
        fullResponse = full;
        onStream(token, full);
      },
      { signal, model: 'qwen/qwen3.8-27b', maxTokens: 4500, temperature: 0.15 }
    );

    let patchedCode = this.cleanCodeBlock(fullResponse);

    // Auto-Continuation Loop for Surgical Edits
    let continuationAttempts = 0;
    while (this.isCodeIncomplete(patchedCode) && continuationAttempts < 2) {
      continuationAttempts++;
      const lastChunk = patchedCode.slice(-1200);
      const continuationPrompt = `El código anterior se interrumpió aquí:
\`\`\`
${lastChunk}
\`\`\`

Continúa EXACTAMENTE desde la última línea sin repetir nada del código previo, completando todas las funciones JavaScript, eventos de clic, Three.js y concluyendo con </script></body></html>:`;

      let continuationOutput = '';
      try {
        await this.aiProvider.streamChat(
          [
            { role: 'system', content: `${NONA_MASTER_SYSTEM_PROMPT_V5}\nEres el CONTINUATION ENGINE de NONA. Continúa el código exactamente donde se quedó.` },
            { role: 'user', content: continuationPrompt }
          ],
          (token, full) => {
            continuationOutput = full;
            onStream(token, full);
          },
          { signal, model: 'qwen/qwen3.8-27b', maxTokens: 3500, temperature: 0.1 }
        );

        let cleanedContinuation = continuationOutput.replace(/^```html(?:\s+filename=[^\n]+)?\n/, '').replace(/```\s*$/, '').trim();
        patchedCode = patchedCode + '\n' + cleanedContinuation;
      } catch (err) {
        console.warn('Surgical auto-continuation fallback', err);
        break;
      }
    }

    // Run QA syntax & tag closure
    const qaReport = qaTesterAgent.testAndAudit(patchedCode, userInstruction);
    return qaReport.repairedCode || patchedCode;
  }
}

export const surgicalDiffAgent = new SurgicalDiffAgent();
