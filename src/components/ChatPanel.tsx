import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  RefreshCw, 
  Mic, 
  MicOff, 
  Paperclip, 
  Zap, 
  Copy, 
  Check, 
  Edit3, 
  PlusCircle, 
  Code2, 
  Play, 
  Crosshair, 
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ChatMessage, FileItem } from '../types';
import type { FullStackProject } from '../core/types';
import { agentOrchestrator } from '../core/agent/AgentOrchestrator';
import { creditLedger } from '../core/credits/CreditLedger';

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
  const [isRecording, setIsRecording] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingText]);

  // Voice to text setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInputPrompt(prev => (prev ? prev + ' ' + currentTranscript : currentTranscript));
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Handle external pending prompts
  useEffect(() => {
    if (pendingPrompt && !isGenerating) {
      handleSendMessage(pendingPrompt);
      if (onClearPendingPrompt) onClearPendingPrompt();
    }
  }, [pendingPrompt, isGenerating]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('El reconocimiento de voz no está soportado en este navegador.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
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
              `${prev}\n\n--- Archivo Adjunto: ${file.name} ---\n${reader.result as string}`
            );
          }
        };
        reader.readAsText(file);
      }
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setAttachedImages(prev => [...prev, event.target!.result as string]);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

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

  const handleSendMessage = async (customPrompt?: string) => {
    let promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend && attachedImages.length === 0 && !inspectedElement) return;

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
    const newUserMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: promptToSend,
      images: currentImages.length > 0 ? currentImages : undefined,
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
          signal: abortController.signal,
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
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantPlaceholderId
            ? { 
                ...msg, 
                content: result.responseText, 
                intent: result.intent.type, 
                actionChips: result.actionChips 
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
                {/* User Image Attachment in chat bubble */}
                {isUser && msg.images && msg.images.length > 0 && (
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

                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* Interactive Action Chips (Lovable / Antigravity Style) */}
                {!isUser && msg.actionChips && msg.actionChips.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap gap-1.5 animate-fade-in">
                    {msg.actionChips.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => handleSendMessage(chip)}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 text-indigo-700 text-[11px] font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500" />
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

      {/* Inspected Element Floating Chip */}
      {inspectedElement && (
        <div className="p-2.5 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between text-indigo-900 text-xs shrink-0 animate-fade-in">
          <div className="flex items-center gap-2 overflow-hidden">
            <Crosshair className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-bold truncate">{inspectedElement}</span>
          </div>
          <button
            onClick={onClearInspectedElement}
            className="p-1 text-indigo-600 hover:bg-indigo-100 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attached Images Preview Bar */}
      {attachedImages.length > 0 && (
        <div className="p-2 bg-indigo-50/50 border-t border-indigo-100 flex items-center gap-2 overflow-x-auto shrink-0">
          {attachedImages.map((img, idx) => (
            <div key={idx} className="relative group shrink-0">
              <img
                src={img}
                alt="Vista previa"
                className="w-12 h-12 object-cover rounded-xl border border-indigo-200 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setAttachedImages(prev => prev.filter((_, i) => i !== idx))}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-90 hover:opacity-100 shadow-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Starter Chips */}
      {messages.length <= 1 && (
        <div className="px-3 pb-2 pt-1 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {quickStarters.map((qs, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qs.prompt)}
              className="text-[11px] font-bold px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl border border-slate-200 transition-all shrink-0 cursor-pointer shadow-2xs hover:scale-105"
            >
              {qs.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 border-t border-slate-200 bg-white shrink-0">
        <div className="relative border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-slate-50/50 transition-all">
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              isRecording
                ? '🎙️ Escuchando tu voz...'
                : inspectedElement
                ? '¿Qué deseas modificar en este elemento seleccionado?'
                : 'Escribe tu instrucción, pregunta técnica o arrastra capturas...'
            }
            rows={2}
            className="w-full p-3 pr-20 text-xs bg-transparent border-none resize-none focus:outline-none placeholder-slate-400 text-slate-800"
          />

          {/* Action Buttons Inside Input Box */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*,.txt,.md,.json,.html,.css,.js,.ts"
              multiple
              className="hidden"
            />

            <button
              type="button"
              onClick={toggleRecording}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/60'
              }`}
              title={isRecording ? 'Detener grabación de voz' : 'Dictar instrucción por voz'}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              title="Adjuntar imagen o archivo de código"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={isGenerating || (!inputPrompt.trim() && attachedImages.length === 0 && !inspectedElement)}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
              title="Enviar mensaje"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer Credit & Model Indicator */}
        <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Inteligencia Multi-Modal & Co-Creación Activa</span>
          </div>
          <span className="text-indigo-600 font-bold">⚡ 5 Créditos / Run</span>
        </div>
      </div>

    </div>
  );
};
