import type { ChatMessage } from '../../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { qaTesterAgent } from './QATesterAgent';
import { formatConversationHistory } from './historyUtils';

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

    // 2. Explicit new project verbs
    const fullCreationStarts = [
      'crea una nueva', 'crea un nuevo', 'haz un nuevo', 'haz una nueva',
      'nuevo proyecto', 'desde cero', 'reinicia todo', 'crea otro', 'crea otra',
      'empezar de cero', 'empecemos de nuevo', 'borra todo', 'cambia de juego',
      'olvida el juego', 'haz otra cosa', 'borra este juego'
    ];

    if (fullCreationStarts.some(kw => lower.includes(kw))) {
      return false;
    }

    // 3. Any instruction on an existing codebase is treated as an edit/evolution of the current app
    return true;
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
   * Executes a surgical component / bug fix edit on the existing code with full context & Auto-Continuation.
   */
  public async applySurgicalEdit(
    userInstruction: string,
    currentCode: string,
    onStream: (token: string, fullText: string) => void,
    signal?: AbortSignal,
    history?: ChatMessage[]
  ): Promise<string> {
    const historyText = formatConversationHistory(history, 8);
    const historySection = historyText
      ? `\nHISTORIAL DE CONVERSACIÓN RECIENTE (Contexto de lo solicitado previamente):\n${historyText}\n`
      : '';

    const systemPrompt = `Eres NONA SURGICAL CODE FIXER (v12.0 — Estándar Lovable / Google Antigravity).
Tu misión: modificar o reparar el código HTML5+JS actual satisfaciendo con precisión la solicitud del usuario SOBRE LA APLICACIÓN QUE YA EXISTE.

REGLAS ABSOLUTAS:
1. PRESERVACIÓN ESTRICTA: El usuario está trabajando sobre una aplicación o videojuego existente. NUNCA crees una aplicación diferente, no cambies la temática ni elimines la mecánica previa.
2. Si el usuario reporta que un botón o función no hace nada (ej: "JUGAR", inicio, colisiones, dificultad, audio, turbo):
   - Localiza la función, evento o listener correspondiente.
   - Corrige el error asegurando que los eventos (\`click\`, \`keydown\`, \`requestAnimationFrame\`) se ejecuten y los overlays se oculten.
3. Si el usuario reporta PANTALLA EN NEGRO o que nada se ve:
   - Asegúrate de que el canvas tenga dimensiones visibles (\`w-full h-full\`), \`scene.background = new THREE.Color(0x0a0f1d)\`, luces activas (\`AmbientLight\` + \`DirectionalLight\`) y que \`init()\` se llame de inmediato al final del script.
   - Corrige cualquier excepción o \`TypeError\` en el bucle \`animate()\` que detenga el renderizado.
4. Si el usuario pide agregar una función o estilo: intégralo armónicamente en el código actual manteniendo Three.js / Web Audio / Tailwind activos.
5. El archivo resultante index.html DEBE ser 100% COMPLETO, sin omitir funciones ni bucles de juego, y concluir con </script></body></html>.
6. Inicia DIRECTAMENTE con \`\`\`html filename=index.html y concluye con \`\`\`.`;

    const userPrompt = `${historySection}
CÓDIGO ACTUAL DE LA APLICACIÓN:
\`\`\`html
${currentCode}
\`\`\`

SOLICITUD DE MODIFICACIÓN / CORRECCIÓN DEL USUARIO:
"${userInstruction}"

IMPORTANTE: Conserva el mismo juego/aplicación. Aplica la corrección o mejora sobre el código existente.
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
      { signal, model: 'qwen/qwen3.8-27b', maxTokens: 3500, temperature: 0.15 }
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
