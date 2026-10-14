import React, { useState } from 'react';
import { 
  X, 
  FolderOpen, 
  Plus, 
  Trash2, 
  Copy, 
  FolderPlus, 
  Calendar, 
  Layers,
  ArrowRight
} from 'lucide-react';
import type { ProjectRecord, ProjectTemplate } from '../types';
import { STARTER_TEMPLATES } from '../services/templates';
import { CATALOG_TEMPLATES, resolveTemplateFiles } from '../services/catalogTemplates';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectRecord[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string, template?: ProjectTemplate) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onDuplicateProject,
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const name = newProjectName.trim();
    const finish = (tmpl?: typeof STARTER_TEMPLATES[number]) => {
      onCreateProject(name, tmpl);
      setNewProjectName('');
      setShowCreateForm(false);
      onClose();
    };
    const fromCatalog = CATALOG_TEMPLATES.find(t => t.id === selectedTemplateId);
    if (fromCatalog) resolveTemplateFiles(fromCatalog).then(finish).catch(() => finish());
    else finish();
  };

  return (
    <div className="fixed inset-0 z-50 bg-raised/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-panel border border-line rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-fade-in text-xs flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 bg-canvas border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shadow-xs">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-fg">
                Gestor de Proyectos & Memoria
              </h2>
              <p className="text-xs text-muted">
                {projects.length} proyecto(s) guardados con historial independiente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Proyecto</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-raised-2 text-muted hover:text-fg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* New Project Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateSubmit} className="p-4 bg-accent/10 border border-accent/30 rounded-2xl space-y-3 animate-fade-in">
              <h3 className="font-bold text-xs text-accent flex items-center gap-1.5">
                <FolderPlus className="w-3.5 h-3.5 text-accent" />
                Crear Nuevo Proyecto
              </h3>
              
              <div>
                <label className="text-[11px] font-semibold text-fg-2 block mb-1">Nombre del Proyecto</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Mi nueva app o juego..."
                  className="w-full px-3 py-2 bg-panel border border-line rounded-xl text-xs outline-none focus:border-accent text-fg"
                />
              </div>

              <div>
                <label className="text-[12px] text-fg-2 block mb-1">Empezar desde</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 bg-panel border border-line rounded-xl text-xs outline-none text-fg cursor-pointer"
                >
                  <option value="">Proyecto vacío</option>
                  <optgroup label="Apps">
                    {CATALOG_TEMPLATES.filter(t => t.group === 'Apps').map(t => (
                      <option key={t.id} value={t.id}>{t.name} · {t.category}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Juegos">
                    {CATALOG_TEMPLATES.filter(t => t.group === 'Juegos').map(t => (
                      <option key={t.id} value={t.id}>{t.name} · {t.category}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 rounded-xl border border-line text-fg-2 hover:bg-canvas font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-accent hover:bg-accent-strong text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Crear proyecto
                </button>
              </div>
            </form>
          )}

          {/* Project Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.map((proj) => {
              const isActive = proj.id === activeProjectId;
              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj.id);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isActive
                      ? 'bg-accent/10 border-accent ring-2 ring-accent/20 shadow-xs'
                      : 'bg-canvas hover:bg-panel border-line hover:border-accent/30 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-bold text-fg">
                        <Layers className="w-4 h-4 text-accent" />
                        <span className="truncate max-w-[150px]">{proj.name}</span>
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-bold text-accent bg-accent/15 px-2 py-0.5 rounded-full">
                          Activo
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-muted line-clamp-2 mb-3">
                      {proj.description || `${proj.files?.length || 0} archivos • ${proj.messages?.length || 0} mensajes`}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-line/80 flex items-center justify-between text-[10px] text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(proj.updatedAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onDuplicateProject(proj.id)}
                        title="Duplicar Proyecto"
                        className="p-1 rounded-md hover:bg-raised-2 text-muted hover:text-fg transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {projects.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar el proyecto "${proj.name}"?`)) {
                              onDeleteProject(proj.id);
                            }
                          }}
                          title="Eliminar Proyecto"
                          className="p-1 rounded-md hover:bg-red-500/15 text-muted hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="p-1 text-accent font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                        Abrir <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
