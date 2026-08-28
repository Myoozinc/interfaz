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
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { ComfyStudioModal } from './components/ComfyStudioModal';
import { AuthModal } from './components/AuthModal';
import type { FileItem, ProjectRecord, ProjectTemplate, UserCredits, UserAccount, ChatMessage } from './types';
import { projectStore } from './services/projectStore';
import { STARTER_TEMPLATES } from './services/templates';
import { aiEngine } from './services/aiGenerator';

export function App() {
  const [viewMode, setViewMode] = useState<'chat' | 'split' | 'preview' | 'editor'>('chat');
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  // Projects State
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [projectName, setProjectName] = useState('NONA App');
  const [files, setFiles] = useState<FileItem[]>(STARTER_TEMPLATES[0].files);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy **NONA AI**. Pídeme crear cualquier aplicación, juego 3D interactivo, componente o diseño en tiempo real.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [activeFileId, setActiveFileId] = useState<string>('1');

  // User & Credits State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('nona_user');
    return saved ? JSON.parse(saved) : { id: 'local_user', name: 'Mi Cuenta Local', email: 'local@nona.app', provider: 'local' };
  });

  const [credits, setCredits] = useState<UserCredits>(() => {
    const saved = localStorage.getItem('nona_credits');
    return saved ? JSON.parse(saved) : { balance: 50, maxFree: 50, totalUsed: 0, plan: 'free' };
  });

  // Modals State
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isComfyModalOpen, setIsComfyModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState(() => {
    return localStorage.getItem('nona_inference_url') || 'https://fancy-trains-worry.loca.lt';
  });

  // Load projects from IndexedDB on mount
  useEffect(() => {
    aiEngine.setOllamaUrl(ollamaUrl);
    projectStore.getAllProjects().then((list) => {
      setProjects(list);
      if (list.length > 0) {
        const active = list[0];
        setActiveProjectId(active.id);
        setProjectName(active.name);
        setFiles(active.files);
        if (active.messages && active.messages.length > 0) setMessages(active.messages);
        setActiveFileId(active.files[0]?.id || '1');
      }
    });
  }, []);

  const handleUpdateOllamaUrl = (url: string) => {
    setOllamaUrl(url);
    localStorage.setItem('nona_inference_url', url);
    aiEngine.setOllamaUrl(url);
  };

  // Sync active project state to IndexedDB on changes
  useEffect(() => {
    if (!activeProjectId) return;
    const currentProj = projects.find(p => p.id === activeProjectId);
    if (currentProj) {
      const updated: ProjectRecord = {
        ...currentProj,
        name: projectName,
        files,
        messages,
        updatedAt: new Date().toISOString(),
      };
      projectStore.saveProject(updated);
      setProjects(prev => prev.map(p => p.id === activeProjectId ? updated : p));
    }
  }, [files, messages, projectName]);

  // Save credits & user
  useEffect(() => {
    localStorage.setItem('nona_credits', JSON.stringify(credits));
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('nona_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Handlers for Projects
  const handleSelectProject = (projectId: string) => {
    const target = projects.find(p => p.id === projectId);
    if (target) {
      setActiveProjectId(target.id);
      setProjectName(target.name);
      setFiles(target.files);
      setMessages(target.messages || []);
      setActiveFileId(target.files[0]?.id || '1');
      setViewMode('split');
    }
  };

  const handleCreateProject = (name: string, template?: ProjectTemplate) => {
    const tmplFiles = template ? template.files : STARTER_TEMPLATES[0].files;
    const newProj = projectStore.createDefaultProject(name, tmplFiles);
    projectStore.saveProject(newProj).then(() => {
      setProjects(prev => [newProj, ...prev]);
      setActiveProjectId(newProj.id);
      setProjectName(newProj.name);
      setFiles(newProj.files);
      setMessages(newProj.messages);
      setActiveFileId(newProj.files[0]?.id || '1');
      setViewMode('split');
    });
  };

  const handleDeleteProject = (projectId: string) => {
    projectStore.deleteProject(projectId).then(() => {
      const remaining = projects.filter(p => p.id !== projectId);
      setProjects(remaining);
      if (activeProjectId === projectId && remaining.length > 0) {
        handleSelectProject(remaining[0].id);
      }
    });
  };

  const handleDuplicateProject = (projectId: string) => {
    const source = projects.find(p => p.id === projectId);
    if (!source) return;
    const copy: ProjectRecord = {
      ...source,
      id: 'proj_' + Date.now(),
      name: `${source.name} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projectStore.saveProject(copy).then(() => {
      setProjects(prev => [copy, ...prev]);
      handleSelectProject(copy.id);
    });
  };

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

  // Credits & Monetization
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

  // Export ZIP
  const handleExportZip = async () => {
    const zip = new JSZip();
    files.forEach(f => {
      zip.file(f.name, f.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${projectName.toLowerCase().replace(/\s+/g, '-')}-nona.zip`);
  };

  const handleStartFromHero = (prompt: string) => {
    setPendingPrompt(prompt);
    setViewMode('split');
  };

  // Insert asset into code
  const handleInsertAssetToCode = (assetUrl: string, prompt: string) => {
    const htmlIndex = files.findIndex(f => f.name.endsWith('.html'));
    if (htmlIndex !== -1) {
      const currentHtml = files[htmlIndex].content;
      let updated = currentHtml;
      if (currentHtml.includes('</body>')) {
        updated = currentHtml.replace(
          '</body>',
          `  <!-- Media Asset: ${prompt} -->\n  <div class="p-4 flex justify-center"><img src="${assetUrl}" alt="${prompt}" class="rounded-2xl max-w-sm shadow-xl border border-violet-500/30" /></div>\n</body>`
        );
      } else {
        updated += `\n<img src="${assetUrl}" alt="${prompt}" class="rounded-2xl max-w-sm" />`;
      }
      setFiles(prev => prev.map((f, i) => i === htmlIndex ? { ...f, content: updated, isModified: true } : f));
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* Top Navigation */}
      <Header
        projectName={projectName}
        credits={credits}
        currentUser={currentUser}
        onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
        onOpenComfyModal={() => setIsComfyModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onExportZip={handleExportZip}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Main Content Surfaces based on viewMode */}
      <div className="flex-1 flex overflow-hidden">
        
        {viewMode === 'chat' ? (
          /* Mode 1: Central Hero Chat View */
          <HeroChatView
            onStartGeneration={handleStartFromHero}
            creditsBalance={credits.balance}
            onOpenWorkspace={() => setViewMode('split')}
          />
        ) : (
          /* Mode 2: Multi-panel Workspace */
          <div className="flex-1 flex overflow-hidden">
            
            {/* Left: File Explorer */}
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

            {/* Center: Monaco Editor */}
            {(viewMode === 'split' || viewMode === 'editor') && (
              <EditorPanel
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onFileChange={handleFileChange}
              />
            )}

            {/* Center/Right: Live Preview */}
            {(viewMode === 'split' || viewMode === 'preview') && (
              <PreviewPanel
                files={files}
              />
            )}

            {/* Right: AI Chat Panel with Memory */}
            <ChatPanel
              files={files}
              messages={messages}
              setMessages={setMessages}
              onUpdateFiles={setFiles}
              onDeductCredit={handleDeductCredit}
              pendingPrompt={pendingPrompt}
              onClearPendingPrompt={() => setPendingPrompt(null)}
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
        setOllamaUrl={handleUpdateOllamaUrl}
      />

      {/* Projects Manager Modal */}
      <ProjectManagerModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
      />

      {/* NONA Media Studio Modal */}
      <ComfyStudioModal
        isOpen={isComfyModalOpen}
        onClose={() => setIsComfyModalOpen(false)}
        onInsertAssetToCode={handleInsertAssetToCode}
      />

      {/* Auth & Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={setCurrentUser}
        onLogout={() => setCurrentUser(null)}
      />

    </div>
  );
}

export default App;
