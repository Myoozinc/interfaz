import React from 'react';
import { 
  Download, 
  Settings, 
  Zap, 
  Columns,
  Eye,
  Code2,
  FolderOpen,
  Wand2,
  Activity,
  PanelLeft,
  Terminal,
  MessageSquare,
  LayoutGrid,
  Database
} from 'lucide-react';
import { NonaLogo } from './NonaLogo';
import { GitHubIcon } from './icons/GitHubIcon';
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
  onOpenTemplatesModal?: () => void;
  onOpenGitHubModal?: () => void;
  onOpenSupabaseModal?: () => void;
  onExportZip: () => void;
  viewMode: 'chat' | 'split' | 'preview' | 'editor';
  setViewMode: (mode: 'chat' | 'split' | 'preview' | 'editor') => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
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
  onOpenTemplatesModal,
  onOpenGitHubModal,
  onOpenSupabaseModal,
  onExportZip,
  viewMode,
  setViewMode,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="h-13 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-3.5 flex items-center justify-between select-none z-20 font-sans shrink-0 shadow-2xs">
      
      {/* Left: macOS Traffic Lights + Sidebar Toggle + NONA Logo & Project Breadcrumb */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        
        {/* If sidebar is closed, show macOS traffic lights and expand button with NONA Logo */}
        {!isSidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 pl-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/80 hover:bg-red-500 transition-colors shadow-2xs"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 hover:bg-amber-500 transition-colors shadow-2xs"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 hover:bg-emerald-500 transition-colors shadow-2xs"></span>
            </div>
            <button
              onClick={onToggleSidebar}
              title="Abrir barra lateral (Cmd+B)"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <NonaLogo size={22} showText className="mr-1" />
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          </div>
        )}

        {/* If sidebar is open, show compact NonaLogo icon next to breadcrumb */}
        {isSidebarOpen && (
          <NonaLogo size={20} showText={false} className="shrink-0" />
        )}

        {/* Project Breadcrumb */}
        <button
          onClick={onOpenProjectsModal}
          title="Gestor de Proyectos"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100/90 text-xs font-semibold text-slate-800 transition-all cursor-pointer truncate max-w-[220px] border border-transparent hover:border-slate-200/60"
        >
          <FolderOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-slate-400 font-normal">proyecto /</span>
          <span className="truncate text-slate-900 font-semibold">{projectName}</span>
        </button>
      </div>

      {/* Center: Workspace Sub-tabs (Only when in IDE/split/preview/editor mode) */}
      {viewMode !== 'chat' && (
        <div className="hidden md:flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/60 text-[11px]">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-white text-indigo-600 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3 h-3" />
            <span>Workspace</span>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-white text-indigo-600 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setViewMode('editor')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === 'editor'
                ? 'bg-white text-indigo-600 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>Código</span>
          </button>
        </div>
      )}

      {/* Right: Model Indicator + "Open IDE" Button (Antigravity standard) + Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        
        {/* Model Indicator Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] font-medium text-slate-700 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>⚡ NONA Cloud Engine (Multi-IA)</span>
        </div>

        {/* 🌟 Signature "Open IDE / Modo Chat" Button (Antigravity & Ollama Desktop style) */}
        {viewMode === 'chat' ? (
          <button
            onClick={() => setViewMode('split')}
            title="Abrir entorno de desarrollo y vista previa"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer hover:scale-102"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Open IDE</span>
          </button>
        ) : (
          <button
            onClick={() => setViewMode('chat')}
            title="Volver a la vista de conversación limpia"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Modo Chat</span>
          </button>
        )}

        {/* Gallery Templates Button */}
        {onOpenTemplatesModal && (
          <button
            onClick={onOpenTemplatesModal}
            title="Explorar Galería de Plantillas y Videojuegos 3D Funcionales"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-all cursor-pointer hover:scale-102"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
            <span>Plantillas</span>
          </button>
        )}

        {/* Media Studio */}
        <button
          onClick={onOpenMediaModal}
          title="Media Studio & Generador de Assets"
          className="p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 text-violet-600 transition-colors shadow-2xs cursor-pointer"
        >
          <Wand2 className="w-3.5 h-3.5" />
        </button>

        {/* Diagnostics */}
        <button
          onClick={onOpenDiagnostics}
          title="Diagnósticos del Sistema (Zero Mocks)"
          className="p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 text-emerald-600 transition-colors shadow-2xs cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5" />
        </button>

        {/* Credits Badge */}
        <button
          onClick={onOpenCreditsModal}
          title="Saldo de Créditos"
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-[11px] font-bold text-amber-800 transition-all cursor-pointer"
        >
          <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
          <span>{credits.balance}</span>
        </button>

        {/* Supabase BaaS Modal */}
        {onOpenSupabaseModal && (
          <button
            onClick={onOpenSupabaseModal}
            title="Supabase BaaS: Auto-Provisionamiento y Base de Datos"
            className="p-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200/80 text-emerald-600 hover:text-emerald-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
          </button>
        )}

        {/* GitHub Sync Modal */}
        {onOpenGitHubModal && (
          <button
            onClick={onOpenGitHubModal}
            title="Sincronizar con GitHub y Desplegar en Vercel (1 Clic)"
            className="p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
          >
            <GitHubIcon className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Export ZIP */}
        <button
          onClick={onExportZip}
          title="Exportar Proyecto en ZIP"
          className="p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettingsModal}
          title="Ajustes del Motor IA"
          className="p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

      </div>

    </header>
  );
};
