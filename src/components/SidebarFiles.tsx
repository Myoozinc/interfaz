import React, { useState } from 'react';
import { 
  FolderTree, 
  FileText, 
  FilePlus, 
  Trash2, 
  Sparkles, 
  LayoutTemplate,
  ChevronRight
} from 'lucide-react';
import type { FileItem, ProjectTemplate } from '../types';
import { STARTER_TEMPLATES } from '../services/templates';

interface SidebarFilesProps {
  files: FileItem[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onAddFile: (name: string, language: FileItem['language']) => void;
  onDeleteFile: (fileId: string) => void;
  onLoadTemplate: (template: ProjectTemplate) => void;
}

export const SidebarFiles: React.FC<SidebarFilesProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  onLoadTemplate,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let lang: FileItem['language'] = 'html';
    if (newFileName.endsWith('.html')) lang = 'html';
    else if (newFileName.endsWith('.css')) lang = 'css';
    else if (newFileName.endsWith('.js')) lang = 'javascript';
    else if (newFileName.endsWith('.ts') || newFileName.endsWith('.tsx')) lang = 'typescript';
    else if (newFileName.endsWith('.json')) lang = 'json';

    onAddFile(newFileName.trim(), lang);
    setNewFileName('');
    setIsAdding(false);
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.html')) return <span className="text-orange-500 font-bold text-[10px]">HTML</span>;
    if (fileName.endsWith('.css')) return <span className="text-blue-500 font-bold text-[10px]">CSS</span>;
    if (fileName.endsWith('.js') || fileName.endsWith('.ts')) return <span className="text-amber-500 bg-slate-900 px-1 rounded font-bold text-[9px]">JS</span>;
    if (fileName.endsWith('.json')) return <span className="text-slate-500 font-bold text-[10px]">{}</span>;
    return <FileText className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <aside className="w-60 bg-slate-50 border-r border-slate-200 flex flex-col h-full select-none text-xs">
      
      {/* Explorer Section Header */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <FolderTree className="w-4 h-4 text-indigo-600" />
          <span>EXPLORADOR</span>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          title="Nuevo Archivo"
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <FilePlus className="w-4 h-4" />
        </button>
      </div>

      {/* New File Inline Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="p-2 border-b border-slate-200 bg-white space-y-2">
          <input
            type="text"
            placeholder="archivo.html o styles.css"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            autoFocus
            className="w-full px-2.5 py-1.5 border border-indigo-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2 py-0.5 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-2.5 py-0.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-md font-semibold cursor-pointer"
            >
              Crear
            </button>
          </div>
        </form>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider">
          Archivos ({files.length})
        </div>

        {files.map((file) => {
          const isActive = file.id === activeFileId;
          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-all ${
                isActive
                  ? 'bg-white text-slate-900 font-semibold border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {getFileIcon(file.name)}
                <span className="truncate">{file.name}</span>
                {file.isModified && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
              </div>

              {files.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`¿Eliminar ${file.name}?`)) onDeleteFile(file.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity cursor-pointer"
                  title="Eliminar archivo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Templates Drawer Toggle */}
      <div className="border-t border-slate-200 p-2 bg-white">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 hover:border-indigo-200 transition-all shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-indigo-600" />
            <span>Plantillas de Inicio</span>
          </div>
          <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showTemplates ? 'rotate-90' : ''}`} />
        </button>

        {showTemplates && (
          <div className="mt-2 space-y-1.5 pt-1">
            {STARTER_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => {
                  if (confirm(`¿Cargar plantilla "${tmpl.name}"? Se reemplazarán los archivos actuales.`)) {
                    onLoadTemplate(tmpl);
                    setShowTemplates(false);
                  }
                }}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              >
                <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  {tmpl.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {tmpl.description}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

    </aside>
  );
};
