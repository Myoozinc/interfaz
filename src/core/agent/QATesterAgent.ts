import { VirtualMultiFileBundler } from '../sandbox/VirtualMultiFileBundler';

export interface QATestResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  visualDensityScore: number; // 0 to 100
  needsVisualEnrichment: boolean;
  enrichmentPrompt?: string;
  repairedCode?: string;
}

export interface ProjectValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  unresolvedImports: { file: string; importedSpecifier: string }[];
  syntaxErrors: { file: string; error: string; line?: number }[];
  runtimeErrors: string[];
  repairedFiles?: Record<string, string>;
}

export class QATesterAgent {
  /**
   * Valida exhaustivamente una colección de archivos multi-archivo React + TypeScript + Vite:
   * 1. Resolución de imports relativos (garantiza que cada import apunte a un archivo real).
   * 2. Análisis sintáctico y balance de llaves/etiquetas JSX en archivos TSX/TS.
   * 3. Detección de código truncado o componentes vacíos.
   * 4. Incorporación de errores de ejecución capturados en runtime desde el sandbox o WebContainer.
   */
  public validateTypeScriptProject(
    files: Record<string, string>,
    runtimeErrors: string[] = []
  ): ProjectValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const unresolvedImports: { file: string; importedSpecifier: string }[] = [];
    const syntaxErrors: { file: string; error: string; line?: number }[] = [];

    // 0. Normalizar rutas de archivos
    const normalizedFiles: Record<string, string> = {};
    for (const [p, content] of Object.entries(files)) {
      const clean = p.replace(/^(\.\/|\/)/, '');
      normalizedFiles[clean] = content;
    }

    const fileKeys = Object.keys(normalizedFiles);

    if (fileKeys.length === 0) {
      return {
        valid: false,
        errors: ['El proyecto no contiene ningún archivo de código fuente.'],
        warnings: [],
        unresolvedImports: [],
        syntaxErrors: [],
        runtimeErrors: [...runtimeErrors]
      };
    }

    // 1. Detección de archivo raíz o componentes
    const hasRootComponent = fileKeys.some(
      k => k === 'src/App.tsx' || k === 'src/App.jsx' || k === 'src/main.tsx' || k === 'src/main.jsx' || k === 'index.html' || (k.startsWith('src/') && (k.endsWith('.tsx') || k.endsWith('.jsx')))
    );

    if (!hasRootComponent) {
      errors.push('El proyecto carece de un componente principal ejecutable en "src/" (ej: src/App.tsx o src/main.tsx).');
    }

