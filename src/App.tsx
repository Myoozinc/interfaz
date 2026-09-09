import { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import confetti from 'canvas-confetti';
import { 
  FolderClosed, 
  ChevronDown, 
  Eye, 
  Code2, 
  Columns, 
  X, 
  MessageSquare 
} from 'lucide-react';
import { Header } from './components/Header';
import { SidebarFiles } from './components/SidebarFiles';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ChatPanel } from './components/ChatPanel';
import { HeroChatView } from './components/HeroChatView';
import { CreditsModal } from './components/CreditsModal';
import { SettingsModal } from './components/SettingsModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { TemplatesGalleryModal } from './components/TemplatesGalleryModal';
import { MediaLibraryModal } from './components/MediaLibraryModal';
import { AuthModal } from './components/AuthModal';
import { DiagnosticsPage } from './components/DiagnosticsPage';
import { AgentActivityStream } from './components/AgentActivityStream';
import { DesktopSidebar } from './components/DesktopSidebar';
import type { FileItem, ProjectRecord, ProjectTemplate, UserCredits, UserAccount, ChatMessage, ChatAttachment } from './types';
import type { FullStackProject } from './core/types';
import { projectStore } from './services/projectStore';
import { STARTER_TEMPLATES } from './services/templates';
import { aiEngine } from './services/aiGenerator';
import { agentOrchestrator } from './core/agent/AgentOrchestrator';
import { creditLedger } from './core/credits/CreditLedger';

