export interface QATestResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0 to 100
  repairedCode?: string;
}

export class QATesterAgent {
  /**
   * Performs deep automated linting, syntax analysis, DOM element verification,
   * and auto-repairs common runtime hazards.
   */
  public testAndAudit(htmlCode: string): QATestResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let repaired = htmlCode;

    if (!htmlCode || htmlCode.trim().length === 0) {
      return {
        valid: false,
        errors: ['El documento HTML está completamente vacío.'],
        warnings: [],
        score: 0,
      };
    }

    // 1. Basic Structure Checks
    if (!repaired.includes('<!DOCTYPE html>') && !repaired.includes('<html')) {
      errors.push('Falta la declaración <!DOCTYPE html> o etiqueta <html>.');
      repaired = `<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <script src="https://cdn.tailwindcss.com"></script>\n  <script src="https://unpkg.com/lucide@latest"></script>\n</head>\n<body>\n${repaired}\n</body>\n</html>`;
    }

    // 2. Unclosed Tag Repairs
    if (repaired.includes('<script') && !repaired.includes('</script>')) {
      const lastScriptIdx = repaired.lastIndexOf('<script');
      const scriptContent = repaired.slice(lastScriptIdx);
      const opens = (scriptContent.match(/\{/g) || []).length;
      const closes = (scriptContent.match(/\}/g) || []).length;
      if (opens > closes) {
        repaired += '\n' + '}'.repeat(opens - closes);
      }
      repaired += '\n</script>';
      warnings.push('Etiqueta <script> cerrada automáticamente por el auditor QA.');
    }

    if (!repaired.includes('</body>')) {
      repaired += '\n</body>';
      warnings.push('Etiqueta </body> insertada automáticamente.');
    }

    if (!repaired.includes('</html>')) {
      repaired += '\n</html>';
      warnings.push('Etiqueta </html> insertada automáticamente.');
    }

    // 3. Balance of braces inside all <script> blocks
    const scriptMatches = repaired.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi);
    for (const match of scriptMatches) {
      const scriptCode = match[1];
      const openBraces = (scriptCode.match(/\{/g) || []).length;
      const closeBraces = (scriptCode.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push(`Desbalance de llaves en JavaScript: ${openBraces} abiertas vs ${closeBraces} cerradas.`);
      }

      const openParens = (scriptCode.match(/\(/g) || []).length;
      const closeParens = (scriptCode.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push(`Desbalance de paréntesis en JavaScript: ${openParens} abiertos vs ${closeParens} cerrados.`);
      }
    }

    // 4. Element ID Reference Checks
    // Find all document.getElementById('xyz') and verify 'xyz' exists in HTML
    const getElementByIdMatches = repaired.matchAll(/document\.getElementById\(['"]([^'"]+)['"]\)/g);
    for (const match of getElementByIdMatches) {
      const elementId = match[1];
      const idRegex = new RegExp(`id=["']${elementId}["']`, 'i');
      if (!idRegex.test(repaired)) {
        warnings.push(`El script hace referencia a getElementById('${elementId}'), pero el elemento no existe en el DOM.`);
      }
    }

    // 5. Essential Libraries Check
    if (!repaired.includes('tailwindcss.com')) {
      warnings.push('Tailwind CSS no detectado en <head>; se recomienda para el estándar de diseño visual.');
    }

    const isValid = errors.length === 0;
    const score = Math.max(0, 100 - (errors.length * 30) - (warnings.length * 10));

    return {
      valid: isValid,
      errors,
      warnings,
      score,
      repairedCode: repaired,
    };
  }
}

export const qaTesterAgent = new QATesterAgent();
