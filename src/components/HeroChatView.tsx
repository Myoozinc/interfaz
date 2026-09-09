import React, { useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Gamepad2, 
  BarChart3, 
  Music, 
  Rocket, 
  Columns, 
  Play, 
  Check, 
  RefreshCw, 
  PlusCircle, 
  Brain, 
  Globe,
  Video,
  FileText,
  ExternalLink,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { FloatingOmnibar } from './FloatingOmnibar';
import { MarkdownViewer } from './MarkdownViewer';
import type { ChatMessage, ChatAttachment } from '../types';

interface HeroChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, mode?: 'chat' | 'builder', model?: string, attachments?: ChatAttachment[]) => void;
  creditsBalance: number;
  onOpenWorkspace: () => void;
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
  isGenerating?: boolean;
  thinkingText?: string;
}

export const HeroChatView: React.FC<HeroChatViewProps> = ({
  messages,
  onSendMessage,
  creditsBalance: _creditsBalance,
  onOpenWorkspace,
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
  isGenerating = false,
  thinkingText = '',
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isConversing = messages.length > 1;

  useEffect(() => {
    if (isConversing) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, thinkingText, isConversing]);

  const quickActions = [
    {
      label: '🏎️ Carreras 3D Cyberpunk',
      icon: Gamepad2,
      prompt: 'Crea un juego de carreras 3D con Three.js, físicas de velocidad y derrape, velocímetro digital HUD, sonido de motor Web Audio y controles táctiles y de teclado',
    },
    {
      label: '🎹 Sintetizador Web DAW',
      icon: Music,
      prompt: 'Crea una estación de producción musical y secuenciador por pasos con osciloscopio en tiempo real y efectos de audio',
    },
    {
      label: '🚀 Simulador Espacial 3D',
      icon: Rocket,
      prompt: 'Crea un simulador de combate espacial 3D con campo de asteroides, disparos láser y efectos de partículas',
    },
    {
      label: '📊 Dashboard SaaS & MRR',
      icon: BarChart3,
      prompt: 'Construye un dashboard SaaS moderno con métricas interactivas en tiempo real, gráficos Chart.js y modo oscuro',
    },
  ];

  const handleChipClick = (chip: string) => {
    if (chip.includes('Construir y Ver en Preview') || chip.includes('Probar en Preview en Vivo')) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user' && !m.content.includes('Construir y Ver en Preview'))?.content || '';
      const promptToSend = lastUserMsg 
        ? `Construye la aplicación ahora: ${lastUserMsg}`
        : chip;
      onSendMessage(promptToSend, 'builder');
    } else if (chip.includes('Ver Preview Actual') || chip.includes('Ver Código en Editor')) {
      onOpenWorkspace();
    } else {
      onSendMessage(chip, 'chat');
    }
  };

  // State 1: Fresh clean Hero view (no conversation yet)
  if (!isConversing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/40 relative overflow-y-auto select-none font-sans">
        
        {/* Decorative ambient subtle glow */}
        <div className="absolute top-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl w-full z-10 space-y-6 text-center my-auto">
          
          {/* Centered Minimalist Header */}
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-700 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>NONA Software Factory • Meta-Agentes & Búsqueda Web</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              ¿Qué deseas construir hoy?
            </h1>

            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Adjunta audio, video, enlaces web de referencia o escribe tu idea. Un Meta-Agente asignará un especialista en tu dominio y coordinará la creación del software.
            </p>
          </div>

          {/* Centerpiece Floating Omnibar Prompt Box */}
          <FloatingOmnibar
            onSendMessage={(prompt, mode, model, atts) => onSendMessage(prompt, mode || 'chat', model, atts)}
            isGenerating={isGenerating}
            inspectedElement={inspectedElement}
            onClearInspectedElement={onClearInspectedElement}
            attachedImages={attachedImages}
            onAddImage={onAddImage}
            onRemoveImage={onRemoveImage}
            attachments={attachments}
            onAddAttachment={onAddAttachment}
            onRemoveAttachment={onRemoveAttachment}
            placeholder="Describe tu idea o pega una URL de referencia (soporta audio, video, imágenes)..."
          />

          {/* ⚡ Featured Templates Gallery Button */}
          {onOpenTemplatesModal && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onOpenTemplatesModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer hover:scale-102"
              >
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>⚡ Explorar Galería de Plantillas y Videojuegos 3D Funcionales</span>
              </button>
            </div>
          )}

          {/* Quick Action Suggestion Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendMessage(action.prompt, 'chat')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 text-[11px] font-medium text-slate-700 hover:text-slate-900 shadow-2xs transition-all cursor-pointer hover:border-slate-300 hover:scale-102"
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Workspace Access Pill */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenWorkspace}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-slate-400 hover:text-slate-700 text-xs transition-colors cursor-pointer"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Abrir editor de código y preview del proyecto actual</span>
            </button>
          </div>

        </div>

      </div>
    );
  }

  // State 2: Active Conversational Chat View
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 relative overflow-hidden font-sans select-none">
      
      {/* Top Conversational Header */}
      <div className="h-12 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>NONA Multi-Agent Architecture</span>
          </div>

          {/* Multi-Agent Collaboration Badge */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-semibold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-xl border border-slate-200/60">
            <span className="flex items-center gap-1 text-slate-700">
              <Brain className="w-3 h-3 text-indigo-500" /> Meta-Agente
            </span>
            <span>→</span>
            <span className="flex items-center gap-1 text-slate-700">
              <Globe className="w-3 h-3 text-cyan-600" /> Web Grounding
            </span>
            <span>→</span>
            <span className="flex items-center gap-1 text-slate-700">
              <Cpu className="w-3 h-3 text-amber-500" /> Especialista
            </span>
            <span>→</span>
            <span className="flex items-center gap-1 text-slate-700">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> QA Guard
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNewCleanProject && (
            <button
              onClick={onNewCleanProject}
              title="Iniciar nuevo tema de conversación o proyecto"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo Chat</span>
            </button>
          )}

          <button
            onClick={onOpenWorkspace}
            title="Ver la vista previa interactiva y el código en el Workspace"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer hover:scale-102"
          >
            <Columns className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ver Preview en Workspace →</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl mx-auto w-full">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              {/* Header Label with Domain & Collaborator badges */}
              <div className="flex items-center gap-2 mb-1.5 px-1 text-[11px] text-slate-400 font-medium flex-wrap">
                {!isUser && (
                  <div className="flex items-center gap-1 text-indigo-600 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>NONA AI Architect</span>
                  </div>
                )}
                {msg.activeAgentDomain && !isUser && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-bold text-[10px] border border-violet-100">
                    👑 {msg.activeAgentDomain}
                  </span>
                )}
                {msg.intent && !isUser && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-100">
                    {msg.intent === 'INTERACTIVE_PLAN' ? '🗺️ Plan & Estrategia' :
                     msg.intent === 'CHAT_CONSULT' ? '💬 Consulta Técnica' :
                     msg.intent === 'FULL_BUILD' ? '🚀 Aplicación Construida' :
                     '⚡ Edición Quirúrgica'}
                  </span>
                )}
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Body */}
              <div
                className={`w-full max-w-2xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed transition-all shadow-xs ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-xs self-end font-medium'
                    : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                }`}
              >
                {/* Universal Attachments in User Bubble */}
                {isUser && msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {msg.attachments.map((att) => (
                      <div key={att.id} className="rounded-xl overflow-hidden border border-white/20 bg-white/10 p-2 text-xs">
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
                          <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline text-[11px] text-indigo-200">
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
                        className="w-32 h-32 object-cover rounded-xl border border-white/20 shadow-xs"
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

                {/* Multi-Agent Collaboration Footnote */}
                {!isUser && msg.collaboratingAgents && msg.collaboratingAgents.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                    <span className="text-slate-500 font-semibold">Consejo Multi-IA:</span>
                    <span>{msg.collaboratingAgents.join(' • ')}</span>
                  </div>
                )}

                {/* Interactive Action Chips */}
                {!isUser && msg.actionChips && msg.actionChips.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                    {msg.actionChips.map((chip, cIdx) => {
                      const isBuildChip = chip.includes('Construir') || chip.includes('Probar en Preview en Vivo');
                      const isPreviewChip = chip.includes('Ver Preview');
                      return (
                        <button
                          key={cIdx}
                          onClick={() => handleChipClick(chip)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-103 active:scale-97 ${
                            isBuildChip
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                              : isPreviewChip
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-700'
                          }`}
                        >
                          {isBuildChip ? (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                          <span>{chip}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Build Success Card */}
                {!isUser && (msg.intent === 'FULL_BUILD' || msg.intent === 'SURGICAL_EDIT') && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Software generado y verificado en sandbox</span>
                    </span>
                    <button
                      onClick={onOpenWorkspace}
                      className="px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current text-emerald-600" />
                      <span>Abrir Preview en Pantalla Completa</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Multi-Agent Thinking & Collaboration Box */}
        {isGenerating && (
          <div className="max-w-2xl bg-gradient-to-r from-indigo-50/90 via-violet-50/80 to-slate-50/90 border border-indigo-200/80 rounded-2xl p-4 text-xs sm:text-sm text-indigo-950 flex items-start gap-3 shadow-xs animate-pulse">
            <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="font-bold text-indigo-900 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ejecutando Consejo Multi-Agente NONA (Pensando & Colaborando)</span>
              </div>
              <div className="text-xs text-indigo-800 font-medium leading-relaxed">
                {thinkingText || 'Analizando dominio técnico, consultando documentación web y coordinando especialistas...'}
              </div>
              <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1 text-indigo-700">● Meta-Agente</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-cyan-700">● Web Grounding</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-700">● Especialista</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700">● QA Verifier</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Floating Omnibar in Chat Mode */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-white via-white/95 to-transparent shrink-0">
        <div className="max-w-3xl mx-auto w-full space-y-2">
          <FloatingOmnibar
            onSendMessage={(prompt, mode, model, atts) => onSendMessage(prompt, mode || 'chat', model, atts)}
            isGenerating={isGenerating}
            inspectedElement={inspectedElement}
            onClearInspectedElement={onClearInspectedElement}
            attachedImages={attachedImages}
            onAddImage={onAddImage}
            onRemoveImage={onRemoveImage}
            attachments={attachments}
            onAddAttachment={onAddAttachment}
            onRemoveAttachment={onRemoveAttachment}
            placeholder="Responde, pide mejoras o adjunta audio, video o páginas web de referencia..."
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-2">
            <span>Inferencia Ultrarrápida Groq LPU + Google Gemini Flash</span>
            <span>Consejo Multi-IA & Conectividad Web Activos</span>
          </div>
        </div>
      </div>

    </div>
  );
};
