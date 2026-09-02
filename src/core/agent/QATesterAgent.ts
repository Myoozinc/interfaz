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
   * interactivity validation, and runtime safety checks.
   */
  public testAndAudit(htmlCode: string, userInstruction?: string): QATestResult {
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
        enrichmentPrompt: 'El código generado está vacío. Genera la aplicación completa con Tailwind CSS, Three.js (si aplica), interactividad y audio.',
      };
    }

    // 1. Basic Structure Checks & Modern Library Injection
    if (!repaired.includes('<!DOCTYPE html>') && !repaired.includes('<html')) {
      errors.push('Falta la declaración <!DOCTYPE html> o etiqueta <html>.');
      repaired = `<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <script src="https://cdn.tailwindcss.com"></script>\n  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n</head>\n<body class="bg-slate-950 text-white min-h-screen font-sans">\n${repaired}\n</body>\n</html>`;
    }

    // Replace legacy tailwind CSS links with modern CDN
    if (repaired.includes('tailwindcss@2') || repaired.includes('tailwind.min.css')) {
      repaired = repaired.replace(/<link[^>]*tailwindcss[^>]*>/gi, '<script src="https://cdn.tailwindcss.com"></script>');
      warnings.push('Enlace CSS legado de Tailwind reemplazado por CDN moderno.');
    }

    // Ensure modern Tailwind CDN is present
    if (!repaired.includes('cdn.tailwindcss.com') && !repaired.includes('tailwindcss')) {
      repaired = repaired.replace('<head>', '<head>\n  <script src="https://cdn.tailwindcss.com"></script>');
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

    // 3. Real JavaScript Syntax Validation
    const scriptMatches = repaired.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi);
    let totalScriptLength = 0;
    for (const match of scriptMatches) {
      const scriptCode = match[1];
      if (!scriptCode || scriptCode.trim().length === 0) continue;
      totalScriptLength += scriptCode.trim().length;

      try {
        // Test compile JavaScript syntax
        new Function(scriptCode);
      } catch (syntaxErr: any) {
        errors.push(`Error de sintaxis JavaScript en el script: ${syntaxErr.message}`);
      }
    }

    // 4. Interactivity & DOM Element Matching Check
    const hasButtons = /<button/i.test(repaired);
    const hasScriptHandlers = /addEventListener|onclick|querySelector/i.test(repaired);
    if (hasButtons && (totalScriptLength < 80 || !hasScriptHandlers)) {
      errors.push('La aplicación contiene botones interactivos pero carece de listeners o funciones JavaScript en <script>.');
    }

    // Check for getElementById references that don't exist in HTML
    const getElementByIdMatches = repaired.matchAll(/document\.getElementById\(['"]([^'"]+)['"]\)/g);
    for (const m of getElementByIdMatches) {
      const elId = m[1];
      const idRegex = new RegExp(`id=["']${elId}["']`, 'i');
      if (!idRegex.test(repaired)) {
        errors.push(`El script intenta acceder al elemento con id="${elId}", pero no existe en el DOM HTML.`);
      }
    }

    // 5. Domain Detection & Feature Scoring
    const is3D = /three\.min\.js|three@0|THREE\./i.test(repaired) || (userInstruction ? /juego|snake|3d|carrera|nave|arcade|calculadora/i.test(userInstruction) : false);

    let densityPoints = 0;
    const missingFeatures: string[] = [];

    if (is3D) {
      // DOMAIN A: 3D Graphics & Games
      if (repaired.includes('Scene') && repaired.includes('PerspectiveCamera') && (repaired.includes('WebGLRenderer') || repaired.includes('requestAnimationFrame'))) {
        densityPoints += 35;
      }
      if (repaired.includes('AmbientLight') || repaired.includes('DirectionalLight') || repaired.includes('PointLight')) {
        densityPoints += 25;
      } else {
        missingFeatures.push('Iluminación 3D (AmbientLight / DirectionalLight / PointLight)');
      }
      if (repaired.includes('addEventListener') || repaired.includes('click') || repaired.includes('keydown')) {
        densityPoints += 25;
      } else {
        missingFeatures.push('Controles y eventos de interactividad (clics / teclado / ratón)');
      }
      if (repaired.includes('AudioContext') || repaired.includes('playSynthSound') || repaired.includes('audio') || repaired.includes('score') || repaired.includes('lcd')) {
        densityPoints += 15;
      }
    } else {
      // DOMAIN B: 2D Web Apps / SaaS
      const hasTransitions = /transition-all|transition-colors|duration-|ease-in-out/i.test(repaired);
      if (hasTransitions) densityPoints += 30;
      if (/addEventListener|onclick/i.test(repaired)) densityPoints += 30;
      if (/localStorage/i.test(repaired)) densityPoints += 20;
      if (/backdrop-blur|bg-slate-900|shadow-xl|rounded-2xl/i.test(repaired)) densityPoints += 20;
    }

    const visualDensityScore = densityPoints;
    const isValid = errors.length === 0;

    let enrichmentPrompt: string | undefined;
    if (!isValid) {
      const issueList = [
        ...errors,
        ...missingFeatures.map(f => `Falta: ${f}`)
      ];
      enrichmentPrompt = `Problemas detectados por el Auditor QA (Score: ${visualDensityScore}/100):\n${issueList.map(f => '- ' + f).join('\n')}`;
    }

    return {
      valid: isValid,
      errors,
      warnings,
      visualDensityScore,
      needsVisualEnrichment: !isValid,
      enrichmentPrompt,
      repairedCode: repaired,
    };
  }
}

export const qaTesterAgent = new QATesterAgent();
