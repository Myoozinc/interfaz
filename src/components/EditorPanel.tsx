import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import { 
  Copy, 
  Check, 
  WrapText, 
  Code2, 
  FileCode
} from 'lucide-react';
import type { FileItem } from '../types';

interface EditorPanelProps {
  files: FileItem[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCloseFile?: (fileId: string) => void;
  onFileChange: (fileId: string, newContent: string) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onFileChange,
}) => {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const editorRef = useRef<any>(null);

  const handleEditorWillMount = (monaco: Monaco) => {
    monaco.editor.defineTheme('nona-modern', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '94A3B8', fontStyle: 'italic' },
        { token: 'keyword', foreground: '6366F1', fontStyle: 'bold' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: '7C3AED' },
        { token: 'tag', foreground: '4F46E5' },
        { token: 'attribute.name', foreground: '64748B' },
        { token: 'attribute.value', foreground: '0D9488' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#0F172A',
        'editorLineNumber.foreground': '#CBD5E1',
        'editorLineNumber.activeForeground': '#6366F1',
        'editorCursor.foreground': '#4F46E5',
        'editor.selectionBackground': '#E0E7FF',
        'editor.inactiveSelectionBackground': '#EEF2FF',
        'editorIndentGuide.background': '#F1F5F9',
        'editorIndentGuide.activeBackground': '#CBD5E1',
        'editorGutter.background': '#F8FAFC',
      }
    });
  };

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  if (!activeFile) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center text-slate-400 text-xs">
        No hay archivos abiertos.
      </div>
    );
  }

  return (
    <section className="flex-1 bg-white flex flex-col h-full overflow-hidden border-r border-slate-200">
      
      {/* File Tabs Bar */}
      <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-2 overflow-x-auto select-none">
        
        {/* Open Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {files.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <button
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium border-t border-x transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 border-slate-200 border-b-transparent shadow-2xs font-semibold'
                    : 'bg-transparent text-slate-500 hover:bg-slate-100 border-transparent'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>{file.name}</span>
                {file.isModified && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
              </button>
            );
          })}
        </div>

        {/* Editor Actions Toolbar */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setWordWrap(wordWrap === 'on' ? 'off' : 'on')}
            title="Ajuste de línea (Word Wrap)"
            className={`p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer ${
              wordWrap === 'on' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'
            }`}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleFormat}
            title="Formatear Código"
            className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            title="Copiar Código"
            className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      {/* Monaco Code Editor Instance */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={activeFile.language}
          value={activeFile.content}
          theme="nona-modern"
          beforeMount={handleEditorWillMount}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          onChange={(value) => {
            onFileChange(activeFile.id, value || '');
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "'JetBrains Mono', Consolas, monospace",
            wordWrap: wordWrap,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'all',
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>

    </section>
  );
};
