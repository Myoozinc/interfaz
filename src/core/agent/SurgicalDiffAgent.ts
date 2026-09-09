import type { ChatMessage } from '../../types';
import { OllamaProvider } from '../providers/OllamaProvider';
import { qaTesterAgent } from './QATesterAgent';
import { formatConversationHistory } from './historyUtils';
import { PatchEngine } from './PatchEngine';
import { optimalModelRouter } from './OptimalModelRouter';
import { ActionStreamParser } from '../parser/ActionStreamParser';
import { ProjectJSONParser, type ProjectChangeEntry } from '../parser/ProjectJSONParser';

export interface IncrementalEditResult {
  changes: ProjectChangeEntry[];
  explanation: string;
}

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
      { isEdit: true, history, hasExistingProject: true, projectFileCount: 1 }
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

  /**
   * Applies incremental multi-file edits strictly according to the IncrementalEditContract JSON format.
   */
  public async applyIncrementalProjectEdit(
    userInstruction: string,
    projectFiles: Record<string, { path: string; content: string; language?: string }>,
    onStream: (token: string, fullText: string) => void,
    signal?: AbortSignal,
    history?: ChatMessage[]
  ): Promise<IncrementalEditResult> {
    const historyText = formatConversationHistory(history, 6);
    const historySection = historyText
      ? `\nHISTORIAL DE CONVERSACIÓN RECIENTE:\n${historyText}\n`
      : '';

    const routingDecision = optimalModelRouter.selectOptimalModel(
      userInstruction,
      [],
      false,
      undefined,
      {
        isEdit: true,
        history,
        hasExistingProject: true,
        projectFileCount: Object.keys(projectFiles).length,
        existingFileNames: Object.keys(projectFiles)
      }
    );

    // Build concise project context
    const fileEntries = Object.entries(projectFiles);
    const filesContext = fileEntries.map(([path, f]) => {
      let body = f.content;
      if (body.length > 8000) {
        body = body.slice(0, 4000) + '\n\n/* ... [contenido intermedio omitido] ... */\n\n' + body.slice(-2000);
      }
      return `### ARCHIVO: ${path}\n\`\`\`${f.language || 'text'}\n${body}\n\`\`\``;
    }).join('\n\n');

    const systemPrompt = `Eres NONA INCREMENTAL EDIT ENGINE (Estándar Lovable / bolt.new / v0).
Tu misión es aplicar modificaciones, agregar nuevos componentes o corregir errores sobre los archivos existentes del proyecto.

CONVENCIONES DE CARPETAS Y ARQUITECTURA:
- Componentes nuevos o actualizados deben residir en "src/components/" (PascalCase).
- Vistas completas de páginas o pestañas en "src/pages/".
- Utilidades o clientes en "src/lib/" (ej: "src/lib/supabase.ts", "src/lib/utils.ts").
- Tipos e interfaces en "src/types/".
- Si el usuario pide base de datos, persistencia o login, genera o actualiza "src/lib/supabase.ts" con @supabase/supabase-js en lugar de crear un servidor backend casero.
- Mantén consistencia absoluta con la paleta de Tailwind existente y la iconografía Lucide.

CONTRATO OBLIGATORIO DE SALIDA (JSON ESTRUCTURADO):
Debes responder ÚNICAMENTE con un objeto JSON válido (puedes encerrarlo en un bloque \`\`\`json ... \`\`\`) con la siguiente estructura exacta:
{
  "changes": [
    {
      "path": "src/components/LoginForm.tsx",
      "action": "update",
      "content": "...código completo y actualizado del archivo..."
    },
    {
      "path": "src/components/Toast.tsx",
      "action": "create",
      "content": "...código del nuevo archivo creado..."
    }
  ],
  "explanation": "Resumen conciso en español de los cambios realizados."
}

REGLAS ESTRICTAS:
1. Incluye en "changes" ÚNICAMENTE los archivos que se modifican ("update"), se crean ("create") o se eliminan ("delete").
2. No reenvíes archivos que no sufren modificaciones.
3. Para "update" o "create", el campo "content" debe contener el código COMPLETO y ejecutable del archivo, sin omitir funciones ni colocar "// TODO".
4. Para "delete", el campo "content" puede omitirse.
5. El JSON debe ser 100% válido y parseable: escapa correctamente comillas dobles en "content".
6. Todo tu resumen explicativo va dentro de "explanation".`;

    const maxRetries = 2;
    let attempt = 0;
    let lastFailureReason = '';

    while (attempt <= maxRetries) {
      let userPrompt = `${historySection}
ARCHIVOS ACTUALES DEL PROYECTO:
${filesContext}

INSTRUCCIÓN DEL USUARIO:
"${userInstruction}"`;

      if (attempt > 0) {
        userPrompt += `\n\n[CORRECCIÓN TÉCNICA OBLIGATORIA - INTENTO ${attempt + 1}/${maxRetries + 1}]:
El intento anterior no cumplió el contrato de edición incremental: ${lastFailureReason}.
Por favor devuelve EXCLUSIVAMENTE el objeto JSON válido con la clave "changes" (array de objetos { "path": string, "action": "update"|"create"|"delete", "content": string }) y "explanation" (string).`;
      } else {
        userPrompt += `\n\nAplica la modificación y responde estrictamente con el objeto JSON de "changes":`;
      }

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
        lastFailureReason = err.message || 'Error de conexión con el proveedor';
        attempt++;
        continue;
      }

      const cleanResponse = fullResponse
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/^[\s\S]*?<\/think>/gi, '')
        .trim();

      // 1. Primary parser: ProjectJSONParser.parseIncrementalEdit
      const parseResult = ProjectJSONParser.parseIncrementalEdit(cleanResponse);
      if (parseResult.success) {
        // Simular aplicación de cambios para validar coherencia del proyecto
        const candidateFiles: Record<string, string> = {};
        for (const [p, f] of Object.entries(projectFiles)) {
          candidateFiles[p] = f.content;
        }
        for (const ch of parseResult.contract.changes) {
          if (ch.action === 'delete') {
            delete candidateFiles[ch.path];
          } else if (ch.content !== undefined) {
            candidateFiles[ch.path] = ch.content;
          }
        }

        const qaValidation = qaTesterAgent.validateTypeScriptProject(candidateFiles);
        if (!qaValidation.valid) {
          lastFailureReason = qaValidation.errors.join('; ');
          attempt++;
          continue;
        }

        return {
          changes: parseResult.contract.changes,
          explanation: parseResult.contract.explanation
        };
      }

      // 2. Resilient check: Did the model return search/replace blocks or full build JSON?
      if (cleanResponse.includes('<<<<<<< SEARCH') && cleanResponse.includes('=======')) {
        const primaryTarget = fileEntries.find(([p]) => userInstruction.toLowerCase().includes(p.toLowerCase()))?.[0] || 'index.html';
        const targetContent = projectFiles[primaryTarget]?.content || '';
        const patched = PatchEngine.applyPatches(targetContent, cleanResponse);
        if (patched.success) {
          return {
            changes: [{
              path: primaryTarget,
              action: 'update',
              content: patched.patchedCode
            }],
            explanation: `Parche aplicado con precisión en ${primaryTarget}.`
          };
        }
      }

      lastFailureReason = parseResult.error;
      attempt++;
    }

    return {
      changes: [],
      explanation: `⚠️ No fue posible aplicar la modificación incremental tras ${attempt} intentos técnicos: ${lastFailureReason}. Se mantuvieron los archivos existentes sin cambios.`
    };
  }
}

export const surgicalDiffAgent = new SurgicalDiffAgent();
