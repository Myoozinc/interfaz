import React from 'react';
import { 
  Sparkles, 
  Download, 
  Settings, 
  Zap, 
  MessageSquare,
  Columns,
  Eye,
  Code2,
  FolderOpen,
  Wand2,
  Activity
} from 'lucide-react';
import type { UserCredits, UserAccount } from '../types';

interface HeaderProps {
  projectName: string;
  credits: UserCredits;
  currentUser: UserAccount | null;
  onOpenCreditsModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenProjectsModal: () => void;
  onOpenMediaModal: () => void;
  onOpenDiagnostics: () => void;
  onOpenAuthModal: () => void;
  onExportZip: () => void;
  viewMode: 'chat' | 'split' | 'preview' | 'editor';
  setViewMode: (mode: 'chat' | 'split' | 'preview' | 'editor') => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  credits,
  currentUser: _currentUser,
  onOpenCreditsModal,
  onOpenSettingsModal,
  onOpenProjectsModal,
  onOpenMediaModal,
  onOpenDiagnostics,
  onOpenAuthModal: _onOpenAuthModal,
  onExportZip,
  viewMode,
  setViewMode,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between select-none z-20 shadow-xs font-sans">
      
      {/* Left: Brand Logo & Project Title Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black tracking-tight text-slate-900">
              NONA<span className="text-indigo-600">.</span>
            </span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-slate-200" />

        {/* Project Selector Button */}
        <button
          onClick={onOpenProjectsModal}
          title="Gestor de Proyectos"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-all cursor-pointer shadow-2xs max-w-[180px] truncate"
        >
          <FolderOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="truncate">{projectName}</span>
        </button>
      </div>

      {/* Center: View Switcher */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
        <button
          onClick={() => setViewMode('chat')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
            viewMode === 'chat'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Vista Chat"
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
          title="Vista Workspace"
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
          title="Solo Preview"
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
          title="Solo Editor"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Editor</span>
        </button>
      </div>

      {/* Right: Diagnostics, Media, Credits, Settings */}
      <div className="flex items-center gap-2">
        
        {/* Zero-Mocks Diagnostics Button */}
        <button
          onClick={onOpenDiagnostics}
          title="Verificación del Sistema (Zero Mocks)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all shadow-2xs cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden lg:inline">Diagnósticos</span>
        </button>

        {/* Media Studio Button */}
        <button
          onClick={onOpenMediaModal}
          title="Media Library & Generador de Assets"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100/80 border border-violet-200 text-xs font-semibold text-violet-700 transition-all shadow-2xs cursor-pointer"
        >
          <Wand2 className="w-3.5 h-3.5 text-violet-600" />
          <span className="hidden lg:inline">Media Studio</span>
        </button>

        {/* Credits Pill */}
        <button
          onClick={onOpenCreditsModal}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 text-xs font-bold text-indigo-700 transition-all shadow-2xs cursor-pointer hover:scale-102"
        >
          <Zap className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
          <span>{credits.balance}</span>
        </button>

        {/* Export ZIP */}
        <button
          onClick={onExportZip}
          title="Exportar Proyecto en ZIP"
          className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-indigo-600" />
        </button>

        {/* GitHub Link */}
        <a
          href="https://github.com/Myoozinc/interfaz"
          target="_blank"
          rel="noopener noreferrer"
          title="Ver Repositorio GitHub"
          className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-2xs flex items-center"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>

        {/* Settings */}
        <button
          onClick={onOpenSettingsModal}
          title="Ajustes del Motor IA"
          className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

    </header>
  );
};
