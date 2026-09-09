import { useState, useMemo, useEffect } from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  ExternalLink,
  MousePointerClick,
  Terminal,
  Eye,
  Wrench,
  AlertTriangle,
  Server,
  Zap
} from 'lucide-react';
import type { FileItem } from '../types';
import { webContainerService } from '../core/sandbox/WebContainerService';
import { VirtualMultiFileBundler } from '../core/sandbox/VirtualMultiFileBundler';
import { ensureCompleteViteProject } from '../core/sandbox/ProjectStructureDefaults';

export interface ElementSelectionInfo {
  tagName: string;
  id?: string;
  classList: string[];
  selector: string;
  outerHTML: string;
}

interface PreviewPanelProps {
  files?: FileItem[] | Record<string, string>;
  htmlCode?: string;
  onElementSelect?: (info: ElementSelectionInfo) => void;
  onAutoFixErrors?: (errorList: string[]) => void;
}

export const PreviewPanel = ({ files, htmlCode, onElementSelect, onAutoFixErrors }: PreviewPanelProps) => {
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [iframeKey, setIframeKey] = useState(0);
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'console'>('preview');
  const [consoleLogs, setConsoleLogs] = useState<{ type: 'log' | 'warn' | 'error' | 'info'; message: string; time: string }[]>([]);
  const [webContainerUrl, setWebContainerUrl] = useState<string | null>(null);
  const [isContainerBooting, setIsContainerBooting] = useState(false);

  const filesMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(files)) {
      files.forEach(f => {
        const cleanName = f.name.replace(/^(\.\/|\/)/, '');
        map[cleanName] = f.content;
      });
    } else if (files && typeof files === 'object') {
      Object.entries(files).forEach(([k, v]) => {
        const cleanName = k.replace(/^(\.\/|\/)/, '');
        map[cleanName] = typeof v === 'string' ? v : (v as any).content || '';
      });
    }
    if (htmlCode) {
      map['index.html'] = htmlCode;
    }
    return map;
  }, [files, htmlCode]);

  const htmlFile = useMemo(() => {
    if (htmlCode) return htmlCode;
    if (filesMap['index.html']) return filesMap['index.html'];
    const htmlKey = Object.keys(filesMap).find(k => k.endsWith('.html'));
    if (htmlKey) return filesMap[htmlKey];
    return Object.values(filesMap)[0] || '';
  }, [filesMap, htmlCode]);

  // Reset console logs when preview code changes
  const [prevHtml, setPrevHtml] = useState(htmlFile);
  if (prevHtml !== htmlFile) {
    setPrevHtml(htmlFile);
    setConsoleLogs([]);
  }

  // WebContainers lifecycle integration
  useEffect(() => {
    if (!webContainerService.isSupported()) return;
    const isMultiFileReact = Object.keys(filesMap).some(k => k.endsWith('.tsx') || k.endsWith('.ts') || k === 'package.json');
    if (!isMultiFileReact) return;

    let isMounted = true;
    setIsContainerBooting(true);

    const fullProject = ensureCompleteViteProject(filesMap);

    webContainerService.mountAndStartServer(fullProject, {
      onServerReady: (url) => {
        if (isMounted) {
          setWebContainerUrl(url);
          setIsContainerBooting(false);
        }
      },
      onOutput: (chunk) => {
        if (isMounted) {
          setConsoleLogs(prev => [...prev.slice(-99), {
            type: 'info',
            message: `[Vite] ${chunk}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }]);
        }
      },
      onError: (err) => {
        if (isMounted) {
          setIsContainerBooting(false);
          setConsoleLogs(prev => [...prev.slice(-99), {
            type: 'error',
            message: `[Vite Error] ${err}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }]);
        }
      }
    }).catch(err => {
      console.warn('[WebContainer] Fallback to Virtual Multi-File Bundler:', err.message);
      if (isMounted) setIsContainerBooting(false);
    });

    return () => {
      isMounted = false;
    };
  }, [filesMap]);

  // Clean compilation & bundling of source document (Antigravity Virtual Multi-File Sandbox)
  const srcDoc = useMemo(() => {
    // 1. If project contains React TSX / JSX files, use VirtualMultiFileBundler
    const hasReactFiles = Object.keys(filesMap).some(k => k.endsWith('.tsx') || k.endsWith('.jsx') || k.includes('src/App'));
    if (hasReactFiles) {
      const bundleRes = VirtualMultiFileBundler.bundle(filesMap);
      return bundleRes.srcDoc;
    }

    if (!htmlFile || htmlFile.trim().length === 0) {
      return `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 text-white min-h-screen flex items-center justify-center font-sans"><div class="text-center p-6"><h2 class="text-lg font-bold">Esperando generación...</h2></div></body></html>`;
    }

    // 1. Virtual Multi-File Bundler & Import Map
    const importMap: Record<string, string> = {};
    const scriptBlobMap: Record<string, string> = {};
    let injectedStyles = '';

    Object.entries(filesMap).forEach(([filePath, content]) => {
      // Inline virtual CSS files
      if (filePath.endsWith('.css')) {
        injectedStyles += `\n<style data-virtual-file="${filePath}">\n${content}\n</style>\n`;
      }
      // Create virtual Data URIs for all JS / TS / JSX / ESM files
      else if (
        filePath.endsWith('.js') ||
        filePath.endsWith('.mjs') ||
        filePath.endsWith('.ts') ||
        filePath.endsWith('.jsx') ||
        filePath.endsWith('.tsx')
      ) {
        try {
          const moduleUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(content);

          importMap[`./${filePath}`] = moduleUri;
          importMap[`${filePath}`] = moduleUri;
          importMap[`/${filePath}`] = moduleUri;

          const baseName = filePath.split('/').pop();
          if (baseName) {
            importMap[`./${baseName}`] = moduleUri;
            importMap[`${baseName}`] = moduleUri;
            scriptBlobMap[baseName] = moduleUri;
          }
          scriptBlobMap[filePath] = moduleUri;
          scriptBlobMap[`./${filePath}`] = moduleUri;
        } catch (e) {
          console.warn('[PreviewPanel] Error creating virtual module:', filePath, e);
        }
      }
    });

    const importMapScript = Object.keys(importMap).length > 0 ? `
      <script type="importmap">
      ${JSON.stringify({ imports: importMap }, null, 2)}
      </script>
    ` : '';

    const consoleCaptureScript = `
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
        })();
      </script>
    `;

    const runtimeErrorCaptureScript = `
      <script>
        (function() {
          window.onerror = function(msg, src, lineno, colno, err) {
            try {
              window.parent.postMessage({
                type: 'SANDBOX_RUNTIME_ERROR',
                level: 'error',
                msg: String(msg),
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
              const errTxt = reason ? (reason.message || String(reason)) : 'Promise rechazada sin razón';
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

    const inspectElementScript = `
      <script>
        (function() {
          let currentHighlighted = null;
          let isInspecting = ${isInspectMode};

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

    const audioPolyfillScript = `
      <script>
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        window.playSynthSound = function(type) {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            const now = ctx.currentTime;
            if (type === 'click' || type === 'button') {
              osc.frequency.setValueAtTime(440, now);
              osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
              gain.gain.setValueAtTime(0.2, now);
              gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
              osc.start(now);
              osc.stop(now + 0.05);
            } else if (type === 'eat' || type === 'win') {
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(523.25, now);
              osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.12);
              gain.gain.setValueAtTime(0.3, now);
              gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
              osc.start(now);
              osc.stop(now + 0.12);
            } else if (type === 'gameover') {
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(300, now);
              osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
              gain.gain.setValueAtTime(0.3, now);
              gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
              osc.start(now);
              osc.stop(now + 0.3);
            }
          } catch(e) {}
        };
      </script>
    `;

    const lifecyclePolyfillScript = `
      <script>
        (function() {
          // Guaranteed lifecycle execution in srcdoc iframes
          const _origAddEventListener = window.addEventListener;
          window.addEventListener = function(type, listener, options) {
            _origAddEventListener.call(window, type, listener, options);
            if (type === 'load' && (document.readyState === 'complete')) {
              setTimeout(function() {
                try {
                  if (typeof listener === 'function') listener(new Event('load'));
                  else if (listener && typeof listener.handleEvent === 'function') listener.handleEvent(new Event('load'));
                } catch(e) { console.error(e); }
              }, 10);
            }
            if (type === 'DOMContentLoaded' && (document.readyState === 'complete' || document.readyState === 'interactive')) {
              setTimeout(function() {
                try {
                  if (typeof listener === 'function') listener(new Event('DOMContentLoaded'));
                  else if (listener && typeof listener.handleEvent === 'function') listener.handleEvent(new Event('DOMContentLoaded'));
                } catch(e) { console.error(e); }
              }, 10);
            }
          };

          let _customOnload = null;
          try {
            Object.defineProperty(window, 'onload', {
              get: function() { return _customOnload; },
              set: function(fn) {
                _customOnload = fn;
                if (typeof fn === 'function' && document.readyState === 'complete') {
                  setTimeout(function() {
                    try { fn(new Event('load')); } catch(e) { console.error(e); }
                  }, 10);
                }
              }
            });
          } catch(e) {}
        })();
      </script>
    `;

    const runtimePolyfills = `
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
      <script src="https://unpkg.com/lucide@latest"></script>
    `;

    const allInjectedScripts = `${importMapScript}${lifecyclePolyfillScript}${runtimePolyfills}${consoleCaptureScript}${runtimeErrorCaptureScript}${inspectElementScript}${audioPolyfillScript}${injectedStyles}`;

    let compiled = htmlFile
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^[\s\S]*?<\/think>/gi, '')
      .replace(/<\/think>/gi, '')
      .replace(/(?:^|\n)(?:Here's a thinking process|Thinking Process|Thinking):[\s\S]*?(?=(?:```|<!DOCTYPE|<html|<nonaArtifact|<<<<<<< SEARCH|$))/i, '')
      .trim();

    // Guard unclosed script tags that trigger "Unexpected end of input"
    if (compiled.includes('<script') && !compiled.includes('</script>')) {
      compiled += '\n</script>';
    }
    if (!compiled.includes('</body>') && compiled.includes('<body')) {
      compiled += '\n</body>';
    }
    if (!compiled.includes('</html>') && compiled.includes('<html')) {
      compiled += '\n</html>';
    }

    // Rewrite relative script src to virtual blob URLs
    Object.entries(scriptBlobMap).forEach(([specifier, blobUrl]) => {
      const escaped = specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(<script[^>]*src=["'])(\\./)?${escaped}(["'][^>]*>)`, 'gi');
      compiled = compiled.replace(regex, `$1${blobUrl}$3`);
    });

    if (compiled.includes('<head>')) {
      compiled = compiled.replace('<head>', `<head>${allInjectedScripts}`);
    } else if (compiled.includes('<!DOCTYPE html>') || compiled.includes('<html')) {
      compiled = compiled.replace(/<html[^>]*>/, `$&<head>${allInjectedScripts}</head>`);
    } else {
      // If code is pure React JSX or body snippet, wrap it in a complete HTML/Babel shell
      compiled = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${allInjectedScripts}
</head>
<body class="bg-slate-950 text-white min-h-screen font-sans">
  <div id="root">${compiled.includes('<div') ? compiled : ''}</div>
</body>
</html>`;
    }

    return compiled;
  }, [htmlFile, filesMap, isInspectMode]);

  // Handle postMessage logs, runtime errors, and element inspection from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SANDBOX_RUNTIME_ERROR' || event.data?.type === 'NONA_LOG') {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const isRuntimeErr = event.data.type === 'SANDBOX_RUNTIME_ERROR';
        const level = isRuntimeErr ? 'error' : event.data.level;
        const msg = isRuntimeErr
          ? `${event.data.msg}${event.data.line ? ` (Línea ${event.data.line}:C${event.data.col || 0})` : ''}`
          : event.data.msg;

        setConsoleLogs(prev => [
          ...prev.slice(-49),
          {
            type: level,
            message: msg,
            time
          }
        ]);
      } else if (event.data?.type === 'NONA_ELEMENT_SELECTED') {
        if (onElementSelect) {
          onElementSelect(event.data.info);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementSelect]);

  const handleOpenInNewTab = () => {
    const blob = new Blob([srcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const toggleInspect = () => {
    const next = !isInspectMode;
    setIsInspectMode(next);
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'NONA_TOGGLE_INSPECT', enabled: next }, '*');
    }
  };

  const errorLogs = useMemo(() => consoleLogs.filter(l => l.type === 'error'), [consoleLogs]);

  const handleTriggerAutoFix = () => {
    if (onAutoFixErrors && errorLogs.length > 0) {
      onAutoFixErrors(errorLogs.map(e => e.message));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden select-none font-sans">
      
      {/* Top Preview Controls */}
      <div className="h-11 bg-white border-b border-slate-200 flex items-center justify-between px-3 shrink-0">
        
        {/* Tabs: Preview vs Console & QA Score */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Vista Previa</span>
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'console'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-slate-600" />
            <span>Consola</span>
            {consoleLogs.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                errorLogs.length > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {consoleLogs.length}
              </span>
            )}
          </button>

          {isContainerBooting ? (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold animate-pulse">
              <Server className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              <span>Iniciando WebContainer...</span>
            </div>
          ) : webContainerUrl ? (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
              <Server className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>WebContainer (Vite Live)</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Virtual Multi-File Sandbox</span>
            </div>
          )}
        </div>

        {/* Viewport Switching & Inspection Controls */}
        <div className="flex items-center gap-1.5">
          {/* Click to Inspect Element */}
          <button
            onClick={toggleInspect}
            title={isInspectMode ? 'Desactivar Inspector de Elementos' : 'Inspeccionar Elemento (Clic para editar)'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border ${
              isInspectMode
                ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-300'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isInspectMode ? 'Inspeccionando...' : 'Inspeccionar'}</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          {/* Viewport Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewport === 'desktop' ? 'bg-white shadow-2xs text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de Escritorio"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewport === 'tablet' ? 'bg-white shadow-2xs text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista Tablet"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewport === 'mobile' ? 'bg-white shadow-2xs text-indigo-600' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Simulador iPhone 15 Pro"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIframeKey(k => k + 1)}
            title="Recargar vista previa"
            className="p-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer ml-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleOpenInNewTab}
            title="Abrir en pestaña completa"
            className="p-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Main Preview Container */}
      <div className="flex-1 p-3 flex items-center justify-center overflow-auto bg-slate-100 relative">
        {activeTab === 'preview' && errorLogs.length > 0 && (
          <div className="absolute top-5 left-5 right-5 bg-rose-950/95 border border-rose-500/70 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between z-40 animate-fade-in text-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              <div className="overflow-hidden">
                <p className="font-bold text-rose-200">Error de ejecución en la vista previa:</p>
                <p className="text-rose-300 font-mono truncate max-w-md">{errorLogs[errorLogs.length - 1].message}</p>
              </div>
            </div>
            <button
              onClick={handleTriggerAutoFix}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 font-bold text-white rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer ml-3"
            >
              <Wrench className="w-3.5 h-3.5" />
              Auto-Corregir con NONA
            </button>
          </div>
        )}

        {activeTab === 'preview' ? (
          viewport === 'mobile' ? (
            /* iPhone 15 Pro Shell Frame */
            <div className="w-[375px] h-[740px] bg-slate-900 border-[6px] border-slate-800 rounded-[50px] shadow-2xl overflow-hidden relative flex flex-col shrink-0 animate-fade-in">
              {/* Dynamic Island Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-between px-2.5 pointer-events-none shadow-md">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
              
              <iframe
                key={iframeKey}
                title="Live Sandbox Mobile"
                src={webContainerUrl || undefined}
                srcDoc={!webContainerUrl ? srcDoc : undefined}
                className="w-full h-full border-none bg-white flex-1"
                sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
              />
            </div>
          ) : (
            <div
              style={{ width: viewport === 'tablet' ? '768px' : '100%' }}
              className="h-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 flex flex-col"
            >
              <iframe
                key={iframeKey}
                title="Live Sandbox"
                src={webContainerUrl || undefined}
                srcDoc={!webContainerUrl ? srcDoc : undefined}
                className="w-full h-full border-none bg-white flex-1"
                sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
              />
            </div>
          )
        ) : (
          <div className="w-full h-full bg-slate-900 text-slate-100 rounded-3xl p-5 font-mono text-xs overflow-y-auto space-y-3 shadow-inner flex flex-col">
            <div className="text-[11px] text-slate-400 border-b border-slate-800 pb-2.5 flex justify-between items-center shrink-0">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Terminal de Logs del Sandbox
              </span>
              <div className="flex items-center gap-3">
                {errorLogs.length > 0 && onAutoFixErrors && (
                  <button
                    onClick={handleTriggerAutoFix}
                    className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-[11px] transition-all shadow-md cursor-pointer animate-bounce"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>⚡ Reparar {errorLogs.length} Errores con IA</span>
                  </button>
                )}
                <button
                  onClick={() => setConsoleLogs([])}
                  className="text-indigo-400 hover:underline cursor-pointer font-bold"
                >
                  Limpiar Logs
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {consoleLogs.length === 0 ? (
                <p className="text-slate-500 pt-2">No hay logs registrados en la consola.</p>
              ) : (
                consoleLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-slate-500">[{log.time}]</span>
                    <span className={log.type === 'error' ? 'text-red-400 font-bold' : log.type === 'warn' ? 'text-amber-300 font-bold' : 'text-emerald-300 font-bold'}>
                      {log.type.toUpperCase()}:
                    </span>
                    <span>{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
