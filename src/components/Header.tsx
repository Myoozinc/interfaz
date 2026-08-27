import React from 'react';
import { 
  Sparkles, 
  Download, 
  Settings, 
  Zap, 
  Plus, 
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { UserCredits } from '../types';

interface HeaderProps {
  projectName: string;
  setProjectName: (name: string) => void;
  credits: UserCredits;
  onOpenCreditsModal: () => void;
  onOpenSettingsModal: () => void;
  onExportZip: () => void;
  onNewProject: () => void;
  ollamaStatus: { ok: boolean; message: string };
  currentModel: string;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  setProjectName,
  credits,
  onOpenCreditsModal,
  onOpenSettingsModal,
  onExportZip,
  onNewProject,
  ollamaStatus,
  currentModel,
}) => {
  return (
    <header className="h-14 bg-[#FAF7F2] border-b border-[#E7E0D6] px-4 flex items-center justify-between select-none z-20">
      
      {/* Left: Brand Logo & Project Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FAF1E8] border border-[#DFC7B1] flex items-center justify-center text-[#A86B32] shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-[#1C1917] flex items-center gap-1">
              NONA<span className="text-[#A86B32]">.</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#A86B32] bg-[#FAF1E8] border border-[#DFC7B1] px-1.5 py-0.2 rounded-md">
                Studio
              </span>
            </span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-[#E7E0D6] hidden sm:block" />

        {/* Editable Project Name */}
        <div className="hidden sm:flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#8C827A]" />
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-xs font-semibold text-[#1C1917] bg-transparent hover:bg-[#F4EFEA] focus:bg-white focus:ring-1 focus:ring-[#A86B32] px-2 py-1 rounded-md border border-transparent hover:border-[#E7E0D6] transition-all outline-none"
            placeholder="Nombre del Proyecto"
          />
        </div>
      </div>

      {/* Center: Ollama Model & Connection Pill */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E7E0D6] shadow-xs text-xs">
        {ollamaStatus.ok ? (
          <span className="flex items-center gap-1.5 text-[#10B981] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ollama Activo:
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[#D97706] font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            Ollama:
          </span>
        )}
        <span className="font-semibold text-[#1C1917]">{currentModel}</span>
      </div>

      {/* Right: Credits, Actions & Modals */}
      <div className="flex items-center gap-2.5">
        
        {/* Credits Pill */}
        <button
          onClick={onOpenCreditsModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF1E8] hover:bg-[#F4E2D2] border border-[#DFC7B1] text-xs font-semibold text-[#8F5622] transition-all shadow-2xs hover:scale-102 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-[#A86B32] text-[#A86B32]" />
          <span>{credits.balance} Créditos</span>
          <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-md text-[#A86B32] font-bold border border-[#DFC7B1]">
            Recargar
          </span>
        </button>

        {/* New Project */}
        <button
          onClick={onNewProject}
          title="Nuevo Proyecto"
          className="p-2 rounded-xl bg-white hover:bg-[#F4EFEA] border border-[#E7E0D6] text-[#57534E] hover:text-[#1C1917] transition-all shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Export ZIP */}
        <button
          onClick={onExportZip}
          title="Descargar Proyecto en ZIP"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F4EFEA] border border-[#E7E0D6] text-xs font-medium text-[#57534E] hover:text-[#1C1917] transition-all shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#A86B32]" />
          <span className="hidden lg:inline">Exportar ZIP</span>
        </button>

        {/* GitHub Link */}
        <a
          href="https://github.com/Myoozinc/interfaz"
          target="_blank"
          rel="noopener noreferrer"
          title="Ver Repositorio en GitHub"
          className="p-2 rounded-xl bg-white hover:bg-[#F4EFEA] border border-[#E7E0D6] text-[#57534E] hover:text-[#1C1917] transition-all shadow-2xs flex items-center"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>

        {/* Settings */}
        <button
          onClick={onOpenSettingsModal}
          title="Ajustes de Ollama y Vercel"
          className="p-2 rounded-xl bg-white hover:bg-[#F4EFEA] border border-[#E7E0D6] text-[#57534E] hover:text-[#1C1917] transition-all shadow-2xs cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

    </header>
  );
};
