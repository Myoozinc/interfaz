import React, { useState, useEffect } from 'react';
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
  const jsFile = files.find(f => f.name.endsWith('.js'))?.content || '';

  // Construct bundled source document
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/lucide@latest"></script>
        <style>
          ${cssFile}
        </style>
        <script>
          const _log = console.log;
          const _err = console.error;
          const _warn = console.warn;
          console.log = function(...args) {
            window.parent.postMessage({ type: 'NONA_LOG', level: 'info', msg: args.join(' ') }, '*');
            _log.apply(console, args);
          };
          console.error = function(...args) {
            window.parent.postMessage({ type: 'NONA_LOG', level: 'error', msg: args.join(' ') }, '*');
            _err.apply(console, args);
          };
          console.warn = function(...args) {
            window.parent.postMessage({ type: 'NONA_LOG', level: 'warn', msg: args.join(' ') }, '*');
            _warn.apply(console, args);
          };
        </script>
      </head>
      <body>
        ${htmlFile.includes('<body') ? htmlFile : `<div>${htmlFile}</div>`}
        <script>
          try {
            ${jsFile}
            if (window.lucide) {
              window.lucide.createIcons();
            }
          } catch(e) {
            console.error(e.message);
          }
        </script>
      </body>
    </html>
  `;

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
    <div className="flex-1 flex flex-col h-full bg-[#FAF7F2] overflow-hidden">
      
      {/* Top Preview Controls */}
      <div className="h-10 bg-[#FAF7F2] border-b border-[#E7E0D6] flex items-center justify-between px-3 select-none">
        
        {/* Tabs: Preview vs Console */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white text-[#1C1917] border border-[#E7E0D6] shadow-2xs'
                : 'text-[#57534E] hover:bg-[#F4EFEA]'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-[#A86B32]" />
            <span>Vista Previa</span>
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'console'
                ? 'bg-white text-[#1C1917] border border-[#E7E0D6] shadow-2xs'
                : 'text-[#57534E] hover:bg-[#F4EFEA]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Consola</span>
            {consoleLogs.length > 0 && (
              <span className="text-[10px] bg-[#FAF1E8] text-[#8F5622] px-1.5 py-0.2 rounded-full font-bold border border-[#DFC7B1]">
                {consoleLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Viewport & Actions */}
        <div className="flex items-center gap-1.5">
          {activeTab === 'preview' && (
            <div className="flex items-center bg-white border border-[#E7E0D6] rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={() => setViewport('desktop')}
                title="Escritorio (100%)"
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  viewport === 'desktop' ? 'bg-[#FAF1E8] text-[#A86B32]' : 'text-[#8C827A] hover:text-[#1C1917]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewport('tablet')}
                title="Tablet (768px)"
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  viewport === 'tablet' ? 'bg-[#FAF1E8] text-[#A86B32]' : 'text-[#8C827A] hover:text-[#1C1917]'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                title="Móvil (375px)"
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  viewport === 'mobile' ? 'bg-[#FAF1E8] text-[#A86B32]' : 'text-[#8C827A] hover:text-[#1C1917]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIframeKey(k => k + 1)}
            title="Recargar Vista Previa"
            className="p-1.5 rounded-lg bg-white hover:bg-[#F4EFEA] border border-[#E7E0D6] text-[#57534E] hover:text-[#1C1917] transition-all shadow-2xs cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleOpenInNewTab}
            title="Abrir en pestaña completa"
            className="p-1.5 rounded-lg bg-white hover:bg-[#F4EFEA] border border-[#E7E0D6] text-[#57534E] hover:text-[#1C1917] transition-all shadow-2xs cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Main Preview Container */}
      <div className="flex-1 p-3 flex items-center justify-center overflow-auto bg-[#F4EFEA]/50">
        {activeTab === 'preview' ? (
          <div
            style={{ width: getViewportWidth() }}
            className="h-full bg-white rounded-xl border border-[#E7E0D6] shadow-sm overflow-hidden transition-all duration-300 flex flex-col"
          >
            <iframe
              key={iframeKey}
              title="Live Sandbox"
              srcDoc={srcDoc}
              className="w-full h-full border-none bg-white flex-1"
              sandbox="allow-scripts allow-modals allow-same-origin"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-[#1C1917] text-[#FAF7F2] rounded-xl p-4 font-mono text-xs overflow-y-auto space-y-1.5 shadow-inner">
            <div className="text-[11px] text-[#8C827A] border-b border-[#332F2B] pb-2 flex justify-between">
              <span>Terminal de Logs del Preview</span>
              <button
                onClick={() => setConsoleLogs([])}
                className="text-[#A86B32] hover:underline cursor-pointer"
              >
                Limpiar
              </button>
            </div>
            {consoleLogs.length === 0 ? (
              <p className="text-[#8C827A] pt-2">No hay logs registrados.</p>
            ) : (
              consoleLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#8C827A]">[{log.time}]</span>
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
