import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Cpu, 
  Globe, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Key
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('nona_cloud_api_key') || '';
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    localStorage.setItem('nona_cloud_api_key', apiKey.trim());
    onClose();
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': 'https://interfaz-hazel.vercel.app',
          'X-Title': 'NONA App',
        },
        body: JSON.stringify({
          model: 'qwen/qwen-2.5-coder-32b-instruct',
          messages: [{ role: 'user', content: 'Ping' }],
        }),
      });

      if (res.ok) {
        setTestResult({ ok: true, message: 'Qwen 2.5 Coder 32B Cloud Conectado y Verificado' });
      } else {
        const err = await res.json();
        setTestResult({ ok: false, message: `Error: ${err.error?.message || res.statusText}` });
      }
    } catch {
      setTestResult({ ok: false, message: 'Error al conectar con OpenRouter Cloud' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-fade-in text-xs font-sans">
        
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Settings className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-900">
              Ajustes del Motor IA Cloud
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Active Cloud Model Card */}
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-600" />
                Motor IA Cloud Activo
              </span>
              <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                100% Cloud (0% Mac)
              </span>
            </div>
            <p className="text-[11px] text-indigo-900/80 font-medium">
              <strong>Qwen 2.5 Coder 32B Instruct</strong> (32 mil millones de parámetros) ejecutándose en OpenRouter Cloud.
            </p>
          </div>

          {/* OpenRouter API Key Input */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-indigo-600" />
                Clave API OpenRouter
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                {apiKey ? 'Configurada' : 'Sin Configurar'}
              </span>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 block mb-1">
                Pega tu OpenRouter API Key:
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-900 font-mono"
                />
                <button
                  onClick={handleTestKey}
                  disabled={testing || !apiKey.trim()}
                  className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Probar'}
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                testResult.ok 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {testResult.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
                <span className="text-[11px] leading-tight font-medium">{testResult.message}</span>
              </div>
            )}
          </div>

          {/* GitHub & Vercel Sync Info */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <svg className="w-4 h-4 fill-current text-slate-900" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Repositorio GitHub
            </span>

            <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-[11px]">
              <span className="font-mono font-semibold text-slate-900">Myoozinc/interfaz</span>
              <a
                href="https://github.com/Myoozinc/interfaz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
              >
                Abrir <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-600" />
              Despliegue Vercel
            </span>
            <p className="text-[11px] text-slate-600 font-medium">
              Sincronizado automáticamente con tu cuenta de Vercel.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleSaveApiKey}
            className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold shadow-2xs transition-all cursor-pointer"
          >
            Guardar y Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
