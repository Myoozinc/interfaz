import { OllamaProvider } from '../providers/OllamaProvider';
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
      'cambia el color', 'rosado', 'azul', 'verde', 'nubes', 'universo', 'fondo',
      'pisar el boton', 'al pisar', 'no empieza', 'dificultad'
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
   * Executes a surgical component / bug fix edit on the existing code with compact prompt & Auto-Continuation.
   */
  public async applySurgicalEdit(
    userInstruction: string,
    currentCode: string,
    onStream: (token: string, fullText: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    // Compact system prompt (only ~120 tokens to maximize context window and stay within TPM limits)
    const systemPrompt = `Eres NONA SURGICAL CODE FIXER (v11.0).
Tu misión: reparar o modificar el código HTML5+JS actual satisfaciendo EXACTAMENTE la solicitud del usuario.

REGLAS ABSOLUTAS:
1. El archivo resultante index.html DEBE ser 100% COMPLETO, sin omitir funciones ni bucles de juego.
2. Si el usuario reporta que un botón (ej: "JUGAR", dificultad, turbo) no hace nada: escribe los listeners click/pointerdown correspondientes, oculta los overlays (\`classList.add('hidden')\`) y arranca el bucle de juego / cálculo (\`requestAnimationFrame\` o función de juego).
3. Asegúrate de que el Three.js canvas, renderer, cámara, controles (WASD/flechas/táctil) y audio Web Audio API funcionen al 100%.
4. Resuelve el estilo con Tailwind CSS y concluye con </script></body></html>.
5. Inicia DIRECTAMENTE con \`\`\`html filename=index.html y concluye con </html>\`\`\`.`;

    const userPrompt = `CÓDIGO ACTUAL:
\`\`\`html
${currentCode}
\`\`\`

SOLICITUD DE CORRECCIÓN:
"${userInstruction}"

Entrega el código index.html COMPLETO y 100% funcional en \`\`\`html filename=index.html:`;

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
      { signal, model: 'qwen/qwen3.8-27b', maxTokens: 3200, temperature: 0.15 }
    );

    let patchedCode = this.cleanCodeBlock(fullResponse);

    // Auto-Continuation Loop for Surgical Edits
    let continuationAttempts = 0;
    while (this.isCodeIncomplete(patchedCode) && continuationAttempts < 2) {
      continuationAttempts++;
      const lastChunk = patchedCode.slice(-1000);
      const continuationPrompt = `El código anterior se interrumpió aquí:
\`\`\`
${lastChunk}
\`\`\`

Continúa EXACTAMENTE desde la última línea sin repetir nada del código previo, completando todas las funciones JavaScript, eventos y concluyendo con </script></body></html>:`;

      let continuationOutput = '';
      try {
        await this.aiProvider.streamChat(
          [
            { role: 'system', content: 'Eres NONA Continuation Engine. Continúa el código exactamente donde se quedó hasta cerrar con </script></body></html>.' },
            { role: 'user', content: continuationPrompt }
          ],
          (token, full) => {
            continuationOutput = full;
            onStream(token, full);
          },
          { signal, model: 'qwen/qwen3.8-27b', maxTokens: 2500, temperature: 0.1 }
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
