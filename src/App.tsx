import { useState, useEffect, useRef, useCallback } from 'react';
import { friendlyError } from './core/agent/friendlyError';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import confetti from 'canvas-confetti';
import { 
  FolderClosed, 
  Eye, 
  Code2, 
  Columns, 
  X, 
  Terminal 
} from 'lucide-react';
import { Header } from './components/Header';
import { SidebarFiles } from './components/SidebarFiles';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { TerminalPanel } from './components/TerminalPanel';
import { ChatPanel } from './components/ChatPanel';
import { HeroChatView } from './components/HeroChatView';
import { CreditsModal } from './components/CreditsModal';
import { SettingsModal } from './components/SettingsModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { TemplatesGalleryModal } from './components/TemplatesGalleryModal';
import { MediaLibraryModal } from './components/MediaLibraryModal';
import { GitHubExportModal } from './components/GitHubExportModal';
import { SupabaseConnectModal } from './components/SupabaseConnectModal';
import { AuthModal } from './components/AuthModal';
import { DiagnosticsPage } from './components/DiagnosticsPage';
import { AgentActivityStream } from './components/AgentActivityStream';
import { DesktopSidebar } from './components/DesktopSidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { telemetryService } from './services/telemetryService';
import type { FileItem, ProjectRecord, ProjectTemplate, UserCredits, UserAccount, ChatMessage, ChatAttachment } from './types';
import type { FullStackProject } from './core/types';
import { projectStore } from './services/projectStore';
import { STARTER_TEMPLATES } from './services/templates';
import { CATALOG_TEMPLATES, resolveTemplateFiles } from './services/catalogTemplates';

const FEATURED_TEMPLATES = ['panel-ventas', 'tienda-online', 'reservas-barberia', 'neon-highway']
  .map(id => CATALOG_TEMPLATES.find(t => t.id === id)!)
  .filter(Boolean);
import { aiEngine } from './services/aiGenerator';
import { agentOrchestrator } from './core/agent/AgentOrchestrator';
import { creditLedger } from './core/credits/CreditLedger';
import { ensureCompleteViteProject } from './core/sandbox/ProjectStructureDefaults';

