/**
 * VirtualMultiFileBundler
 * 
 * Compilador y empaquetador multi-archivo en cliente (Navegador).
 * Permite previsualizar instantáneamente proyectos React + TypeScript + Tailwind
 * con múltiples archivos modulares sin depender de un servidor externo.
 */

import { transform } from 'sucrase';

export interface BundlerResult {
  srcDoc: string;
  transpiledFilesCount: number;
  entryPoint: string;
  errors: string[];
}

export class VirtualMultiFileBundler {
  /**
   * Transpila código TypeScript y JSX a JavaScript estándar ejecutable nativamente por el navegador.
   * Utiliza Sucrase para compilar TSX/TS a React.createElement y remueve tipos en milisegundos.
   */
  public static transpileTypeScript(code: string, filePath = 'file.tsx'): string {
    if (!code || code.trim().length === 0) return '';

    try {
      const isJsx = filePath.endsWith('.tsx') || filePath.endsWith('.jsx') || code.includes('<') || code.includes('React');
      const transforms: ('jsx' | 'typescript')[] = ['typescript'];
      if (isJsx) {
        transforms.push('jsx');
      }

      let transpiled = transform(code, {
        transforms,
        jsxRuntime: 'classic',
        production: true,
      }).code;

      // Garantizar que React esté disponible en el módulo si se generó React.createElement
      // y NO fue importado ni declarado previamente en el módulo.
      const hasReactDeclaration = /(?:^|\n)\s*(?:import\s+[^;]*?\bReact\b[^;]*?from|(?:const|let|var|function|class)\s+React\b)/m.test(transpiled);
      if (transpiled.includes('React.createElement') && !hasReactDeclaration) {
        transpiled = `import React from 'react';\n${transpiled}`;
      }

      // Garantizar que cualquier módulo importado por defecto no rompa la ejecución ESM
      // si sólo definió exports nombrados (ej: export function Toolbar o export const MyComponent)
      if (!transpiled.includes('export default') && (transpiled.includes('export ') || transpiled.includes('exports.'))) {
        const namedMatch = transpiled.match(/export\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z0-9_]+)/);
        if (namedMatch) {
          const exportName = namedMatch[1];
          transpiled = `${transpiled}\nexport default ${exportName};\n`;
        }
      }

