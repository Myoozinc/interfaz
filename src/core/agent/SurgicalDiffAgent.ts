import { OllamaProvider } from '../providers/OllamaProvider';

export class SurgicalDiffAgent {
  private aiProvider: OllamaProvider;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'qwen/qwen3.8-27b');
  }

  /**
   * Determines whether the user instruction is a localized surgical edit
   * or a full application generation from scratch.
   */
  public isSurgicalEdit(userInstruction: string, currentCode: string, isExplicitNew: boolean): boolean {
    if (isExplicitNew || !currentCode || currentCode.trim().length < 100) {
      return false;
    }

    const lower = userInstruction.toLowerCase().trim();
    const editKeywords = [
      'cambia', 'modifica', 'agrega', 'añade', 'elimina', 'quita', 'pon', 'color', 
      'botón', 'texto', 'título', 'haz que', 'velocidad', 'más rápido', 'más lento',
      'fondo', 'estilo', 'tamaño', 'icono', 'sonido', 'puntuación', 'score', 'vidas',
      'corrige', 'arregla', 'fix', 'actualiza', 'edita', 'hazlo verde', 'hazlo azul'
    ];

    const creationKeywords = [
      'crea una nueva', 'crea un nuevo', 'haz un nuevo', 'haz una nueva', 'nuevo proyecto', 
      'desde cero', 'reinicia todo', 'crea la app de', 'crea un juego'
    ];

    if (creationKeywords.some(kw => lower.includes(kw))) {
      return false;
    }

    return editKeywords.some(kw => lower.includes(kw)) || currentCode.length > 500;
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
    const systemPrompt = `Eres SURGICAL DIFF AGENT de Google Antigravity & Lovable.
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
4. Asegura que los nuevos elementos tengan eventos interactivos, clases Tailwind y soporte para Lucide icons.`;

    const userPrompt = `INSTRUCCIÓN DE EDICIÓN:
"${userInstruction}"

CÓDIGO ACTUAL A MODIFICAR:
\`\`\`html
${currentCode}
\`\`\`

Aplica la modificación solicitada con precisión quirúrgica y devuelve el archivo index.html completo actualizado:`;

    const response = await this.aiProvider.streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      onStream,
      { signal, model: 'qwen/qwen3.8-27b', maxTokens: 3800 }
    );

    const match = response.match(/```html(?:\s+filename=[^\n]+)?\n([\s\S]*)/);
    if (match) {
      return match[1].replace(/```\s*$/, '').trim();
    } else if (response.includes('<!DOCTYPE html>')) {
      const idx = response.indexOf('<!DOCTYPE html>');
      return response.slice(idx).replace(/```\s*$/, '').trim();
    }

    return response.replace(/```\s*$/, '').trim();
  }
}

export const surgicalDiffAgent = new SurgicalDiffAgent();
