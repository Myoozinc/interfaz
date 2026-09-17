/**
 * ActionStreamParser
 * High-performance streaming & batch parser for multi-file actions (Bolt.new / Claude Artifacts standard).
 * 
 * Supported Patterns:
 * 1. Tagged XML Actions:
 *    <nonaArtifact id="..." title="...">
 *      <nonaAction type="file" filePath="index.html">...</nonaAction>
 *      <nonaAction type="file" filePath="src/game.js">...</nonaAction>
 *      <nonaAction type="patch" filePath="src/game.js">...</nonaAction>
 *    </nonaArtifact>
 * 
 * 2. Multi-File Markdown Blocks:
 *    ```html filename="index.html"
 *    ...
 *    ```
 *    ```js filename="src/main.js"
 *    ...
 *    ```
 * 
 * 3. In-Block File Declarations:
 *    // file: src/utils.js
 *    // filename: src/utils.js
 *    <!-- filename: index.html -->
 * 
 * 4. Resilient Fallback:
 *    Single HTML code block or raw <!DOCTYPE html> document defaults to index.html.
 */

export interface ParsedFileAction {
  filePath: string;
  content: string;
  type: 'file' | 'patch';
}

export interface ParsedPatchAction {
  filePath: string;
  search: string;
  replace: string;
}

export interface ParsedArtifactResult {
  title?: string;
  files: Record<string, string>;
  patches: ParsedPatchAction[];
  conversationalSummary: string;
  rawText: string;
}

import { ProjectJSONParser } from './ProjectJSONParser';

export class ActionStreamParser {
  /**
   * Normalizes a file path (removes leading ./ or /, trims whitespace)
   */
  public static normalizeFilePath(path: string): string {
    let clean = path.trim().replace(/^(\.\/|\/)/, '');
    if (!clean) clean = 'index.html';
    return clean;
  }

  /**
   * Full batch parse of an LLM response string.
   */
  public static parse(raw: string): ParsedArtifactResult {
    const files: Record<string, string> = {};
    const patches: ParsedPatchAction[] = [];
    let title: string | undefined = undefined;

    // 0. Sanitize internal model reasoning / thinking tokens (DeepSeek-R1 / Qwen-2.5 / Groq)
    const cleaned = raw
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^[\s\S]*?<\/think>/gi, '')
      .trim();

    // 0.1 Primary Contract Check: Structured JSON (Lovable / bolt.new standard)
    const jsonContractResult = ProjectJSONParser.parse(cleaned);
    if (jsonContractResult.success) {
      if (jsonContractResult.data.type === 'full_build') {
        jsonContractResult.data.contract.files.forEach(f => {
          files[ActionStreamParser.normalizeFilePath(f.path)] = f.content;
        });
        return {
          title: 'NONA Project',
          files,
          patches,
          conversationalSummary: jsonContractResult.data.contract.explanation,
          rawText: raw
        };
      } else if (jsonContractResult.data.type === 'incremental') {
        jsonContractResult.data.contract.changes.forEach(c => {
          const normPath = ActionStreamParser.normalizeFilePath(c.path);
          if ((c.action === 'create' || c.action === 'update') && c.content !== undefined) {
            files[normPath] = c.content;
          }
        });
        return {
          title: 'NONA Incremental Changes',
          files,
          patches,
          conversationalSummary: jsonContractResult.data.contract.explanation,
          rawText: raw
        };
      }
    }

    // 1. Try Tagged XML: <nonaArtifact> and <nonaAction>
    const artifactMatch = cleaned.match(/<nonaArtifact\b([^>]*)>([\s\S]*?)<\/nonaArtifact>/i);
    const hasOpenArtifact = !artifactMatch && /<nonaArtifact\b([^>]*)>([\s\S]*)/i.test(cleaned);

    const artifactContent = artifactMatch 
      ? artifactMatch[2] 
      : (hasOpenArtifact ? (cleaned.match(/<nonaArtifact\b([^>]*)>([\s\S]*)/i)?.[2] || '') : null);

    if (artifactContent !== null) {
      const titleAttr = (artifactMatch ? artifactMatch[1] : (cleaned.match(/<nonaArtifact\b([^>]*)>/i)?.[1] || '')).match(/title=["']([^"']+)["']/i);
      if (titleAttr) title = titleAttr[1];

      // Parse all <nonaAction> tags (including unclosed trailing actions for streaming resilience)
      const actionRegex = /<nonaAction\s+([^>]*?)>([\s\S]*?)(?:<\/nonaAction>|(?=<nonaAction)|$)/gi;
      let actionMatch: RegExpExecArray | null;

      while ((actionMatch = actionRegex.exec(artifactContent)) !== null) {
        const attributes = actionMatch[1];
        const innerContent = actionMatch[2].trim();

        const typeMatch = attributes.match(/type=["']([^"']+)["']/i);
        const fileMatch = attributes.match(/(?:filePath|file|path)=["']([^"']+)["']/i);

        const actionType = (typeMatch ? typeMatch[1] : 'file').toLowerCase();
        const filePath = ActionStreamParser.normalizeFilePath(fileMatch ? fileMatch[1] : 'index.html');

        if (actionType === 'patch') {
          // Parse search and replace blocks
          const patchRegex = /<{5,9}\s*SEARCH[^\n]*\n([\s\S]*?)\n={5,9}[^\n]*\n([\s\S]*?)\n>{5,9}\s*REPLACE/gi;
          let pMatch: RegExpExecArray | null;
          while ((pMatch = patchRegex.exec(innerContent)) !== null) {
            patches.push({
              filePath,
              search: pMatch[1],
              replace: pMatch[2]
            });
          }
        } else {
          // File action
          if (innerContent) {
            files[filePath] = innerContent;
          }
        }
      }
    }

