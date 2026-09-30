/**
 * VirtualMultiFileBundler
 * 
 * Compilador y empaquetador multi-archivo en cliente (Navegador).
 * Permite previsualizar instantáneamente proyectos React + TypeScript + Tailwind
 * con múltiples archivos modulares sin depender de un servidor externo.
 */

import { transform } from 'sucrase';
import { NONA_BADGE_HTML } from './ProjectStructureDefaults';

export const THREE_VERSION = '0.170.0';
const THREE_ESM = `https://esm.sh/three@${THREE_VERSION}`;

export interface BundlerResult {
  srcDoc: string;
  transpiledFilesCount: number;
  entryPoint: string;
  errors: string[];
}

export class VirtualMultiFileBundler {
  /**
   * Sanitiza y deduplica todas las declaraciones e imports de React en un módulo ES.
   * Garantiza que 'React' se importe exactamente una vez y elimina declaraciones duplicadas
   * que provoquen "SyntaxError: Identifier 'React' has already been declared".
   */
  public static sanitizeReactInModule(code: string): string {
    if (!code) return '';
    let clean = code;

    // 1. Eliminar declaraciones redundantes de const/var/let React = ...
    clean = clean.replace(/(?:^|\n)\s*(?:const|var|let)\s+React\s*=\s*(?:window\.)?React\s*;?/g, '\n/* [redundant-react] */');

    // 2. Extraer todos los imports de 'react' o "react"
    const reactImportRegex = /import\s+([^;'"]*?)\s+from\s+['"]react['"];?/g;
    let hasReactDefault = false;
    let hasReactNamespace = false;
    const namedImports = new Set<string>();
    let foundAnyReactImport = false;

    let match: RegExpExecArray | null;
    while ((match = reactImportRegex.exec(clean)) !== null) {
      foundAnyReactImport = true;
      const clause = match[1].trim();

      if (clause.startsWith('* as ')) {
        hasReactNamespace = true;
      } else {
        const defaultMatch = clause.match(/^([A-Za-z0-9_]+)\s*(?:,|$)/);
        if (defaultMatch && defaultMatch[1] !== 'type') {
          hasReactDefault = true;
        }
        const namedMatch = clause.match(/\{([\s\S]*?)\}/);
        if (namedMatch) {
          namedMatch[1].split(',').forEach(n => {
            const item = n.trim().replace(/^type\s+/, '');
            if (item) {
              if (item === 'React') {
                hasReactDefault = true;
              } else {
                namedImports.add(item);
              }
            }
          });
        }
      }
    }

    // Comprobar si el código invoca React directamente (ej: React.createElement, React.useState)
    const usesReactGlobal = /\bReact\./.test(clean) || /\bReact\b(?!\s*from)/.test(clean);

    if (foundAnyReactImport || usesReactGlobal) {
      // Reemplazar todos los imports existentes de 'react' por un placeholder
      clean = clean.replace(/import\s+[^;'"]*?\s+from\s+['"]react['"];?/g, '/* [react-import-placeholder] */');

      // Construir la única declaración unificada canónica
      let unified = '';
      const namedList = Array.from(namedImports);
      const namedStr = namedList.length > 0 ? `{ ${namedList.join(', ')} }` : '';

      if (hasReactNamespace) {
        unified = `import * as React from 'react';`;
      } else if ((hasReactDefault || usesReactGlobal) && namedStr) {
        unified = `import React, ${namedStr} from 'react';`;
      } else if (hasReactDefault || usesReactGlobal) {
        unified = `import React from 'react';`;
      } else if (namedStr) {
        unified = `import React, ${namedStr} from 'react';`;
      }

      // Reemplazar únicamente el primer placeholder y remover los duplicados subsecuentes
      let replaced = false;
      clean = clean.replace(/\/\* \[react-import-placeholder\] \*\//g, () => {
        if (!replaced) {
          replaced = true;
          return unified;
        }
        return '';
      });

      // Si no había ningún import previo pero usesReactGlobal es true, anteponer al inicio del módulo
      if (!replaced && unified) {
        clean = `${unified}\n${clean}`;
      }
    }

    return clean;
  }

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

      // Sanitizar y deduplicar imports de React de forma canónica
      transpiled = this.sanitizeReactInModule(transpiled);

