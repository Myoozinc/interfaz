import { OllamaProvider } from '../providers/OllamaProvider';
import { NONA_MASTER_SYSTEM_PROMPT_V5 } from './PromptGuardrails';

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
      'haz que', 'más rápido', 'más lento', 'aumenta', 'reduce', 'error', 'bug'
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

  /**
   * Executes a surgical component / bug fix edit on the existing code.
   */
  public async applySurgicalEdit(
    userInstruction: string,
    currentCode: string,
    onStream: (token: string, fullText: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const systemPrompt = `${NONA_MASTER_SYSTEM_PROMPT_V5}

Eres NONA SURGICAL DIFF & BUG-FIX AGENT.
Tu misión es analizar el código existente, diagnosticar el problema reportado por el usuario (ej: botón que no responde, función no llamada, clase hidden no removida, error en consola) y entregar el código COMPLETO, 100% REPARADO Y FUNCIONAL.

REGLAS ESTRICTAS:
1. Localiza el botón, función o listener que falla y corrígelo con exactitud.
2. Si el botón "Jugar" o "Start" no responde, asegúrate de que tenga:
   \`document.getElementById('play-btn').onclick = () => { document.getElementById('start-screen').classList.add('hidden'); gameRunning = true; startGame(); };\`
   y que NO tenga clases CSS de "pointer-events: none" bloqueando el clic.
3. Devuelve el código COMPLETO actualizado en un único bloque:
\`\`\`html filename=index.html
<!DOCTYPE html>
...
</html>
\`\`\`
4. Inicia DIRECTAMENTE con \`\`\`html filename=index.html y concluye con </html>\`\`\`. Cero texto de conversación.`;

    const userPrompt = `CÓDIGO ACTUAL EXISTENTE:
\`\`\`html
${currentCode}
\`\`\`

INSTRUCCIÓN DE CORRECCIÓN / MODIFICACIÓN DEL USUARIO:
"${userInstruction}"

Corrige el problema con precisión y devuelve el archivo index.html completo y 100% funcional:`;

    const fullResponse = await this.aiProvider.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      (token, full) => onStream(token, full),
      { signal, model: 'openai/gpt-oss-120b', maxTokens: 3500 }
    );

    const match = fullResponse.match(/```html(?:\s+filename=[^\n]+)?\n([\s\S]*)/);
    if (match) {
      return match[1].replace(/```\s*$/, '').trim();
    } else if (fullResponse.includes('<!DOCTYPE html>')) {
      const idx = fullResponse.indexOf('<!DOCTYPE html>');
      return fullResponse.slice(idx).replace(/```\s*$/, '').trim();
    }
    return fullResponse.replace(/```\s*$/, '').trim();
  }
}

export const surgicalDiffAgent = new SurgicalDiffAgent();
