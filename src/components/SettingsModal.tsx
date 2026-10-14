import React, { useEffect, useState } from 'react';
import { X, ChevronDown, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;
}

type Provider = 'openai' | 'anthropic' | 'gemini' | 'deepseek';

const PROVIDERS: { id: Provider; name: string; placeholder: string; test: string; where: string }[] = [
  { id: 'anthropic', name: 'Anthropic (Claude)', placeholder: 'sk-ant-…', test: 'anthropic:claude-haiku-4-5-20251001', where: 'console.anthropic.com' },
  { id: 'openai', name: 'OpenAI (ChatGPT)', placeholder: 'sk-…', test: 'openai:gpt-4.1-mini', where: 'platform.openai.com' },
  { id: 'gemini', name: 'Google Gemini', placeholder: 'AIza…', test: 'gemini:gemini-2.5-flash', where: 'aistudio.google.com' },
  { id: 'deepseek', name: 'DeepSeek', placeholder: 'sk-…', test: 'deepseek:deepseek-chat', where: 'platform.deepseek.com' },
];

const STORAGE = 'nona_user_keys';
const load = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(STORAGE) || '{}') || {}; } catch { return {}; } };

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState<Record<string, string>>(load);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, { state: 'testing' | 'ok' | 'error'; msg?: string }>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setKeys(load());
    setSaved(false);
    setOpen(Object.values(load()).some(Boolean));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const save = () => {
    const clean: Record<string, string> = {};
    for (const p of PROVIDERS) if (keys[p.id]?.trim()) clean[p.id] = keys[p.id].trim();
    if (Object.keys(clean).length) localStorage.setItem(STORAGE, JSON.stringify(clean));
    else localStorage.removeItem(STORAGE);
    setSaved(true);
    setTimeout(onClose, 600);
  };

  const test = async (p: typeof PROVIDERS[number]) => {
    const key = keys[p.id]?.trim();
    if (!key) return;
    setStatus(s => ({ ...s, [p.id]: { state: 'testing' } }));
    try {
      const r = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ only: p.test, userKeys: { [p.id]: key }, messages: [{ role: 'user', content: 'Responde solo: ok' }], maxTokensRequested: 300, stream: true }),
      });
      const text = await r.text();
      if (r.ok && /"message"/.test(text)) setStatus(s => ({ ...s, [p.id]: { state: 'ok', msg: 'Llave válida' } }));
      else {
        let msg = 'La llave no funciona';
        if (/401|403|invalid|incorrect|unauthor/i.test(text)) msg = 'Llave no válida o sin permisos';
        else if (/429|quota|credit|balance|billing/i.test(text)) msg = 'La cuenta no tiene saldo o cupo';
        setStatus(s => ({ ...s, [p.id]: { state: 'error', msg } }));
      }
    } catch {
      setStatus(s => ({ ...s, [p.id]: { state: 'error', msg: 'No se pudo comprobar (sin conexión)' } }));
    }
  };

  const count = PROVIDERS.filter(p => keys[p.id]?.trim()).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Ajustes" className="w-full max-w-lg bg-panel border border-line rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[22px] font-bold tracking-[-0.01em] text-fg">Ajustes</h2>
            <p className="mt-0.5 text-[13px] text-fg-2">Cómo genera NONA tus apps.</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted hover:text-fg hover:bg-raised transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-5 space-y-4 overflow-y-auto">
          <section className="rounded-xl border border-line bg-canvas p-4">
            <div className="flex items-center gap-2 text-[14px] font-medium text-fg">
              <Sparkles className="w-4 h-4 text-accent" /> IA gratuita incluida
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-fg-2">
              No necesitas configurar nada. NONA combina varios modelos gratuitos: uno planifica la app, varios escriben las pantallas
              en paralelo y otro revisa y corrige los errores. Si un proveedor está ocupado, cambia solo a otro.
            </p>
          </section>

          <section className="rounded-xl border border-line overflow-hidden">
            <button
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-raised/60 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 text-[13px] text-fg-2">
                <KeyRound className="w-4 h-4 text-muted" />
                Usar tu propia llave de IA <span className="text-muted">(opcional)</span>
                {count > 0 && <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-md bg-accent/15 text-accent">{count} activa{count > 1 ? 's' : ''}</span>}
              </span>
              <ChevronDown className={`w-4 h-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-line">
                <p className="text-[12.5px] leading-relaxed text-muted">
                  Si tienes cuenta de pago en alguno de estos servicios, NONA usará ese modelo primero para planificar y escribir tu app.
                  La llave se guarda solo en este navegador y se usa únicamente para tus peticiones.
                </p>
                {PROVIDERS.map(p => {
                  const st = status[p.id];
                  return (
                    <div key={p.id}>
                      <label htmlFor={`key-${p.id}`} className="flex items-baseline justify-between text-[12.5px] text-fg-2 mb-1">
                        <span>{p.name}</span>
                        <span className="text-[11px] text-faint">{p.where}</span>
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            id={`key-${p.id}`}
                            type={visible[p.id] ? 'text' : 'password'}
                            autoComplete="off"
                            spellCheck={false}
                            value={keys[p.id] || ''}
                            onChange={(e) => { setKeys(k => ({ ...k, [p.id]: e.target.value })); setStatus(s => ({ ...s, [p.id]: undefined as any })); }}
                            placeholder={p.placeholder}
                            className="w-full h-9 pl-3 pr-9 bg-canvas border border-line rounded-lg text-[13px] text-fg font-mono placeholder-faint outline-none focus:border-accent/70 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setVisible(v => ({ ...v, [p.id]: !v[p.id] }))}
                            aria-label={visible[p.id] ? 'Ocultar llave' : 'Mostrar llave'}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted hover:text-fg cursor-pointer"
                          >
                            {visible[p.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <button
                          onClick={() => test(p)}
                          disabled={!keys[p.id]?.trim() || st?.state === 'testing'}
                          className="h-9 px-3 rounded-lg bg-raised hover:bg-raised-2 text-[12.5px] text-fg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          {st?.state === 'testing' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Probar
                        </button>
                      </div>
                      {st && st.state !== 'testing' && (
                        <p className={`mt-1 text-[12px] flex items-center gap-1.5 ${st.state === 'ok' ? 'text-emerald-300' : 'text-amber-300'}`}>
                          {st.state === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          {st.msg}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-line text-[13px] text-fg-2 hover:text-fg hover:bg-raised transition-colors cursor-pointer">Cerrar</button>
          {open && (
            <button onClick={save} className="h-9 px-4 rounded-lg bg-accent hover:bg-accent-strong text-accent-ink hover:text-white text-[13px] font-medium transition-colors cursor-pointer">
              {saved ? 'Guardado' : 'Guardar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
