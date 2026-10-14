import React, { useRef, useEffect, useState } from 'react';
import { 
  Code2, 
  Gamepad2, 
  BarChart3, 
  Music, 
  Columns, 
  Play, 
  Check, 
  Copy,
  RefreshCw, 
  PlusCircle, 
  Globe,
  Video,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { FloatingOmnibar } from './FloatingOmnibar';
import { MarkdownViewer } from './MarkdownViewer';
import { NonaLogo } from './NonaLogo';
import type { ChatMessage, ChatAttachment, ProjectTemplate } from '../types';

interface HeroChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, mode?: 'chat' | 'builder', model?: string, attachments?: ChatAttachment[]) => void;
  creditsBalance: number;
  onOpenWorkspace: () => void;
  onSwitchView?: (view: 'preview' | 'editor') => void;
  onNewCleanProject?: () => void;
  attachedImages?: string[];
  onAddImage?: (base64: string) => void;
  onRemoveImage?: (index: number) => void;
  attachments?: ChatAttachment[];
  onAddAttachment?: (att: ChatAttachment) => void;
  onRemoveAttachment?: (id: string) => void;
  inspectedElement?: string | null;
  onClearInspectedElement?: () => void;
  onOpenTemplatesModal?: () => void;
  featuredTemplates?: ProjectTemplate[];
  onSelectTemplate?: (t: ProjectTemplate) => void;
  isGenerating?: boolean;
  thinkingText?: string;
}

