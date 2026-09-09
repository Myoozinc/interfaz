import type { ChatMessage } from '../../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { qaTesterAgent } from './QATesterAgent';
import { formatConversationHistory } from './historyUtils';
import { PatchEngine } from './PatchEngine';
import { optimalModelRouter } from './OptimalModelRouter';
import { ActionStreamParser } from '../parser/ActionStreamParser';

export class SurgicalDiffAgent {
  private aiProvider: OllamaProvider;

  constructor() {
    this.aiProvider = new OllamaProvider('/api/agent', 'llama-3.3-70b-versatile');
  }

  public setEndpoint(url: string): void {
    this.aiProvider.setBaseUrl(url);
  }

  public setModel(model: string): void {
    this.aiProvider.setDefaultModel(model);
  }

  /**
   * Determines whether the user instruction is a localized surgical edit / bug fix
   * or a full new application generation.
   */
  public isSurgicalEdit(userInstruction: string, currentCode: string, isExplicitNew: boolean): boolean {
    if (
      isExplicitNew ||
      !currentCode ||
      currentCode.trim().length < 50 ||
      currentCode.includes('Lienzo Listo') ||
      currentCode.includes('AURA.store')
    ) {
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
   * Executes a surgical component / bug fix edit on the existing code using targeted
   * SEARCH/REPLACE diff blocks to guarantee 100% codebase consistency and avoid full-file rewrites.
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

    const routingDecision = optimalModelRouter.selectOptimalModel(
      userInstruction,
      [],
      false,
      undefined,
      { isEdit: true, history }
    );

    const systemPrompt = `Eres NONA SURGICAL DIFF ENGINE (v12.0 — Edición Quirúrgica de Alta Precisión / Formato Aider & Lovable).
Tu misión es corregir o modificar PUNTUALMENTE el código HTML5+JS existente según la instrucción del usuario, SIN REESCRIBIR TODO EL ARCHIVO.

ESTRUCTURA DE RESPUESTA OBLIGATORIA:
Debes responder ÚNICAMENTE con uno o más bloques de reemplazo quirúrgico con este formato exacto:
<<<<<<< SEARCH
[código exacto actual a reemplazar]
=======
[código nuevo o corregido]
>>>>>>> REPLACE

REGLAS ABSOLUTAS:
1. NO REESCRIBAS EL ARCHIVO COMPLETO. Modifica ÚNICAMENTE las líneas o funciones necesarias para cumplir con la solicitud.
2. CONSISTENCIA TOTAL: El 100% del resto de la aplicación (escenas 3D Three.js, geometrías, luces, audio Web Audio API, bucle de animación requestAnimationFrame, estilos Tailwind) se mantendrá EXACTAMENTE IGUAL.
3. El bloque SEARCH debe coincidir EXACTAMENTE con el código actual (caracteres, espacios e indentación). Incluye 2 a 5 líneas de contexto antes y después para asegurar que la coincidencia sea única.
4. Si el usuario reporta un problema puntual (ej: "el botón JUGAR no hace nada", "pantalla en negro", "aumenta la velocidad", "agrega contador de vidas"):
   - Localiza la función o bloque exacto donde ocurre el fallo o donde debe añadirse la lógica.
   - Aplica la corrección en el bloque REPLACE.
5. Si necesitas agregar una función o variable nueva:
   - En SEARCH, coloca las líneas adyacentes donde deba insertarse.
   - En REPLACE, incluye esas líneas más el nuevo código.
6. NUNCA incluyas explicaciones en inglés, comentarios de razonamiento tipo "Here's a thinking process" ni texto fuera de los bloques SEARCH/REPLACE.`;

    const userPrompt = `${historySection}
CÓDIGO ACTUAL DE LA APLICACIÓN:
\`\`\`html
${currentCode}
\`\`\`

SOLICITUD DE MODIFICACIÓN O CORRECCIÓN DEL USUARIO:
"${userInstruction}"

Entrega los bloques <<<<<<< SEARCH / ======= / >>>>>>> REPLACE para corregir o modificar puntualmente el código sin reescribir el resto:`;

    let fullResponse = '';
    try {
      await this.aiProvider.streamChat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        (token, full) => {
          fullResponse = full;
          onStream(token, full);
        },
        {
          signal,
          model: routingDecision.model,
          maxTokens: Math.min(routingDecision.maxTokens, 4000),
          temperature: 0.1
        }
      );
    } catch (err: any) {
      console.warn('[SurgicalDiffAgent] Falló stream del modelo:', err.message);
    }

    if (fullResponse && fullResponse.trim().length > 0) {
      // Sanitize any reasoning tokens or thinking chatter
      const cleanResponse = fullResponse
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/^[\s\S]*?<\/think>/gi, '')
        .replace(/<\/think>/gi, '')
        .replace(/(?:^|\n)(?:Here's a thinking process|Thinking Process|Thinking):[\s\S]*?(?=(?:```|<!DOCTYPE|<html|<nonaArtifact|<<<<<<< SEARCH|$))/i, '')
        .trim();

      // 1. Intentar aplicar parches quirúrgicos Search & Replace
      const patchResult = PatchEngine.applyPatches(currentCode, cleanResponse);
      if (patchResult.success) {
        console.log(`[SurgicalDiffAgent] Parche quirúrgico aplicado con éxito: ${patchResult.appliedCount} bloque(s).`);
        const qaReport = qaTesterAgent.testAndAudit(patchResult.patchedCode, userInstruction);
        if (qaReport.valid && qaReport.errors.length === 0) {
          return qaReport.repairedCode || patchResult.patchedCode;
        }
      }

      // 2. Si el modelo devolvió código completo en lugar de bloques diff
      const parsed = ActionStreamParser.parse(cleanResponse);
      let candidateFullCode = parsed.files['index.html'] || this.cleanCodeBlock(cleanResponse);

      if (
        candidateFullCode &&
        candidateFullCode.length > 300 &&
        candidateFullCode.includes('<!DOCTYPE html>') &&
        candidateFullCode.includes('</html>')
      ) {
        const qaReport = qaTesterAgent.testAndAudit(candidateFullCode, userInstruction);
        if (qaReport.valid && qaReport.errors.length === 0) {
          console.log('[SurgicalDiffAgent] Reemplazo de código completo verificado y validado por QA.');
          return qaReport.repairedCode || candidateFullCode;
        }
      }
    }

    // 3. Heurística de emergencia si falló el parche para eventos de controles
    const lowerInst = (userInstruction || '').toLowerCase();
    if (
      lowerInst.includes('mueve') ||
      lowerInst.includes('mover') ||
      lowerInst.includes('anda') ||
      lowerInst.includes('control') ||
      lowerInst.includes('tecla') ||
      lowerInst.includes('boton') ||
      lowerInst.includes('velocidad')
    ) {
      let healed = currentCode;
      if (healed.includes('</script>')) {
        const movementScript = `
  // [NONA Control Heuristic]: Garantizar enfoque de canvas y listener de teclado/pantalla
  window.addEventListener('load', () => window.focus());
  window.addEventListener('click', () => window.focus());
`;
        healed = healed.replace('</script>', movementScript + '\n</script>');
      }
      const qaReport = qaTesterAgent.testAndAudit(healed, userInstruction);
      if (qaReport.valid && qaReport.errors.length === 0) {
        return qaReport.repairedCode || healed;
      }
    }

    // 4. Salvaguarda crítica: Conservar código actual para evitar pantalla en negro o inyección de sintaxis rota
    console.warn('[SurgicalDiffAgent] Salvaguarda activada: Conservando código actual para evitar pantalla en negro.');
    return currentCode;
  }
}

export const surgicalDiffAgent = new SurgicalDiffAgent();
