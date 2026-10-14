import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Settings,
  ChevronDown,
  Wand2,
  Activity,
  PanelLeft,
  Code2,
  MessageSquare,
  LayoutGrid,
  Database,
  MoreHorizontal,
  Share2,
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

/** Menú desplegable sencillo: se cierra al hacer clic fuera o con Esc. */
const Menu: React.FC<{ trigger: (open: boolean) => React.ReactNode; children: (close: () => void) => React.ReactNode }> = ({ trigger, children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(o => !o)}>{trigger(open)}</div>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-line bg-panel p-1.5 shadow-2xl shadow-black/40 z-50">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
};

const MenuItem: React.FC<{ icon: React.ReactNode; label: string; hint?: string; onClick: () => void }> = ({ icon, label, hint, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-start gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-raised transition-colors cursor-pointer"
  >
    <span className="mt-0.5 text-muted">{icon}</span>
    <span className="flex flex-col">
      <span className="text-[13px] text-fg">{label}</span>
      {hint && <span className="text-[11.5px] text-muted leading-snug">{hint}</span>}
    </span>
  </button>
);

const iconBtn = 'h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted hover:text-fg hover:bg-raised transition-colors cursor-pointer';

export const Header: React.FC<HeaderProps> = ({
  projectName,
  credits: _credits,
  onOpenSettingsModal,
  onOpenProjectsModal,
  onOpenMediaModal,
  onOpenDiagnostics,
  onOpenTemplatesModal,
  onOpenGitHubModal,
  onOpenSupabaseModal,
  onExportZip,
  viewMode,
  setViewMode,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const inWorkspace = viewMode !== 'chat';
  return (
    <header className="h-12 bg-canvas border-b border-line px-3 flex items-center justify-between gap-3 select-none z-20 shrink-0">
      {/* Izquierda: barra lateral, marca y proyecto */}
      <div className="flex items-center gap-1.5 min-w-0">
        {!isSidebarOpen && (
          <>
            <button onClick={onToggleSidebar} title="Mostrar barra lateral (Cmd+B)" aria-label="Mostrar barra lateral" className={iconBtn}>
              <PanelLeft className="w-4 h-4" />
            </button>
            <NonaLogo size={22} showText className="mx-1" />
            <span className="text-faint mx-0.5">/</span>
          </>
        )}
        <button
          onClick={onOpenProjectsModal}
          title="Tus proyectos"
          className="min-w-0 flex items-center gap-1.5 h-8 px-2 rounded-lg hover:bg-raised text-[13px] font-medium text-fg transition-colors cursor-pointer"
        >
          <span className="truncate max-w-[240px]">{projectName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
        </button>
      </div>

      {/* Derecha: acciones */}
      <div className="flex items-center gap-1">
        {onOpenTemplatesModal && (
          <button
            onClick={onOpenTemplatesModal}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[13px] text-fg-2 hover:text-fg hover:bg-raised transition-colors cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
            Plantillas
          </button>
        )}

        <button
          onClick={() => setViewMode(inWorkspace ? 'chat' : 'split')}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[13px] text-fg-2 hover:text-fg hover:bg-raised transition-colors cursor-pointer"
          title={inWorkspace ? 'Volver a la conversación a pantalla completa' : 'Abrir vista previa y código'}
        >
          {inWorkspace ? <MessageSquare className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
          <span className="hidden md:inline">{inWorkspace ? 'Conversación' : 'Vista previa y código'}</span>
        </button>



        <Menu
          trigger={(open) => (
            <button className={`inline-flex items-center gap-1.5 h-8 pl-3 pr-2.5 ml-1 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${open ? 'bg-accent-strong text-white' : 'bg-accent text-accent-ink hover:bg-accent-strong hover:text-white'}`}>
              <Share2 className="w-3.5 h-3.5" />
              Exportar
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
          )}
        >
          {(close) => (
            <>
              <MenuItem icon={<Download className="w-4 h-4" />} label="Descargar ZIP" hint="Proyecto Vite completo, listo para npm install" onClick={() => { close(); onExportZip(); }} />
              {onOpenGitHubModal && (
                <MenuItem icon={<GitHubIcon className="w-4 h-4" />} label="GitHub y Vercel" hint="Sube el código a un repositorio y publícalo" onClick={() => { close(); onOpenGitHubModal(); }} />
              )}
              {onOpenSupabaseModal && (
                <MenuItem icon={<Database className="w-4 h-4" />} label="Base de datos (Supabase)" hint="Conecta usuarios y datos reales" onClick={() => { close(); onOpenSupabaseModal(); }} />
              )}
            </>
          )}
        </Menu>

        <Menu
          trigger={() => (
            <button className={iconBtn} title="Más opciones" aria-label="Más opciones">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
        >
          {(close) => (
            <>
              <MenuItem icon={<Wand2 className="w-4 h-4" />} label="Media Studio" hint="Genera imágenes y recursos para tu app" onClick={() => { close(); onOpenMediaModal(); }} />
              <MenuItem icon={<Activity className="w-4 h-4" />} label="Estado del sistema" hint="Comprueba los proveedores de IA" onClick={() => { close(); onOpenDiagnostics(); }} />
              <MenuItem icon={<Settings className="w-4 h-4" />} label="Ajustes" onClick={() => { close(); onOpenSettingsModal(); }} />
            </>
          )}
        </Menu>
      </div>
    </header>
  );
};
