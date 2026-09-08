import React, { useState } from 'react';
import { 
  Plus, 
  FolderOpen, 
  Wand2, 
  Activity, 
  Settings, 
  Zap, 
  Download, 
  Trash2, 
  Copy, 
  Search, 
  PanelLeftClose, 
  ChevronUp
} from 'lucide-react';
import type { ProjectRecord, UserCredits, UserAccount } from '../types';

interface DesktopSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectRecord[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  credits: UserCredits;
  currentUser: UserAccount | null;
  onOpenCreditsModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenProjectsModal: () => void;
  onOpenMediaModal: () => void;
  onOpenDiagnostics: () => void;
  onExportZip: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onDuplicateProject,
  credits,
  currentUser,
  onOpenCreditsModal,
  onOpenSettingsModal,
  onOpenProjectsModal,
  onOpenMediaModal,
  onOpenDiagnostics,
  onExportZip,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRelativeDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${Math.max(1, diffMins)}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays}d`;
      return `${Math.floor(diffDays / 30)}mo`;
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="w-64 sm:w-72 bg-slate-50/95 border-r border-slate-200/80 flex flex-col h-full select-none text-xs shrink-0 font-sans z-30 transition-all">
      
      {/* Top Header: Traffic Light Spacer & Toggle */}
      <div className="h-12 px-3 flex items-center justify-between border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          {/* macOS window traffic lights mockup */}
          <div className="flex items-center gap-1.5 pl-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80 hover:bg-red-500 transition-colors"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 hover:bg-amber-500 transition-colors"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 hover:bg-emerald-500 transition-colors"></span>
          </div>
          <span className="ml-2 font-bold text-slate-800 tracking-tight text-xs flex items-center gap-1">
            <span>NONA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
          </span>
        </div>

        <button
          onClick={onClose}
          title="Colapsar barra lateral (Cmd+B)"
          className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Main Actions: + Nuevo */}
      <div className="p-3 space-y-2">
        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-900 font-semibold shadow-2xs transition-all cursor-pointer hover:border-slate-300"
        >
          <Plus className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
          <span>Nuevo Proyecto</span>
        </button>

        {/* Quick Tools Navigation */}
        <div className="pt-1 grid grid-cols-3 gap-1">
          <button
            onClick={onOpenProjectsModal}
            title="Gestor de Proyectos"
            className="flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-slate-200/50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-600 mb-1" />
            <span className="text-[10px] font-medium">Proyectos</span>
          </button>
          <button
            onClick={onOpenMediaModal}
            title="Media Studio"
            className="flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-slate-200/50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5 text-violet-600 mb-1" />
            <span className="text-[10px] font-medium">Media</span>
          </button>
          <button
            onClick={onOpenDiagnostics}
            title="Diagnósticos del Sistema"
            className="flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-slate-200/50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600 mb-1" />
            <span className="text-[10px] font-medium">Health</span>
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-xl border border-slate-200/80 text-slate-400 focus-within:border-indigo-400 focus-within:text-slate-700 transition-colors">
          <Search className="w-3.5 h-3.5 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar proyectos..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Projects / Chats List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Chats y Aplicaciones</span>
          <span className="font-normal text-[9px]">{filteredProjects.length}</span>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs">
            No se encontraron proyectos.
          </div>
        ) : (
          filteredProjects.map((p) => {
            const isActive = p.id === activeProjectId;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50/90 text-indigo-950 font-semibold border border-indigo-200/60 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-indigo-600' : 'bg-slate-300 group-hover:bg-slate-400'}`} />
                  <span className="truncate">{p.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="text-[10px] text-slate-400 group-hover:hidden">
                    {formatRelativeDate(p.updatedAt)}
                  </span>
                  
                  {/* Hover Actions */}
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateProject(p.id);
                      }}
                      title="Duplicar"
                      className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(p.id);
                        }}
                        title="Eliminar"
                        className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Profile & Footer Pill */}
      <div className="p-2 border-t border-slate-200/70 relative">
        <button
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {currentUser?.name?.[0] || 'M'}
            </div>
            <div className="truncate">
              <div className="font-semibold text-slate-900 truncate">{currentUser?.name || 'Myooz'}</div>
              <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-indigo-600" />
                <span>{credits.balance} créditos</span>
              </div>
            </div>
          </div>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {/* Profile Dropdown Popup */}
        {isProfileMenuOpen && (
          <div className="absolute left-2 right-2 bottom-14 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 text-xs animate-fade-in space-y-0.5">
            <button
              onClick={() => { setIsProfileMenuOpen(false); onOpenCreditsModal(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer font-medium"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Planes & Recarga de Créditos</span>
            </button>
            <button
              onClick={() => { setIsProfileMenuOpen(false); onExportZip(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Exportar Proyecto (ZIP)</span>
            </button>
            <button
              onClick={() => { setIsProfileMenuOpen(false); onOpenSettingsModal(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Ajustes del Motor IA</span>
            </button>
            <div className="h-[1px] bg-slate-100 my-1" />
            <a
              href="https://github.com/Myoozinc/interfaz"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current text-slate-800" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Repositorio en GitHub</span>
            </a>
          </div>
        )}
      </div>

    </aside>
  );
};
