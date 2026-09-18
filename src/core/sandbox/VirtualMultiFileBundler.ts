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

    // 1b. Transformar imports nombrados de lucide-react para que nunca fallen si la IA inventa un icono
    result = result.replace(
      /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g,
      (_match, namesStr) => {
        const names = namesStr.split(',').map((n: string) => n.trim()).filter(Boolean);
        const decls = names.map((n: string) => {
          if (n.includes(' as ')) {
            const [orig, alias] = n.split(' as ').map((s: string) => s.trim());
            return `const ${alias} = LucideModule.Lucide[${JSON.stringify(orig)}];`;
          }
          return `const ${n} = LucideModule.Lucide[${JSON.stringify(n)}];`;
        }).join(' ');
        return `import * as LucideModule from 'lucide-react'; ${decls}`;
      }
    );

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

    // 2. Construir Shims Locales Resilientes para React, ReactDOM, Three, Tone y Lucide
    const reactShimCode = `
      const R = window.React || {};
      export default R;
      export const {
        useState, useEffect, useContext, useReducer, useCallback, useMemo,
        useRef, useImperativeHandle, useLayoutEffect, useDebugValue,
        useDeferredValue, useTransition, useId, useInsertionEffect,
        useSyncExternalStore, createElement, createRef, Component,
        PureComponent, createContext, forwardRef, lazy, memo, Fragment,
        Children, cloneElement, isValidElement, version, startTransition
      } = R;
    `;
    const reactShimUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(reactShimCode);

    const reactDomShimCode = `
      const RDOM = window.ReactDOM || {};
      export default RDOM;
      export const {
        render, hydrate, unmountComponentAtNode, findDOMNode,
        createPortal, version
      } = RDOM;
    `;
    const reactDomShimUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(reactDomShimCode);

    const reactDomClientShimCode = `
      const RDOM = window.ReactDOM || {};
      export const createRoot = RDOM.createRoot || function(container) {
        return {
          render(element) { RDOM.render(element, container); },
          unmount() { RDOM.unmountComponentAtNode(container); }
        };
      };
      export const hydrateRoot = RDOM.hydrateRoot || function(container, element) {
        return {
          render(el) { RDOM.hydrate(el, container); },
          unmount() { RDOM.unmountComponentAtNode(container); }
        };
      };
      export default { createRoot, hydrateRoot };
    `;
    const reactDomClientShimUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(reactDomClientShimCode);

    const reactJsxRuntimeShimCode = `
      const R = window.React || {};
      export const jsx = (type, props, key) => R.createElement(type, key !== undefined ? { ...props, key } : props);
      export const jsxs = jsx;
      export const Fragment = R.Fragment || 'Fragment';
    `;
    const reactJsxRuntimeShimUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(reactJsxRuntimeShimCode);

    const threeShimCode = `
      const T = window.THREE || {};
      export default T;
      export const {
        Scene, PerspectiveCamera, OrthographicCamera, WebGLRenderer,
        BoxGeometry, SphereGeometry, CylinderGeometry, ConeGeometry,
        TorusGeometry, PlaneGeometry, RingGeometry, DodecahedronGeometry,
        BufferGeometry, Float32BufferAttribute, BufferAttribute,
        MeshStandardMaterial, MeshBasicMaterial, MeshPhysicalMaterial,
        MeshLambertMaterial, MeshDepthMaterial, PointsMaterial,
        Mesh, Points, Line, Group, Color, Vector2, Vector3, Vector4,
        Matrix3, Matrix4, Quaternion, Euler, Raycaster, Clock,
        DirectionalLight, AmbientLight, PointLight, SpotLight, HemisphereLight,
        TextureLoader, PCFSoftShadowMap, Fog, FogExp2, AdditiveBlending
      } = T;
    `;
    const threeShimUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(threeShimCode);

    const orbitControlsShimCode = `
      const OC = (window.THREE && window.THREE.OrbitControls) || window.OrbitControls || function(cam, dom) {
        this.update = function() {};
        this.dispose = function() {};
      };
      export const OrbitControls = OC;
      export default OC;
    `;
    const orbitControlsShimUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(orbitControlsShimCode);

    const clsxShimCode = `
      export function clsx(...inputs) {
        const classes = [];
        for (const input of inputs) {
          if (!input) continue;
          if (typeof input === 'string' || typeof input === 'number') {
            classes.push(input);
          } else if (Array.isArray(input)) {
            const inner = clsx(...input);
            if (inner) classes.push(inner);
          } else if (typeof input === 'object') {
            for (const [k, v] of Object.entries(input)) {
              if (v) classes.push(k);
            }
          }
        }
        return classes.join(' ');
      }
      export default clsx;
    `;
    const clsxShimUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(clsxShimCode);

    const twMergeShimCode = `
      import clsx from 'clsx';
      export function twMerge(...inputs) {
        return clsx(...inputs);
      }
      export default twMerge;
    `;
    const twMergeShimUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(twMergeShimCode);

    const confettiShimCode = `
      const c = window.confetti || function() { console.log('🎉 Confetti'); };
      export default c;
      export const confetti = c;
    `;
    const confettiShimUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(confettiShimCode);

    const toneShimCode = `
      const T = window.Tone || {};
      export default T;
    `;
    const toneShimUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(toneShimCode);

    const lucideReactShimCode = `
      const R = window.React || {};
      
      export function createLucideIcon(iconName) {
        return function DynamicIcon(props) {
          const p = props || {};
          const size = p.size || p.width || 20;
          const color = p.color || 'currentColor';
          const strokeWidth = p.strokeWidth || 2;
          const className = p.className || '';
          const lucideGlobal = window.lucide;
          
          if (lucideGlobal && lucideGlobal.icons) {
            const kebab = iconName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            const iconDef = lucideGlobal.icons[kebab] || lucideGlobal.icons[iconName.toLowerCase()] || lucideGlobal.icons[iconName];
            if (iconDef && typeof iconDef.toSvg === 'function') {
              return R.createElement('span', {
                className: 'inline-flex items-center justify-center ' + className,
                dangerouslySetInnerHTML: { __html: iconDef.toSvg({ width: size, height: size, color, 'stroke-width': strokeWidth, class: className }) }
              });
            }
          }
          
          return R.createElement('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: size,
            height: size,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: color,
            strokeWidth: strokeWidth,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            className: 'lucide-icon ' + className,
            ...p
          }, R.createElement('polygon', { points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' }));
        };
      }

      const iconCache = {};
      export const Lucide = new Proxy({}, {
        get(_, prop) {
          if (typeof prop !== 'string') return undefined;
          if (!iconCache[prop]) iconCache[prop] = createLucideIcon(prop);
          return iconCache[prop];
        }
      });
      export default Lucide;
    `;
    const lucideReactShimUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(lucideReactShimCode);

    // 2b. Construir Import Map con resolución local y paquetes externos
    const importMap: Record<string, string> = {
      "react": reactShimUri,
      "react-dom": reactDomShimUri,
      "react-dom/client": reactDomClientShimUri,
      "react/jsx-runtime": reactJsxRuntimeShimUri,
      "lucide-react": lucideReactShimUri,
      "clsx": clsxShimUri,
      "tailwind-merge": twMergeShimUri,
      "three": threeShimUri,
      "three/addons/controls/OrbitControls": orbitControlsShimUri,
      "three/addons/controls/OrbitControls.js": orbitControlsShimUri,
      "three/examples/jsm/controls/OrbitControls": orbitControlsShimUri,
      "three/examples/jsm/controls/OrbitControls.js": orbitControlsShimUri,
      "three-stdlib": orbitControlsShimUri,
      "canvas-confetti": confettiShimUri,
      "tone": toneShimUri,
      "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2.47.10",
      "framer-motion": "https://esm.sh/framer-motion@11.11.17?external=react,react-dom",
      "cannon-es": "https://esm.sh/cannon-es@0.20.0",
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
            rootEl.innerHTML = '<div style="padding: 24px; color: #f87171; background: #0f172a; border-radius: 16px; margin: 20px; font-family: system-ui, sans-serif;"><h3 style="font-weight: 700; margin-bottom: 8px;">Aviso de Montaje</h3><p style="font-size: 13px; color: #94a3b8;">El componente de entrada no exportó una función o vista React válida.</p></div>';
          }
        } catch (err) {
          console.error('[NONA Virtual Runner Error]:', err);
          rootEl.innerHTML = '<div style="padding: 24px; color: #f87171; background: #0f172a; border-radius: 16px; margin: 20px; font-family: system-ui, sans-serif;"><h3 style="font-weight: 700; margin-bottom: 8px;">Error al Montar Componente</h3><p style="font-size: 13px; color: #94a3b8;">' + String(err && err.message ? err.message : err) + '</p></div>';
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
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.6);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(100, 116, 139, 0.35);
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.6);
    }
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
