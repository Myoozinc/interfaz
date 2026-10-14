import React, { useState, useRef, useEffect } from 'react';
import { 
  RefreshCw, 
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
import { NonaLogo } from './NonaLogo';

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
  const [isCopiedAll, setIsCopiedAll] = useState(false);

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

  const handleCopyAllChat = () => {
    if (messages.length === 0) return;
    const formatted = messages.map(msg => {
      const roleLabel = msg.role === 'user' ? '👤 Usuario' : '🤖 NONA AI Engine';
      const time = msg.timestamp ? ` (${msg.timestamp})` : '';
      const domain = msg.activeAgentDomain ? ` [${msg.activeAgentDomain}]` : '';
      return `### ${roleLabel}${domain}${time}:\n${msg.content}\n`;
    }).join('\n---\n\n');

    const fullExport = `# Historial de Conversación — NONA AI Factory\nFecha: ${new Date().toLocaleString()}\nTotal de mensajes: ${messages.length}\n\n---\n\n${formatted}`;
    navigator.clipboard.writeText(fullExport);
    setIsCopiedAll(true);
    setTimeout(() => setIsCopiedAll(false), 2000);
  };

  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  const handleSendMessage = async (
    customPrompt?: string, 
    modeOverride?: 'chat' | 'builder',
    customAttachments?: ChatAttachment[],
    modelOverride?: string
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
          model: modelOverride,
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


  return (
    <div 
      className={`flex flex-col h-full bg-canvas border-l border-line select-none font-sans relative transition-colors ${
        isDraggingOver ? 'bg-accent/10 ring-2 ring-accent/40 ring-inset' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      
      {/* Top Header */}
      <div className="h-11 px-3 border-b border-line flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-medium text-fg">Chat</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {messages.length > 0 && (
            <button
              onClick={handleCopyAllChat}
              title="Copiar toda la conversación al portapapeles"
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 text-[12px] rounded-lg transition-colors cursor-pointer ${
                isCopiedAll ? 'text-emerald-300' : 'text-muted hover:text-fg hover:bg-raised'
              }`}
            >
              {isCopiedAll ? (
                <>
                  <Check className="w-3 h-3 text-emerald-300" />
                  <span className="hidden sm:inline">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-muted" />
                  <span className="hidden sm:inline">Copiar chat</span>
                </>
              )}
            </button>
          )}

          {onNewProject && (
            <button
              onClick={onNewProject}
              title="Nuevo proyecto limpio"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-[12px] text-muted hover:text-fg hover:bg-raised rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nuevo proyecto</span>
            </button>
          )}
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
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-fg-2">
                    <NonaLogo size={14} />
                    <span>NONA</span>
                  </div>
                )}
                {msg.intent && !isUser && (
                  <span className="text-[11px] text-muted">
                    {msg.intent === 'CHAT_CONSULT' ? 'Respuesta' :
                     msg.intent === 'INTERACTIVE_PLAN' ? 'Propuesta' :
                     msg.intent === 'FULL_BUILD' ? 'App creada' :
                     'Cambios aplicados'}
                  </span>
                )}
                <span className="text-[11px] text-faint">{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[92%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
                  isUser
                    ? 'bg-raised-2 text-fg'
                    : 'text-fg'
                }`}
              >
                {/* User Universal Attachments in chat bubble */}
                {isUser && msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.attachments.map((att) => (
                      <div key={att.id} className="rounded-xl overflow-hidden border border-line/20 bg-panel/10 p-1.5 text-xs">
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
                          <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline text-[10px] text-fg">
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
                        className="w-28 h-28 object-cover rounded-xl border border-line/20 shadow-xs"
                      />
                    ))}
                  </div>
                )}

                {isUser ? (
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                ) : msg.content ? (
                  <MarkdownViewer content={msg.content} />
                ) : (
                  <div className="flex items-center gap-2 text-muted italic py-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent shrink-0" />
                    <span>Sintetizando código y verificando componentes...</span>
                  </div>
                )}

                {!isUser && msg.collaboratingAgents && msg.collaboratingAgents.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-line/60 flex items-center gap-1 text-[10px] text-muted font-medium">
                    <span className="text-muted font-semibold">Consejo Multi-IA:</span>
                    <span className="truncate">{msg.collaboratingAgents.join(' • ')}</span>
                  </div>
                )}

                {/* Interactive Action Chips (Lovable / Antigravity Style) */}
                {/* Interactive Action Chips (filtered for no duplicates) */}
                {!isUser && msg.actionChips && (
                  (() => {
                    const chipsToShow = msg.actionChips.filter(c => 
                      !c.toLowerCase().includes('preview') && 
                      !c.toLowerCase().includes('probar') && 
                      !c.toLowerCase().includes('código') &&
                      !c.toLowerCase().includes('editor')
                    );
                    if (chipsToShow.length === 0) return null;
                    return (
                      <div className="mt-2.5 pt-2 border-t border-line/60 flex flex-wrap gap-1.5 animate-fade-in">
                        {chipsToShow.map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => {
                              if (chip.includes('Construir y Ver en Preview') || chip.includes('Construir Aplicación') || chip.includes('Construir')) {
                                const lastUserMsg = [...messages].reverse().find(m => m.role === 'user' && !m.content.includes('Construir'))?.content || '';
                                const promptToSend = lastUserMsg 
                                  ? `Construye la aplicación ahora: ${lastUserMsg}`
                                  : 'Construye la aplicación ahora';
                                handleSendMessage(promptToSend, 'builder');
                              } else if (chip.includes('Refinar')) {
                                setInputPrompt('Refinar: ');
                              } else {
                                handleSendMessage(chip, 'chat');
                              }
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer shadow-2xs ${
                              chip.includes('Construir')
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-accent/10 hover:bg-accent/15 border border-accent/70 text-accent'
                            }`}
                          >
                            {chip.includes('Construir') ? (
                              <Play className="w-3 h-3 fill-current" />
                            ) : (
                              <Code2 className="w-3 h-3" />
                            )}
                            <span>{chip}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()
                )}

                {/* Software Verification Status & Direct View Switcher */}
                {!isUser && msg.content && (msg.intent === 'FULL_BUILD' || msg.intent === 'SURGICAL_EDIT') && (
                  <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-300 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-300" /> Software verificado
                    </span>
                    <div className="flex items-center gap-1">
                      {onSwitchView && (
                        <button
                          onClick={() => onSwitchView('preview')}
                          className="px-2 py-0.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/15 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Play className="w-2.5 h-2.5" /> Preview
                        </button>
                      )}
                      {onSwitchView && (
                        <button
                          onClick={() => onSwitchView('editor')}
                          className="px-2 py-0.5 rounded-lg bg-raised text-fg-2 hover:bg-raised-2 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Code2 className="w-2.5 h-2.5" /> Código
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Action Toolbar */}
              {Boolean(msg.content) && (
                <div className={`mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${
                  isUser ? 'justify-end mr-1' : 'justify-start ml-1'
                }`}>
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    title={isUser ? "Copiar tu pregunta o prompt" : "Copiar respuesta de NONA"}
                    className={`inline-flex items-center gap-1 h-7 px-2 rounded-md text-[12px] transition-colors cursor-pointer ${
                      copiedMsgId === msg.id ? 'text-emerald-300' : 'text-muted hover:text-fg hover:bg-raised'
                    }`}
                  >
                    {copiedMsgId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-300" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-muted" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  {isUser && (
                    <button
                      onClick={() => setInputPrompt(msg.content)}
                      title="Editar prompt y volver a enviar"
                      className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[12px] text-muted hover:text-fg hover:bg-raised transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-muted" />
                      <span>Editar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl border border-line bg-panel text-[13px] text-fg-2">
            <RefreshCw className="w-4 h-4 mt-0.5 text-accent animate-spin shrink-0" />
            <span className="whitespace-pre-line">{thinkingText || 'NONA está trabajando…'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Modern Floating Omnibar Input */}
      <div className="p-3 shrink-0">
        <FloatingOmnibar
          initialText={inputPrompt}
          onSendMessage={(text, mode, model, atts) => {
            setInputPrompt('');
            handleSendMessage(text, mode, atts, model);
          }}
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
              ? '¿Qué quieres cambiar en este elemento?'
              : 'Pide un cambio: «agrega una página de contacto», «cambia los colores»…'
          }
        />
        
      </div>

    </div>
  );
};
