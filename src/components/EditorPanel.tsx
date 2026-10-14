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
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6B7389', fontStyle: 'italic' },
        { token: 'keyword', foreground: '8FB0FF' },
        { token: 'string', foreground: '9BD8A6' },
        { token: 'number', foreground: 'F2B880' },
        { token: 'tag', foreground: '7FB8FF' },
        { token: 'attribute.name', foreground: 'C6A6FF' },
        { token: 'attribute.value', foreground: '9BD8A6' },
        { token: 'type', foreground: '7FD6D0' },
      ],
      colors: {
        'editor.background': '#0F1219',
        'editor.foreground': '#E7EAF2',
        'editorLineNumber.foreground': '#3E4659',
        'editorLineNumber.activeForeground': '#B9BFCD',
        'editorCursor.foreground': '#5B8CFF',
        'editor.selectionBackground': '#2A3A66',
        'editor.inactiveSelectionBackground': '#1F2A47',
        'editor.lineHighlightBackground': '#151923',
        'editorIndentGuide.background': '#1C212D',
        'editorIndentGuide.activeBackground': '#353C4E',
        'editorGutter.background': '#0F1219',
        'editorWidget.background': '#151923',
        'editorWidget.border': '#262C3A',
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
      <div className="flex-1 bg-panel flex items-center justify-center text-muted text-xs">
        No hay archivos abiertos.
      </div>
    );
  }

  return (
    <section className="flex-1 bg-panel flex flex-col h-full overflow-hidden border-r border-line">
      
      {/* File Tabs Bar */}
      <div className="h-10 bg-canvas border-b border-line flex items-center justify-between px-2 overflow-x-auto select-none">
        
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
                    ? 'bg-panel text-fg border-line border-b-transparent shadow-2xs font-semibold'
                    : 'bg-transparent text-muted hover:bg-raised border-transparent'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-accent" />
                <span>{file.name}</span>
                {file.isModified && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
              </button>
            );
          })}
        </div>

        {/* Editor Actions Toolbar */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setWordWrap(wordWrap === 'on' ? 'off' : 'on')}
            title="Ajuste de línea (Word Wrap)"
            className={`p-1.5 rounded-lg hover:bg-raised-2/60 transition-colors cursor-pointer ${
              wordWrap === 'on' ? 'text-accent bg-accent/10' : 'text-muted'
            }`}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleFormat}
            title="Formatear Código"
            className="p-1.5 rounded-lg hover:bg-raised-2/60 text-muted hover:text-fg transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            title="Copiar Código"
            className="p-1.5 rounded-lg hover:bg-raised-2/60 text-muted hover:text-fg transition-colors flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
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
