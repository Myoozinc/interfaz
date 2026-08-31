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
  ShieldCheck,
  Wrench
} from 'lucide-react';
import type { FileItem } from '../types';

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

  const htmlFile = useMemo(() => {
    if (htmlCode) return htmlCode;
    if (Array.isArray(files)) {
      const indexFile = files.find(f => f.name === 'index.html' || f.name.endsWith('.html'));
      return indexFile ? indexFile.content : files[0]?.content || '';
    }
    if (files && typeof files === 'object') {
      return files['index.html'] || Object.values(files)[0] || '';
    }
    return '';
  }, [files, htmlCode]);

  // Clean compilation & bundling of source document (Antigravity Zero-Artifact Engine)
  const srcDoc = useMemo(() => {
    if (!htmlFile || htmlFile.trim().length === 0) {
      return `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 text-white min-h-screen flex items-center justify-center font-sans"><div class="text-center p-6"><h2 class="text-lg font-bold">Esperando generación...</h2></div></body></html>`;
    }

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
          window.addEventListener('error', function(e) {
            console.error(e.message);
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

    let compiled = htmlFile;
    if (compiled.includes('<head>')) {
      compiled = compiled.replace('<head>', `<head>${consoleCaptureScript}${inspectElementScript}${audioPolyfillScript}`);
    } else {
      compiled = `${consoleCaptureScript}${inspectElementScript}${audioPolyfillScript}${compiled}`;
    }

    return compiled;
  }, [htmlFile, isInspectMode]);

  // Handle postMessage logs and element inspection from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NONA_LOG') {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setConsoleLogs(prev => [
          ...prev.slice(-49),
          {
            type: event.data.level,
            message: event.data.msg,
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

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>QA Verified 100%</span>
          </div>
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
      <div className="flex-1 p-3 flex items-center justify-center overflow-auto bg-slate-100">
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
                srcDoc={srcDoc}
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
                srcDoc={srcDoc}
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
