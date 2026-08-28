import React from 'react';
import { 
  Sparkles, 
  Download, 
  Settings, 
  Zap, 
  Plus, 
  Layers,
  MessageSquare,
  Columns,
  Eye,
  Code2
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
  viewMode: 'chat' | 'split' | 'preview' | 'editor';
  setViewMode: (mode: 'chat' | 'split' | 'preview' | 'editor') => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  setProjectName,
  credits,
  onOpenCreditsModal,
  onOpenSettingsModal,
  onExportZip,
  onNewProject,
  viewMode,
  setViewMode,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between select-none z-20 shadow-xs">
      
      {/* Left: Brand Logo & Project Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              NONA<span className="text-indigo-600">.</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
              Studio
            </span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

        {/* Editable Project Name */}
        <div className="hidden sm:flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 transition-all outline-none"
            placeholder="Nombre del Proyecto"
          />
        </div>
      </div>

      {/* Center: View Switcher (Chat vs Split vs Preview vs Editor) */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
        <button
          onClick={() => setViewMode('chat')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
            viewMode === 'chat'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Vista Solo Chat"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Chat</span>
        </button>

        <button
          onClick={() => setViewMode('split')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
            viewMode === 'split'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Vista Dividida"
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Workspace</span>
        </button>

        <button
          onClick={() => setViewMode('preview')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
            viewMode === 'preview'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Solo Vista Previa"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Preview</span>
        </button>

        <button
          onClick={() => setViewMode('editor')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
            viewMode === 'editor'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Solo Editor de Código"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Editor</span>
        </button>
      </div>

      {/* Right: Credits, Actions & Modals */}
      <div className="flex items-center gap-2.5">
        
        {/* Credits Pill */}
        <button
          onClick={onOpenCreditsModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 text-xs font-semibold text-indigo-700 transition-all shadow-2xs cursor-pointer hover:scale-102"
        >
          <Zap className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
          <span>{credits.balance} Créditos</span>
          <span className="text-[10px] bg-white px-1.5 py-0.2 rounded-md text-indigo-600 font-bold border border-indigo-100">
            +
          </span>
        </button>

        {/* New Project */}
        <button
          onClick={onNewProject}
          title="Nuevo Proyecto"
          className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Export ZIP */}
        <button
          onClick={onExportZip}
          title="Descargar Proyecto en ZIP"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden lg:inline">Exportar ZIP</span>
        </button>

        {/* GitHub Link */}
        <a
          href="https://github.com/Myoozinc/interfaz"
          target="_blank"
          rel="noopener noreferrer"
          title="Ver Repositorio en GitHub"
          className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-2xs flex items-center"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>

        {/* Settings */}
        <button
          onClick={onOpenSettingsModal}
          title="Ajustes de la Plataforma"
          className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

    </header>
  );
};
