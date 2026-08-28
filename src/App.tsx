import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Header } from './components/Header';
import { SidebarFiles } from './components/SidebarFiles';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ChatPanel } from './components/ChatPanel';
import { HeroChatView } from './components/HeroChatView';
import { CreditsModal } from './components/CreditsModal';
import { SettingsModal } from './components/SettingsModal';
import type { FileItem, ProjectTemplate, UserCredits } from './types';
import { STARTER_TEMPLATES } from './services/templates';

export function App() {
  // Navigation & View Mode: 'chat' | 'split' | 'preview' | 'editor'
  const [viewMode, setViewMode] = useState<'chat' | 'split' | 'preview' | 'editor'>('chat');

  // Project state
  const [projectName, setProjectName] = useState('NONA App');
  const [files, setFiles] = useState<FileItem[]>(() => {
    const saved = localStorage.getItem('nona_files');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return STARTER_TEMPLATES[0].files;
  });
  const [activeFileId, setActiveFileId] = useState<string>(() => files[0]?.id || '1');

  // Credits state
  const [credits, setCredits] = useState<UserCredits>(() => {
    const saved = localStorage.getItem('nona_credits');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      balance: 50,
      maxFree: 50,
      totalUsed: 0,
      plan: 'free',
    };
  });

  // Modals state
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Ollama endpoint
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');

  // Save files to localStorage
  useEffect(() => {
    localStorage.setItem('nona_files', JSON.stringify(files));
  }, [files]);

  // Save credits to localStorage
  useEffect(() => {
    localStorage.setItem('nona_credits', JSON.stringify(credits));
  }, [credits]);

  // Handlers for Files
  const handleSelectFile = (fileId: string) => {
    setActiveFileId(fileId);
  };

  const handleFileChange = (fileId: string, newContent: string) => {
    setFiles(prev =>
      prev.map(f => (f.id === fileId ? { ...f, content: newContent, isModified: true } : f))
    );
  };

  const handleAddFile = (name: string, language: FileItem['language']) => {
    const newId = Date.now().toString();
    const newFile: FileItem = {
      id: newId,
      name,
      language,
      content: language === 'html' 
        ? '<div class="p-4">Nuevo Archivo</div>' 
        : language === 'css' 
        ? '/* Estilos */' 
        : '// Código JS',
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newId);
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => {
      const remaining = prev.filter(f => f.id !== fileId);
      if (activeFileId === fileId && remaining.length > 0) {
        setActiveFileId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleLoadTemplate = (template: ProjectTemplate) => {
    setFiles(template.files);
    setActiveFileId(template.files[0]?.id || '1');
    setProjectName(template.name);
    setViewMode('split');
  };

  const handleNewProject = () => {
    if (confirm('¿Crear un proyecto nuevo desde cero?')) {
      handleLoadTemplate(STARTER_TEMPLATES[0]);
    }
  };

  // Handler to apply generated AI code directly
  const handleApplyCodeToFile = (filename: string, code: string) => {
    setFiles(prev => {
      const existing = prev.find(f => f.name.toLowerCase() === filename.toLowerCase());
      if (existing) {
        return prev.map(f => (f.id === existing.id ? { ...f, content: code, isModified: true } : f));
      } else {
        const newFile: FileItem = {
          id: Date.now().toString(),
          name: filename,
          language: filename.endsWith('.css') ? 'css' : filename.endsWith('.js') ? 'javascript' : 'html',
          content: code,
          isModified: true,
        };
        setActiveFileId(newFile.id);
        return [...prev, newFile];
      }
    });
  };

  // Handler for Credits deduction
  const handleDeductCredit = (amount: number = 1): boolean => {
    if (credits.balance <= 0) {
      setIsCreditsModalOpen(true);
      return false;
    }
    setCredits(prev => ({
      ...prev,
      balance: Math.max(0, prev.balance - amount),
      totalUsed: prev.totalUsed + amount,
    }));
    return true;
  };

  const handleAddCredits = (amount: number, planName?: UserCredits['plan']) => {
    setCredits(prev => ({
      ...prev,
      balance: prev.balance + amount,
      plan: planName || prev.plan,
    }));
  };

  // Handler to export project as ZIP
  const handleExportZip = async () => {
    const zip = new JSZip();
    files.forEach(f => {
      zip.file(f.name, f.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${projectName.toLowerCase().replace(/\s+/g, '-')}-nona.zip`);
  };

  // Handler when starting generation from Hero Chat
  const handleStartFromHero = (prompt: string) => {
    setViewMode('split');
    // Trigger generation in chat panel
    setTimeout(() => {
      const chatInput = document.querySelector('textarea') as HTMLTextAreaElement;
      if (chatInput) {
        chatInput.value = prompt;
        const sendBtn = chatInput.parentElement?.querySelector('button') as HTMLButtonElement;
        sendBtn?.click();
      }
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* Top Navigation */}
      <Header
        projectName={projectName}
        setProjectName={setProjectName}
        credits={credits}
        onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onExportZip={handleExportZip}
        onNewProject={handleNewProject}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Main Content Surfaces based on viewMode */}
      <div className="flex-1 flex overflow-hidden">
        
        {viewMode === 'chat' ? (
          /* Mode 1: Central Hero Chat View (Chat-first flow) */
          <HeroChatView
            onStartGeneration={handleStartFromHero}
            creditsBalance={credits.balance}
            onOpenWorkspace={() => setViewMode('split')}
          />
        ) : (
          /* Mode 2: Multi-panel Workspace */
          <div className="flex-1 flex overflow-hidden">
            
            {/* Left: File Explorer (Shown in split and editor views) */}
            {(viewMode === 'split' || viewMode === 'editor') && (
              <SidebarFiles
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onAddFile={handleAddFile}
                onDeleteFile={handleDeleteFile}
                onLoadTemplate={handleLoadTemplate}
              />
            )}

            {/* Center: Monaco Editor (Shown in split and editor views) */}
            {(viewMode === 'split' || viewMode === 'editor') && (
              <EditorPanel
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onFileChange={handleFileChange}
              />
            )}

            {/* Center/Right: Live Preview (Shown in split and preview views) */}
            {(viewMode === 'split' || viewMode === 'preview') && (
              <PreviewPanel
                files={files}
              />
            )}

            {/* Right: AI Chat Panel */}
            <ChatPanel
              files={files}
              onApplyCodeToFile={handleApplyCodeToFile}
              onDeductCredit={handleDeductCredit}
            />

          </div>
        )}

      </div>

      {/* Pricing & Credits Modal */}
      <CreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
        credits={credits}
        onAddCredits={handleAddCredits}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        ollamaUrl={ollamaUrl}
        setOllamaUrl={setOllamaUrl}
      />

    </div>
  );
}

export default App;