      // Garantizar que cualquier módulo importado por defecto no rompa la ejecución ESM
      // si sólo definió exports nombrados (ej: export function Toolbar o export const MyComponent)
      if (!transpiled.includes('export default') && (transpiled.includes('export ') || transpiled.includes('exports.'))) {
        const namedMatch = transpiled.match(/export\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z0-9_]+)/) ||
                           transpiled.match(/export\s*\{\s*([A-Za-z0-9_]+)/);
        if (namedMatch) {
          const exportName = namedMatch[1];
          transpiled = `${transpiled}\nexport default ${exportName};\n`;
        }
      }

      return transpiled;
    } catch (err: any) {
      // El código no compila (típicamente salida truncada de la IA). Antes se intentaba un "fallback por regex"
      // que producía JS roto y hacía caer TODA la vista previa con un SyntaxError opaco. Ahora el módulo se
      // sustituye por un stub que falla con un mensaje claro al renderizarse, sin romper el resto de módulos.
      console.warn(`[VirtualMultiFileBundler] "${filePath}" no compila:`, err.message);
      return this.buildBrokenModuleStub(code, filePath, err.message);
    }
  }

  /**
   * Comprueba la sintaxis real (TS/TSX/JS/JSX) con el mismo compilador que usa la vista previa.
   * Devuelve null si compila, o el mensaje de error (con línea) si no.
   */
  public static checkSyntax(code: string, filePath = 'file.tsx'): string | null {
    if (!code || !code.trim()) return null;
    if (!/\.(tsx|ts|jsx|js|mjs)$/.test(filePath)) return null;
    try {
      const transforms: ('jsx' | 'typescript')[] = [];
      if (/\.(tsx|ts)$/.test(filePath)) transforms.push('typescript');
      if (/\.(tsx|jsx|js|mjs)$/.test(filePath) || code.includes('</')) transforms.push('jsx');
      transform(code, { transforms, jsxRuntime: 'classic', production: true, filePath });
      return null;
    } catch (e: any) {
      return String(e?.message || e).split('\n')[0].slice(0, 240);
    }
  }

  /** Módulo sustituto para un archivo que no compila: conserva los exports para no romper el linkeo ESM. */
  private static buildBrokenModuleStub(code: string, filePath: string, reason: string): string {
    const names = new Set<string>();
    const re = /export\s+(?:async\s+)?(?:function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(code)) !== null) names.add(m[1]);
    const msg = `Error de sintaxis en ${filePath}: ${reason}`;
    return [
      `const __msg = ${JSON.stringify(msg)};`,
      `console.error(__msg);`,
      `function __broken() { throw new Error(__msg); }`,
      `export default __broken;`,
      ...Array.from(names).map(n => `export const ${n} = __broken;`),
    ].join('\n');
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

    clean = this.sanitizeReactInModule(clean);

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
  public static rewriteImports(
    code: string,
    currentFilePath: string,
    availableFiles: string[],
    importedSpecifiersCollector?: Map<string, Set<string>>
  ): string {
    let result = code;

    // 1. Neutralizar imports de CSS (ya inyectados globalmente en <style>)
    result = result.replace(/import\s+['"][^'"]+\.css['"];?/g, '/* [inlined-css] */');
    result = result.replace(/import\s+([A-Za-z0-9_]+)\s+from\s+['"][^'"]+\.css['"];?/g, 'const $1 = {}; /* [inlined-css] */');

    // 1b. Transformar imports de lucide-react para que nunca fallen si la IA inventa un icono o usa múltiples imports
    result = result.replace(
      /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g,
      (_match, namesStr) => {
        const names = namesStr.split(',').map((n: string) => n.trim()).filter(Boolean);
        const decls = names.map((n: string) => {
          if (n.includes(' as ')) {
            const [orig, alias] = n.split(' as ').map((s: string) => s.trim());
            return `const ${alias} = (window.__nonaGetLucideIcon || ((k) => () => null))(${JSON.stringify(orig)});`;
          }
          return `const ${n} = (window.__nonaGetLucideIcon || ((k) => () => null))(${JSON.stringify(n)});`;
        }).join(' ');
        return decls;
      }
    );
    result = result.replace(
      /import\s+([A-Za-z0-9_]+)\s+from\s+['"]lucide-react['"];?/g,
      'const $1 = (window.__nonaLucideProxy || {});'
    );
    result = result.replace(
      /import\s+\*\s+as\s+([A-Za-z0-9_]+)\s+from\s+['"]lucide-react['"];?/g,
      'const $1 = (window.__nonaLucideProxy || {});'
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

        if (importedSpecifiersCollector) {
          if (!importedSpecifiersCollector.has(canonicalBare)) {
            importedSpecifiersCollector.set(canonicalBare, new Set<string>());
          }
          const set = importedSpecifiersCollector.get(canonicalBare)!;
          const namedMatches = clause.match(/\{([^}]+)\}/);
          if (namedMatches) {
            namedMatches[1].split(',').forEach((n: string) => {
              const clean = n.trim().split(/\s+as\s+/)[0].trim();
              if (clean) set.add(clean);
            });
          }
          const defaultMatch = clause.match(/^\s*([A-Za-z0-9_]+)\s*(?:,|$)/);
          if (defaultMatch && defaultMatch[1] !== 'type') {
            set.add('default');
            set.add(defaultMatch[1]);
          }
        }

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
        if (importedSpecifiersCollector && !importedSpecifiersCollector.has(canonicalBare)) {
          importedSpecifiersCollector.set(canonicalBare, new Set<string>(['default']));
        }
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
        if (importedSpecifiersCollector && !importedSpecifiersCollector.has(canonicalBare)) {
          importedSpecifiersCollector.set(canonicalBare, new Set<string>(['default']));
        }
        return `import(${quote}${canonicalBare}${quote})`;
      }
    );

    return result;
  }

  /**
   * Genera el documento HTML completo (srcDoc) con Import Maps para ejecutar
   * la aplicación React multi-archivo en un iframe seguro.
   */
  public static bundle(files: Record<string, string>, options?: { isInspectMode?: boolean }): BundlerResult {
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
      // https://esm.sh/react@18.3.1
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


    const lucideReactShimCode = `
      // https://esm.sh/lucide-react
      const R = window.React || {};
      
      export function createLucideIcon(iconName) {
        function DynamicIcon(props) {
          if (window.__nonaGetLucideIcon) {
            return window.__nonaGetLucideIcon(iconName)(props);
          }
          const p = props || {};
          const size = p.size || p.width || 20;
          const color = p.color || 'currentColor';
          const strokeWidth = p.strokeWidth || 2;
          const className = p.className || '';
          const lucideGlobal = window.lucide;
          
          if (lucideGlobal && lucideGlobal.icons) {
            const kebab = iconName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            const iconDef = lucideGlobal.icons[kebab] || lucideGlobal.icons[iconName.toLowerCase()] || lucideGlobal.icons[iconName];
            if (iconDef && Array.isArray(iconDef) && R && R.createElement) {
                  // lucide >= 0.3xx: el icono es un IconNode ([tag, attrs][] o ['svg', attrs, children])
                  const nodes = iconDef[0] === 'svg' ? (iconDef[2] || []) : iconDef;
                  const { size: _s, color: _c, strokeWidth: _w, className: _cn, absoluteStrokeWidth: _a, ...rest } = p;
                  return R.createElement('svg', {
                    xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: '0 0 24 24',
                    fill: 'none', stroke: color, strokeWidth: strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
                    className: 'lucide lucide-' + iconName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase() + ' ' + className,
                    ...rest
                  }, ...nodes.map((n, i) => R.createElement(n[0], { key: i, ...n[1] })));
                }
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
          }, R.createElement('circle', { cx: 12, cy: 12, r: 10 }));
        }

        DynamicIcon.displayName = iconName;
        DynamicIcon.toString = () => iconName;
        DynamicIcon.valueOf = () => 0;
        DynamicIcon[Symbol.toPrimitive] = (hint) => (hint === 'number' ? 0 : iconName);
        return DynamicIcon;
      }

      const iconCache = {};
      export const Lucide = new Proxy({}, {
        get(target, prop) {
          if (prop === '__esModule') return true;
          if (prop === 'default') return Lucide;
          if (prop === 'then') return undefined;

          if (prop === Symbol.toPrimitive) {
            return (hint) => (hint === 'number' ? 0 : 'Lucide');
          }
          if (prop === Symbol.toStringTag) {
            return 'Lucide';
          }
          if (typeof prop !== 'string') {
            return target[prop];
          }

          if (prop === 'toString') return () => 'Lucide';
          if (prop === 'valueOf') return () => 0;
          if (prop === 'toJSON') return () => ({ name: 'Lucide' });
          if (prop === 'displayName' || prop === 'name') return 'Lucide';

          if (!iconCache[prop]) iconCache[prop] = createLucideIcon(prop);
          return iconCache[prop];
        }
      });
      export default Lucide;
    `;
    const lucideReactShimUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(lucideReactShimCode);

    const utilsShimCode = `
      import clsx from 'clsx';
      import twMerge from 'tailwind-merge';
      export function cn(...inputs) {
        return twMerge(clsx(...inputs));
      }
      export { clsx, twMerge };
      export default { cn, clsx, twMerge };
    `;
    const utilsShimUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(utilsShimCode);

    // 2a. React Router: la vista previa corre en un iframe srcdoc (location = about:srcdoc), donde
    // BrowserRouter/HashRouter fallan con "Invalid URL". Se sustituyen por sus equivalentes en memoria.
    const RR = 'https://esm.sh/react-router-dom@6.28.0?external=react,react-dom';
    const routerShimCode = `
      export * from '${RR}';
      import { MemoryRouter, createMemoryRouter } from '${RR}';
      export { MemoryRouter as BrowserRouter, MemoryRouter as HashRouter };
      export const createBrowserRouter = (routes, opts) => createMemoryRouter(routes, opts);
      export const createHashRouter = (routes, opts) => createMemoryRouter(routes, opts);
    `;
    const routerShimUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(routerShimCode);

    // 2b. Construir Import Map con resolución local y paquetes externos predeterminados
    const importMap: Record<string, string> = {
      "react": reactShimUri,
      "react-dom": reactDomShimUri,
      "react-dom/client": reactDomClientShimUri,
      "react/jsx-runtime": reactJsxRuntimeShimUri,
      "react-router-dom": routerShimUri,
      "react-router": routerShimUri,
      "lucide-react": lucideReactShimUri,
      "clsx": clsxShimUri,
      "tailwind-merge": twMergeShimUri,
      "@/lib/utils": utilsShimUri,
      "@/utils": utilsShimUri,
      "lib/utils": utilsShimUri,
      "./lib/utils": utilsShimUri,
      "../lib/utils": utilsShimUri,
      "./utils": utilsShimUri,
      "../utils": utilsShimUri,
      "utils": utilsShimUri,
      // three.js y Tone.js completos (misma versión que el package.json exportado). Antes eran shims recortados
      // sobre la versión global r128: "import * as THREE from 'three'" solo exponía ~50 clases y Tone ninguna.
      "three": THREE_ESM,
      "canvas-confetti": confettiShimUri,
      "tone": "https://esm.sh/tone@14.8.49",
      "vexflow": "https://esm.sh/vexflow@4.2.5?external=react,react-dom",
      "howler": "https://esm.sh/howler@2.2.4",
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

    const importedSpecifiersCollector = new Map<string, Set<string>>();

    for (const p of moduleFileKeys) {
      const content = normalizedFiles[p];
      try {
        // Transpilar sintaxis TS a JS
        let processedCode = this.transpileTypeScript(content, p);

        // Reescribir imports relativos a bare specifiers canónicos y registrar dependencias
        processedCode = this.rewriteImports(processedCode, p, moduleFileKeys, importedSpecifiersCollector);

        // Garantizar que React nunca se declare duplicado tras las transformaciones
        processedCode = this.sanitizeReactInModule(processedCode);

        const encoded = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(processedCode);

        const withoutExt = p.replace(/\.(tsx|ts|jsx|js)$/, '');
        const baseName = p.split('/').pop()!;
        const baseNameWithoutExt = baseName.replace(/\.(tsx|ts|jsx|js)$/, '');

        // Registrar bare specifiers canónicos bajo el espacio de nombres app/
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

    // 3b. Crear stubs sintéticos para módulos o componentes referenciados que la IA omitió generar
    for (const [canonicalBare, names] of importedSpecifiersCollector.entries()) {
      if (!importMap[canonicalBare]) {
        const baseName = canonicalBare.split('/').pop() || 'Componente';
        const namedList = Array.from(names).filter(n => n !== 'default' && n !== '*' && n !== 'type');

        const stubCode = `
          // Stub sintético generado automáticamente por NONA para evitar pantallas en blanco
          const R = window.React;
          function FallbackComponent(props) {
            if (!R || !R.createElement) return null;
            const p = props || {};
            if (p.children !== undefined && p.children !== null) {
              return R.createElement('div', {
                className: p.className || '',
                style: { display: 'contents' }
              }, p.children);
            }
            return R.createElement('div', {
              style: {
                padding: '4px 10px',
                margin: '2px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px dashed rgba(99, 102, 241, 0.35)',
                color: '#818cf8',
                fontSize: '11px',
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }
            }, '🧩 [' + String(${JSON.stringify(baseName)}) + ']');
          }

          FallbackComponent.displayName = String(${JSON.stringify(baseName)});
          FallbackComponent.toString = () => String(${JSON.stringify(baseName)});
          FallbackComponent.valueOf = () => 0;
          FallbackComponent[Symbol.toPrimitive] = (hint) => (hint === 'number' ? 0 : String(${JSON.stringify(baseName)}));

          const makeProxy = (name) => {
            const proxy = new Proxy(FallbackComponent, {
              get(target, prop) {
                if (prop === '__esModule') return true;
                if (prop === 'default') return proxy;
                if (prop === 'then') return undefined;

                if (prop === Symbol.toPrimitive) {
                  return (hint) => (hint === 'number' ? 0 : String(name));
                }
                if (prop === Symbol.iterator) {
                  return function* () {};
                }
                if (prop === Symbol.toStringTag) {
                  return String(name);
                }
                if (typeof prop !== 'string') {
                  return target[prop];
                }

                if (prop === 'toString') return () => String(name);
                if (prop === 'valueOf') return () => 0;
                if (prop === 'toJSON') return () => ({ name: String(name) });
                if (prop === 'displayName' || prop === 'name') return String(name);

                if (prop === 'length') return 0;
                if (prop === 'map') return (fn) => [];
                if (prop === 'filter') return (fn) => [];
                if (prop === 'forEach') return (fn) => {};
                if (prop === 'find') return (fn) => undefined;
                if (prop === 'findIndex') return (fn) => -1;
                if (prop === 'some') return (fn) => false;
                if (prop === 'every') return (fn) => true;
                if (prop === 'reduce') return (fn, init) => init;
                if (prop === 'slice') return () => [];
                if (prop === 'concat') return () => [];
                if (prop === 'includes') return () => false;
                if (prop === 'indexOf') return () => -1;
                if (prop === 'flat') return () => [];
                if (prop === 'flatMap') return () => [];

                if (prop in target) {
                  return target[prop];
                }

                return makeProxy(name + '.' + prop);
              },
              apply(target, thisArg, args) {
                const firstArg = args && args[0];
                if (args && args.length > 0 && typeof firstArg === 'string') {
                  return args.filter(Boolean).join(' ');
                }
                if (firstArg && typeof firstArg === 'object' && !firstArg.$$typeof && !firstArg.children && (firstArg.variant || firstArg.size || firstArg.className)) {
                  return [name, firstArg.variant, firstArg.size, firstArg.className].filter(Boolean).join(' ');
                }
                return FallbackComponent(firstArg);
              },
              construct(target, args) {
                return makeProxy(name);
              }
            });
            return proxy;
          };

          const stub = makeProxy(${JSON.stringify(baseName)});
          export default stub;
          ${namedList.map(n => `export const ${n} = stub;`).join('\n')}
        `;
        const stubUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(stubCode);
        importMap[canonicalBare] = stubUri;
        const withoutApp = canonicalBare.replace(/^app\//, '');
        importMap[withoutApp] = stubUri;
        importMap[`./${withoutApp}`] = stubUri;
        importMap[`@/${withoutApp.replace(/^src\//, '')}`] = stubUri;
        importMap[`./${baseName}`] = stubUri;
        importMap[baseName] = stubUri;
      }
    }

    // 3c. Auto-registro dinámico de paquetes npm externos (CDN esm.sh / shims)
    const allCodeText = Object.values(normalizedFiles).join('\n');
    const bareImportRegex = /(?:^|\n|\r)\s*(?:import|export)\s+(?:[^;'"]*?from\s+)?['"]([a-zA-Z0-9@][^'"]*)['"]/g;
    let bareMatch: RegExpExecArray | null;
    while ((bareMatch = bareImportRegex.exec(allCodeText)) !== null) {
      const spec = bareMatch[1].trim();
      if (!spec || spec.startsWith('app/') || spec.startsWith('.') || spec.startsWith('/')) continue;
      if (importMap[spec]) continue;

      if (spec === 'vexflow' || spec.startsWith('vexflow/')) {
        importMap[spec] = 'https://esm.sh/vexflow@4.2.5?external=react,react-dom';
      } else if (spec === 'howler' || spec.startsWith('howler/')) {
        importMap[spec] = 'https://esm.sh/howler@2.2.4';
      } else if (spec === 'framer-motion') {
        importMap[spec] = 'https://esm.sh/framer-motion@11.11.17?external=react,react-dom';
      } else if (spec === 'cannon-es') {
        importMap[spec] = 'https://esm.sh/cannon-es@0.20.0';
      } else if (spec === 'tone') {
        importMap[spec] = 'https://esm.sh/tone@14.8.49';
      } else if (spec === 'three') {
        importMap[spec] = THREE_ESM;
      } else if (spec.startsWith('three/')) {
        // Addons oficiales: three/addons/x -> three/examples/jsm/x(.js), compartiendo la misma instancia de three
        let sub = spec.slice('three/'.length).replace(/^addons\//, 'examples/jsm/');
        if (!/\.(m?js)$/.test(sub)) sub += '.js';
        importMap[spec] = `https://esm.sh/three@${THREE_VERSION}/${sub}?external=three`;
      } else if (spec === 'canvas-confetti') {
        importMap[spec] = confettiShimUri;
      } else if (spec.startsWith('date-fns')) {
        importMap[spec] = 'https://esm.sh/' + spec;
      } else if (spec.startsWith('lodash')) {
        importMap[spec] = 'https://esm.sh/' + spec;
      } else if (spec.startsWith('axios')) {
        importMap[spec] = 'https://esm.sh/' + spec;
      } else if (spec.startsWith('zustand')) {
        importMap[spec] = 'https://esm.sh/' + spec + '?external=react';
      } else {
        // external=three: librerías que dependen de three (three-stdlib, @react-three/*) usan la misma instancia
        importMap[spec] = 'https://esm.sh/' + spec + (spec.includes('?') ? '' : '?external=react,react-dom,three');
      }
    }

    // 4. Identificar el punto de entrada con priorización robusta (soporta src/ y raíz)
    const mainKey = Object.keys(normalizedFiles).find(k => 
      k === 'src/main.tsx' || k === 'src/main.jsx' || k === 'src/main.js' ||
      k === 'main.tsx' || k === 'main.jsx' || k === 'main.js'
    );
    const hasMain = Boolean(mainKey);

    const appKey = Object.keys(normalizedFiles).find(k => 
      k === 'src/App.tsx' || k === 'src/App.jsx' || k === 'src/App.js' ||
      k === 'App.tsx' || k === 'App.jsx' || k === 'App.js' ||
      k === 'src/components/App.tsx' || k === 'src/components/App.jsx'
    );

    let entryPoint: string = hasMain ? mainKey! : (appKey || 'src/App.tsx');

    if (!hasMain && !appKey) {
      // Prioridad 1: cualquier archivo con App en el nombre o que defina App
      const anyAppKey = Object.keys(normalizedFiles).find(k => 
        (k.endsWith('.tsx') || k.endsWith('.jsx')) && 
        (/\bApp\b/i.test(k) || (normalizedFiles[k] && /\bfunction App\b/.test(normalizedFiles[k])))
      );
      if (anyAppKey) {
        entryPoint = anyAppKey;
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

    // 5. Generar script de montaje con Error Boundary resiliente y auto-fallback
    const entryBare = 'app/' + entryPoint.replace(/\.(tsx|ts|jsx|js)$/, '');
    const appBare = appKey ? 'app/' + appKey.replace(/\.(tsx|ts|jsx|js)$/, '') : entryBare;

    const mountScript = `
      import React from 'react';
      import ReactDOM from 'react-dom/client';

      class NonaErrorBoundary extends React.Component {
        constructor(props) {
          super(props);
          this.state = { hasError: false, error: null };
        }
        static getDerivedStateFromError(error) {
          return { hasError: true, error };
        }
        componentDidCatch(error, errorInfo) {
          console.error('[NONA Preview Error]:', error, errorInfo);
          try {
            window.parent.postMessage({
              type: 'SANDBOX_RUNTIME_ERROR',
              level: 'error',
              msg: String(error && error.message ? error.message : error)
            }, '*');
          } catch(e) {}
        }
        render() {
          if (this.state.hasError) {
            const err = this.state.error;
            return React.createElement('div', {
              style: {
                minHeight: '100vh',
                background: '#090d16',
                color: '#f8fafc',
                padding: '32px 24px',
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            },
              React.createElement('div', {
                style: {
                  maxWidth: '560px',
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid #ef4444',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                }
              },
                React.createElement('h3', {
                  style: { margin: '0 0 8px 0', fontSize: '15px', fontWeight: 'bold', color: '#f87171' }
                }, '⚠️ Error de Ejecución en Vista Previa'),
                React.createElement('p', {
                  style: { margin: '0 0 12px 0', fontSize: '12px', color: '#94a3b8' }
                }, 'Se produjo un error al renderizar el componente principal:'),
                React.createElement('pre', {
                  style: {
                    background: '#020617',
                    border: '1px solid #1e293b',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fca5a5',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap'
                  }
                }, String(err && err.message ? err.message : err)),
                React.createElement('button', {
                  onClick: () => this.setState({ hasError: false, error: null }),
                  style: {
                    marginTop: '14px',
                    padding: '8px 16px',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }
                }, 'Reintentar')
              )
            );
          }
          return this.props.children;
        }
      }

      const rootEl = document.getElementById('root') || document.getElementById('app') || document.body;

      const renderApp = (Comp) => {
        if (!Comp) return;
        try {
          const root = ReactDOM.createRoot(rootEl);
          root.render(React.createElement(NonaErrorBoundary, null, React.createElement(Comp)));
        } catch(err) {
          console.error('[NONA Render Error]:', err);
        }
      };

      const loadAndMount = async () => {
        try {
          // 1. Intentar cargar el punto de entrada principal
          const entryMod = await import('${entryBare}');
          
          if (${hasMain ? 'true' : 'false'}) {
            setTimeout(() => {
              if (rootEl && rootEl.childElementCount === 0) {
                import('${appBare}').then(appMod => {
                  const Comp = appMod.default || appMod.App || Object.values(appMod).find(v => typeof v === 'function');
                  if (Comp) renderApp(Comp);
                }).catch(() => {});
              }
            }, 250);
            return;
          }

          let Comp = entryMod.default;
          if (!Comp || (typeof Comp !== 'function' && !(Comp && Comp.$$typeof))) {
            Comp = entryMod.App ||
                   entryMod.Main ||
                   Object.values(entryMod).find(v => typeof v === 'function' || (v && typeof v === 'object' && v.$$typeof)) ||
                   entryMod;
          }

          if (typeof Comp === 'function' || (Comp && typeof Comp === 'object' && Comp.$$typeof)) {
            renderApp(Comp);
          } else {
            const appMod = await import('${appBare}');
            const FallbackComp = appMod.default || appMod.App || Object.values(appMod).find(v => typeof v === 'function');
            if (FallbackComp) {
              renderApp(FallbackComp);
            } else {
              rootEl.innerHTML = '<div style="padding: 24px; color: #f87171; background: #0f172a; border-radius: 16px; margin: 20px; font-family: system-ui, sans-serif;"><h3 style="font-weight: 700; margin-bottom: 8px;">Aviso de Montaje</h3><p style="font-size: 13px; color: #94a3b8;">El componente de entrada no exportó una función o vista React válida.</p></div>';
            }
          }
        } catch (err) {
          console.error('[NONA Virtual Runner Error]:', err);
          try {
            const appMod = await import('${appBare}');
            const Comp = appMod.default || appMod.App || Object.values(appMod).find(v => typeof v === 'function');
            if (Comp) {
              renderApp(Comp);
              return;
            }
          } catch (fallbackErr) {}

          rootEl.innerHTML = '<div style="padding: 24px; color: #f87171; background: #0f172a; border: 1px solid #ef4444; border-radius: 16px; margin: 20px; font-family: system-ui, sans-serif;"><h3 style="font-weight: 700; margin-bottom: 8px;">Error al Cargar la Aplicación</h3><pre style="font-size: 12px; color: #fca5a5; white-space: pre-wrap; margin: 0;">' + String(err && err.message ? err.message : err) + '</pre></div>';
          try {
            window.parent.postMessage({
              type: 'SANDBOX_RUNTIME_ERROR',
              level: 'error',
              msg: String(err && err.message ? err.message : err)
            }, '*');
          } catch(e) {}
        }
      };

      loadAndMount();
    `;

    // 6. Scripts de soporte: Lucide, Audio Polyfill, Element Inspector y Captura de Logs
    const lucideScript = `
      <script>
        (function() {
          function createLucideIcon(iconName) {
            function DynamicLucideIcon(props) {
              const p = props || {};
              const size = p.size || p.width || 20;
              const color = p.color || 'currentColor';
              const strokeWidth = p.strokeWidth || 2;
              const className = p.className || '';
              const R = window.React;
              const lucideGlobal = window.lucide;

              if (lucideGlobal && lucideGlobal.icons) {
                const kebab = iconName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
                const iconDef = lucideGlobal.icons[kebab] || lucideGlobal.icons[iconName.toLowerCase()] || lucideGlobal.icons[iconName];
                if (iconDef && Array.isArray(iconDef) && R && R.createElement) {
                  // lucide >= 0.3xx: el icono es un IconNode ([tag, attrs][] o ['svg', attrs, children])
                  const nodes = iconDef[0] === 'svg' ? (iconDef[2] || []) : iconDef;
                  const { size: _s, color: _c, strokeWidth: _w, className: _cn, absoluteStrokeWidth: _a, ...rest } = p;
                  return R.createElement('svg', {
                    xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: '0 0 24 24',
                    fill: 'none', stroke: color, strokeWidth: strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
                    className: 'lucide lucide-' + iconName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase() + ' ' + className,
                    ...rest
                  }, ...nodes.map((n, i) => R.createElement(n[0], { key: i, ...n[1] })));
                }
                if (iconDef && typeof iconDef.toSvg === 'function') {
                  return R ? R.createElement('span', {
                    className: 'inline-flex items-center justify-center ' + className,
                    dangerouslySetInnerHTML: { __html: iconDef.toSvg({ width: size, height: size, color, 'stroke-width': strokeWidth, class: className }) }
                  }) : null;
                }
              }

              if (!R || !R.createElement) return null;
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
              }, R.createElement('circle', { cx: 12, cy: 12, r: 10 }));
            }

            DynamicLucideIcon.displayName = iconName;
            DynamicLucideIcon.toString = () => iconName;
            DynamicLucideIcon.valueOf = () => 0;
            DynamicLucideIcon[Symbol.toPrimitive] = (hint) => (hint === 'number' ? 0 : iconName);
            return DynamicLucideIcon;
          }

          const iconCache = {};
          window.__nonaGetLucideIcon = function(name) {
            if (!iconCache[name]) {
              iconCache[name] = createLucideIcon(name);
            }
            return iconCache[name];
          };

          window.__nonaLucideProxy = new Proxy({}, {
            get(target, prop) {
              if (prop === '__esModule') return true;
              if (prop === 'default') return window.__nonaLucideProxy;
              if (prop === 'then') return undefined;

              if (prop === Symbol.toPrimitive) {
                return (hint) => (hint === 'number' ? 0 : 'Lucide');
              }
              if (prop === Symbol.toStringTag) {
                return 'Lucide';
              }
              if (typeof prop !== 'string') {
                return target[prop];
              }

              if (prop === 'toString') return () => 'Lucide';
              if (prop === 'valueOf') return () => 0;
              if (prop === 'toJSON') return () => ({ name: 'Lucide' });
              if (prop === 'displayName' || prop === 'name') return 'Lucide';

              return window.__nonaGetLucideIcon(prop);
            }
          });
        })();
      </script>
    `;

    const audioPolyfillScript = `
      <script>
        (function() {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const resumeAudio = function() {
              if (window.__nonaAudioCtx && window.__nonaAudioCtx.state === 'suspended') {
                window.__nonaAudioCtx.resume();
              }
              const contexts = window.__allAudioContexts || [];
              contexts.forEach(ctx => {
                if (ctx.state === 'suspended') ctx.resume();
              });
            };
            window.addEventListener('click', resumeAudio, { once: false });
            window.addEventListener('keydown', resumeAudio, { once: false });
            window.addEventListener('touchstart', resumeAudio, { once: false });
          }
        })();
      </script>
    `;

    const inspectElementScript = `
      <script>
        (function() {
          let currentHighlighted = null;
          let isInspecting = ${options?.isInspectMode ? 'true' : 'false'};

          window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'NONA_TOGGLE_INSPECT') {
              isInspecting = e.data.enabled;
              if (!isInspecting && currentHighlighted) {
                currentHighlighted.style.outline = '';
                currentHighlighted.style.backgroundColor = '';
              }
            }
          });

          document.addEventListener('mouseover', function(e) {
            if (!isInspecting) return;
            if (currentHighlighted && currentHighlighted !== e.target) {
              currentHighlighted.style.outline = '';
              currentHighlighted.style.backgroundColor = '';
            }
            currentHighlighted = e.target;
            currentHighlighted.style.outline = '2px dashed #6366F1';
            currentHighlighted.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
            e.stopPropagation();
          });

          document.addEventListener('click', function(e) {
            if (!isInspecting) return;
            e.preventDefault();
            e.stopPropagation();
            const target = e.target;
            const tag = target.tagName.toLowerCase();
            const id = target.id ? '#' + target.id : '';
            const className = typeof target.className === 'string' ? target.className.split(' ').slice(0, 3).join('.') : '';
            const selector = tag + id + (className ? '.' + className : '');
            const outerHTML = target.outerHTML.slice(0, 400);

            window.parent.postMessage({
              type: 'NONA_ELEMENT_SELECTED',
              info: {
                tagName: tag,
                id: target.id || undefined,
                classList: typeof target.className === 'string' ? target.className.split(' ').filter(Boolean) : [],
                selector,
                outerHTML
              }
            }, '*');
          });
        })();
      </script>
    `;

    const captureScripts = `
      <script>
        (function() {
          const formatArg = function(a) {
            if (a === null) return 'null';
            if (a === undefined) return 'undefined';
            if (a instanceof Error || (a && typeof a === 'object' && ('message' in a || 'stack' in a))) {
              return a.stack || a.message || String(a);
            }
            if (typeof a === 'object') {
              try {
                const s = JSON.stringify(a);
                if (s === '{}' && (a.name || a.type || a.target)) {
                  return (a.name || a.type || 'Object') + (a.detail ? ': ' + JSON.stringify(a.detail) : '');
                }
                return s;
              } catch(e) {
                return String(a);
              }
            }
            return String(a);
          };

          const _log = console.log;
          const _err = console.error;
          const _warn = console.warn;
          console.log = function(...args) {
            try {
              window.parent.postMessage({ type: 'NONA_LOG', level: 'info', msg: args.map(formatArg).join(' ') }, '*');
            } catch(e) {}
            _log.apply(console, args);
          };
          console.error = function(...args) {
            try {
              window.parent.postMessage({ type: 'NONA_LOG', level: 'error', msg: args.map(formatArg).join(' ') }, '*');
            } catch(e) {}
            _err.apply(console, args);
          };
          console.warn = function(...args) {
            try {
              window.parent.postMessage({ type: 'NONA_LOG', level: 'warn', msg: args.map(formatArg).join(' ') }, '*');
            } catch(e) {}
            _warn.apply(console, args);
          };
          window.onerror = function(msg, src, lineno, colno, err) {
            try {
              const errMsg = (err && (err.message || err.stack)) ? String(err.message || err.stack) : (typeof msg === 'object' ? formatArg(msg) : String(msg || 'Error de ejecución'));
              window.parent.postMessage({
                type: 'SANDBOX_RUNTIME_ERROR',
                level: 'error',
                msg: errMsg,
                source: String(src || ''),
                line: lineno,
                col: colno,
                stack: err ? err.stack : ''
              }, '*');
            } catch(e) {}
          };
          window.addEventListener('unhandledrejection', function(event) {
            try {
              const reason = event.reason;
              const errTxt = reason ? (reason.stack || reason.message || formatArg(reason)) : 'Promise rechazada sin razón';
              window.parent.postMessage({
                type: 'SANDBOX_RUNTIME_ERROR',
                level: 'error',
                msg: 'Unhandled Rejection: ' + errTxt,
                stack: reason && reason.stack ? reason.stack : ''
              }, '*');
            } catch(e) {}
          });
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
  <script>try { tailwind.config = { darkMode: 'class' }; } catch (e) {}</script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  ${lucideScript}
  ${audioPolyfillScript}
  ${inspectElementScript}
  ${captureScripts}
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
  ${NONA_BADGE_HTML}
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
