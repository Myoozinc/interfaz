import React, { useState, useEffect, useMemo } from 'react';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  RotateCw, 
  ExternalLink, 
  Terminal, 
  Eye
} from 'lucide-react';
import type { FileItem } from '../types';

interface PreviewPanelProps {
  files: FileItem[];
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ files }) => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'console'>('preview');
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
  }, [htmlFile, cssFile]);

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
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleOpenInNewTab = () => {
    const blob = new Blob([srcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden select-none font-sans">
      
      {/* Top Preview Controls */}
      <div className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-3 shrink-0">
        
        {/* Tabs: Preview vs Console */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
        </div>

        {/* Viewport & Actions */}
        <div className="flex items-center gap-1.5">
          {activeTab === 'preview' && (
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={() => setViewport('desktop')}
                title="Escritorio (100%)"
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  viewport === 'desktop' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewport('tablet')}
                title="Tablet (768px)"
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  viewport === 'tablet' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                title="Móvil (375px)"
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  viewport === 'mobile' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIframeKey(k => k + 1)}
            title="Recargar Vista Previa"
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleOpenInNewTab}
            title="Abrir en pestaña completa"
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Main Preview Container */}
      <div className="flex-1 p-3 flex items-center justify-center overflow-auto bg-slate-100">
        {activeTab === 'preview' ? (
          <div
            style={{ width: getViewportWidth() }}
            className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 flex flex-col"
          >
            <iframe
              key={iframeKey}
              title="Live Sandbox"
              srcDoc={srcDoc}
              className="w-full h-full border-none bg-white flex-1"
              sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs overflow-y-auto space-y-1.5 shadow-inner">
            <div className="text-[11px] text-slate-400 border-b border-slate-800 pb-2 flex justify-between">
              <span>Terminal de Logs del Preview</span>
              <button
                onClick={() => setConsoleLogs([])}
                className="text-indigo-400 hover:underline cursor-pointer"
              >
                Limpiar
              </button>
            </div>
            {consoleLogs.length === 0 ? (
              <p className="text-slate-500 pt-2">No hay logs registrados.</p>
            ) : (
              consoleLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-slate-500">[{log.time}]</span>
                  <span className={log.type === 'error' ? 'text-red-400 font-bold' : log.type === 'warn' ? 'text-amber-300' : 'text-emerald-300'}>
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