    // 2. If no files were found via XML, try Multi-File Markdown Blocks:
    // e.g. ```tsx src/App.tsx, ```tsx filename="src/App.tsx", // Toolbar.tsx, etc.
    if (Object.keys(files).length === 0) {
      const codeBlockRegex = /```([^\n]*)\n([\s\S]*?)(?:```|$)/gi;
      let blockMatch: RegExpExecArray | null;
      let blockCount = 0;

      while ((blockMatch = codeBlockRegex.exec(cleaned)) !== null) {
        blockCount++;
        const infoStr = (blockMatch[1] || '').trim();
        let code = blockMatch[2].trim();
        let explicitFile: string | undefined;

        // A. Extraer nombre de archivo del header del bloque (ej: ```tsx filename="src/App.tsx", ```tsx:src/App.tsx, ```tsx [src/App.tsx], ```tsx src/App.tsx)
        const attrMatch = infoStr.match(/(?:filename|file|path|title)=["']?([^\s"'>]+)["']?/i);
        if (attrMatch) {
          explicitFile = attrMatch[1];
        } else {
          // Detectar formato: ```tsx src/App.tsx o ```tsx:src/App.tsx o ```tsx [src/App.tsx]
          const colonOrSpaceMatch = infoStr.match(/(?:^|[a-z0-9_-]+[:\s]+)(?:\[)?([a-zA-Z0-9_./-]+\.(?:tsx|ts|jsx|js|html|css|json))(?:\])?/i);
          if (colonOrSpaceMatch) {
            explicitFile = colonOrSpaceMatch[1];
          }
        }

        // B. Extraer lenguaje primario
        const lang = (infoStr.split(/[\s:="']/)[0] || '').toLowerCase();

        // C. Check if lines 1-3 have a comment like: // src/App.tsx, // Toolbar.tsx, <!-- index.html -->
        if (!explicitFile) {
          const lines = code.split('\n');
          for (let i = 0; i < Math.min(3, lines.length); i++) {
            const line = lines[i].trim();
            // Comentario con palabra clave: // filename: src/App.tsx
            const kwMatch = line.match(/^(?:\/\/\s*|<!--\s*|\/\*\s*|#\s*)(?:filename|file|path|component):\s*([a-zA-Z0-9_./-]+\.(?:tsx|ts|jsx|js|html|css|json))/i);
            if (kwMatch) {
              explicitFile = kwMatch[1];
              // Remover la línea de comentario del código
              code = lines.filter((_, idx) => idx !== i).join('\n').trim();
              break;
            }
            // Comentario directo con ruta/nombre de archivo: // src/components/Toolbar.tsx o // Toolbar.tsx
            const directFileMatch = line.match(/^(?:\/\/\s*|<!--\s*|\/\*\s*|#\s*)([a-zA-Z0-9_./-]+\.(?:tsx|ts|jsx|js|html|css|json))(?:\s*\*\/|\s*-->)?$/i);
            if (directFileMatch) {
              explicitFile = directFileMatch[1];
              code = lines.filter((_, idx) => idx !== i).join('\n').trim();
              break;
            }
          }
        }

        // D. Check preceding text (within 150 chars) for headers: e.g. ### src/App.tsx or **Toolbar.tsx**
        if (!explicitFile) {
          const blockStartIdx = blockMatch.index;
          const preceedingText = cleaned.slice(Math.max(0, blockStartIdx - 150), blockStartIdx);
          const headerMatch = preceedingText.match(/(?:###|\*\*|`|Archivo:|File:)\s*([a-zA-Z0-9_./-]+\.(?:tsx|ts|jsx|js|html|css|json))/i);
          if (headerMatch) {
            explicitFile = headerMatch[1];
          }
        }

        // E. Inferir ruta por contenido del código si no se especificó nombre
        const isJsOrTs = lang === 'js' || lang === 'javascript' || lang === 'ts' || lang === 'typescript' || lang === 'tsx' || lang === 'jsx' || (!lang && (code.includes('import ') || code.includes('export ')));
        const isHtml = lang === 'html' || code.includes('<!DOCTYPE html>') || code.includes('<html');
        const isCss = lang === 'css';

        if (explicitFile) {
          let filePath = ActionStreamParser.normalizeFilePath(explicitFile);
          // Si el nombre es solo un componente (ej: "Toolbar.tsx"), ubicarlo en src/components o src/
          if (!filePath.includes('/')) {
            filePath = filePath === 'index.html' ? 'index.html'
              : filePath === 'App.tsx' || filePath === 'App.jsx' ? `src/${filePath}`
              : filePath === 'styles.css' || filePath === 'index.css' ? `src/${filePath}`
              : `src/components/${filePath}`;
          }
          files[filePath] = code;
        } else if (isHtml) {
          files['index.html'] = code;
        } else if (isCss) {
          files['src/index.css'] = code;
        } else if (isJsOrTs) {
          // Detectar si el código define el componente App
          const hasAppDef = /(?:function|const|class)\s+App\b/.test(code) || /export\s+default\s+function\s+App\b/.test(code);
          if (hasAppDef && !files['src/App.tsx']) {
            files['src/App.tsx'] = code;
          } else {
            // Detectar nombre del componente exportado
            const compExportMatch = code.match(/export\s+(?:default\s+)?(?:function|class|const)\s+([A-Z][A-Za-z0-9_]+)/);
            if (compExportMatch) {
              const compName = compExportMatch[1];
              if (compName === 'App' && !files['src/App.tsx']) {
                files['src/App.tsx'] = code;
              } else {
                const compPath = `src/components/${compName}.tsx`;
                if (!files[compPath]) {
                  files[compPath] = code;
                } else {
                  files[`src/components/${compName}_${blockCount}.tsx`] = code;
                }
              }
            } else if (!files['src/App.tsx']) {
              // Si aún no tenemos App.tsx, el primer archivo JS/TSX se asigna a src/App.tsx
              files['src/App.tsx'] = code;
            } else {
              files[`src/components/Module${blockCount}.tsx`] = code;
            }
          }
        }
      }

      // F. Saneamiento de exports por defecto: si un módulo React no tiene "export default", sintetizarlo
      for (const [filePath, content] of Object.entries(files)) {
        if ((filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) && !content.includes('export default')) {
          const namedExportMatch = content.match(/export\s+(?:async\s+)?(?:function|class|const)\s+([A-Za-z0-9_]+)/);
          if (namedExportMatch) {
            const expName = namedExportMatch[1];
            files[filePath] = `${content}\n\nexport default ${expName};\n`;
          }
        }
      }
    }

    // 3. Fallback: Check if cleaned text contains an entire HTML document without markdown fences
    if (Object.keys(files).length === 0) {
      let rawHtml = '';
      const doctypeIdx = cleaned.indexOf('<!DOCTYPE html>');
      if (doctypeIdx !== -1) {
        const htmlEndIdx = cleaned.lastIndexOf('</html>');
        if (htmlEndIdx !== -1) {
          rawHtml = cleaned.slice(doctypeIdx, htmlEndIdx + 7).trim();
        } else {
          rawHtml = cleaned.slice(doctypeIdx).trim();
        }
      } else if (cleaned.includes('<html') && cleaned.includes('</body>')) {
        const startIdx = cleaned.indexOf('<html');
        const endIdx = cleaned.lastIndexOf('</html>');
        rawHtml = cleaned.slice(startIdx, endIdx !== -1 ? endIdx + 7 : undefined).trim();
      }

      if (rawHtml) {
        // Des-escapar si fue extraído de un fragmento de string JSON con caracteres de escape literales (\n, \", etc.)
        if (rawHtml.includes('\\n') || rawHtml.includes('\\"') || rawHtml.includes('\\\\')) {
          rawHtml = rawHtml
            .replace(/\\r\\n/g, '\n')
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/\\t/g, '\t');
        }
        files['index.html'] = rawHtml;
      }
    }

    // 4. Extract Conversational Text (any text outside <nonaArtifact> or markdown codeblocks)
    let conversationalText = cleaned
      .replace(/<nonaArtifact[\s\S]*?<\/nonaArtifact>/gi, '')
      .replace(/<nonaArtifact[\s\S]*/gi, '') // Unfinished artifact
      .replace(/```[\s\S]*?(?:```|$)/g, '')
      .replace(/<\/think>/gi, '')
      .trim();

    // Saneamiento de texto conversacional: NUNCA mostrar volcados de JSON crudo o truncado en el chat
    if (conversationalText.startsWith('{') || conversationalText.includes('"files"') || conversationalText.includes('"changes"')) {
      const explMatch = conversationalText.match(/"explanation"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i);
      if (explMatch && explMatch[1]) {
        conversationalText = explMatch[1]
          .replace(/\\r\\n/g, '\n')
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      } else {
        const count = Object.keys(files).length;
        conversationalText = count > 0
          ? `He generado la aplicación con ${count} archivo(s) modulares listos para interactuar en la Vista Previa.`
          : 'Aplicación procesada con éxito.';
      }
    }

    return {
      title,
      files,
      patches,
      conversationalSummary: conversationalText,
      rawText: raw
    };
  }

  /**
   * Quick check if a given text contains multi-file actions.
   */
  public static hasArtifactActions(raw: string): boolean {
    return /<nonaAction\b/i.test(raw) || /(?:filename|filePath)=/i.test(raw);
  }
}
