import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Zap, 
  Copy, 
  Check, 
  Edit3, 
  PlusCircle, 
  Code2, 
  Play,
  Music,
  Video,
  FileText,
  Globe,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ChatMessage, FileItem, ChatAttachment } from '../types';
import type { FullStackProject } from '../core/types';
import { agentOrchestrator } from '../core/agent/AgentOrchestrator';
import { creditLedger } from '../core/credits/CreditLedger';
import { FloatingOmnibar } from './FloatingOmnibar';
import { MarkdownViewer } from './MarkdownViewer';

interface ChatPanelProps {
  files: FileItem[];
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onUpdateFiles: (newFiles: FileItem[]) => void;
  onDeductCredit: (amount: number) => boolean;
  onGenerationStart?: () => void;
  pendingPrompt?: string | null;
  onClearPendingPrompt?: () => void;
  onNewProject?: () => void;
  onSwitchView?: (view: 'preview' | 'editor' | 'split') => void;
  inspectedElement?: string | null;
  onClearInspectedElement?: () => void;
}

export const ChatPanel = ({
  files,
  messages,
  setMessages,
  onUpdateFiles,
  onDeductCredit,
  onGenerationStart,
  pendingPrompt,
  onClearPendingPrompt,
  onNewProject,
  onSwitchView,
  inspectedElement,
  onClearInspectedElement,
}: ChatPanelProps) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [thinkingText, setThinkingText] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingText]);

  // Handle external pending prompts
  useEffect(() => {
    if (pendingPrompt && !isGenerating) {
      handleSendMessage(pendingPrompt);
      if (onClearPendingPrompt) onClearPendingPrompt();
    }
  }, [pendingPrompt, isGenerating]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              setAttachedImages(prev => [...prev, reader.result as string]);
            }
          };
          reader.readAsDataURL(file);
        } else {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              setInputPrompt(prev => 
                `${prev}\n\n--- Archivo Arrastrado: ${file.name} ---\n${reader.result as string}`
              );
            }
          };
          reader.readAsText(file);
        }
      });
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  const handleSendMessage = async (
    customPrompt?: string, 
    modeOverride?: 'chat' | 'builder',
    customAttachments?: ChatAttachment[]
  ) => {
    let promptToSend = (customPrompt || inputPrompt).trim();
    const activeAtts = customAttachments || attachments;
    if (!promptToSend && attachedImages.length === 0 && activeAtts.length === 0 && !inspectedElement) return;

    if (inspectedElement) {
      promptToSend = `[Elemento Seleccionado en Vista Previa: ${inspectedElement}]\n${promptToSend}`;
      if (onClearInspectedElement) onClearInspectedElement();
    }

    if (!onDeductCredit(5)) {
      alert('⚠️ No tienes suficientes créditos para esta generación (requiere 5 créditos).');
      return;
    }

    if (onGenerationStart) onGenerationStart();

    const userMessageId = Date.now().toString();
    const currentImages = [...attachedImages];
    const currentAtts = [...activeAtts];
    const newUserMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: promptToSend,
      images: currentImages.length > 0 ? currentImages : undefined,
      attachments: currentAtts.length > 0 ? currentAtts : undefined,
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
    setInputPrompt('');
    setAttachedImages([]);
    setAttachments([]);
    setIsGenerating(true);
    setThinkingText('⚡ Analizando intención y contexto con NONA Engine...');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const projectPayload: FullStackProject = {
        id: 'workspace_proj',
        name: 'Workspace Project',
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
          images: currentImages.length > 0 ? currentImages : undefined,
          attachments: currentAtts.length > 0 ? currentAtts : undefined,
          signal: abortController.signal,
          history: [...messages, newUserMsg],
          mode: modeOverride,
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
        onUpdateFiles(updatedFileList);
        if (onSwitchView) onSwitchView('preview');
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

      if (result.intent.type === 'FULL_BUILD' || result.intent.type === 'SURGICAL_EDIT') {
        confetti({
          particleCount: 50,
          spread: 80,
          origin: { y: 0.7 },
          colors: ['#6366F1', '#7C3AED', '#A855F7', '#10B981']
        });
      }

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

  const quickStarters = [
    { label: '🛍️ Tienda E-Commerce con Carrito y Pasarela', prompt: 'Crea una tienda de productos tecnológicos estilo Apple con carrito interactivo, cálculo de envíos, búsqueda y checkout modal.' },
    { label: '📱 App Móvil de Fitness con Marco iOS', prompt: 'Desarrolla una aplicación móvil de fitness con contador de calorías, gráficos semanales, cronómetro de entrenamiento y diseño en modo oscuro.' },
    { label: '👾 Mascota Virtual Tamagotchi Pro', prompt: 'Construye un Tamagotchi interactivo en 3D/2D con barras de hambre, felicidad, minijuegos y efectos de sonido.' },
  ];

  return (
    <div 
      className={`flex flex-col h-full bg-white border-l border-slate-200 select-none font-sans relative transition-colors ${
        isDraggingOver ? 'bg-indigo-50/50 ring-2 ring-indigo-400 ring-inset' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      
      {/* Top Header */}
      <div className="h-11 px-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-800 tracking-tight">NONA Agent Core</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onNewProject && (
            <button
              onClick={onNewProject}
              title="Nuevo proyecto limpio"
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <PlusCircle className="w-3 h-3 text-indigo-600" />
              <span>Nuevo</span>
            </button>
          )}

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>NONA Multi-Agent Factory</span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col group ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Role Header */}
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {!isUser && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600">
                    <Sparkles className="w-3 h-3" />
                    <span>NONA AI Engine</span>
                  </div>
                )}
                {msg.activeAgentDomain && !isUser && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                    👑 {msg.activeAgentDomain}
                  </span>
                )}
                {msg.intent && !isUser && (
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
                    {msg.intent === 'CHAT_CONSULT' ? '💬 Consulta Técnica' :
                     msg.intent === 'INTERACTIVE_PLAN' ? '🗺️ Propuesta & Opciones' :
                     msg.intent === 'FULL_BUILD' ? '🚀 Software Construido' :
                     '⚡ Edición Quirúrgica'}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-medium">{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[92%] p-3.5 rounded-2xl text-xs leading-relaxed transition-all shadow-xs ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-xs'
                }`}
              >
                {/* User Universal Attachments in chat bubble */}
                {isUser && msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.attachments.map((att) => (
                      <div key={att.id} className="rounded-xl overflow-hidden border border-white/20 bg-white/10 p-1.5 text-xs">
                        {att.type === 'image' && (
                          <img src={att.url} alt={att.name} className="w-24 h-24 object-cover rounded-lg" />
                        )}
                        {att.type === 'audio' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold">
                              <Music className="w-3 h-3 text-emerald-300" />
                              <span className="truncate max-w-[140px]">{att.name}</span>
                            </div>
                            <audio controls src={att.url} className="h-6 w-44 rounded" />
                          </div>
                        )}
                        {att.type === 'video' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold">
                              <Video className="w-3 h-3 text-rose-300" />
                              <span className="truncate max-w-[140px]">{att.name}</span>
                            </div>
                            <video controls src={att.url} className="max-w-xs max-h-24 rounded-lg" />
                          </div>
                        )}
                        {att.type === 'url' && (
                          <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline text-[10px] text-indigo-200">
                            <Globe className="w-3 h-3 text-cyan-300 shrink-0" />
                            <span className="truncate max-w-[150px] font-bold">{att.title || att.name}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                          </a>
                        )}
                        {att.type === 'document' && (
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <FileText className="w-3 h-3 text-amber-300 shrink-0" />
                            <span className="truncate max-w-[140px] font-semibold">{att.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* User Image Attachment in chat bubble */}
                {isUser && (!msg.attachments || msg.attachments.length === 0) && msg.images && msg.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Adjunto"
                        className="w-28 h-28 object-cover rounded-xl border border-white/20 shadow-xs"
                      />
                    ))}
                  </div>
                )}

                {isUser ? (
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                ) : (
                  <MarkdownViewer content={msg.content} />
                )}

                {!isUser && msg.collaboratingAgents && msg.collaboratingAgents.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <span className="text-slate-500 font-semibold">Consejo Multi-IA:</span>
                    <span className="truncate">{msg.collaboratingAgents.join(' • ')}</span>
                  </div>
                )}

                {/* Interactive Action Chips (Lovable / Antigravity Style) */}
                {!isUser && msg.actionChips && msg.actionChips.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap gap-1.5 animate-fade-in">
                    {msg.actionChips.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => {
                          if (chip.includes('Construir y Ver en Preview')) {
                            const lastUserMsg = [...messages].reverse().find(m => m.role === 'user' && !m.content.includes('Construir y Ver en Preview'))?.content || '';
                            const promptToSend = lastUserMsg 
                              ? `Construye la aplicación ahora: ${lastUserMsg}`
                              : chip;
                            handleSendMessage(promptToSend, 'builder');
                          } else if (chip.includes('Ver Preview Actual')) {
                            if (onSwitchView) onSwitchView('preview');
                          } else {
                            handleSendMessage(chip, 'chat');
                          }
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer shadow-2xs ${
                          chip.includes('Construir y Ver en Preview')
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : chip.includes('Ver Preview Actual')
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 text-indigo-700'
                        }`}
                      >
                        {chip.includes('Construir y Ver en Preview') ? (
                          <Play className="w-3 h-3 fill-current" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Software Verification Badge & View Switches */}
                {!isUser && msg.content && (msg.intent === 'FULL_BUILD' || msg.intent === 'SURGICAL_EDIT') && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Software generado y verificado
                    </span>
                    <div className="flex items-center gap-1">
                      {onSwitchView && (
                        <button
                          onClick={() => onSwitchView('preview')}
                          className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Play className="w-2.5 h-2.5" /> Preview
                        </button>
                      )}
                      {onSwitchView && (
                        <button
                          onClick={() => onSwitchView('editor')}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Code2 className="w-2.5 h-2.5" /> Código
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Action Toolbar */}
              <div className={`mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                isUser ? 'mr-1' : 'ml-1'
              }`}>
                <button
                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                  title="Copiar mensaje"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {copiedMsgId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>

                {isUser && (
                  <button
                    onClick={() => setInputPrompt(msg.content)}
                    title="Editar y reenviar"
                    className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex items-center gap-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-900 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            <span className="font-semibold">{thinkingText || 'Procesando instrucción con NONA Engine...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Starter Chips */}
      {messages.length <= 1 && (
        <div className="px-3 pb-2 pt-1 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {quickStarters.map((qs, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qs.prompt)}
              className="text-[11px] font-medium px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl border border-slate-200 transition-all shrink-0 cursor-pointer shadow-2xs hover:scale-102"
            >
              {qs.label}
            </button>
          ))}
        </div>
      )}

      {/* Modern Floating Omnibar Input */}
      <div className="p-3 border-t border-slate-200/80 bg-white shrink-0">
        <FloatingOmnibar
          onSendMessage={(text, mode, _model, atts) => handleSendMessage(text, mode, atts)}
          isGenerating={isGenerating}
          inspectedElement={inspectedElement}
          onClearInspectedElement={onClearInspectedElement}
          attachedImages={attachedImages}
          onAddImage={(img) => setAttachedImages(prev => [...prev, img])}
          onRemoveImage={(idx) => setAttachedImages(prev => prev.filter((_, i) => i !== idx))}
          attachments={attachments}
          onAddAttachment={(att) => setAttachments(prev => [...prev, att])}
          onRemoveAttachment={(id) => setAttachments(prev => prev.filter(a => a.id !== id))}
          placeholder={
            inspectedElement
              ? '¿Qué deseas modificar en este elemento seleccionado?'
              : 'Escribe tu instrucción, pega URLs o adjunta archivos...'
          }
        />
        
        {/* Footer Credit Indicator */}
        <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Inferencia Ultrarrápida Groq LPU</span>
          </div>
          <span className="text-indigo-600 font-bold">⚡ 5 Créditos / Run</span>
        </div>
      </div>

    </div>
  );
};
