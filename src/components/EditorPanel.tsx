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
    monaco.editor.defineTheme('nona-cream', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8C827A', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'A86B32', fontStyle: 'bold' },
        { token: 'string', foreground: '2E7D32' },
        { token: 'number', foreground: 'D97706' },
        { token: 'tag', foreground: 'A86B32' },
        { token: 'attribute.name', foreground: '4B5563' },
        { token: 'attribute.value', foreground: '059669' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#1C1917',
        'editorLineNumber.foreground': '#C4BAAC',
        'editorLineNumber.activeForeground': '#A86B32',
        'editorCursor.foreground': '#A86B32',
        'editor.selectionBackground': '#F4E2D2',
        'editor.inactiveSelectionBackground': '#FAF1E8',
        'editorIndentGuide.background': '#F0EAE2',
        'editorIndentGuide.activeBackground': '#DFC7B1',
        'editorGutter.background': '#FAF7F2',
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
      <div className="flex-1 bg-white flex items-center justify-center text-[#8C827A] text-xs">
        No hay archivos abiertos.
      </div>
    );
  }

  return (
    <section className="flex-1 bg-white flex flex-col h-full overflow-hidden border-r border-[#E7E0D6]">
      
      {/* File Tabs Bar */}
      <div className="h-10 bg-[#FAF7F2] border-b border-[#E7E0D6] flex items-center justify-between px-2 overflow-x-auto select-none">
        
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
                    ? 'bg-white text-[#1C1917] border-[#E7E0D6] border-b-transparent shadow-2xs font-semibold'
                    : 'bg-transparent text-[#57534E] hover:bg-[#F4EFEA] border-transparent'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-[#A86B32]" />
                <span>{file.name}</span>
                {file.isModified && <span className="w-1.5 h-1.5 rounded-full bg-[#A86B32]" />}
              </button>
            );
          })}
        </div>

        {/* Editor Actions Toolbar */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setWordWrap(wordWrap === 'on' ? 'off' : 'on')}
            title="Ajuste de línea (Word Wrap)"
            className={`p-1.5 rounded-md hover:bg-[#EADBCE] transition-colors cursor-pointer ${
              wordWrap === 'on' ? 'text-[#A86B32] bg-[#FAF1E8]' : 'text-[#57534E]'
            }`}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleFormat}
            title="Formatear Código"
            className="p-1.5 rounded-md hover:bg-[#EADBCE] text-[#57534E] hover:text-[#1C1917] transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            title="Copiar Código"
            className="p-1.5 rounded-md hover:bg-[#EADBCE] text-[#57534E] hover:text-[#1C1917] transition-colors flex items-center gap-1 cursor-pointer"
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
          theme="nona-cream"
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
            fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
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
