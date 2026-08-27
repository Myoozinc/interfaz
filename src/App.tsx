import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Header } from './components/Header';
import { SidebarFiles } from './components/SidebarFiles';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ChatPanel } from './components/ChatPanel';
import { CreditsModal } from './components/CreditsModal';
import { SettingsModal } from './components/SettingsModal';
import type { FileItem, ProjectTemplate, OllamaModelInfo, UserCredits } from './types';
import { STARTER_TEMPLATES } from './services/templates';
import { ollamaClient } from './services/ollama';

export function App() {
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

  // Ollama & models state
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [currentModel, setCurrentModel] = useState('qwen3.8');
  const [modelsList, setModelsList] = useState<OllamaModelInfo[]>([
    { name: 'qwen3.8', modified_at: new Date().toISOString(), size: 4800000000, digest: 'local' },
    { name: 'qwen2.5-coder:14b', modified_at: new Date().toISOString(), size: 9000000000, digest: 'local' },
    { name: 'qwen2.5:3b', modified_at: new Date().toISOString(), size: 2000000000, digest: 'local' },
    { name: 'gemma4:26b', modified_at: new Date().toISOString(), size: 16000000000, digest: 'local' },
  ]);
  const [ollamaStatus, setOllamaStatus] = useState<{ ok: boolean; message: string }>({
    ok: true,
    message: 'Listo para conectar con Qwen 3.8',
  });

  // Save files to localStorage
  useEffect(() => {
    localStorage.setItem('nona_files', JSON.stringify(files));
  }, [files]);

  // Save credits to localStorage
  useEffect(() => {
    localStorage.setItem('nona_credits', JSON.stringify(credits));
  }, [credits]);

  // Auto check Ollama on mount
  useEffect(() => {
    const checkOllama = async () => {
      const res = await ollamaClient.checkConnection();
      setOllamaStatus(res);
      if (res.ok) {
        const models = await ollamaClient.getModels();
        if (models.length > 0) {
          setModelsList(models);
          const hasQwen = models.some(m => m.name.toLowerCase().includes('qwen'));
          if (hasQwen) {
            const bestQwen = models.find(m => m.name.includes('qwen3.8')) || models.find(m => m.name.includes('qwen'));
            if (bestQwen) setCurrentModel(bestQwen.name);
          }
        }
      }
    };
    checkOllama();
  }, []);

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
  };

  const handleNewProject = () => {
    if (confirm('¿Crear un proyecto nuevo desde cero?')) {
      handleLoadTemplate(STARTER_TEMPLATES[0]);
    }
  };

  // Handler to apply generated AI code
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

  return (
    <div className="flex flex-col h-screen w-screen bg-[#FAF7F2] text-[#1C1917] overflow-hidden">
      
      {/* Top Main Navigation */}
      <Header
        projectName={projectName}
        setProjectName={setProjectName}
        credits={credits}
        onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onExportZip={handleExportZip}
        onNewProject={handleNewProject}
        ollamaStatus={ollamaStatus}
        currentModel={currentModel}
      />

      {/* Main 4-Way Worksurface Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left 1: File Explorer & Templates */}
        <SidebarFiles
          files={files}
          activeFileId={activeFileId}
          onSelectFile={handleSelectFile}
          onAddFile={handleAddFile}
          onDeleteFile={handleDeleteFile}
          onLoadTemplate={handleLoadTemplate}
        />

        {/* Center: Monaco Code Editor */}
        <EditorPanel
          files={files}
          activeFileId={activeFileId}
          onSelectFile={handleSelectFile}
          onFileChange={handleFileChange}
        />

        {/* Right Split: Live Preview */}
        <PreviewPanel
          files={files}
        />

        {/* Far Right: NONA AI Agent & Chat with Qwen 3.8 */}
        <ChatPanel
          files={files}
          onApplyCodeToFile={handleApplyCodeToFile}
          onDeductCredit={handleDeductCredit}
          currentModel={currentModel}
          setCurrentModel={setCurrentModel}
          modelsList={modelsList}
        />

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
        onRefreshModels={async () => {
          const models = await ollamaClient.getModels();
          if (models.length > 0) setModelsList(models);
        }}
      />

    </div>
  );
}

export default App;
