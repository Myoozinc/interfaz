import React, { useState } from 'react';
import { 
  FolderTree, 
  FileText, 
  FilePlus, 
  Trash2, 
  Sparkles, 
  LayoutTemplate,
  ChevronRight,
  Folder,
  FolderOpen
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
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    'src': true,
    'src/components': true,
    'src/pages': true,
    'src/lib': true,
    'src/hooks': true,
    'src/utils': true,
    'src/types': true
  });

  const toggleFolder = (folderName: string) => {
    setOpenFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  };

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
    if (fileName.endsWith('.tsx')) return <span className="text-cyan-700 font-bold text-[9px] bg-cyan-100/70 px-1 py-0.2 rounded border border-cyan-300">TSX</span>;
    if (fileName.endsWith('.ts')) return <span className="text-blue-700 font-bold text-[9px] bg-blue-100/70 px-1 py-0.2 rounded border border-blue-300">TS</span>;
    if (fileName.endsWith('.jsx')) return <span className="text-cyan-600 font-bold text-[9px] bg-cyan-50 px-1 py-0.2 rounded border border-cyan-200">JSX</span>;
    if (fileName.endsWith('.js')) return <span className="text-amber-700 font-bold text-[9px] bg-amber-100/70 px-1 py-0.2 rounded border border-amber-300">JS</span>;
    if (fileName.endsWith('.css')) return <span className="text-sky-700 font-bold text-[9px] bg-sky-100/70 px-1 py-0.2 rounded border border-sky-300">CSS</span>;
    if (fileName.endsWith('.json')) return <span className="text-slate-600 font-bold text-[9px] bg-slate-200/70 px-1 py-0.2 rounded border border-slate-300">{}</span>;
    if (fileName.endsWith('.html')) return <span className="text-orange-600 font-bold text-[9px] bg-orange-100/70 px-1 py-0.2 rounded border border-orange-300">HTML</span>;
    return <FileText className="w-3.5 h-3.5 text-slate-400" />;
  };

  // Group files into hierarchical folders and root files
  const fileGroups = React.useMemo(() => {
    const rootFiles: FileItem[] = [];
    const folderMap: Record<string, FileItem[]> = {};

    files.forEach(f => {
      const clean = f.name.replace(/^(\.\/|\/)/, '');
      const parts = clean.split('/');
      if (parts.length === 1) {
        rootFiles.push(f);
      } else {
        const folderName = parts.slice(0, -1).join('/');
        if (!folderMap[folderName]) folderMap[folderName] = [];
        folderMap[folderName].push(f);
      }
    });

    return { rootFiles, folderMap };
  }, [files]);

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
          title="Nuevo Archivo (ej. src/components/Card.tsx)"
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
            placeholder="src/components/Boton.tsx"
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

      {/* File List Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider flex items-center justify-between">
          <span>Proyecto ({files.length} archivos)</span>
        </div>

        {/* Folders */}
        {Object.entries(fileGroups.folderMap).map(([folderName, folderFiles]) => {
          const isOpen = openFolders[folderName] ?? true;
          return (
            <div key={folderName} className="space-y-0.5">
              <button
                onClick={() => toggleFolder(folderName)}
                className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                {isOpen ? <FolderOpen className="w-3.5 h-3.5 text-amber-500" /> : <Folder className="w-3.5 h-3.5 text-amber-500" />}
                <span className="truncate">{folderName}</span>
                <span className="text-[10px] text-slate-400 font-normal ml-auto">({folderFiles.length})</span>
              </button>

              {isOpen && (
                <div className="pl-4 space-y-0.5 border-l border-slate-200 ml-3">
                  {folderFiles.map((file) => {
                    const isActive = file.id === activeFileId;
                    const baseName = file.name.split('/').pop() || file.name;
                    return (
                      <div
                        key={file.id}
                        onClick={() => onSelectFile(file.id)}
                        className={`group flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition-all ${
                          isActive
                            ? 'bg-white text-slate-900 font-semibold border border-slate-200 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {getFileIcon(file.name)}
                          <span className="truncate">{baseName}</span>
                          {file.isModified && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                        </div>

                        {files.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`¿Eliminar ${file.name}?`)) onDeleteFile(file.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-600 transition-opacity cursor-pointer"
                            title="Eliminar archivo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Root Files (package.json, vite.config.ts, index.html, etc.) */}
        {fileGroups.rootFiles.length > 0 && (
          <div className="pt-1 space-y-0.5">
            {fileGroups.rootFiles.map((file) => {
              const isActive = file.id === activeFileId;
              return (
                <div
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  className={`group flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 font-semibold border border-slate-200 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
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
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-600 transition-opacity cursor-pointer"
                      title="Eliminar archivo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
