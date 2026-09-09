/**
 * ProjectJSONParser
 * 
 * Contrato estricto de salida para NONA (Estándar Lovable / bolt.new / v0).
 * 
 * Formato 1 (Full Build):
 * {
 *   "files": [
 *     { "path": "src/App.tsx", "content": "..." },
 *     { "path": "src/components/LoginForm.tsx", "content": "..." },
 *     { "path": "src/index.css", "content": "..." }
 *   ],
 *   "explanation": "Resumen breve de qué se construyó."
 * }
 * 
 * Formato 2 (Incremental Edit):
 * {
 *   "changes": [
 *     { "path": "src/components/LoginForm.tsx", "action": "update", "content": "..." },
 *     { "path": "src/components/Toast.tsx", "action": "create", "content": "..." }
 *   ],
 *   "explanation": "Resumen breve del cambio aplicado."
 * }
 */

export interface ProjectFileEntry {
  path: string;
  content: string;
}

export interface FullBuildContract {
  files: ProjectFileEntry[];
  explanation: string;
}

export type FileChangeAction = 'create' | 'update' | 'delete';

export interface ProjectChangeEntry {
  path: string;
  action: FileChangeAction;
  content?: string;
}

export interface IncrementalEditContract {
  changes: ProjectChangeEntry[];
  explanation: string;
}

export type ParsedContractData = 
  | { type: 'full_build'; contract: FullBuildContract }
  | { type: 'incremental'; contract: IncrementalEditContract };

export type ParseContractResult = 
  | { success: true; data: ParsedContractData; rawText: string }
  | { success: false; error: string; rawText: string };

export class ProjectJSONParser {
  /**
   * Normaliza una ruta de archivo relativa
   */
  public static normalizePath(filePath: string): string {
    return filePath.trim().replace(/^(\.\/|\/)/, '');
  }

