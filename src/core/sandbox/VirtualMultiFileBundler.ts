/**
 * VirtualMultiFileBundler
 * 
 * Compilador y empaquetador multi-archivo en cliente (Navegador).
 * Permite previsualizar instantáneamente proyectos React + TypeScript + Tailwind
 * con múltiples archivos modulares sin depender de un servidor externo.
 */

export interface BundlerResult {
  srcDoc: string;
  transpiledFilesCount: number;
  entryPoint: string;
  errors: string[];
}

export class VirtualMultiFileBundler {
  /**
   * Transpila código TypeScript y JSX simple a JavaScript estándar ejecutable por el navegador.
   * Remueve anotaciones de tipo de TypeScript y compila elementos JSX a llamadas de createElement
   * o deja JSX para el runtime de Babel Standalone si está cargado.
   */
  public static transpileTypeScript(code: string): string {
    let clean = code;

    // 1. Remover imports de tipos: "import type { ... } from '...';"
    clean = clean.replace(/import\s+type\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
    clean = clean.replace(/export\s+type\s+[\s\S]*?;/g, '');

    // 2. Remover interfaces y type aliases
    clean = clean.replace(/export\s+interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?\}/g, '');
    clean = clean.replace(/interface\s+[A-Za-z0-9_]+\s*\{[\s\S]*?\}/g, '');
    clean = clean.replace(/export\s+type\s+[A-Za-z0-9_]+\s*=\s*[\s\S]*?;/g, '');
    clean = clean.replace(/type\s+[A-Za-z0-9_]+\s*=\s*[\s\S]*?;/g, '');

    // 3. Remover anotaciones de tipos primitivos, React y PascalCase: ": React.FC<...>", ": string", ": number", ": ClassValue[]", ": UserProfile"
    clean = clean.replace(/:\s*React\.[A-Za-z0-9_]+(?:<[^>]+>)?/g, '');
    clean = clean.replace(/:\s*(?:string|number|boolean|any|void|unknown)(?:\[\])?(?=[\s,=);])/g, '');
    clean = clean.replace(/:\s*[A-Z][A-Za-z0-9_]*(?:<[^>]+>)?(?:\[\])?(?=[\s,=);])/g, '');

    // 4. Remover "as const", "as any", "as string"
    clean = clean.replace(/\s+as\s+[A-Za-z0-9_<>[\], ]+/g, '');

    // 5. Remover el operador non-null assertion postfijo: "document.getElementById('root')!", "user!.prop"
    clean = clean.replace(/([a-zA-Z0-9_\)\]])!\s*([.;,\)\]\n\r])/g, '$1$2');

    // 6. Remover tipos genéricos en llamadas comunes de React hooks: useState<User[]>([]), useRef<HTMLDivElement>(null)
    clean = clean.replace(/(useState|useRef|useMemo|useCallback)<[^>]+>\(/g, '$1(');

    return clean;
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

    // 2. Construir Import Map con paquetes CDN externos estándar (React 18, Lucide, Supabase, etc.)
    const importMap: Record<string, string> = {
      "react": "https://esm.sh/react@18.3.1?dev",
      "react-dom": "https://esm.sh/react-dom@18.3.1?dev",
      "react-dom/client": "https://esm.sh/react-dom@18.3.1/client?dev",
      "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime?dev",
      "lucide-react": "https://esm.sh/lucide-react@0.469.0",
      "clsx": "https://esm.sh/clsx@2.1.1",
      "tailwind-merge": "https://esm.sh/tailwind-merge@2.5.5",
      "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2.47.10",
      "canvas-confetti": "https://esm.sh/canvas-confetti@1.9.4"
    };

    // 3. Crear Data URIs para todos los módulos JS/TSX/TS del proyecto
    for (const [p, content] of Object.entries(normalizedFiles)) {
      if (
        p.endsWith('.tsx') ||
        p.endsWith('.ts') ||
        p.endsWith('.jsx') ||
        p.endsWith('.js')
      ) {
        try {
          // Transpilar sintaxis TS a JS
          let processedCode = this.transpileTypeScript(content);

          const encoded = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(processedCode);

          // Registrar todas las variantes de ruta relativa en el import map
          importMap[`./${p}`] = encoded;
          importMap[`/${p}`] = encoded;
          importMap[`${p}`] = encoded;

          // Si termina en .tsx o .ts, registrar también la variante sin extensión
          const withoutExt = p.replace(/\.(tsx|ts|jsx|js)$/, '');
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
          const baseName = p.split('/').pop()!;
          const baseNameWithoutExt = baseName.replace(/\.(tsx|ts|jsx|js)$/, '');
          importMap[`./${baseName}`] = encoded;
          importMap[`./${baseNameWithoutExt}`] = encoded;

          transpiledCount++;
        } catch (e: any) {
          errors.push(`Error empaquetando módulo ${p}: ${e.message}`);
        }
      }
    }

    // 4. Identificar el punto de entrada
    let entryPoint = 'src/main.tsx';
    if (!normalizedFiles['src/main.tsx'] && !normalizedFiles['src/main.jsx']) {
      if (normalizedFiles['src/App.tsx'] || normalizedFiles['src/App.jsx']) {
        entryPoint = 'src/App.tsx';
      } else {
        const anyTsx = Object.keys(normalizedFiles).find(k => k.endsWith('.tsx') || k.endsWith('.jsx'));
        if (anyTsx) entryPoint = anyTsx;
      }
    }

    // 5. Generar script de montaje
    const mountScript = `
      import React from 'react';
      import ReactDOM from 'react-dom/client';
      import EntryComponent from './${entryPoint}';

      const rootEl = document.getElementById('root') || document.getElementById('app') || document.body;
      try {
        if (typeof EntryComponent === 'function') {
          const root = ReactDOM.createRoot(rootEl);
          root.render(React.createElement(EntryComponent));
        } else if (EntryComponent && typeof EntryComponent.default === 'function') {
          const root = ReactDOM.createRoot(rootEl);
          root.render(React.createElement(EntryComponent.default));
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