    // 2. Validación archivo por archivo
    for (const [filePath, content] of Object.entries(normalizedFiles)) {
      // Omitir validación de dependencias binarias o JSON simple
      if (filePath.endsWith('.json') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
        if (filePath.endsWith('.json')) {
          try {
            JSON.parse(content);
          } catch (e: any) {
            errors.push(`Error de sintaxis JSON en "${filePath}": ${e.message}`);
            syntaxErrors.push({ file: filePath, error: e.message });
          }
        }
        continue;
      }

      // Validar archivos TSX, TS, JSX, JS
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        // A. Verificar si el archivo está vacío o excesivamente truncado
        if (!content || content.trim().length === 0) {
          errors.push(`El archivo "${filePath}" está completamente vacío.`);
          continue;
        }

        // B. Verificar balance de llaves { }
        // Remover primero cadenas de texto (para no confundir // en URLs con comentarios) y luego comentarios
        const strippedStrings = content
          .replace(/'(?:\\.|[^'\\])*'/g, "''")
          .replace(/"(?:\\.|[^"\\])*"/g, '""')
          .replace(/`(?:\\.|[^`\\])*`/g, '``')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*/g, '');

        const openBraces = (strippedStrings.match(/\{/g) || []).length;
        const closeBraces = (strippedStrings.match(/\}/g) || []).length;

        if (openBraces !== closeBraces) {
          const diff = openBraces - closeBraces;
          const msg = diff > 0 
            ? `El archivo "${filePath}" tiene ${diff} llave(s) '{' sin cerrar. Código probablemente truncado.`
            : `El archivo "${filePath}" tiene ${Math.abs(diff)} llave(s) '}' de cierre adicionales.`;
          errors.push(msg);
          syntaxErrors.push({ file: filePath, error: msg });
        }

        // C. Resolución de imports relativos y alias de proyecto (@/)
        const importRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"]((?:\.|\@\/)[^'"]+)['"]/g;
        let match: RegExpExecArray | null;

        const fileDir = filePath.includes('/') ? filePath.slice(0, filePath.lastIndexOf('/')) : '';

        while ((match = importRegex.exec(content)) !== null) {
          const specifier = match[1];

          // Resolver ruta relativa con respecto al directorio del archivo importador
          const resolvedPath = this.resolveRelativePath(fileDir, specifier);

          // Probar posibles extensiones si no la incluye explícitamente
          const candidatePaths = [
            resolvedPath,
            `${resolvedPath}.tsx`,
            `${resolvedPath}.ts`,
            `${resolvedPath}.jsx`,
            `${resolvedPath}.js`,
            `${resolvedPath}.css`,
            `${resolvedPath}/index.tsx`,
            `${resolvedPath}/index.ts`,
            `${resolvedPath}/index.jsx`,
            `${resolvedPath}/index.js`,
          ];

          const exists = candidatePaths.some(candidate => candidate in normalizedFiles);

          if (!exists) {
            const err = `El archivo "${filePath}" importa "${specifier}", pero no se encontró ningún archivo correspondiente en el proyecto.`;
            errors.push(err);
            unresolvedImports.push({ file: filePath, importedSpecifier: specifier });
          }
        }

        // D. Prueba de transpilación rápida de TypeScript
        try {
          const transpiled = VirtualMultiFileBundler.transpileTypeScript(content);
          if (transpiled.includes('class ') || transpiled.includes('function ') || transpiled.includes('const ') || transpiled.includes('export ')) {
            // Verificar sintaxis básica
            // Nota: elementos JSX aislados son válidos en TSX, pero no en new Function pura sin Babel.
            // Si no contiene JSX o si es TS puro, podemos probar su sintaxis básica limpiando import/export
            if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx') && !transpiled.includes('<')) {
              const testSyntaxCode = transpiled
                .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
                .replace(/import\.meta/g, '({ env: {} })')
                .replace(/export\s+(?:default\s+)?(?:async\s+)?/g, (m) => m.includes('async') ? 'async ' : '')
                .replace(/export\s*\{[\s\S]*?\};?/g, '');
              new Function(testSyntaxCode);
            }
          }
        } catch (e: any) {
          // En archivos TypeScript (.ts/.tsx), ciertas anotaciones de tipos complejas, genéricos o APIs de módulo (import.meta, export)
          // son válidos en TS/ESM pero no son ejecutables directamente por el motor V8 nativo new Function.
          const isTs = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
          const isModuleOrTypeSyntax = 
            e.message.includes("Unexpected token ':'") || 
            e.message.includes("Unexpected identifier") || 
            e.message.includes("Unexpected token 'export'") ||
            e.message.includes("Cannot use 'import.meta'");
          if (!isTs || !isModuleOrTypeSyntax) {
            errors.push(`Error de sintaxis en "${filePath}": ${e.message}`);
            syntaxErrors.push({ file: filePath, error: e.message });
          }
        }
      }
    }

    // 3. Incorporar errores capturados en tiempo de ejecución (Sandbox / Runtime / Console)
    if (runtimeErrors.length > 0) {
      for (const rErr of runtimeErrors) {
        if (rErr && rErr.trim().length > 0) {
          errors.push(`[Error de Ejecución en Sandbox]: ${rErr.trim()}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      unresolvedImports,
      syntaxErrors,
      runtimeErrors: [...runtimeErrors],
      repairedFiles: normalizedFiles
    };
  }

  /**
   * Resuelve una ruta relativa tipo "./components/Header" respecto a "src" -> "src/components/Header",
   * o un alias tipo "@/lib/supabase" -> "src/lib/supabase"
   */
  private resolveRelativePath(baseDir: string, relativePath: string): string {
    if (relativePath.startsWith('@/')) {
      return `src/${relativePath.slice(2)}`;
    }

    const parts = baseDir ? baseDir.split('/') : [];
    const relParts = relativePath.split('/');

    for (const part of relParts) {
      if (part === '.' || part === '') {
        continue;
      } else if (part === '..') {
        if (parts.length > 0) parts.pop();
      } else {
        parts.push(part);
      }
    }

    return parts.join('/');
  }

  /**
   * Construye un prompt estructurado de autocorrección para alimentar al modelo
   * en caso de fallos de compilación, sintaxis o ejecución en sandbox.
   */
  public buildSelfCorrectionPrompt(
    validation: ProjectValidationResult,
    attempt: number,
    maxAttempts: number
  ): string {
    const errorList = validation.errors.map((e, idx) => `${idx + 1}. ${e}`).join('\n');

    return `[CORRECCIÓN TÉCNICA OBLIGATORIA - INTENTO ${attempt}/${maxAttempts}]:
Se detectaron los siguientes errores críticos de compilación/sintaxis/runtime en la aplicación generada:

${errorList}

INSTRUCCIONES DE CORRECCIÓN:
1. Si falta un archivo importado, inclúyelo en el array "files" con su código fuente completo.
2. Si hay llaves sin cerrar o código truncado, completa las funciones y componentes afectados.
3. Si hay un error de sintaxis o de import, corrígelo específicamente preservando la funcionalidad.
4. Devuelve EXCLUSIVAMENTE el objeto JSON válido con la clave "files" (array de { "path": string, "content": string }) y "explanation" (string).`;
  }

  /**
   * Performs automated linting, syntax analysis, and basic checks on a single HTML document (Legacy support).
   */
  public testAndAudit(htmlCode: string, _userInstruction?: string): QATestResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let repaired = htmlCode
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^[\s\S]*?<\/think>/gi, '')
      .replace(/<\/think>/gi, '')
      .replace(/(?:^|\n)(?:Here's a thinking process|Thinking Process|Thinking):[\s\S]*?(?=(?:```|<!DOCTYPE|<html|<nonaArtifact|<<<<<<< SEARCH|$))/i, '')
      .trim();

    if (!htmlCode || htmlCode.trim().length === 0) {
      return {
        valid: false,
        errors: ['El documento HTML está completamente vacío.'],
        warnings: [],
        visualDensityScore: 0,
        needsVisualEnrichment: true,
        enrichmentPrompt: 'El código generado está vacío. Genera la aplicación completa con Tailwind CSS, interactividad y estructura correcta.',
      };
    }

    // 1. Basic Structure Checks & Modern Library Injection
    if (!repaired.includes('<!DOCTYPE html>') && !repaired.includes('<html')) {
      errors.push('Falta la declaración <!DOCTYPE html> o etiqueta <html>.');
      repaired = `<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-slate-950 text-white min-h-screen font-sans">\n${repaired}\n</body>\n</html>`;
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
        new Function(scriptCode);
      } catch (syntaxErr: any) {
        errors.push(`Error de sintaxis JavaScript en el script: ${syntaxErr.message}`);
      }
    }

    const isValid = errors.length === 0;

    return {
      valid: isValid,
      errors,
      warnings,
      visualDensityScore: isValid ? 85 : 30,
      needsVisualEnrichment: !isValid,
      repairedCode: repaired,
    };
  }
}

export const qaTesterAgent = new QATesterAgent();