  /**
   * Sanea el texto de entrada removiendo tokens de pensamiento (<think>...</think>)
   */
  public static sanitizeInput(raw: string): string {
    return raw
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^[\s\S]*?<\/think>/gi, '')
      .replace(/<\/think>/gi, '')
      .trim();
  }

  /**
   * Extrae el bloque JSON potencial de la respuesta del modelo:
   * 1. Bloque ```json ... ```
   * 2. Bloque ``` ... ```
   * 3. Texto delimitado por el primer '{' y el último '}'
   */
  public static extractJSONString(text: string): string | null {
    const cleaned = this.sanitizeInput(text);

    // 1. Markdown codeblock con tag json
    const jsonBlockMatch = cleaned.match(/```(?:json)\s*\n([\s\S]*?)(?:```|$)/i);
    if (jsonBlockMatch && jsonBlockMatch[1].trim()) {
      return jsonBlockMatch[1].trim();
    }

    // 2. Cualquier bloque de código markdown que contenga { y "files" o "changes"
    const genericBlockRegex = /```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)(?:```|$)/g;
    let blockMatch: RegExpExecArray | null;
    while ((blockMatch = genericBlockRegex.exec(cleaned)) !== null) {
      const candidate = blockMatch[1].trim();
      if (candidate.startsWith('{') && (candidate.includes('"files"') || candidate.includes('"changes"'))) {
        return candidate;
      }
    }

    // 3. Buscar el primer '{' y el último '}' en el texto completo
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return cleaned.slice(firstBrace, lastBrace + 1).trim();
    }

    return null;
  }

  /**
   * Intenta reparar errores comunes de JSON emitidos por LLMs:
   * - Comas colgantes antes de '}' o ']'
   * - Saltos de línea literales sin escapar dentro de strings
   */
  public static repairJSON(jsonStr: string): string {
    let repaired = jsonStr.trim();

    // Eliminar comas antes de llaves o corchetes de cierre: ", }" -> "}" o ", ]" -> "]"
    repaired = repaired.replace(/,\s*([}\]])/g, '$1');

    return repaired;
  }

  /**
   * Intenta parsear un string JSON con recuperación progresiva
   */
  private static safeParseJSON(jsonStr: string): any {
    try {
      return JSON.parse(jsonStr);
    } catch {
      // Intento con reparación básica
      const repaired = this.repairJSON(jsonStr);
      try {
        return JSON.parse(repaired);
      } catch (err: any) {
        throw new Error(err?.message || 'Error de sintaxis JSON');
      }
    }
  }

  /**
   * Parsea y valida una respuesta del modelo contra el contrato (Full Build o Incremental)
   */
  public static parse(raw: string): ParseContractResult {
    const rawText = raw || '';
    const jsonCandidate = this.extractJSONString(rawText);

    if (!jsonCandidate) {
      return {
        success: false,
        error: 'No se encontró ningún objeto JSON válido en la respuesta del modelo.',
        rawText
      };
    }

    let parsedObj: any;
    try {
      parsedObj = this.safeParseJSON(jsonCandidate);
    } catch (parseError: any) {
      return {
        success: false,
        error: `Error de sintaxis al parsear JSON: ${parseError.message}`,
        rawText
      };
    }

    if (!parsedObj || typeof parsedObj !== 'object' || Array.isArray(parsedObj)) {
      return {
        success: false,
        error: 'El JSON debe ser un objeto con formato { "files": [...] } o { "changes": [...] }.',
        rawText
      };
    }

    // 1. Validar si cumple con FullBuildContract
    if (Array.isArray(parsedObj.files)) {
      if (parsedObj.files.length === 0) {
        return {
          success: false,
          error: 'El campo "files" está vacío. Se requiere al menos un archivo con su ruta y contenido.',
          rawText
        };
      }

      const validFiles: ProjectFileEntry[] = [];
      for (let i = 0; i < parsedObj.files.length; i++) {
        const item = parsedObj.files[i];
        if (!item || typeof item !== 'object') {
          return {
            success: false,
            error: `El archivo en el índice ${i} no es un objeto válido.`,
            rawText
          };
        }
        if (typeof item.path !== 'string' || !item.path.trim()) {
          return {
            success: false,
            error: `El archivo en el índice ${i} carece de un campo "path" válido.`,
            rawText
          };
        }
        if (typeof item.content !== 'string') {
          return {
            success: false,
            error: `El archivo "${item.path}" carece de un campo "content" de tipo string.`,
            rawText
          };
        }

        validFiles.push({
          path: this.normalizePath(item.path),
          content: item.content
        });
      }

      const explanation = typeof parsedObj.explanation === 'string' && parsedObj.explanation.trim()
        ? parsedObj.explanation.trim()
        : 'Aplicación multi-archivo generada con éxito.';

      return {
        success: true,
        data: {
          type: 'full_build',
          contract: {
            files: validFiles,
            explanation
          }
        },
        rawText
      };
    }

    // 2. Validar si cumple con IncrementalEditContract
    if (Array.isArray(parsedObj.changes)) {
      if (parsedObj.changes.length === 0) {
        return {
          success: false,
          error: 'El campo "changes" está vacío. Se requiere al menos un cambio especificado.',
          rawText
        };
      }

      const validChanges: ProjectChangeEntry[] = [];
      for (let i = 0; i < parsedObj.changes.length; i++) {
        const item = parsedObj.changes[i];
        if (!item || typeof item !== 'object') {
          return {
            success: false,
            error: `El cambio en el índice ${i} no es un objeto válido.`,
            rawText
          };
        }
        if (typeof item.path !== 'string' || !item.path.trim()) {
          return {
            success: false,
            error: `El cambio en el índice ${i} carece de un campo "path" válido.`,
            rawText
          };
        }
        const action = (item.action || 'update').toLowerCase();
        if (!['create', 'update', 'delete'].includes(action)) {
          return {
            success: false,
            error: `Acción inválida "${item.action}" para el archivo "${item.path}". Debe ser create, update o delete.`,
            rawText
          };
        }

        if (action !== 'delete' && typeof item.content !== 'string') {
          return {
            success: false,
            error: `El cambio en "${item.path}" (acción: ${action}) requiere un campo "content" con el código.`,
            rawText
          };
        }

        validChanges.push({
          path: this.normalizePath(item.path),
          action: action as FileChangeAction,
          content: item.content !== undefined ? String(item.content) : undefined
        });
      }

      const explanation = typeof parsedObj.explanation === 'string' && parsedObj.explanation.trim()
        ? parsedObj.explanation.trim()
        : 'Modificaciones aplicadas con éxito al proyecto.';

      return {
        success: true,
        data: {
          type: 'incremental',
          contract: {
            changes: validChanges,
            explanation
          }
        },
        rawText
      };
    }

    return {
      success: false,
      error: 'El objeto JSON no contiene la propiedad requerida "files" (para nueva construcción) ni "changes" (para edición).',
      rawText
    };
  }

  /**
   * Helper para parsear específicamente un FullBuildContract
   */
  public static parseFullBuild(raw: string): { success: true; contract: FullBuildContract } | { success: false; error: string } {
    const result = this.parse(raw);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    if (result.data.type !== 'full_build') {
      return { 
        success: false, 
        error: 'Se esperaba un contrato de construcción completa ("files": [...]), pero se recibió otro formato.' 
      };
    }
    return { success: true, contract: result.data.contract };
  }

  /**
   * Helper para parsear específicamente un IncrementalEditContract
   */
  public static parseIncrementalEdit(raw: string): { success: true; contract: IncrementalEditContract } | { success: false; error: string } {
    const result = this.parse(raw);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    if (result.data.type !== 'incremental') {
      return { 
        success: false, 
        error: 'Se esperaba un contrato de edición incremental ("changes": [...]), pero se recibió otro formato.' 
      };
    }
    return { success: true, contract: result.data.contract };
  }
}
