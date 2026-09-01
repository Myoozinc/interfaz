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
   * domain-aware scoring (Games vs SaaS), and runtime safety checks.
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
    for (const match of scriptMatches) {
      const scriptCode = match[1];
      // Skip external scripts with src attribute
      if (!scriptCode || scriptCode.trim().length === 0) continue;

      try {
        // Test compile JavaScript syntax without executing
        new Function(scriptCode);
      } catch (syntaxErr: any) {
        errors.push(`Error de sintaxis JavaScript en el script: ${syntaxErr.message}`);
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

    // 5. Domain Detection (3D Game vs SaaS / Web App)
    const is3D = /three\.min\.js|three@0|THREE\./i.test(repaired) || (userInstruction ? /juego|snake|3d|carrera|nave|arcade/i.test(userInstruction) : false);

    let densityPoints = 0;
    const missingFeatures: string[] = [];

    if (is3D) {
      // DOMAIN A: 3D Games & WebGL Simulations
      if (!repaired.includes('THREE.Scene') && !repaired.includes('new THREE.Scene')) {
        errors.push('Falta inicialización de la escena 3D (new THREE.Scene()).');
      }
      if (!repaired.includes('PerspectiveCamera')) {
        errors.push('Falta cámara 3D (new THREE.PerspectiveCamera()).');
      }
      if (!repaired.includes('WebGLRenderer')) {
        errors.push('Falta renderizador WebGL (new THREE.WebGLRenderer()).');
      }
      if (/#hud\s*\{[^}]*pointer-events:\s*none/i.test(repaired) && !/#hud\s+button\s*\{[^}]*pointer-events:\s*auto/i.test(repaired)) {
        repaired = repaired.replace(/pointer-events:\s*none;/gi, 'pointer-events: auto;');
        warnings.push('Corregido pointer-events en HUD para habilitar clics de botones.');
      }

      // 3D Quality Criteria (100 pts total)
      if (repaired.includes('Scene') && repaired.includes('PerspectiveCamera') && repaired.includes('WebGLRenderer')) {
        densityPoints += 30; // Core 3D engine setup
      }
      if (repaired.includes('AmbientLight') || repaired.includes('DirectionalLight') || repaired.includes('HemisphereLight')) {
        densityPoints += 25; // 3D Lighting
      } else {
        missingFeatures.push('Iluminación 3D (AmbientLight / DirectionalLight)');
      }
      if (repaired.includes('keydown') || repaired.includes('addEventListener') || repaired.includes('click')) {
        densityPoints += 25; // Controls & Interaction
      } else {
        missingFeatures.push('Controles de juego (Teclado WASD/Flechas o Clics)');
      }
      if (repaired.includes('score') || repaired.includes('Puntuación') || repaired.includes('playBtn') || repaired.includes('JUGAR')) {
        densityPoints += 20; // HUD & Game loop
      } else {
        missingFeatures.push('HUD flotante con marcador de puntuación y botón JUGAR');
      }

    } else {
      // DOMAIN B: 2D Web Apps / SaaS / E-Commerce
      const hasTransitions = /transition-all|transition-colors|duration-|ease-in-out/i.test(repaired);
      const hasHovers = /hover:scale-|hover:bg-|hover:border-|hover:shadow-|active:scale-/i.test(repaired);
      if (hasTransitions && hasHovers) {
        densityPoints += 25;
      } else {
        missingFeatures.push('Micro-interacciones visuales (hover:scale-105, active:scale-95, transition-all)');
      }

      const hasAudio = /playSynthSound/i.test(repaired) || /AudioContext/i.test(repaired);
      if (hasAudio) {
        densityPoints += 20;
      } else {
        missingFeatures.push('Efectos de sonido interactivos con AudioContext');
      }

      const hasPersistence = /localStorage|NONA_DB/i.test(repaired);
      if (hasPersistence) {
        densityPoints += 20;
      } else {
        missingFeatures.push('Persistencia de datos en localStorage');
      }

      const hasTailwindGlass = /backdrop-blur|bg-slate-900|bg-opacity|shadow-xl|rounded-2xl|rounded-3xl|shadow-lg/i.test(repaired);
      if (hasTailwindGlass) {
        densityPoints += 20;
      } else {
        missingFeatures.push('Diseño visual premium con tarjetas backdrop-blur y sombras');
      }

      const hasResponsive = /sm:|md:|lg:|max-w-|mobile/i.test(repaired);
      if (hasResponsive) {
        densityPoints += 15;
      } else {
        missingFeatures.push('Diseño responsive adaptado a móvil y escritorio (sm:, md:, lg:)');
      }
    }

    const visualDensityScore = densityPoints;
    const needsVisualEnrichment = visualDensityScore < 70 && errors.length === 0;
    const isValid = errors.length === 0 && !needsVisualEnrichment;

    let enrichmentPrompt: string | undefined;
    if (needsVisualEnrichment || errors.length > 0) {
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
      needsVisualEnrichment,
      enrichmentPrompt,
      repairedCode: repaired,
    };
  }
}

export const qaTesterAgent = new QATesterAgent();
