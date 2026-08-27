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
    if (fileName.endsWith('.html')) return <span className="text-[#E34F26] font-bold text-[10px]">HTML</span>;
    if (fileName.endsWith('.css')) return <span className="text-[#1572B6] font-bold text-[10px]">CSS</span>;
    if (fileName.endsWith('.js') || fileName.endsWith('.ts')) return <span className="text-[#F7DF1E] bg-[#323330] px-1 rounded font-bold text-[9px]">JS</span>;
    if (fileName.endsWith('.json')) return <span className="text-[#5E5E5E] font-bold text-[10px]">{}</span>;
    return <FileText className="w-3.5 h-3.5 text-[#8C827A]" />;
  };

  return (
    <aside className="w-64 bg-[#F4EFEA] border-r border-[#E7E0D6] flex flex-col h-full select-none text-xs">
      
      {/* Explorer Section Header */}
      <div className="p-3 border-b border-[#E7E0D6] flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-[#1C1917]">
          <FolderTree className="w-4 h-4 text-[#A86B32]" />
          <span>EXPLORADOR</span>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          title="Nuevo Archivo"
          className="p-1 rounded-md hover:bg-[#EADBCE] text-[#57534E] hover:text-[#1C1917] transition-colors cursor-pointer"
        >
          <FilePlus className="w-4 h-4" />
        </button>
      </div>

      {/* New File Inline Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="p-2 border-b border-[#E7E0D6] bg-white space-y-2">
          <input
            type="text"
            placeholder="archivo.html o styles.css"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            autoFocus
            className="w-full px-2 py-1 border border-[#DFC7B1] rounded-md text-xs outline-none focus:ring-1 focus:ring-[#A86B32]"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2 py-0.5 text-[#8C827A] hover:text-[#1C1917] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-2.5 py-0.5 bg-[#A86B32] text-white rounded font-medium hover:bg-[#8F5622] cursor-pointer"
            >
              Crear
            </button>
          </div>
        </form>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="text-[10px] uppercase font-bold text-[#8C827A] px-2 py-1 tracking-wider">
          Archivos del Proyecto ({files.length})
        </div>

        {files.map((file) => {
          const isActive = file.id === activeFileId;
          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? 'bg-white text-[#1C1917] font-semibold border border-[#E7E0D6] shadow-2xs'
                  : 'text-[#57534E] hover:bg-[#EADBCE]/60 hover:text-[#1C1917]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {getFileIcon(file.name)}
                <span className="truncate">{file.name}</span>
                {file.isModified && <span className="w-1.5 h-1.5 rounded-full bg-[#A86B32]" />}
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
      <div className="border-t border-[#E7E0D6] p-2 bg-[#FAF7F2]">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-white border border-[#E7E0D6] text-xs font-semibold text-[#1C1917] hover:border-[#DFC7B1] transition-all shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-[#A86B32]" />
            <span>Plantillas de Inicio</span>
          </div>
          <ChevronRight className={`w-3.5 h-3.5 text-[#8C827A] transition-transform ${showTemplates ? 'rotate-90' : ''}`} />
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
                className="w-full text-left p-2 rounded-lg bg-white/80 hover:bg-white border border-[#E7E0D6] text-[#57534E] hover:text-[#1C1917] transition-all cursor-pointer"
              >
                <div className="font-semibold text-xs text-[#1C1917] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#A86B32]" />
                  {tmpl.name}
                </div>
                <div className="text-[10px] text-[#8C827A] mt-0.5 line-clamp-1">
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
