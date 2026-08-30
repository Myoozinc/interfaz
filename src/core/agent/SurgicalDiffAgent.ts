import { OllamaProvider } from '../providers/OllamaProvider';

export class SurgicalDiffAgent {
  private aiProvider: OllamaProvider;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'openai/gpt-oss-120b');
  }

  /**
   * Determines whether the user instruction is a localized surgical edit
   * or a full application generation from scratch.
   */
  public isSurgicalEdit(userInstruction: string, currentCode: string, isExplicitNew: boolean): boolean {
    if (isExplicitNew || !currentCode || currentCode.trim().length < 50 || currentCode.includes('Lienzo Listo')) {
      return false;
    }

    const lower = userInstruction.toLowerCase().trim();

    // 1. If user used Click-to-Inspect to select an element
    if (lower.startsWith('[elemento seleccionado')) {
      return true;
    }

    // 2. Explicit full creation / new app keywords -> ALWAYS Full Generation
    const fullCreationKeywords = [
      'crea', 'haz', 'has', 'hacer', 'genera', 'construye', 'desarrolla', 'dame',
      'quiero un', 'quiero una', 'quiero que hagas', 'juego de', 'app de', 'saas de',
      'tienda de', 'simulador de', 'plataforma de', 'sistema de', 'calculadora',
      'snake', 'football', 'futbol', 'carreras', 'tamagotchi', 'dashboard', 'nuevo', 'nueva'
    ];

    if (fullCreationKeywords.some(kw => lower.includes(kw))) {
      return false;
    }

    // 3. Explicit surgical modification verbs ONLY
    const surgicalVerbs = [
      'cambia el', 'cambia la', 'modifica el', 'modifica la', 'pon de color',
      'haz el botón', 'haz que el botón', 'añade un campo', 'agrega un campo',
      'elimina el botón', 'quita el', 'corrige el error', 'arregla la función',
      'hazlo verde', 'hazlo rojo', 'hazlo azul', 'aumenta el tamaño', 'cambia el título',
      'cambia el fondo', 'cambia la velocidad', 'más rápido', 'más lento'
    ];

    return surgicalVerbs.some(verb => lower.includes(verb));
  }

  /**
   * Executes a surgical component / function edit on the existing code.
   */
  public async applySurgicalEdit(
    userInstruction: string,
    currentCode: string,
    onStream: (token: string, fullText: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const systemPrompt = `Eres NONA SURGICAL DIFF AGENT (Architecture v5.0).
Tu tarea es modificar quirúrgicamente el código existente según la solicitud del usuario, preservando todas las demás funcionalidades intactas.

REGLAS ESTRICTAS:
1. Analiza el código actual y localiza exactamente los elementos, funciones JS o clases CSS que deben cambiar.
2. Devuelve el código COMPLETO actualizado en un único bloque:
\`\`\`html filename=index.html
<!DOCTYPE html>
... (código completo con los cambios integrados limpiamente)
</html>
\`\`\`
3. NO elimines funcionalidades previas que no hayan sido solicitadas para borrarse.
4. Asegura que los nuevos elementos tengan eventos interactivos, clases Tailwind y soporte para Lucide icons.
5. Inicia DIRECTAMENTE con \`\`\`html filename=index.html y concluye con </html>\`\`\`. CERO TEXTO DE CHARLA.`;

    const userPrompt = `CÓDIGO ACTUAL EXISTENTE:
\`\`\`html
${currentCode}
\`\`\`

INSTRUCCIÓN DE MODIFICACIÓN ESPECÍFICA:
"${userInstruction}"

Aplica la modificación quirúrgica y devuelve el archivo index.html completo y actualizado:`;

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
