import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Globe, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Key,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Zap,
  Layers,
  Server
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
  const [openRouterKey, setOpenRouterKey] = useState(() => {
    return localStorage.getItem('nona_openrouter_key') || localStorage.getItem('nona_cloud_api_key') || '';
  });
  const [groqKey, setGroqKey] = useState(() => {
    return localStorage.getItem('nona_groq_key') || '';
  });
  const [showDevKeys, setShowDevKeys] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    if (openRouterKey.trim()) {
      localStorage.setItem('nona_openrouter_key', openRouterKey.trim());
      localStorage.setItem('nona_cloud_api_key', openRouterKey.trim());
    } else {
      localStorage.removeItem('nona_openrouter_key');
      localStorage.removeItem('nona_cloud_api_key');
    }
    if (groqKey.trim()) {
      localStorage.setItem('nona_groq_key', groqKey.trim());
    } else {
      localStorage.removeItem('nona_groq_key');
    }
    onClose();
  };

  const handleTestKey = async () => {
    const keyToTest = openRouterKey.trim() || groqKey.trim();
    if (!keyToTest) return;
    setTesting(true);
    setTestResult(null);

    const isGroq = keyToTest.startsWith('gsk_');
    const endpoint = isGroq 
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';

    const model = isGroq ? 'qwen/qwen3.8-27b' : 'qwen/qwen3.8-27b';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyToTest}`,
          'HTTP-Referer': 'https://interfaz-hazel.vercel.app',
          'X-Title': 'NONA App',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Ping' }],
        }),
      });

      if (res.ok) {
        setTestResult({ 
          ok: true, 
          message: isGroq 
            ? 'Conexión exitosa con Groq LPUs' 
            : 'Conexión exitosa con OpenRouter AI' 
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setTestResult({ ok: false, message: `Error: ${err.error?.message || res.statusText}` });
      }
    } catch {
      setTestResult({ ok: false, message: 'Error al conectar con el servidor cloud' });
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
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Centro de Inteligencia Cloud
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Infraestructura multi-proveedor autónoma y pre-conectada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Active Cloud Status Card (Zero-Key Experience) */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-indigo-50/30 p-4 rounded-2xl border border-emerald-200/80 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                NONA Cloud Gateway: Pre-conectado
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                ONLINE
              </span>
            </div>

            <p className="text-[11px] text-emerald-950/80 font-medium leading-relaxed">
              No necesitas configurar ninguna clave API. NONA opera sobre una red distribuida de servidores cloud con conmutación por error automática (failover) y balanceo inteligente.
            </p>

            {/* Providers Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 text-[11px]">Groq LPUs</div>
                  <div className="text-[10px] text-slate-500">Qwen 3.8 / Llama 3.3 (Ultra rápido)</div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 text-[11px]">SambaNova Cloud</div>
                  <div className="text-[10px] text-slate-500">16,000 tokens de contexto</div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 text-[11px]">Cerebras Cloud</div>
                  <div className="text-[10px] text-slate-500">Inferencia a escala de oblea</div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 text-[11px]">Google & OpenRouter</div>
                  <div className="text-[10px] text-slate-500">Visión UI y respaldo 24/7</div>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Developer Override Section */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowDevKeys(!showDevKeys)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <span className="font-bold text-slate-800 flex items-center gap-2 text-xs">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                Opciones Avanzadas de Desarrollador (Opcional)
              </span>
              {showDevKeys ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showDevKeys && (
              <div className="p-4 pt-1 space-y-3 border-t border-slate-200/80 bg-white">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Solo necesario si deseas forzar el uso de tus propias cuentas privadas de API en lugar de la infraestructura en la nube administrada por NONA.
                </p>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    OpenRouter API Key (`sk-or-...`):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={openRouterKey}
                      onChange={(e) => setOpenRouterKey(e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-900 font-mono"
                    />
                    <button
                      onClick={handleTestKey}
                      disabled={testing || !openRouterKey.trim()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer text-[11px]"
                    >
                      {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Probar'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Groq API Key (`gsk_...`):
                  </label>
                  <input
                    type="password"
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-900 font-mono"
                  />
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
            )}
          </div>

          {/* GitHub & Vercel Sync Info */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Server className="w-3.5 h-3.5 text-slate-700" />
              Infraestructura & Despliegue
            </span>

            <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-[11px]">
              <span className="font-mono font-semibold text-slate-900">Myoozinc/interfaz</span>
              <a
                href="https://github.com/Myoozinc/interfaz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
              >
                GitHub <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-[11px]">
              <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                Vercel Serverless Gateway
              </span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Sincronizado
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold transition-all cursor-pointer text-xs"
          >
            Cerrar
          </button>
          {showDevKeys && (
            <button
              onClick={handleSaveApiKey}
              className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold shadow-2xs transition-all cursor-pointer text-xs"
            >
              Guardar Claves
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
