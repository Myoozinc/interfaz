import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Gamepad2, 
  Music, 
  Rocket, 
  BarChart3, 
  ShoppingBag, 
  Smartphone, 
  HeartHandshake, 
  Search, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { STARTER_TEMPLATES } from '../services/templates';
import type { ProjectTemplate } from '../types';

interface TemplatesGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProjectTemplate) => void;
}

const CATEGORIES = [
  'Todos',
  'Videojuegos 3D',
  'Música & Audio',
  'Arcade 2D',
  'SaaS / Dashboards',
  'E-Commerce',
  'Móvil iOS',
  'Juegos & Mascotas'
];

export const TemplatesGalleryModal: React.FC<TemplatesGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredTemplates = STARTER_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'Todos' || template.category === selectedCategory;
    const matchesQuery = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.tags && template.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesQuery;
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Gamepad2': return <Gamepad2 className="w-6 h-6" />;
      case 'Music': return <Music className="w-6 h-6" />;
      case 'Rocket': return <Rocket className="w-6 h-6" />;
      case 'BarChart3': return <BarChart3 className="w-6 h-6" />;
      case 'ShoppingBag': return <ShoppingBag className="w-6 h-6" />;
      case 'Smartphone': return <Smartphone className="w-6 h-6" />;
      case 'HeartHandshake': return <HeartHandshake className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Galería de Plantillas y Modelos de Apps
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
                  {STARTER_TEMPLATES.length} Funcionales
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Modelos de software completos, interactivos y 100% editables listos para probar y evolucionar.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por juego, Three.js, audio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map(template => (
              <div
                key={template.id}
                className="group relative bg-slate-900/60 hover:bg-slate-800/50 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-5 transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-indigo-500/5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {getIcon(template.icon)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {template.name}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {template.category || 'Aplicación'}
                        </span>
                      </div>
                    </div>

                    {template.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {template.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-3.5 leading-relaxed">
                    {template.description}
                  </p>

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {template.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Listo para Ejecutar</span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectTemplate(template);
                      onClose();
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <span>Cargar & Probar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm">No se encontraron plantillas para los filtros seleccionados.</p>
              <button
                onClick={() => { setSelectedCategory('Todos'); setSearchQuery(''); }}
                className="text-xs text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                Restablecer filtros
              </button>
            </div>
          )}
        </div>

        {/* Modal Bottom Status */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>💡 Puedes pedirle a NONA en el chat que personalice cualquier aspecto de la plantilla cargada.</span>
          <span className="font-mono text-indigo-400">NONA Platform v5.0</span>
        </div>

      </div>
    </div>
  );
};
