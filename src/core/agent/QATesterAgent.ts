export interface QATestResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  visualDensityScore: number; // 0 to 100
  needsVisualEnrichment: boolean;
  enrichmentPrompt?: string;
  repairedCode?: string;
}

export class QATesterAgent {
  /**
   * Performs deep automated linting, syntax analysis, DOM element verification,
   * and evaluates Functional & Visual Density (Lovable & Antigravity Pro Standard).
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
        visualDensityScore: 0,
        needsVisualEnrichment: true,
        enrichmentPrompt: 'El código generado está vacío. Genera la aplicación completa con Tailwind CSS, interactividad y audio.',
      };
    }

    // 1. Basic Structure Checks & Document Framing
    if (!repaired.includes('<!DOCTYPE html>') && !repaired.includes('<html')) {
      errors.push('Falta la declaración <!DOCTYPE html> o etiqueta <html>.');
      repaired = `<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <script src="https://cdn.tailwindcss.com"></script>\n  <script src="https://unpkg.com/lucide@latest"></script>\n</head>\n<body class="bg-slate-950 text-white min-h-screen">\n${repaired}\n</body>\n</html>`;
    }

    // 2. Unclosed Tag Auto-Repair
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

    // 3. Balance of braces and parens inside all <script> blocks
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
    const getElementByIdMatches = repaired.matchAll(/document\.getElementById\(['"]([^'"]+)['"]\)/g);
    for (const match of getElementByIdMatches) {
      const elementId = match[1];
      const idRegex = new RegExp(`id=["']${elementId}["']`, 'i');
      if (!idRegex.test(repaired)) {
        warnings.push(`El script hace referencia a getElementById('${elementId}'), pero el elemento no existe en el DOM.`);
      }
    }

    // 5. Visual & Functional Density Evaluation (Pro Standard)
    let densityPoints = 0;
    const missingFeatures: string[] = [];

    // Criterion A: Micro-interactions & Smooth Transitions (25 pts)
    const hasTransitions = /transition-all|transition-colors|duration-|ease-in-out/i.test(repaired);
    const hasHovers = /hover:scale-|hover:bg-|hover:border-|hover:shadow-|active:scale-/i.test(repaired);
    if (hasTransitions && hasHovers) {
      densityPoints += 25;
    } else {
      missingFeatures.push('Micro-interacciones visuales (hover:scale-105, active:scale-95, transition-all)');
    }

    // Criterion B: Native Web Audio Sound Effects (20 pts)
    const hasAudio = /playSynthSound/i.test(repaired) || /AudioContext/i.test(repaired);
    if (hasAudio) {
      densityPoints += 20;
    } else {
      missingFeatures.push('Efectos de sonido interactivos con window.playSynthSound(type)');
    }

    // Criterion C: State Persistence (20 pts)
    const hasPersistence = /localStorage|NONA_DB/i.test(repaired);
    if (hasPersistence) {
      densityPoints += 20;
    } else {
      missingFeatures.push('Persistencia de datos en localStorage o window.NONA_DB');
    }

    // Criterion D: Rich Components & Lucide Icons (20 pts)
    const hasLucide = /lucide|data-lucide/i.test(repaired);
    const hasTailwindGlass = /backdrop-blur|bg-slate-900|bg-opacity|shadow-xl|rounded-2xl|rounded-3xl/i.test(repaired);
    if (hasLucide && hasTailwindGlass) {
      densityPoints += 20;
    } else {
      missingFeatures.push('Diseño visual premium con tarjetas backdrop-blur, sombras e iconos Lucide');
    }

    // Criterion E: Responsive layout (15 pts)
    const hasResponsive = /sm:|md:|lg:|max-w-/i.test(repaired);
    if (hasResponsive) {
      densityPoints += 15;
    } else {
      missingFeatures.push('Diseño responsive adaptado a móvil y escritorio (sm:, md:, lg:)');
    }

    const visualDensityScore = densityPoints;
    const needsVisualEnrichment = errors.length === 0 && visualDensityScore < 60;
    const isValid = errors.length === 0 && !needsVisualEnrichment;

    let enrichmentPrompt: string | undefined;
    if (needsVisualEnrichment) {
      enrichmentPrompt = `La aplicación generada carece de la riqueza visual e interactiva requerida por el estándar comercial Lovable/Antigravity (Score: ${visualDensityScore}/100).\nPor favor enriquece el código agregando los siguientes elementos faltantes:\n${missingFeatures.map(f => '- ' + f).join('\n')}\nDevuelve el código 100% completo, autocontenido y enriquecido en \`\`\`html filename=index.html:`;
    }

    return {
      valid: isValid,
      errors,
      warnings,
      visualDensityScore,
      needsVisualEnrichment,
      enrichmentPrompt,
      repairedCode: repaired,
    };
  }
}

export const qaTesterAgent = new QATesterAgent();
