import React, { useState } from 'react';
import { 
  X, 
  FolderOpen, 
  Plus, 
  Trash2, 
  Copy, 
  Sparkles, 
  Calendar, 
  Layers,
  ArrowRight
} from 'lucide-react';
import type { ProjectRecord, ProjectTemplate } from '../types';
import { STARTER_TEMPLATES } from '../services/templates';

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
  const [selectedTemplateId, setSelectedTemplateId] = useState('saas-cream');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const tmpl = STARTER_TEMPLATES.find(t => t.id === selectedTemplateId) || STARTER_TEMPLATES[0];
    onCreateProject(newProjectName.trim(), tmpl);
    setNewProjectName('');
    setShowCreateForm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-fade-in text-xs flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Gestor de Proyectos & Memoria
              </h2>
              <p className="text-xs text-slate-500">
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
              className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* New Project Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateSubmit} className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-3 animate-fade-in">
              <h3 className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Crear Nuevo Proyecto
              </h3>
              
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Nombre del Proyecto</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Mi nueva app o juego..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Plantilla Inicial</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none text-slate-900 cursor-pointer"
                >
                  {STARTER_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name} — {t.description.slice(0, 45)}...</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Crear y Abrir
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
                      ? 'bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span className="truncate max-w-[150px]">{proj.name}</span>
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                          Activo
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                      {proj.description || `${proj.files?.length || 0} archivos • ${proj.messages?.length || 0} mensajes`}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(proj.updatedAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onDuplicateProject(proj.id)}
                        title="Duplicar Proyecto"
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
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
                          className="p-1 rounded-md hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="p-1 text-indigo-600 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
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
