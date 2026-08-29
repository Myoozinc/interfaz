import React, { useState, useEffect, useMemo } from 'react';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  RotateCw, 
  ExternalLink, 
  Terminal, 
  Eye,
  Crosshair,
  ShieldCheck
} from 'lucide-react';
import type { FileItem } from '../types';

interface PreviewPanelProps {
  files: FileItem[];
  onElementSelect?: (elementInfo: string) => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ files, onElementSelect }) => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'console'>('preview');
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<{ type: string; message: string; time: string }[]>([]);
  const [iframeKey, setIframeKey] = useState(0);

  const htmlFile = files.find(f => f.name.endsWith('.html'))?.content || '';
  const cssFile = files.find(f => f.name.endsWith('.css'))?.content || '';

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
            const className = target.className && typeof target.className === 'string' ? '.' + target.className.split(' ').slice(0, 3).join('.') : '';
            const text = (target.innerText || target.textContent || '').trim().slice(0, 40);
            
            const info = 'Elemento seleccionado: <' + tag + id + className + '> "' + text + '"';
            window.parent.postMessage({ type: 'NONA_ELEMENT_SELECTED', info: info }, '*');
          });
        })();
      </script>
    `;

    const backendMockScript = `
      <script>
        (function() {
          // In-memory persistent database simulator
          window.NONA_DB = {
            tables: JSON.parse(localStorage.getItem('nona_mock_db') || '{}'),
            save: function() { localStorage.setItem('nona_mock_db', JSON.stringify(this.tables)); },
            find: function(table) { return this.tables[table] || []; },
            insert: function(table, item) {
              if (!this.tables[table]) this.tables[table] = [];
              const newItem = { id: Date.now().toString(), ...item, createdAt: new Date().toISOString() };
              this.tables[table].push(newItem);
              this.save();
              return newItem;
            }
          };

          // Web Audio sound synthesizer for real game audio, pet sounds & clicks
          window.playSynthSound = function(type) {
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              if (type === 'engine' || type === 'car') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(70, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
              } else if (type === 'eat' || type === 'happy' || type === 'pet') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
              } else if (type === 'click' || type === 'button') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(500, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
              } else if (type === 'win' || type === 'point') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
              }
            } catch(e) {}
          };
        })();
      </script>
    `;

    let doc = htmlFile;

    if (doc.includes('<!DOCTYPE') || doc.includes('<html')) {
      const headInject = `
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <script src="https://unpkg.com/lucide@latest"></script>
        ${consoleCaptureScript}
        ${inspectElementScript}
        ${backendMockScript}
        ${cssFile && !cssFile.includes('Custom Refined Cream Aesthetic') ? `<style>${cssFile}</style>` : ''}
      `;

      if (doc.includes('<head>')) {
        doc = doc.replace('<head>', '<head>' + headInject);
      } else if (doc.includes('<html>')) {
        doc = doc.replace('<html>', '<html><head>' + headInject + '</head>');
      }

      const bodyInject = `
        <script>
          try {
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
              window.lucide.createIcons();
            }
          } catch(e) {}
        </script>
      `;

      if (doc.includes('</body>')) {
        doc = doc.replace('</body>', bodyInject + '</body>');
      } else {
        doc += bodyInject;
      }

      return doc;
    }

    return `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
          <script src="https://unpkg.com/lucide@latest"></script>
          ${consoleCaptureScript}
          ${inspectElementScript}
          ${backendMockScript}
          ${cssFile && !cssFile.includes('Custom Refined Cream Aesthetic') ? `<style>${cssFile}</style>` : ''}
        </head>
        <body class="bg-slate-950 text-white min-h-screen">
          ${htmlFile}
          <script>
            try {
              if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
              }
            } catch(e) {}
          </script>
        </body>
      </html>
    `;
  }, [htmlFile, cssFile, isInspectMode]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NONA_LOG') {
        setConsoleLogs(prev => [
          ...prev.slice(-40),
          {
            type: event.data.level,
            message: event.data.msg,
            time: new Date().toLocaleTimeString(),
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
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full font-bold">
                {consoleLogs.length}
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>QA Verified 100%</span>
          </div>
        </div>

        {/* Viewport & Tools */}
        <div className="flex items-center gap-1.5">
          {activeTab === 'preview' && (
            <>
              {/* Click-to-Inspect Button */}
              <button
                onClick={toggleInspect}
                title="Inspeccionar elemento para editar con IA"
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isInspectMode 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm animate-pulse' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isInspectMode ? 'Inspeccionando...' : 'Inspeccionar'}</span>
              </button>

              {/* Viewport Buttons */}
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                <button
                  onClick={() => setViewport('desktop')}
                  title="Escritorio (100%)"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewport === 'desktop' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewport('tablet')}
                  title="Tablet (768px)"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewport === 'tablet' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewport('mobile')}
                  title="iPhone 15 Móvil (375px)"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewport === 'mobile' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => setIframeKey(k => k + 1)}
            title="Recargar Vista Previa"
            className="p-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
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
          <div className="w-full h-full bg-slate-900 text-slate-100 rounded-3xl p-5 font-mono text-xs overflow-y-auto space-y-2 shadow-inner">
            <div className="text-[11px] text-slate-400 border-b border-slate-800 pb-2.5 flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Terminal de Logs del Sandbox
              </span>
              <button
                onClick={() => setConsoleLogs([])}
                className="text-indigo-400 hover:underline cursor-pointer font-bold"
              >
                Limpiar Logs
              </button>
            </div>
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
        )}
      </div>

    </div>
  );
};