export function App() {
  const [viewMode, setViewMode] = useState<'chat' | 'split' | 'preview' | 'editor'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('nona_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  // Workspace layout state (Preview active by default, files and editor collapsible)
  const [isFilesDrawerOpen, setIsFilesDrawerOpen] = useState(false);
  const [workspaceCenterTab, setWorkspaceCenterTab] = useState<'preview' | 'code' | 'split'>('preview');

  // Agent execution state
  const [isGenerating, setIsGenerating] = useState(false);
  const [thinkingText, setThinkingText] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Resizable Panels State
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    return parseInt(localStorage.getItem('nona_sidebar_w') || '220', 10);
  });
  const [chatWidth, setChatWidth] = useState(() => {
    return parseInt(localStorage.getItem('nona_chat_w') || '380', 10);
  });
  const [splitRatio, setSplitRatio] = useState(() => {
    return parseFloat(localStorage.getItem('nona_split_ratio') || '0.5');
  });

  const resizingTargetRef = useRef<'sidebar' | 'chat' | 'split' | null>(null);

  // Projects State
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [projectName, setProjectName] = useState('Nuevo Proyecto');
  const [files, setFiles] = useState<FileItem[]>(STARTER_TEMPLATES[0].files);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy **NONA AI Software Factory (Architecture v5.0)**. Transforma cualquier requerimiento en software real, funcional, probado y desplegable.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [activeFileId, setActiveFileId] = useState<string>('1');

  // User & Credits State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('nona_user');
    return saved ? JSON.parse(saved) : { id: 'user_1', name: 'Admin SaaS', email: 'admin@nona.app', provider: 'local' };
  });

  const [credits, setCredits] = useState<UserCredits>(() => {
    const savedBal = localStorage.getItem('nona_credit_balance');
    const bal = savedBal ? parseInt(savedBal, 10) : 1000;
    return { balance: bal, maxFree: 1000, totalUsed: 0, plan: 'free' };
  });

  // Modals State
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState(() => {
    return localStorage.getItem('nona_inference_url') || '/api/agent';
  });
  const [inspectedElement, setInspectedElement] = useState<string | null>(null);

  useEffect(() => {
    aiEngine.setOllamaUrl(ollamaUrl);
    agentOrchestrator.setEndpoint(ollamaUrl);
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
    agentOrchestrator.setEndpoint(url);
  };

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('nona_sidebar_open', String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [toggleSidebar]);

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

  // Resizing mouse move & up listeners
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingTargetRef.current) return;

    if (resizingTargetRef.current === 'sidebar') {
      const newW = Math.max(160, Math.min(380, e.clientX));
      setSidebarWidth(newW);
      localStorage.setItem('nona_sidebar_w', newW.toString());
    } else if (resizingTargetRef.current === 'chat') {
      const newW = Math.max(280, Math.min(600, window.innerWidth - e.clientX));
      setChatWidth(newW);
      localStorage.setItem('nona_chat_w', newW.toString());
    } else if (resizingTargetRef.current === 'split') {
      const workspaceLeft = sidebarWidth;
      const workspaceWidth = window.innerWidth - sidebarWidth - chatWidth;
      const mouseOffset = e.clientX - workspaceLeft;
      const newRatio = Math.max(0.2, Math.min(0.8, mouseOffset / workspaceWidth));
      setSplitRatio(newRatio);
      localStorage.setItem('nona_split_ratio', newRatio.toString());
    }
  }, [sidebarWidth, chatWidth]);

  const handleMouseUp = useCallback(() => {
    resizingTargetRef.current = null;
    document.body.style.cursor = 'default';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

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

  const handleNewCleanProject = () => {
    const newName = 'App ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const cleanFiles: FileItem[] = [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>NONA App</title>\n  <script src="https://cdn.tailwindcss.com"></script>\n  <script src="https://unpkg.com/lucide@latest"></script>\n</head>\n<body class="bg-slate-900 text-white min-h-screen flex items-center justify-center font-sans">\n  <div class="text-center p-8 bg-slate-800/80 rounded-3xl border border-slate-700 max-w-md shadow-2xl">\n    <div class="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4">\n      <i data-lucide="sparkles" class="w-6 h-6"></i>\n    </div>\n    <h1 class="text-xl font-bold mb-2">Lienzo Listo</h1>\n    <p class="text-xs text-slate-400">Escribe en el chat o dicta por voz qué aplicación deseas construir.</p>\n  </div>\n  <script>lucide.createIcons();</script>\n</body>\n</html>`,
        isModified: false,
      }
    ];

    const cleanProj = projectStore.createDefaultProject(newName, cleanFiles);
    cleanProj.messages = [
      {
        id: 'welcome_' + Date.now(),
        role: 'assistant',
        content: '¡Lienzo limpio preparado! Pídeme cualquier app, SaaS o juego 3D.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ];

    projectStore.saveProject(cleanProj).then(() => {
      setProjects(prev => [cleanProj, ...prev]);
      setActiveProjectId(cleanProj.id);
      setProjectName(cleanProj.name);
      setFiles(cleanProj.files);
      setMessages(cleanProj.messages);
      setActiveFileId('1');
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
    setWorkspaceCenterTab('preview');
    setViewMode('split');
    confetti({
      particleCount: 60,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#6366f1', '#ec4899', '#10b981']
    });
  };

  // Credits & Monetization
  const handleDeductCredit = (amount: number = 5): boolean => {
    if (credits.balance < amount) {
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

  const handleSendMessage = async (
    customPrompt?: string, 
    modeOverride?: 'chat' | 'builder', 
    customImages?: string[],
    customAttachments?: ChatAttachment[]
  ) => {
    let promptToSend = (customPrompt || pendingPrompt || '').trim();
    const activeAttachments = customAttachments || attachments;
    if (!promptToSend && (!customImages || customImages.length === 0) && activeAttachments.length === 0 && !inspectedElement) return;

    if (inspectedElement) {
      promptToSend = `[Elemento Seleccionado en Vista Previa: ${inspectedElement}]\n${promptToSend}`;
      setInspectedElement(null);
    }

    const executionMode: 'chat' | 'builder' = modeOverride || (viewMode === 'chat' ? 'chat' : 'builder');

    if (!handleDeductCredit(5)) {
      alert('⚠️ No tienes suficientes créditos para esta generación (requiere 5 créditos).');
      return;
    }

    const userMessageId = Date.now().toString();
    const imgs = customImages && customImages.length > 0 ? customImages : undefined;
    const atts = activeAttachments.length > 0 ? [...activeAttachments] : undefined;
    const newUserMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: promptToSend,
      images: imgs,
      attachments: atts,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantPlaceholderId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newUserMsg, assistantMsg]);
    setAttachments([]);
    setIsGenerating(true);
    setThinkingText(
      executionMode === 'chat'
        ? '🧠 Cadena Multi-Agente: Analizando contexto del chat e ideando plan...'
        : '⚡ NONA Autonomous Engine: Sintetizando y verificando software...'
    );

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const projectPayload: FullStackProject = {
        id: activeProjectId || 'workspace_proj',
        name: projectName,
        description: 'Auto-generated with NONA AI Engine',
        files: files.reduce((acc, f) => {
          acc[f.name] = {
            path: f.name,
            content: f.content,
            language: f.language,
          };
          return acc;
        }, {} as FullStackProject['files']),
        environmentVariables: {},
        framework: 'html-tailwind',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await agentOrchestrator.run(
        promptToSend,
        projectPayload,
        (progressText: string) => {
          setThinkingText(progressText);
        },
        {
          images: imgs,
          attachments: atts,
          signal: abortController.signal,
          history: [...messages, newUserMsg],
          mode: executionMode,
        }
      );

      // If code was created or modified, update workspace files
      if (result.intent.type === 'FULL_BUILD' || result.intent.type === 'SURGICAL_EDIT') {
        const updatedFileList: FileItem[] = Object.entries(result.updatedProject.files).map(([name, file], idx) => ({
          id: (idx + 1).toString(),
          name,
          language: file.language as any,
          content: file.content,
          isModified: true,
        }));
        setFiles(updatedFileList);

        if (executionMode === 'builder') {
          setViewMode('split');
          setWorkspaceCenterTab('preview');
        }

        confetti({
          particleCount: 50,
          spread: 80,
          origin: { y: 0.7 },
          colors: ['#6366F1', '#7C3AED', '#A855F7', '#10B981']
        });
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantPlaceholderId
            ? { 
                ...msg, 
                content: result.responseText, 
                intent: result.intent.type, 
                actionChips: result.actionChips,
                activeAgentDomain: result.activeAgentDomain,
                collaboratingAgents: result.collaboratingAgents,
              }
            : msg
        )
      );

      creditLedger.deductCredits(5, `NONA [${result.intent.type}]: "${promptToSend.slice(0, 30)}..."`);

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        creditLedger.refundCredits(5, 'Reembolso por fallo en generación');
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantPlaceholderId
              ? { ...msg, content: `⚠️ Error: ${err.message}` }
              : msg
          )
        );
      }
    } finally {
      setIsGenerating(false);
      setThinkingText('');
      abortControllerRef.current = null;
    }
  };

  const handleInsertAssetToCode = (assetUrl: string, prompt: string) => {
    const htmlIndex = files.findIndex(f => f.name.endsWith('.html'));
    if (htmlIndex !== -1) {
      const currentHtml = files[htmlIndex].content;
      let updated = currentHtml;
      if (currentHtml.includes('</body>')) {
        updated = currentHtml.replace(
          '</body>',
          `  <!-- Media Asset: ${prompt} -->\n  <div class="p-6 flex justify-center"><img src="${assetUrl}" alt="${prompt}" class="rounded-3xl max-w-md shadow-2xl border border-violet-500/20" /></div>\n</body>`
        );
      } else {
        updated += `\n<img src="${assetUrl}" alt="${prompt}" class="rounded-3xl max-w-md" />`;
      }
      setFiles(prev => prev.map((f, i) => i === htmlIndex ? { ...f, content: updated, isModified: true } : f));
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans select-none">
      
      {/* Top Navigation */}
      <Header
        projectName={projectName}
        credits={credits}
        currentUser={currentUser}
        onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
        onOpenMediaModal={() => setIsMediaModalOpen(true)}
        onOpenDiagnostics={() => setShowDiagnostics(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
        onExportZip={handleExportZip}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main Content View */}
      {showDiagnostics ? (
        <DiagnosticsPage onBack={() => setShowDiagnostics(false)} />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          
          {/* Desktop Left Collapsible Sidebar */}
          <DesktopSidebar
            isOpen={isSidebarOpen}
            onClose={() => {
              setIsSidebarOpen(false);
              localStorage.setItem('nona_sidebar_open', 'false');
            }}
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
            onNewProject={handleNewCleanProject}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            credits={credits}
            currentUser={currentUser}
            onOpenCreditsModal={() => setIsCreditsModalOpen(true)}
            onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
            onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
            onOpenMediaModal={() => setIsMediaModalOpen(true)}
            onOpenDiagnostics={() => setShowDiagnostics(true)}
            onExportZip={handleExportZip}
          />

          {/* Center Main View Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {viewMode === 'chat' ? (
              /* Mode 1: Central Conversational Multi-Agent View */
              <HeroChatView
                messages={messages}
                onSendMessage={(prompt, mode, _model, atts) => handleSendMessage(prompt, mode, undefined, atts)}
                creditsBalance={credits.balance}
                onOpenWorkspace={() => {
                  setViewMode('split');
                  setWorkspaceCenterTab('preview');
                }}
                onNewCleanProject={handleNewCleanProject}
                attachments={attachments}
                onAddAttachment={(att) => setAttachments(prev => [...prev, att])}
                onRemoveAttachment={(id) => setAttachments(prev => prev.filter(a => a.id !== id))}
                onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
                inspectedElement={inspectedElement}
                onClearInspectedElement={() => setInspectedElement(null)}
                isGenerating={isGenerating}
                thinkingText={thinkingText}
              />
            ) : (
              /* Mode 2: Multi-panel Workspace with Preview-First Default Layout */
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Workspace Sub-Toolbar for Collapsible Elements */}
                <div className="h-10 px-3 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 select-none text-xs">
                  
                  {/* Left: Collapsible Files Drawer Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsFilesDrawerOpen(prev => !prev)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isFilesDrawerOpen
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                          : 'bg-slate-100/90 text-slate-600 hover:text-slate-900 border border-slate-200/70 hover:bg-slate-200/70'
                      }`}
                      title={isFilesDrawerOpen ? 'Ocultar panel de archivos' : 'Mostrar explorador de archivos desplegable'}
                    >
                      <FolderClosed className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Archivos ({files.length})</span>
                      <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isFilesDrawerOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Center: Segmented Controls for Center View (Preview by default, Code, or Split) */}
                  <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/70 text-[11px] font-medium">
                    <button
                      onClick={() => setWorkspaceCenterTab('preview')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        workspaceCenterTab === 'preview'
                          ? 'bg-white text-indigo-600 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Vista Previa (Activa)</span>
                    </button>

                    <button
                      onClick={() => setWorkspaceCenterTab('code')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        workspaceCenterTab === 'code'
                          ? 'bg-white text-indigo-600 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Editor de Código</span>
                    </button>

                    <button
                      onClick={() => setWorkspaceCenterTab('split')}
                      className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        workspaceCenterTab === 'split'
                          ? 'bg-white text-indigo-600 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span>Dividir Ambos</span>
                    </button>
                  </div>

                  {/* Right: Quick shortcut back to chat mode */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('chat')}
                      className="flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer text-[11px]"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Ir a Modo Chat</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden relative">
                  
                  {/* Collapsible Left: File Explorer Drawer */}
                  {isFilesDrawerOpen && (
                    <>
                      <div style={{ width: `${sidebarWidth}px` }} className="shrink-0 flex flex-col h-full overflow-hidden bg-slate-50 border-r border-slate-200 z-10">
                        <div className="flex items-center justify-between p-2 border-b border-slate-200 bg-white">
                          <span className="text-[11px] font-bold text-slate-700">Explorador de Archivos</span>
                          <button
                            onClick={() => setIsFilesDrawerOpen(false)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <SidebarFiles
                            files={files}
                            activeFileId={activeFileId}
                            onSelectFile={handleSelectFile}
                            onAddFile={handleAddFile}
                            onDeleteFile={handleDeleteFile}
                            onLoadTemplate={handleLoadTemplate}
                          />
                        </div>
                      </div>

                      {/* Splitter Handle 1: Sidebar / Center */}
                      <div
                        onMouseDown={() => {
                          resizingTargetRef.current = 'sidebar';
                          document.body.style.cursor = 'col-resize';
                        }}
                        title="Arrastra para redimensionar explorador"
                        className="w-1.5 hover:w-2 bg-slate-200 hover:bg-indigo-500 cursor-col-resize transition-all shrink-0 z-20"
                      />
                    </>
                  )}

                  {/* Center Workspace: Preview by default, or Code, or Split */}
                  <div className="flex-1 flex overflow-hidden relative">
                    
                    {/* 1. Preview Only (DEFAULT!) */}
                    {workspaceCenterTab === 'preview' && (
                      <div className="flex-1 h-full overflow-hidden">
                        <PreviewPanel
                          files={files}
                          onElementSelect={(info) => setInspectedElement(info.selector ? `${info.tagName} (${info.selector})` : info.outerHTML)}
                          onAutoFixErrors={(errors) => handleSendMessage('Corrige los siguientes errores de ejecución en consola y haz que el botón de jugar y todos los eventos funcionen al 100%:\n' + errors.map(e => '- ' + e).join('\n'), 'builder')}
                        />
                      </div>
                    )}

                    {/* 2. Code Editor Only */}
                    {workspaceCenterTab === 'code' && (
                      <div className="flex-1 h-full overflow-hidden">
                        <EditorPanel
                          files={files}
                          activeFileId={activeFileId}
                          onSelectFile={handleSelectFile}
                          onFileChange={handleFileChange}
                        />
                      </div>
                    )}

                    {/* 3. Both Side-by-Side (Split) */}
                    {workspaceCenterTab === 'split' && (
                      <>
                        <div style={{ flex: splitRatio }} className="h-full overflow-hidden">
                          <EditorPanel
                            files={files}
                            activeFileId={activeFileId}
                            onSelectFile={handleSelectFile}
                            onFileChange={handleFileChange}
                          />
                        </div>

                        <div
                          onMouseDown={() => {
                            resizingTargetRef.current = 'split';
                            document.body.style.cursor = 'col-resize';
                          }}
                          title="Arrastra para redimensionar editor y preview"
                          className="w-1.5 hover:w-2 bg-slate-200 hover:bg-indigo-500 cursor-col-resize transition-all shrink-0 z-20"
                        />

                        <div style={{ flex: 1 - splitRatio }} className="h-full overflow-hidden">
                          <PreviewPanel
                            files={files}
                            onElementSelect={(info) => setInspectedElement(info.selector ? `${info.tagName} (${info.selector})` : info.outerHTML)}
                            onAutoFixErrors={(errors) => handleSendMessage('Corrige los siguientes errores de ejecución en consola y haz que el botón de jugar y todos los eventos funcionen al 100%:\n' + errors.map(e => '- ' + e).join('\n'), 'builder')}
                          />
                        </div>
                      </>
                    )}

                  </div>

                  {/* Splitter Handle 3: Workspace / Chat Panel */}
                  <div
                    onMouseDown={() => {
                      resizingTargetRef.current = 'chat';
                      document.body.style.cursor = 'col-resize';
                    }}
                    title="Arrastra para redimensionar panel de chat"
                    className="w-1.5 hover:w-2 bg-slate-200 hover:bg-indigo-500 cursor-col-resize transition-all shrink-0 z-20"
                  />

                  {/* Right: AI Agent Core Chat Panel with Resizable Width */}
                  <div style={{ width: `${chatWidth}px` }} className="shrink-0 flex flex-col h-full overflow-hidden">
                    <ChatPanel
                      files={files}
                      messages={messages}
                      setMessages={setMessages}
                      onUpdateFiles={setFiles}
                      onDeductCredit={handleDeductCredit}
                      pendingPrompt={pendingPrompt}
                      onClearPendingPrompt={() => setPendingPrompt(null)}
                      onNewProject={handleNewCleanProject}
                      onSwitchView={(v) => {
                        if (v === 'preview') setWorkspaceCenterTab('preview');
                        else if (v === 'editor') setWorkspaceCenterTab('code');
                        else setWorkspaceCenterTab('split');
                      }}
                      inspectedElement={inspectedElement}
                      onClearInspectedElement={() => setInspectedElement(null)}
                    />
                  </div>

                </div>

                {/* Bottom: Live Agent Activity Stream */}
                <AgentActivityStream />

              </div>
            )}

          </div>
        </div>
      )}

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

      {/* Templates & Functional Apps Gallery Modal */}
      <TemplatesGalleryModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={(tmpl) => {
          handleLoadTemplate(tmpl);
          setIsTemplatesModalOpen(false);
        }}
      />

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onInsertAsset={handleInsertAssetToCode}
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