      return transpiled;
    } catch (err: any) {
      console.warn(`[VirtualMultiFileBundler] Fallback regex transpile para "${filePath}":`, err.message);
      return this.fallbackRegexTranspile(code);
    }
  }

  /**
   * Fallback de emergencia por expresiones regulares si el compilador encuentra un error sintáctico severo.
   */
  public static fallbackRegexTranspile(code: string): string {
    let clean = code;

    // 1. Remover imports de tipos
    clean = clean.replace(/import\s+type\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
    clean = clean.replace(/export\s+type\s+[\s\S]*?;/g, '');

    // 2. Remover interfaces y type aliases
    clean = clean.replace(/export\s+interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?\}/g, '');
    clean = clean.replace(/interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?\}/g, '');
    clean = clean.replace(/export\s+type\s+[A-Za-z0-9_]+\s*=\s*[\s\S]*?;/g, '');
    clean = clean.replace(/type\s+[A-Za-z0-9_]+\s*=\s*[\s\S]*?;/g, '');

    // 3. Remover anotaciones de tipos primitivos y React
    clean = clean.replace(/:\s*React\.[A-Za-z0-9_]+(?:<[^>]+>)?/g, '');
    clean = clean.replace(/:\s*(?:string|number|boolean|any|void|unknown)(?:\[\])?(?=[\s,=);])/g, '');
    clean = clean.replace(/:\s*[A-Z][A-Za-z0-9_]*(?:<[^>]+>)?(?:\[\])?(?=[\s,=);])/g, '');

    // 4. Remover as cast y non-null assertion
    clean = clean.replace(/\s+as\s+[A-Za-z0-9_<>[\], ]+/g, '');
    clean = clean.replace(/([a-zA-Z0-9_\)\]])!\s*([.;,\)\]\n\r])/g, '$1$2');

    // 5. Remover genéricos en hooks
    clean = clean.replace(/(useState|useRef|useMemo|useCallback)<[^>]+>\(/g, '$1(');

    return clean;
  }

  /**
   * Normaliza una ruta eliminando prefijos './', '/', y resolviendo '.' y '..'.
   */
  public static normalizePath(path: string): string {
    if (!path) return '';
    const clean = path.replace(/^[./]+/, '');
    const parts = clean.split('/');
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === '.' || part === '') continue;
      if (part === '..') {
        if (resolved.length > 0) resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    return resolved.join('/');
  }

  /**
   * Busca si una ruta existe en la lista de archivos disponibles,
   * probando extensiones comunes (.tsx, .ts, .jsx, .js) o /index.*.
   */
  public static findExactOrExtMatch(pathCandidate: string, availableFiles: string[]): string {
    if (availableFiles.includes(pathCandidate)) return pathCandidate;

    const exts = ['.tsx', '.ts', '.jsx', '.js', '.json'];
    for (const ext of exts) {
      if (availableFiles.includes(pathCandidate + ext)) {
        return pathCandidate + ext;
      }
    }

    for (const ext of exts) {
      if (availableFiles.includes(`${pathCandidate}/index${ext}`)) {
        return `${pathCandidate}/index${ext}`;
      }
    }

    if (!pathCandidate.startsWith('src/')) {
      const withSrc = `src/${pathCandidate}`;
      if (availableFiles.includes(withSrc)) return withSrc;
      for (const ext of exts) {
        if (availableFiles.includes(withSrc + ext)) return withSrc + ext;
      }
    }

    if (pathCandidate.startsWith('src/')) {
      const withoutSrc = pathCandidate.slice(4);
      if (availableFiles.includes(withoutSrc)) return withoutSrc;
      for (const ext of exts) {
        if (availableFiles.includes(withoutSrc + ext)) return withoutSrc + ext;
      }
    }

    return pathCandidate;
  }

  /**
   * Resuelve la ruta relativa de un import respecto al archivo que lo importa.
   * Maneja './', '../', y el alias '@/' (típico de Vite/Lovable apuntando a src/).
   */
  public static resolveImportPath(importerPath: string, specifier: string, availableFiles: string[]): string {
    if (specifier.startsWith('@/')) {
      const target = specifier.slice(2);
      const hasSrcDir = availableFiles.some(f => f.startsWith('src/'));
      const candidate = hasSrcDir ? `src/${target}` : target;
      return this.findExactOrExtMatch(candidate, availableFiles);
    }

    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const importerDir = importerPath.includes('/')
        ? importerPath.slice(0, importerPath.lastIndexOf('/'))
        : '';
      const combined = importerDir ? `${importerDir}/${specifier}` : specifier;
      const normalized = this.normalizePath(combined);
      return this.findExactOrExtMatch(normalized, availableFiles);
    }

    const match = this.findExactOrExtMatch(this.normalizePath(specifier), availableFiles);
    if (match) return match;

    return specifier;
  }

  /**
   * Reescribe los imports relativos y con alias de un módulo a especificadores "bare" canónicos
   * (ej: 'app/src/components/Toolbar') para permitir que módulos cargados vía Data URI
   * puedan importar otros módulos sin violar la no-jerarquía de 'data:'.
   * También neutraliza imports directos de CSS ya inyectados en <style>.
   */
  public static rewriteImports(code: string, currentFilePath: string, availableFiles: string[]): string {
    let result = code;

    // 1. Neutralizar imports de CSS (ya inyectados globalmente en <style>)
    result = result.replace(/import\s+['"][^'"]+\.css['"];?/g, '/* [inlined-css] */');
    result = result.replace(/import\s+([A-Za-z0-9_]+)\s+from\s+['"][^'"]+\.css['"];?/g, 'const $1 = {}; /* [inlined-css] */');

    // 2. Reescribir imports/exports estáticos:
    // import ... from './...' | export ... from './...'
    result = result.replace(
      /\b(import|export)\s+([^;]+?)\bfrom\s+(['"])([^'"]+)\3/g,
      (match, action, clause, quote, specifier) => {
        if (!specifier.startsWith('.') && !specifier.startsWith('@/') && !availableFiles.includes(specifier)) {
          return match;
        }

        const resolved = this.resolveImportPath(currentFilePath, specifier, availableFiles);
        const canonicalBare = `app/${resolved.replace(/\.(tsx|ts|jsx|js)$/, '')}`;
        return `${action} ${clause}from ${quote}${canonicalBare}${quote}`;
      }
    );

    // 3. Reescribir side-effect imports no CSS (ej: import './polyfills';)
    result = result.replace(
      /\bimport\s+(['"])([^'"]+)\1\s*;?/g,
      (match, quote, specifier) => {
        if (!specifier.startsWith('.') && !specifier.startsWith('@/')) {
          return match;
        }
        if (specifier.endsWith('.css')) {
          return '/* [inlined-css] */';
        }
        const resolved = this.resolveImportPath(currentFilePath, specifier, availableFiles);
        const canonicalBare = `app/${resolved.replace(/\.(tsx|ts|jsx|js)$/, '')}`;
        return `import ${quote}${canonicalBare}${quote};`;
      }
    );

    // 4. Reescribir dynamic imports: import('./...')
    result = result.replace(
      /\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
      (match, quote, specifier) => {
        if (!specifier.startsWith('.') && !specifier.startsWith('@/')) {
          return match;
        }
        const resolved = this.resolveImportPath(currentFilePath, specifier, availableFiles);
        const canonicalBare = `app/${resolved.replace(/\.(tsx|ts|jsx|js)$/, '')}`;
        return `import(${quote}${canonicalBare}${quote})`;
      }
    );

    return result;
  }

  /**
   * Genera el documento HTML completo (srcDoc) con Import Maps para ejecutar
   * la aplicación React multi-archivo en un iframe seguro.
   */
  public static bundle(files: Record<string, string>): BundlerResult {
    const errors: string[] = [];
    let transpiledCount = 0;

    // Normalizar mapa de rutas
    const normalizedFiles: Record<string, string> = {};
    for (const [p, content] of Object.entries(files)) {
      const cleanPath = p.replace(/^(\.\/|\/)/, '');
      normalizedFiles[cleanPath] = content;
    }

    // 1. Recopilar estilos CSS
    let inlinedCSS = '';
    for (const [p, content] of Object.entries(normalizedFiles)) {
      if (p.endsWith('.css')) {
        inlinedCSS += `\n/* File: ${p} */\n${content}\n`;
      }
    }

    // 2. Construir Import Map con paquetes CDN externos estándar (React 18, Lucide, Supabase, Three, Cannon, Tone, Chart.js, etc.)
    const importMap: Record<string, string> = {
      "react": "https://esm.sh/react@18.3.1",
      "react-dom": "https://esm.sh/react-dom@18.3.1",
      "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
      "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
      "lucide-react": "https://esm.sh/lucide-react@0.469.0?external=react,react-dom",
      "clsx": "https://esm.sh/clsx@2.1.1",
      "tailwind-merge": "https://esm.sh/tailwind-merge@2.5.5",
      "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2.47.10",
      "canvas-confetti": "https://esm.sh/canvas-confetti@1.9.4",
      "framer-motion": "https://esm.sh/framer-motion@11.11.17?external=react,react-dom",
      "three": "https://esm.sh/three@0.170.0",
      "three/addons/": "https://esm.sh/three@0.170.0/examples/jsm/",
      "three/examples/jsm/": "https://esm.sh/three@0.170.0/examples/jsm/",
      "three/addons/controls/OrbitControls": "https://esm.sh/three@0.170.0/examples/jsm/controls/OrbitControls.js",
      "three/addons/controls/OrbitControls.js": "https://esm.sh/three@0.170.0/examples/jsm/controls/OrbitControls.js",
      "three/examples/jsm/controls/OrbitControls": "https://esm.sh/three@0.170.0/examples/jsm/controls/OrbitControls.js",
      "three/examples/jsm/controls/OrbitControls.js": "https://esm.sh/three@0.170.0/examples/jsm/controls/OrbitControls.js",
      "three-stdlib": "https://esm.sh/three-stdlib@2.30.0?external=three",
      "cannon-es": "https://esm.sh/cannon-es@0.20.0",
      "tone": "https://esm.sh/tone@14.8.49",
      "chart.js": "https://esm.sh/chart.js@4.4.7",
      "chart.js/auto": "https://esm.sh/chart.js@4.4.7/auto"
    };

    // 3. Crear Data URIs para todos los módulos JS/TSX/TS del proyecto
    const moduleFileKeys = Object.keys(normalizedFiles).filter(p =>
      p.endsWith('.tsx') || p.endsWith('.ts') || p.endsWith('.jsx') || p.endsWith('.js')
    );

    for (const p of moduleFileKeys) {
      const content = normalizedFiles[p];
      try {
        // Transpilar sintaxis TS a JS
        let processedCode = this.transpileTypeScript(content, p);

        // Reescribir imports relativos a bare specifiers canónicos y neutralizar CSS inlined
        processedCode = this.rewriteImports(processedCode, p, moduleFileKeys);

        const encoded = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(processedCode);

        const withoutExt = p.replace(/\.(tsx|ts|jsx|js)$/, '');
        const baseName = p.split('/').pop()!;
        const baseNameWithoutExt = baseName.replace(/\.(tsx|ts|jsx|js)$/, '');

        // Registrar bare specifiers canónicos bajo el espacio de nombres app/
        // Esto permite que los módulos cargados vía Data URI puedan importar sin error de esquema
        importMap[`app/${p}`] = encoded;
        importMap[`app/${withoutExt}`] = encoded;

        if (p.startsWith('src/')) {
          const relToSrc = p.slice('src/'.length);
          const relToSrcNoExt = withoutExt.slice('src/'.length);
          importMap[`app/${relToSrc}`] = encoded;
          importMap[`app/${relToSrcNoExt}`] = encoded;
        }

        importMap[`app/${baseName}`] = encoded;
        importMap[`app/${baseNameWithoutExt}`] = encoded;

        // Registrar variantes relativas y estándar para compatibilidad total
        importMap[`./${p}`] = encoded;
        importMap[`/${p}`] = encoded;
        importMap[`${p}`] = encoded;

        importMap[`./${withoutExt}`] = encoded;
        importMap[`/${withoutExt}`] = encoded;
        importMap[`${withoutExt}`] = encoded;

        // Soporte para alias de arquitectura Lovable / Vite (@/ y subcarpetas)
        if (p.startsWith('src/')) {
          const relToSrc = p.slice('src/'.length);
          const relToSrcNoExt = withoutExt.slice('src/'.length);

          importMap[`@/${relToSrc}`] = encoded;
          importMap[`@/${relToSrcNoExt}`] = encoded;
          importMap[`./${relToSrc}`] = encoded;
          importMap[`./${relToSrcNoExt}`] = encoded;
          importMap[`../${relToSrc}`] = encoded;
          importMap[`../${relToSrcNoExt}`] = encoded;
          importMap[`${relToSrc}`] = encoded;
          importMap[`${relToSrcNoExt}`] = encoded;
        }

        // Registrar también por nombre base
        importMap[`./${baseName}`] = encoded;
        importMap[`./${baseNameWithoutExt}`] = encoded;

        transpiledCount++;
      } catch (e: any) {
        errors.push(`Error empaquetando módulo ${p}: ${e.message}`);
      }
    }

    // 4. Identificar el punto de entrada con priorización robusta
    const hasMain = Boolean(normalizedFiles['src/main.tsx'] || normalizedFiles['src/main.jsx'] || normalizedFiles['src/main.js']);
    let entryPoint = hasMain 
      ? (normalizedFiles['src/main.tsx'] ? 'src/main.tsx' : normalizedFiles['src/main.jsx'] ? 'src/main.jsx' : 'src/main.js') 
      : 'src/App.tsx';

    if (!hasMain && !normalizedFiles['src/App.tsx'] && !normalizedFiles['src/App.jsx'] && !normalizedFiles['src/App.js']) {
      // Prioridad 1: cualquier archivo con App en el nombre o que defina App
      const appKey = Object.keys(normalizedFiles).find(k => 
        (k.endsWith('.tsx') || k.endsWith('.jsx')) && 
        (/\bApp\b/i.test(k) || (normalizedFiles[k] && /\bfunction App\b/.test(normalizedFiles[k])))
      );
      if (appKey) {
        entryPoint = appKey;
      } else {
        // Prioridad 2: primer archivo que exporte un componente por defecto
        const defExportKey = Object.keys(normalizedFiles).find(k => 
          (k.endsWith('.tsx') || k.endsWith('.jsx')) && 
          normalizedFiles[k] && normalizedFiles[k].includes('export default')
        );
        if (defExportKey) {
          entryPoint = defExportKey;
        } else {
          // Prioridad 3: cualquier TSX / JSX en el proyecto
          const anyTsx = Object.keys(normalizedFiles).find(k => k.endsWith('.tsx') || k.endsWith('.jsx'));
          if (anyTsx) entryPoint = anyTsx;
        }
      }
    }

    // 5. Generar script de montaje inmune a syntax errors de export default y fallos de resolución de Data URIs
    const entryBare = 'app/' + entryPoint.replace(/\.(tsx|ts|jsx|js)$/, '');
    const appBare = (normalizedFiles['src/App.tsx'] || normalizedFiles['src/App.jsx'] || normalizedFiles['src/App.js'])
      ? 'app/src/App'
      : entryBare;

    const mountScript = hasMain
      ? `
        try {
          import('${entryBare}').then(module => {
            // Verificación de respaldo: si main.tsx no renderizó en #root tras un instante, intentar montar App directamente
            setTimeout(() => {
              const rootEl = document.getElementById('root');
              if (rootEl && rootEl.childElementCount === 0) {
                import('${appBare}').then(appMod => {
                  const Comp = appMod.default || appMod.App || Object.values(appMod).find(v => typeof v === 'function');
                  if (Comp) {
                    import('react').then(React => {
                      import('react-dom/client').then(ReactDOM => {
                        const root = ReactDOM.createRoot(rootEl);
                        root.render(React.createElement(Comp));
                      });
                    });
                  }
                }).catch(() => {});
              }
            }, 300);
          }).catch(err => {
            console.error('[NONA Virtual Runner Error]:', err);
            window.parent.postMessage({
              type: 'SANDBOX_RUNTIME_ERROR',
              level: 'error',
              msg: String(err && err.message ? err.message : err)
            }, '*');
          });
        } catch (err) {
          console.error('[NONA Virtual Runner Error]:', err);
          window.parent.postMessage({
            type: 'SANDBOX_RUNTIME_ERROR',
            level: 'error',
            msg: String(err && err.message ? err.message : err)
          }, '*');
        }
      `
      : `
        import React from 'react';
        import ReactDOM from 'react-dom/client';
        import * as EntryModule from '${entryBare}';

        const rootEl = document.getElementById('root') || document.getElementById('app') || document.body;
        try {
          let Comp = EntryModule.default;
          if (!Comp || (typeof Comp !== 'function' && !(Comp && Comp.$$typeof))) {
            Comp = EntryModule.App ||
                   EntryModule.Main ||
                   Object.values(EntryModule).find(v => typeof v === 'function' || (v && typeof v === 'object' && v.$$typeof)) ||
                   EntryModule;
          }
          if (typeof Comp === 'function' || (Comp && typeof Comp === 'object' && Comp.$$typeof)) {
            const root = ReactDOM.createRoot(rootEl);
            root.render(React.createElement(Comp));
          } else {
            console.warn('[NONA Virtual Runner]: Componente exportado no es invocable directamente:', Comp);
          }
        } catch (err) {
          console.error('[NONA Virtual Runner Error]:', err);
          window.parent.postMessage({
            type: 'SANDBOX_RUNTIME_ERROR',
            level: 'error',
            msg: String(err && err.message ? err.message : err)
          }, '*');
        }
      `;

    // 6. Scripts de captura de logs y errores
    const captureScripts = `
      <script>
        (function() {
          const _log = console.log;
          const _err = console.error;
          const _warn = console.warn;
          console.log = function(...args) {
            try {
              window.parent.postMessage({ type: 'NONA_LOG', level: 'info', msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
            } catch(e) {}
            _log.apply(console, args);
          };
          console.error = function(...args) {
            try {
              window.parent.postMessage({ type: 'NONA_LOG', level: 'error', msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
            } catch(e) {}
            _err.apply(console, args);
          };
          console.warn = function(...args) {
            try {
              window.parent.postMessage({ type: 'NONA_LOG', level: 'warn', msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
            } catch(e) {}
            _warn.apply(console, args);
          };
          window.onerror = function(msg, src, lineno, colno, err) {
            try {
              window.parent.postMessage({
                type: 'SANDBOX_RUNTIME_ERROR',
                level: 'error',
                msg: String(msg),
                source: String(src || ''),
                line: lineno
              }, '*');
            } catch(e) {}
          };
        })();
      </script>
    `;

    const srcDoc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NONA Multi-File Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${inlinedCSS}
  </style>
  ${captureScripts}
  <script type="importmap">
    ${JSON.stringify({ imports: importMap }, null, 2)}
  </script>
</head>
<body class="bg-slate-950 text-white min-h-screen">
  <div id="root"></div>
  <div id="app"></div>
  <script type="module">
    ${mountScript}
  </script>
</body>
</html>`;

    return {
      srcDoc,
      transpiledFilesCount: transpiledCount,
      entryPoint,
      errors
    };
  }
}
