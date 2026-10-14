import React, { useMemo, useState } from 'react';
import {
  X, LayoutGrid, Gamepad2, Music, Rocket, BarChart3, ShoppingBag, Smartphone, HeartHandshake, Search,
  ArrowRight, CheckCircle2, Box, Kanban, Code2, Plane, Anchor, Calculator, CarFront, Flag, Sword, Castle,
  Globe, Loader2, Keyboard, Sparkles, Truck, Siren, PlaneLanding, Flame, TreePalm, Skull, Trophy,
} from 'lucide-react';
import { STARTER_TEMPLATES } from '../services/templates';
import { GAME_TEMPLATES, GAME_CATEGORIES, REPLACED_TEMPLATE_IDS, resolveTemplateFiles } from '../services/gameTemplates';
import { NonaLogo } from './NonaLogo';
import type { ProjectTemplate } from '../types';

interface TemplatesGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProjectTemplate) => void;
}

const ALL_TEMPLATES: ProjectTemplate[] = [
  ...GAME_TEMPLATES,
  ...STARTER_TEMPLATES.filter(t => !REPLACED_TEMPLATE_IDS.has(t.id)),
];

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2, Box, Gamepad2, Plane, Music, Rocket, BarChart3, ShoppingBag, Kanban, Smartphone, HeartHandshake,
  Anchor, Calculator, CarFront, Flag, Sword, Castle, Globe, Truck, Siren, PlaneLanding, Flame, TreePalm, Skull, Trophy,
};

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Carros: CarFront, Aviones: Plane, Mundos: Globe, Juegos: Gamepad2,
};

export const TemplatesGalleryModal: React.FC<TemplatesGalleryModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const others = Array.from(new Set(ALL_TEMPLATES.map(t => t.category || 'Aplicación')))
      .filter(c => !(GAME_CATEGORIES as readonly string[]).includes(c));
    return ['Todos', ...GAME_CATEGORIES, ...others];
  }, []);

  if (!isOpen) return null;

  const q = searchQuery.toLowerCase();
  const filtered = ALL_TEMPLATES.filter(t => {
    const matchesCategory = selectedCategory === 'Todos' || t.category === selectedCategory;
    const matchesQuery = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });

  const handleLoad = async (t: ProjectTemplate) => {
    setError(null);
    setLoadingId(t.id);
    try {
      const full = await resolveTemplateFiles(t);
      onSelectTemplate(full);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la plantilla');
    } finally {
      setLoadingId(null);
    }
  };

  const renderIcon = (name: string, cls = 'w-5 h-5') => {
    const Icon = ICONS[name] || LayoutGrid;
    return <Icon className={cls} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[94vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        <div className="p-4 sm:p-6 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3.5 min-w-0">
            <NonaLogo size={36} variant="badge" />
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2 flex-wrap">
                Galería de Plantillas
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                  {ALL_TEMPLATES.length} funcionales
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Juegos y apps completos, 100% editables con NONA y descargables como proyecto Vite.
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-3 border-b border-slate-800/60 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar: carreras, 3D, aviones, RPG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
            {categories.map(cat => {
              const CatIcon = CATEGORY_ICON[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {CatIcon && <CatIcon className="w-3.5 h-3.5" />}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-3 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{error}</div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max gap-4 content-start">
          {filtered.length > 0 ? filtered.map(t => {
            const loading = loadingId === t.id;
            return (
              <div
                key={t.id}
                className="group relative bg-slate-900/60 hover:bg-slate-800/50 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col shadow-lg hover:shadow-indigo-500/10"
              >
                {t.thumbnail ? (
                  <button
                    onClick={() => handleLoad(t)}
                    className="relative block w-full shrink-0 aspect-[16/10] bg-slate-950 overflow-hidden cursor-pointer"
                    aria-label={`Cargar ${t.name}`}
                  >
                    <img
                      src={t.thumbnail}
                      alt={`Captura de ${t.name}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/70 border border-white/10 text-[10px] text-slate-200 font-medium backdrop-blur-sm">
                      Hecho con NONA
                    </span>
                    {t.badge && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/90 text-white">
                        {t.badge}
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="shrink-0 aspect-[16/10] bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center text-indigo-300">
                    {renderIcon(t.icon, 'w-10 h-10')}
                  </div>
                )}

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      {renderIcon(t.icon, 'w-4 h-4')}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{t.name}</h3>
                      <span className="text-[11px] text-slate-400 font-medium">{t.category || 'Aplicación'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-3 leading-relaxed line-clamp-3">{t.description}</p>

                  {t.controls && (
                    <p className="mt-2 text-[11px] text-slate-400 flex items-start gap-1.5">
                      <Keyboard className="w-3.5 h-3.5 mt-px shrink-0" /> <span className="line-clamp-2">{t.controls}</span>
                    </p>
                  )}

                  {t.tags && t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {t.tags.slice(0, 5).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold min-w-0">
                      {t.stats ? <Sparkles className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate">{t.stats || 'Listo para ejecutar'}</span>
                    </div>
                    <button
                      onClick={() => handleLoad(t)}
                      disabled={!!loadingId}
                      className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>{loading ? 'Cargando…' : 'Cargar y probar'}</span>
                      {!loading && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-16 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm">No se encontraron plantillas para los filtros seleccionados.</p>
              <button onClick={() => { setSelectedCategory('Todos'); setSearchQuery(''); }} className="text-xs text-indigo-400 hover:underline font-semibold cursor-pointer">
                Restablecer filtros
              </button>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-between gap-3 text-[11px] text-slate-400">
          <span>💡 Carga una plantilla y pídele a NONA en el chat que la cambie: nombre, colores, niveles, mecánicas…</span>
          <span className="font-mono text-indigo-400 hidden sm:inline">NONA Platform</span>
        </div>
      </div>
    </div>
  );
};
