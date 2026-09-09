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
    // e.g. ```html filename="index.html" ... ``` or ```js filename="src/app.js" (supports unclosed fences)
    if (Object.keys(files).length === 0) {
      const codeBlockRegex = /```([a-zA-Z0-9_-]+)?(?:\s+(?:filename|file|path)=["']?([^\s"'\n]+)["']?)?\s*\n([\s\S]*?)(?:```|$)/gi;
      let blockMatch: RegExpExecArray | null;
      let blockCount = 0;

      while ((blockMatch = codeBlockRegex.exec(cleaned)) !== null) {
        blockCount++;
        const lang = (blockMatch[1] || '').toLowerCase();
        let explicitFile = blockMatch[2];
        let code = blockMatch[3].trim();

        // Check if line 1 has a comment like: // file: src/index.js or <!-- file: index.html -->
        if (!explicitFile) {
          const firstLine = code.split('\n')[0].trim();
          const commentFileMatch = firstLine.match(/^(?:\/\/\s*|<!--\s*|\/\*\s*)(?:filename|file|path):\s*([^\s*>-]+)/i);
          if (commentFileMatch) {
            explicitFile = commentFileMatch[1];
            // Remove the filename comment line from the actual code
            code = code.split('\n').slice(1).join('\n').trim();
          }
        }

        if (explicitFile) {
          const filePath = ActionStreamParser.normalizeFilePath(explicitFile);
          files[filePath] = code;
        } else if (blockCount === 1 && (lang === 'html' || code.includes('<!DOCTYPE html>') || code.includes('<html'))) {
          files['index.html'] = code;
        } else if (lang === 'css') {
          files['styles.css'] = code;
        } else if (lang === 'js' || lang === 'javascript' || lang === 'ts' || lang === 'typescript') {
          files[blockCount === 1 ? 'src/main.js' : `src/script_${blockCount}.js`] = code;
        }
      }
    }

    // 3. Fallback: Check if cleaned text contains an entire HTML document without markdown fences
    if (Object.keys(files).length === 0) {
      const doctypeIdx = cleaned.indexOf('<!DOCTYPE html>');
      if (doctypeIdx !== -1) {
        const htmlEndIdx = cleaned.lastIndexOf('</html>');
        if (htmlEndIdx !== -1) {
          files['index.html'] = cleaned.slice(doctypeIdx, htmlEndIdx + 7).trim();
        } else {
          files['index.html'] = cleaned.slice(doctypeIdx).trim();
        }
      } else if (cleaned.includes('<html') && cleaned.includes('</body>')) {
        const startIdx = cleaned.indexOf('<html');
        const endIdx = cleaned.lastIndexOf('</html>');
        files['index.html'] = cleaned.slice(startIdx, endIdx !== -1 ? endIdx + 7 : undefined).trim();
      }
    }

    // 4. Extract Conversational Text (any text outside <nonaArtifact> or markdown codeblocks)
    let conversationalText = cleaned
      .replace(/<nonaArtifact[\s\S]*?<\/nonaArtifact>/gi, '')
      .replace(/<nonaArtifact[\s\S]*/gi, '') // Unfinished artifact
      .replace(/```[\s\S]*?(?:```|$)/g, '')
      .replace(/<\/think>/gi, '')
      .trim();

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
