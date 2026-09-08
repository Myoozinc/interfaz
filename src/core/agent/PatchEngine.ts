export interface PatchBlock {
  search: string;
  replace: string;
}

export interface PatchResult {
  success: boolean;
  patchedCode: string;
  appliedCount: number;
  unmatchedBlocks: PatchBlock[];
}

export class PatchEngine {
  /**
   * Extracts <<<<<<< SEARCH ... ======= ... >>>>>>> REPLACE blocks from LLM output.
   * Also supports markdown diff fences and alternative block tags.
   */
  public static extractPatchBlocks(rawText: string): PatchBlock[] {
    const blocks: PatchBlock[] = [];

    // Format 1: Standard Search/Replace conflict markers (Aider / Cursor standard)
    const regex1 = /<{5,9}\s*SEARCH[^\n]*\n([\s\S]*?)\n={5,9}[^\n]*\n([\s\S]*?)\n>{5,9}\s*REPLACE/gi;
    let match: RegExpExecArray | null;

    while ((match = regex1.exec(rawText)) !== null) {
      blocks.push({
        search: match[1],
        replace: match[2],
      });
    }

    if (blocks.length > 0) return blocks;

    // Format 2: [SEARCH] ... [REPLACE] ... [/REPLACE] tags
    const regex2 = /\[SEARCH\][^\n]*\n([\s\S]*?)\n\[REPLACE\][^\n]*\n([\s\S]*?)\n\[\/REPLACE\]/gi;
    while ((match = regex2.exec(rawText)) !== null) {
      blocks.push({
        search: match[1],
        replace: match[2],
      });
    }

    return blocks;
  }

  /**
   * Applies patch blocks to currentCode with exact matching first,
   * then falling back to fuzzy line matching (whitespace-resilient).
   */
  public static applyPatches(currentCode: string, rawText: string): PatchResult {
    const blocks = this.extractPatchBlocks(rawText);
    if (blocks.length === 0) {
      return {
        success: false,
        patchedCode: currentCode,
        appliedCount: 0,
        unmatchedBlocks: [],
      };
    }

    let code = currentCode;
    let appliedCount = 0;
    const unmatchedBlocks: PatchBlock[] = [];

    for (const block of blocks) {
      const search = block.search;
      const replace = block.replace;

      // 1. Direct exact match
      if (code.includes(search)) {
        code = code.replace(search, replace);
        appliedCount++;
        continue;
      }

      // 2. Normalized line endings match (CRLF -> LF)
      const normalizedCode = code.replace(/\r\n/g, '\n');
      const normalizedSearch = search.replace(/\r\n/g, '\n');
      if (normalizedCode.includes(normalizedSearch)) {
        code = normalizedCode.replace(normalizedSearch, replace);
        appliedCount++;
        continue;
      }

      // 3. Fuzzy Line Matcher (resilient to indentation/trailing space variations)
      const codeLines = code.split('\n');
      const searchLines = search.split('\n').map(l => l.trim());

      if (searchLines.every(l => l === '')) {
        unmatchedBlocks.push(block);
        continue;
      }

      let foundIdx = -1;
      for (let i = 0; i <= codeLines.length - searchLines.length; i++) {
        let allMatch = true;
        for (let j = 0; j < searchLines.length; j++) {
          if (codeLines[i + j].trim() !== searchLines[j]) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) {
          foundIdx = i;
          break;
        }
      }

      if (foundIdx !== -1) {
        codeLines.splice(foundIdx, searchLines.length, replace);
        code = codeLines.join('\n');
        appliedCount++;
      } else {
        unmatchedBlocks.push(block);
      }
    }

    return {
      success: appliedCount > 0,
      patchedCode: code,
      appliedCount,
      unmatchedBlocks,
    };
  }
}
