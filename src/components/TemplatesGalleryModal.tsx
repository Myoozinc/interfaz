import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, Loader2, LayoutGrid, Gamepad2 } from 'lucide-react';
import { CATALOG_TEMPLATES, CATALOG_GROUPS, resolveTemplateFiles } from '../services/catalogTemplates';
import type { ProjectTemplate } from '../types';

interface TemplatesGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProjectTemplate) => void;
}

type Group = 'Apps' | 'Juegos';

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const TemplatesGalleryModal: React.FC<TemplatesGalleryModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const [group, setGroup] = useState<Group>('Apps');
  const [category, setCategory] = useState<string>('Todas');
  const [query, setQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const q = fold(query.trim());
  const visible = useMemo(() => CATALOG_TEMPLATES.filter(t => {
    if (q) {
      return fold(`${t.name} ${t.description} ${t.category} ${(t.tags || []).join(' ')}`).includes(q);
    }
    return t.group === group && (category === 'Todas' || t.category === category);
  }), [q, group, category]);

  if (!isOpen) return null;

  const counts = (g: Group) => CATALOG_TEMPLATES.filter(t => t.group === g).length;

  const handleLoad = async (t: ProjectTemplate) => {
    setError(null);
    setLoadingId(t.id);
    try {
      const full = await resolveTemplateFiles(t);
      onSelectTemplate(full);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la plantilla. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-label="Plantillas" className="relative w-full max-w-6xl h-full sm:h-[min(880px,92vh)] bg-panel sm:border border-line sm:rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden">

        {/* Cabecera */}
        <div className="px-5 sm:px-7 pt-5 pb-4 flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="font-display text-[26px] sm:text-[30px] font-bold tracking-[-0.02em] text-fg leading-tight">Empieza con una plantilla</h2>
            <p className="mt-1 text-[14px] text-fg-2 max-w-[60ch]">
              Apps y juegos completos que funcionan desde el primer minuto. Cárgalos y pídele a NONA los cambios que quieras.
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg text-muted hover:text-fg hover:bg-raised transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grupos, categorías y búsqueda */}
        <div className="px-5 sm:px-7 pb-4 flex flex-col gap-3 shrink-0 border-b border-line">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" className="inline-flex p-1 rounded-xl bg-canvas border border-line">
              {(['Apps', 'Juegos'] as Group[]).map(g => {
                const Icon = g === 'Apps' ? LayoutGrid : Gamepad2;
                const active = !q && group === g;
                return (
                  <button
                    key={g}
                    role="tab"
                    aria-selected={active}
                    onClick={() => { setGroup(g); setCategory('Todas'); setQuery(''); }}
                    className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[14px] font-medium transition-colors cursor-pointer ${active ? 'bg-raised-2 text-fg' : 'text-muted hover:text-fg'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {g}
                    <span className="text-[12px] tabular-nums text-faint">{counts(g)}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar: tienda, reservas, carreras…"
                aria-label="Buscar plantillas"
                className="w-full h-10 bg-canvas border border-line rounded-lg pl-9 pr-3 text-[14px] text-fg placeholder-faint outline-none focus:border-accent/70 transition-colors"
              />
            </div>
          </div>

          {!q && (
            <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5">
              {['Todas', ...CATALOG_GROUPS[group]].map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={`h-8 px-3 rounded-full text-[13px] whitespace-nowrap transition-colors cursor-pointer border ${
                    category === c ? 'bg-fg text-canvas border-fg' : 'border-line text-fg-2 hover:text-fg hover:border-line-strong'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div role="alert" className="mx-5 sm:mx-7 mt-4 px-3.5 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[13px]">{error}</div>
        )}

        {/* Rejilla */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5">
          {q && (
            <p className="mb-4 text-[13px] text-muted">
              {visible.length === 0 ? 'Sin resultados' : `${visible.length} resultado${visible.length === 1 ? '' : 's'}`} para «{query.trim()}»
            </p>
          )}

          {visible.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[15px] text-fg-2">No hay plantillas para esa búsqueda.</p>
              <p className="mt-1 text-[13px] text-muted">Prueba con otra palabra, o describe tu idea en el chat y NONA la crea desde cero.</p>
              <button onClick={() => setQuery('')} className="mt-4 h-9 px-4 rounded-lg bg-raised hover:bg-raised-2 text-[13px] text-fg transition-colors cursor-pointer">
                Ver todas las plantillas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max gap-x-5 gap-y-7">
              {visible.map(t => {
                const loading = loadingId === t.id;
                return (
                  <article key={t.id} className="group flex flex-col">
                    <button
                      onClick={() => handleLoad(t)}
                      disabled={!!loadingId}
                      aria-label={`Usar la plantilla ${t.name}`}
                      className="relative block w-full shrink-0 aspect-[16/10] rounded-xl overflow-hidden bg-raised border border-line group-hover:border-line-strong transition-colors cursor-pointer disabled:cursor-wait"
                    >
                      {t.thumbnail && (
                        <img
                          src={t.thumbnail}
                          alt={`Captura de ${t.name}`}
                          loading="lazy"
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/35 transition-colors">
                        <span className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-fg text-canvas text-[13px] font-medium shadow-lg transition-opacity ${loading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                          {loading ? 'Cargando…' : 'Usar plantilla'}
                        </span>
                      </span>
                    </button>
                    <div className="pt-3 px-0.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-[15px] font-medium text-fg truncate">{t.name}</h3>
                        <span className="text-[12px] text-muted shrink-0">{t.category}</span>
                      </div>
                      <p className="mt-1 text-[13px] text-fg-2 leading-relaxed line-clamp-2">{t.description}</p>
                      {t.controls && <p className="mt-1.5 text-[12px] text-muted line-clamp-1">{t.controls}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