export function App() {
  // Check if current URL route matches /admin, #/admin, or ?admin
  const checkIsAdminPath = () => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname.toLowerCase();
    const h = window.location.hash.toLowerCase();
    const s = window.location.search.toLowerCase();
    return p === '/admin' || p.startsWith('/admin/') || h === '#/admin' || h.startsWith('#/admin') || s.includes('admin');
  };

  const [isAdminView, setIsAdminView] = useState<boolean>(checkIsAdminPath);

  // Initialize real telemetry and listen to route / popstate / hash changes
  useEffect(() => {
    telemetryService.init();

    const handleUrlChange = () => {
      setIsAdminView(checkIsAdminPath());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    // Secret shortcut: Ctrl + Alt + A (or Cmd + Option + A) toggles admin
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsAdminView(prev => {
          const next = !prev;
          if (next) {
            window.history.pushState(null, '', '/admin');
          } else {
            window.history.pushState(null, '', '/');
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleExitAdmin = () => {
    setIsAdminView(false);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
    }
  };

  const [viewMode, setViewMode] = useState<'chat' | 'split' | 'preview' | 'editor'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  // Workspace layout state (Preview active by default, files and editor collapsible)
  const [isFilesDrawerOpen, setIsFilesDrawerOpen] = useState(false);
  const [workspaceCenterTab, setWorkspaceCenterTab] = useState<'preview' | 'code' | 'split' | 'terminal'>('preview');

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
    return saved ? JSON.parse(saved) : { id: 'user_1', name: 'Invitado', email: '', provider: 'local' };
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
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState(() => {
    return localStorage.getItem('nona_inference_url') || '/api/agent';
  });
  const [inspectedElement, setInspectedElement] = useState<string | null>(null);

  useEffect(() => {
    aiEngine.setOllamaUrl(ollamaUrl);
    agentOrchestrator.setEndpoint(ollamaUrl);
    projectStore.getAllProjects().then((list) => {
      setProjects(list);
      // Cada vez que un usuario ingresa a la plataforma, presentar la vista limpia Hero "¿Qué deseas construir hoy?"
      const freshName = 'Proyecto ' + new Date().toLocaleDateString('es', { day: 'numeric', month: 'short' }) + ', ' + new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
      const cleanFiles: FileItem[] = [
        {
          id: '1',
          name: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Proyecto nuevo</title>\n  <style>\n    html,body{height:100%;margin:0}\n    body{display:grid;place-items:center;background:#0F1219;color:#B9BFCD;font:15px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}\n    .box{text-align:center;max-width:34ch;padding:24px}\n    img{width:56px;height:56px;opacity:.9}\n    h1{margin:16px 0 6px;font-size:20px;font-weight:600;color:#E7EAF2}\n  </style>\n</head>\n<body>\n  <!-- Lienzo Listo: proyecto vacío -->\n  <div class="box">\n    <img src="/nona-logo-dark.png" alt="" />\n    <h1>Proyecto vacío</h1>\n    <p>Describe en el chat la app o el juego que quieres y aparecerá aquí.</p>\n  </div>\n</body>\n</html>`,
          isModified: false,
        }
      ];

      const cleanProj = projectStore.createDefaultProject(freshName, cleanFiles);
      cleanProj.messages = [
        {
          id: 'welcome_' + Date.now(),
          role: 'assistant',
          content: 'Proyecto nuevo listo. Cuéntame qué quieres crear: una app, una web o un juego.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ];

      projectStore.saveProject(cleanProj).then(() => {
        setProjects(prev => [cleanProj, ...prev.filter(p => p.id !== cleanProj.id)]);
        setActiveProjectId(cleanProj.id);
        setProjectName(cleanProj.name);
        setFiles(cleanProj.files);
        setMessages(cleanProj.messages);
        setActiveFileId('1');
        setViewMode('chat');
        setIsSidebarOpen(false);
      });
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
    const newName = 'Proyecto ' + new Date().toLocaleDateString('es', { day: 'numeric', month: 'short' }) + ', ' + new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    const cleanFiles: FileItem[] = [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Proyecto nuevo</title>\n  <style>\n    html,body{height:100%;margin:0}\n    body{display:grid;place-items:center;background:#0F1219;color:#B9BFCD;font:15px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}\n    .box{text-align:center;max-width:34ch;padding:24px}\n    img{width:56px;height:56px;opacity:.9}\n    h1{margin:16px 0 6px;font-size:20px;font-weight:600;color:#E7EAF2}\n  </style>\n</head>\n<body>\n  <!-- Lienzo Listo: proyecto vacío -->\n  <div class="box">\n    <img src="/nona-logo-dark.png" alt="" />\n    <h1>Proyecto vacío</h1>\n    <p>Describe en el chat la app o el juego que quieres y aparecerá aquí.</p>\n  </div>\n</body>\n</html>`,
        isModified: false,
      }
    ];

    const cleanProj = projectStore.createDefaultProject(newName, cleanFiles);
    cleanProj.messages = [
      {
        id: 'welcome_' + Date.now(),
        role: 'assistant',
        content: 'Proyecto nuevo listo. Cuéntame qué quieres crear: una app, una web o un juego.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ];

    projectStore.saveProject(cleanProj).then(() => {
      setProjects(prev => [cleanProj, ...prev]);
      setActiveProjectId(cleanProj.id);
      setProjectName(cleanProj.name);
      setFiles(cleanProj.files);
      setMessages(cleanProj.messages);
      setViewMode('chat');
      setIsSidebarOpen(false);
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
  // NONA es gratuito durante la beta: se registra el uso, pero nunca se bloquea al usuario
  // (el sistema de pago era simulado y podía dejar a alguien sin poder generar).
  const handleDeductCredit = (amount: number = 5): boolean => {
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
    const fileRecord: Record<string, string> = {};
    files.forEach(f => {
      fileRecord[f.name] = f.content;
    });
    const completeFiles = ensureCompleteViteProject(fileRecord);
    const zip = new JSZip();
    Object.entries(completeFiles).forEach(([path, content]) => {
      const cleanPath = path.replace(/^\/+/, '');
      zip.file(cleanPath, content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${projectName.toLowerCase().replace(/\s+/g, '-')}-nona.zip`);
    telemetryService.trackEvent('export_zip', `Descarga de proyecto ZIP: ${projectName}`, {
      fileCount: files.length
    });
  };

  const handleSendMessage = async (
    customPrompt?: string, 
    modeOverride?: 'chat' | 'builder', 
    customImages?: string[],
    customAttachments?: ChatAttachment[],
    customModel?: string
  ) => {
    let promptToSend = (customPrompt || pendingPrompt || '').trim();
    const activeAttachments = customAttachments || attachments;
    if (!promptToSend && (!customImages || customImages.length === 0) && activeAttachments.length === 0 && !inspectedElement) return;

    if (inspectedElement) {
      promptToSend = `[Elemento Seleccionado en Vista Previa: ${inspectedElement}]\n${promptToSend}`;
      setInspectedElement(null);
    }

    const executionMode: 'chat' | 'builder' = modeOverride || (viewMode === 'chat' ? 'chat' : 'builder');

    telemetryService.trackEvent('prompt_submit', `Prompt enviado: "${promptToSend.slice(0, 80)}"`, {
      length: promptToSend.length,
      mode: executionMode,
      model: customModel
    });

    handleDeductCredit(5);

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
          model: customModel,
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

        // Vault backup: backup of generated app ("un resguardo de lo que genere")
        telemetryService.backupGeneration(
          promptToSend,
          projectName || 'Proyecto Generado',
          updatedFileList,
          0
        );
        telemetryService.trackEvent('generation_success', `Generación exitosa: ${projectName}`, {
          fileCount: updatedFileList.length,
          intent: result.intent.type,
          prompt: promptToSend.slice(0, 100)
        });

        // Always switch to split view so the user immediately sees the interactive app in Live Preview!
        setViewMode('split');
        setWorkspaceCenterTab('preview');

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
        telemetryService.trackEvent('generation_error', `Error en generación: ${err.message}`, {
          prompt: promptToSend.slice(0, 100),
          error: err.message
        });
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantPlaceholderId
              ? { ...msg, content: `⚠️ ${friendlyError(err?.message)}` }
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
          `  <!-- Media Asset: ${prompt} -->\n  <div class="p-6 flex justify-center"><img src="${assetUrl}" alt="${prompt}" class="rounded-3xl max-w-md shadow-2xl border border-accent/20" /></div>\n</body>`
        );
      } else {
        updated += `\n<img src="${assetUrl}" alt="${prompt}" class="rounded-3xl max-w-md" />`;
      }
      setFiles(prev => prev.map((f, i) => i === htmlIndex ? { ...f, content: updated, isModified: true } : f));
    }
  };

  if (isAdminView) {
    return <AdminDashboard onBackToApp={handleExitAdmin} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-canvas text-fg overflow-hidden font-sans select-none">
      
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
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
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
                onSendMessage={(prompt, mode, model, atts) => handleSendMessage(prompt, mode, undefined, atts, model)}
                creditsBalance={credits.balance}
                onOpenWorkspace={() => {
                  setViewMode('split');
                  setWorkspaceCenterTab('preview');
                }}
                onSwitchView={(v) => {
                  setViewMode('split');
                  setWorkspaceCenterTab(v === 'editor' ? 'code' : 'preview');
                }}
                onNewCleanProject={handleNewCleanProject}
                attachments={attachments}
                onAddAttachment={(att) => setAttachments(prev => [...prev, att])}
                onRemoveAttachment={(id) => setAttachments(prev => prev.filter(a => a.id !== id))}
                onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
                featuredTemplates={FEATURED_TEMPLATES}
                onSelectTemplate={(t) => { resolveTemplateFiles(t).then(handleLoadTemplate).catch(err => console.error(err)); }}
                inspectedElement={inspectedElement}
                onClearInspectedElement={() => setInspectedElement(null)}
                isGenerating={isGenerating}
                thinkingText={thinkingText}
              />
            ) : (
              /* Mode 2: Multi-panel Workspace with Preview-First Default Layout */
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Barra del espacio de trabajo: archivos + vista */}
                <div className="h-11 px-2 bg-canvas border-b border-line flex items-center gap-2 shrink-0 select-none">
                  <button
                    onClick={() => setIsFilesDrawerOpen(prev => !prev)}
                    aria-pressed={isFilesDrawerOpen}
                    className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[13px] transition-colors cursor-pointer ${
                      isFilesDrawerOpen ? 'bg-raised-2 text-fg' : 'text-fg-2 hover:text-fg hover:bg-raised'
                    }`}
                    title={isFilesDrawerOpen ? 'Ocultar archivos' : 'Mostrar archivos'}
                  >
                    <FolderClosed className="w-4 h-4" />
                    <span>Archivos</span>
                    <span className="text-muted tabular-nums">{files.length}</span>
                  </button>

                  <div className="h-4 w-px bg-line" />

                  <div role="tablist" className="flex items-center gap-0.5">
                    {([
                      ['preview', 'Vista previa', Eye],
                      ['code', 'Código', Code2],
                      ['split', 'Dividido', Columns],
                      ['terminal', 'Terminal', Terminal],
                    ] as const).map(([id, label, Icon]) => (
                      <button
                        key={id}
                        role="tab"
                        aria-selected={workspaceCenterTab === id}
                        onClick={() => setWorkspaceCenterTab(id)}
                        className={`${id === 'split' ? 'hidden lg:inline-flex' : 'inline-flex'} items-center gap-1.5 h-8 px-2.5 rounded-lg text-[13px] transition-colors cursor-pointer ${
                          workspaceCenterTab === id ? 'bg-raised-2 text-fg' : 'text-muted hover:text-fg hover:bg-raised'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden relative">
                  
                  {/* Collapsible Left: File Explorer Drawer */}
                  {isFilesDrawerOpen && (
                    <>
                      <div style={{ width: `${sidebarWidth}px` }} className="shrink-0 flex flex-col h-full overflow-hidden bg-canvas border-r border-line z-10">
                        <div className="flex items-center justify-between h-10 px-3 border-b border-line">
                          <span className="text-[12px] font-medium text-muted">Archivos del proyecto</span>
                          <button
                            onClick={() => setIsFilesDrawerOpen(false)}
                            className="p-1 text-muted hover:text-fg-2 rounded-lg hover:bg-raised cursor-pointer"
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
                        className="w-px bg-line hover:bg-accent hover:w-1 cursor-col-resize transition-all shrink-0 z-20"
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
                          className="w-px bg-line hover:bg-accent hover:w-1 cursor-col-resize transition-all shrink-0 z-20"
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

                    {/* 4. Terminal Interactive Panel */}
                    {workspaceCenterTab === 'terminal' && (
                      <div className="flex-1 h-full overflow-hidden">
                        <TerminalPanel
                          files={files}
                          onSendMessage={(msg) => handleSendMessage(msg, 'builder')}
                        />
                      </div>
                    )}

                  </div>

                  {/* Splitter Handle 3: Workspace / Chat Panel */}
                  <div
                    onMouseDown={() => {
                      resizingTargetRef.current = 'chat';
                      document.body.style.cursor = 'col-resize';
                    }}
                    title="Arrastra para redimensionar panel de chat"
                    className="w-px bg-line hover:bg-accent hover:w-1 cursor-col-resize transition-all shrink-0 z-20"
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

      {/* GitHub Export & Sync Modal (Fase B) */}
      <GitHubExportModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        projectName={projectName}
        files={files}
      />

      {/* Supabase BaaS Auto-Provisioning Modal (Fase C) */}
      <SupabaseConnectModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        files={files}
        onUpdateFiles={(newFiles) => setFiles(newFiles)}
      />

    </div>
  );
}

export default App;