export const HeroChatView: React.FC<HeroChatViewProps> = ({
  messages,
  onSendMessage,
  creditsBalance: _creditsBalance,
  onOpenWorkspace,
  onSwitchView,
  onNewCleanProject,
  attachedImages = [],
  onAddImage,
  onRemoveImage,
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
  inspectedElement,
  onClearInspectedElement,
  onOpenTemplatesModal,
  featuredTemplates = [],
  onSelectTemplate,
  isGenerating = false,
  thinkingText = '',
}) => {
  const [omnibarInitialText, setOmnibarInitialText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isConversing = messages.length > 1;

  useEffect(() => {
    if (isConversing) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, thinkingText, isConversing]);

  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);

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

  const quickActions = [
    { label: 'Panel de ventas', icon: BarChart3, prompt: 'Crea un panel de ventas profesional para una tienda online: KPIs del mes, gráfico de ingresos por día, tabla de pedidos recientes con filtros y estado, y vista de productos más vendidos' },
    { label: 'Landing de una cafetería', icon: Globe, prompt: 'Crea una landing page elegante para una cafetería de especialidad: portada con foto, menú con precios, horarios, ubicación, reseñas y formulario de reservas' },
    { label: 'Gestor de tareas en equipo', icon: Code2, prompt: 'Crea un gestor de tareas para equipos estilo tablero kanban: columnas arrastrables, responsables, fechas límite, etiquetas, búsqueda y guardado local' },
    { label: 'Juego de carreras 3D', icon: Gamepad2, prompt: 'Crea un juego de carreras 3D con Three.js: circuito, rivales con IA, velocímetro, turbo, sonido y controles de teclado y táctiles' },
  ];

  const handleChipClick = (chip: string) => {
    if (chip.includes('Construir y Ver en Preview') || chip.includes('Construir Aplicación') || chip.includes('Construir')) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user' && !m.content.includes('Construir'))?.content || '';
      const promptToSend = lastUserMsg 
        ? `Construye la aplicación ahora: ${lastUserMsg}`
        : 'Construye la aplicación ahora';
      onSendMessage(promptToSend, 'builder');
    } else if (chip.includes('Preview') || chip.includes('Probar')) {
      onOpenWorkspace();
      onSwitchView?.('preview');
    } else if (chip.includes('Editor') || chip.includes('Código') || chip.includes('Codigo')) {
      onOpenWorkspace();
      onSwitchView?.('editor');
    } else if (chip.includes('Refinar')) {
      setOmnibarInitialText('Refinar: ');
    } else {
      onSendMessage(chip, 'chat');
    }
  };

  // Estado 1: portada (todavía no hay conversación)
  if (!isConversing) {
    return (
      <div className="flex-1 overflow-y-auto bg-canvas select-none">
        <div className="min-h-full flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <div className="w-full max-w-[720px]">
            <h1 className="font-display text-[40px] sm:text-[56px] leading-[1.02] font-bold tracking-[-0.03em] text-fg text-center">
              ¿Qué quieres crear?
            </h1>
            <p className="mt-4 text-[15px] sm:text-base text-fg-2 text-center max-w-[52ch] mx-auto leading-relaxed">
              Describe tu app o tu juego. NONA escribe el código, te lo muestra funcionando y puedes seguir cambiándolo con el chat.
            </p>

            <div className="mt-8">
              <FloatingOmnibar
                initialText={omnibarInitialText}
                onSendMessage={(prompt, mode, model, atts) => {
                  setOmnibarInitialText('');
                  onSendMessage(prompt, mode || 'builder', model, atts);
                }}
                isGenerating={isGenerating}
                inspectedElement={inspectedElement}
                onClearInspectedElement={onClearInspectedElement}
                attachedImages={attachedImages}
                onAddImage={onAddImage}
                onRemoveImage={onRemoveImage}
                attachments={attachments}
                onAddAttachment={onAddAttachment}
                onRemoveAttachment={onRemoveAttachment}
                placeholder="Ej.: una app para reservar turnos en mi barbería, con calendario y recordatorios"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => setOmnibarInitialText(action.prompt)}
                    title={action.prompt}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line text-[13px] text-fg-2 hover:text-fg hover:border-line-strong hover:bg-panel transition-colors cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5 text-muted" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          {featuredTemplates.length > 0 && (
            <div className="w-full max-w-[960px] mt-16">
              <div className="flex items-baseline justify-between mb-3 px-1">
                <h2 className="text-[13px] font-medium text-fg-2">O empieza desde una plantilla</h2>
                {onOpenTemplatesModal && (
                  <button onClick={onOpenTemplatesModal} className="text-[13px] text-accent hover:text-fg transition-colors cursor-pointer">
                    Ver todas
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {featuredTemplates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onSelectTemplate?.(t)}
                    className="group text-left rounded-xl overflow-hidden border border-line bg-panel hover:border-line-strong transition-colors cursor-pointer"
                  >
                    <div className="aspect-[16/10] bg-raised overflow-hidden">
                      {t.thumbnail && (
                        <img src={t.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition duration-300" />
                      )}
                    </div>
                    <div className="px-3 py-2.5">
                      <div className="text-[13px] font-medium text-fg truncate">{t.name}</div>
                      <div className="text-[12px] text-muted">{t.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // State 2: Active Conversational Chat View
  return (
    <div className="flex-1 flex flex-col h-full bg-canvas relative overflow-hidden font-sans select-none">
      
      {/* Barra superior de la conversación */}
      <div className="h-11 px-3 border-b border-line flex items-center justify-end gap-1 shrink-0 z-10">
        {messages.length > 0 && (
          <button
            onClick={handleCopyAllChat}
            title="Copiar toda la conversación"
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[13px] transition-colors cursor-pointer ${isCopiedAll ? 'text-emerald-300' : 'text-muted hover:text-fg hover:bg-raised'}`}
          >
            {isCopiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {isCopiedAll ? 'Copiado' : 'Copiar chat'}
          </button>
        )}
        {onNewCleanProject && (
          <button
            onClick={onNewCleanProject}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[13px] text-muted hover:text-fg hover:bg-raised transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Nuevo proyecto
          </button>
        )}
        <button
          onClick={onOpenWorkspace}
          className="inline-flex items-center gap-1.5 h-8 px-3 ml-1 rounded-lg text-[13px] bg-raised hover:bg-raised-2 text-fg transition-colors cursor-pointer"
        >
          <Columns className="w-4 h-4" />
          Ver la app
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto"><div className="px-4 sm:px-6 py-8 space-y-7 max-w-3xl mx-auto w-full">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              {!isUser && (
                <div className="flex items-center gap-2 mb-2 text-[12px]">
                  <NonaLogo size={16} />
                  <span className="font-medium text-fg-2">NONA</span>
                  {msg.intent && (
                    <span className="text-muted">
                      {msg.intent === 'INTERACTIVE_PLAN' ? 'Propuesta' :
                       msg.intent === 'CHAT_CONSULT' ? 'Respuesta' :
                       msg.intent === 'FULL_BUILD' ? 'App creada' :
                       'Cambios aplicados'}
                    </span>
                  )}
                  <span className="text-faint">{msg.timestamp}</span>
                </div>
              )}

              {/* Message Body */}
              <div
                className={`text-[15px] leading-relaxed ${
                  isUser
                    ? 'max-w-[85%] rounded-2xl px-4 py-3 bg-raised-2 text-fg self-end'
                    : 'w-full text-fg'
                }`}
              >
                {/* Universal Attachments in User Bubble */}
                {isUser && msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {msg.attachments.map((att) => (
                      <div key={att.id} className="rounded-xl overflow-hidden border border-line/20 bg-panel/10 p-2 text-xs">
                        {att.type === 'image' && (
                          <img src={att.url} alt={att.name} className="w-32 h-32 object-cover rounded-lg" />
                        )}
                        {att.type === 'audio' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold">
                              <Music className="w-3.5 h-3.5 text-emerald-300" />
                              <span className="truncate max-w-[180px]">{att.name}</span>
                            </div>
                            <audio controls src={att.url} className="h-7 w-56 rounded" />
                          </div>
                        )}
                        {att.type === 'video' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold">
                              <Video className="w-3.5 h-3.5 text-rose-300" />
                              <span className="truncate max-w-[180px]">{att.name}</span>
                            </div>
                            <video controls src={att.url} className="max-w-xs max-h-36 rounded-lg" />
                          </div>
                        )}
                        {att.type === 'url' && (
                          <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline text-[11px] text-fg">
                            <Globe className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                            <span className="truncate max-w-[200px] font-bold">{att.title || att.name}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                          </a>
                        )}
                        {att.type === 'document' && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <FileText className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                            <span className="truncate max-w-[180px] font-semibold">{att.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Legacy Attached Images */}
                {isUser && (!msg.attachments || msg.attachments.length === 0) && msg.images && msg.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {msg.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Adjunto"
                        className="w-32 h-32 object-cover rounded-xl border border-line/20 shadow-xs"
                      />
                    ))}
                  </div>
                )}

                {/* Content Rendering (Clean, no raw code dumps) */}
                {isUser ? (
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                ) : (
                  <MarkdownViewer content={msg.content} />
                )}

                {/* Interactive Action Chips */}
                {!isUser && msg.actionChips && msg.actionChips.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-line flex flex-wrap gap-2">
                    {msg.actionChips.map((chip, cIdx) => {
                      const isBuildChip = chip.includes('Construir');
                      const isPreviewChip = chip.includes('Preview') || chip.includes('Probar');
                      const isEditorChip = chip.includes('Editor') || chip.includes('Código') || chip.includes('Codigo');
                      return (
                        <button
                          key={cIdx}
                          onClick={() => handleChipClick(chip)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-103 active:scale-97 ${
                            isBuildChip
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                              : isPreviewChip
                              ? 'bg-accent hover:bg-accent-strong text-white'
                              : isEditorChip
                              ? 'bg-raised-2 hover:bg-raised text-white'
                              : 'bg-raised hover:bg-accent/10 border border-line text-fg-2 hover:text-accent'
                          }`}
                        >
                          {isBuildChip || isPreviewChip ? (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Code2 className="w-3.5 h-3.5" />
                          )}
                          <span>{chip}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Build Success Card */}
                {!isUser && (msg.intent === 'FULL_BUILD' || msg.intent === 'SURGICAL_EDIT') && (
                  <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs">
                    <span className="text-emerald-300 flex items-center gap-1.5 text-[13px]">
                      <Check className="w-4 h-4" />
                      <span>Probada y funcionando</span>
                    </span>
                    <button
                      onClick={onOpenWorkspace}
                      className="h-8 px-3 rounded-lg bg-raised-2 hover:bg-line-strong text-fg text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Ver la app</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Message Action Toolbar */}
              <div className={`mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${
                isUser ? 'self-end' : 'self-start -ml-2'
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
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex items-start gap-3 text-[14px] text-fg-2">
            <RefreshCw className="w-4 h-4 mt-1 text-accent animate-spin shrink-0" />
            <div className="whitespace-pre-line leading-relaxed">{thinkingText || 'NONA está trabajando…'}</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div></div>

      {/* Sticky Bottom Floating Omnibar in Chat Mode */}
      <div className="px-4 sm:px-6 pb-5 pt-2 shrink-0">
        <div className="max-w-3xl mx-auto w-full space-y-2">
          <FloatingOmnibar
            initialText={omnibarInitialText}
            onSendMessage={(prompt, mode, model, atts) => {
              setOmnibarInitialText('');
              onSendMessage(prompt, mode || 'chat', model, atts);
            }}
            isGenerating={isGenerating}
            inspectedElement={inspectedElement}
            onClearInspectedElement={onClearInspectedElement}
            attachedImages={attachedImages}
            onAddImage={onAddImage}
            onRemoveImage={onRemoveImage}
            attachments={attachments}
            onAddAttachment={onAddAttachment}
            onRemoveAttachment={onRemoveAttachment}
            placeholder="Responde o pide un cambio…"
          />

        </div>
      </div>

    </div>
  );
};
