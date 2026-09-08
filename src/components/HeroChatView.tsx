import React from 'react';
import { 
  Sparkles, 
  Gamepad2, 
  BarChart3, 
  Music, 
  Smartphone,
  Columns
} from 'lucide-react';
import { FloatingOmnibar } from './FloatingOmnibar';

interface HeroChatViewProps {
  onStartGeneration: (prompt: string, mode?: 'chat' | 'builder', model?: string) => void;
  creditsBalance: number;
  onOpenWorkspace: () => void;
  attachedImages?: string[];
  onAddImage?: (base64: string) => void;
  onRemoveImage?: (index: number) => void;
  inspectedElement?: string | null;
  onClearInspectedElement?: () => void;
  isGenerating?: boolean;
}

export const HeroChatView: React.FC<HeroChatViewProps> = ({
  onStartGeneration,
  creditsBalance: _creditsBalance,
  onOpenWorkspace,
  attachedImages = [],
  onAddImage,
  onRemoveImage,
  inspectedElement,
  onClearInspectedElement,
  isGenerating = false,
}) => {
  const quickActions = [
    {
      label: 'Videojuego 3D Three.js',
      icon: Gamepad2,
      prompt: 'Crea un videojuego 3D espacial con Three.js, partículas, controles de teclado y efectos de sonido con Web Audio API',
    },
    {
      label: 'Dashboard SaaS en Vivo',
      icon: BarChart3,
      prompt: 'Construye un dashboard SaaS moderno con métricas interactivas en tiempo real, gráficos y modo oscuro con Tailwind CSS',
    },
    {
      label: 'Sintetizador de Música 3D',
      icon: Music,
      prompt: 'Crea un sintetizador musical interactivo con teclado virtual, visualizador de audio por ondas y efectos de sonido',
    },
    {
      label: 'App Interactiva Táctil',
      icon: Smartphone,
      prompt: 'Crea una aplicación móvil interactiva con diseño táctil, botones dinámicos y animaciones de confeti',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/40 relative overflow-y-auto select-none font-sans">
      
      {/* Decorative ambient subtle glow */}
      <div className="absolute top-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full z-10 space-y-6 text-center my-auto">
        
        {/* Centered Minimalist Header (Claude / Antigravity style) */}
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-700 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>NONA Software Factory v12.0</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Listo cuando quieras.
          </h1>

          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Genera videojuegos 3D, aplicaciones web completas y componentes interactivos con inferencia ultrarrápida.
          </p>
        </div>

        {/* Centerpiece Floating Omnibar Prompt Box */}
        <FloatingOmnibar
          onSendMessage={onStartGeneration}
          isGenerating={isGenerating}
          inspectedElement={inspectedElement}
          onClearInspectedElement={onClearInspectedElement}
          attachedImages={attachedImages}
          onAddImage={onAddImage}
          onRemoveImage={onRemoveImage}
          placeholder="Escribe qué quieres crear o pulsa / para habilidades..."
        />

        {/* Quick Action Suggestion Chips (Claude Desktop style) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onStartGeneration(action.prompt, 'builder')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 text-[11px] font-medium text-slate-700 hover:text-slate-900 shadow-2xs transition-all cursor-pointer hover:border-slate-300"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-600" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Workspace Access Pill */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenWorkspace}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-slate-400 hover:text-slate-700 text-xs transition-colors cursor-pointer"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Abrir editor de código y preview del proyecto actual</span>
          </button>
        </div>

      </div>

    </div>
  );
};
