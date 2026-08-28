import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Gamepad2, 
  BarChart3, 
  Layout, 
  Smartphone, 
  Zap,
  Columns
} from 'lucide-react';

interface HeroChatViewProps {
  onStartGeneration: (prompt: string) => void;
  creditsBalance: number;
  onOpenWorkspace: () => void;
}

export const HeroChatView: React.FC<HeroChatViewProps> = ({
  onStartGeneration,
  creditsBalance,
  onOpenWorkspace,
}) => {
  const [prompt, setPrompt] = useState('');

  const sampleCards = [
    {
      icon: Gamepad2,
      title: 'Juego 3D de Música',
      description: 'Mundo virtual 3D interactivo con sintetizador Web Audio y Three.js',
      prompt: 'Quiero hacer un juego 3D de música en un mundo virtual interactivo con notas y nave espacial',
      gradient: 'from-violet-500 to-indigo-500',
    },
    {
      icon: BarChart3,
      title: 'Dashboard Financiero',
      description: 'Panel analítico con KPIs en tiempo real, gráficos y tablas modernas',
      prompt: 'Crea un dashboard financiero interactivo con métricas en vivo y modo oscuro',
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      icon: Layout,
      title: 'Landing Page SaaS',
      description: 'Página web moderna con animaciones, precios y diseño minimalista',
      prompt: 'Crea una landing page SaaS ultra moderna con hero llamativo y tarjetas de producto',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Smartphone,
      title: 'App Móvil Táctil',
      description: 'Calculadora de inversión o app interactiva con diseño móvil',
      prompt: 'Crea una aplicación móvil interactiva con selector táctil y cálculos dinámicos',
      gradient: 'from-emerald-500 to-teal-500',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onStartGeneration(prompt);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-white relative overflow-y-auto">
      
      {/* Decorative ambient glow */}
      <div className="absolute top-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full z-10 space-y-8 text-center my-auto">
        
        {/* Brand Hero */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Motor Autónomo de Creación de Software</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            ¿Qué quieres <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">construir hoy</span>?
          </h1>

          <p className="text-slate-500 text-sm max-w-lg mx-auto">
            Describe cualquier aplicación, juego 3D o interfaz. NONA escribirá el código y abrirá el entorno de desarrollo en vivo.
          </p>
        </div>

        {/* Big Central Prompt Input */}
        <form onSubmit={handleSubmit} className="relative bg-white rounded-3xl p-3 border border-slate-200 shadow-xl shadow-indigo-500/5 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ejemplo: quiero hacer un juego 3d de musica en un mundo virtual..."
            rows={3}
            className="w-full resize-none bg-transparent p-2 text-sm text-slate-900 outline-none placeholder-slate-400 font-medium"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 px-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                <Zap className="w-3 h-3 fill-indigo-600" />
                {creditsBalance} créditos disponibles
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenWorkspace}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Columns className="w-3.5 h-3.5 text-indigo-600" />
                <span>Abrir Editor</span>
              </button>

              <button
                type="submit"
                disabled={!prompt.trim()}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all hover:scale-102 cursor-pointer"
              >
                <span>Generar</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>

        {/* Suggestion Starter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {sampleCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <button
                key={idx}
                onClick={() => onStartGeneration(card.prompt)}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5 transition-all group cursor-pointer text-left flex items-start gap-3"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${card.gradient} flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    {card.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

      </div>

    </div>
  );
};
