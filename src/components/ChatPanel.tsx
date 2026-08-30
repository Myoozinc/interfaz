import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  RefreshCw, 
  Image as ImageIcon, 
  Mic, 
  MicOff, 
  Paperclip, 
  Zap, 
  Monitor,
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

export const ChatPanel: React.FC<ChatPanelProps> = ({
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
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [thinkingText, setThinkingText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating, thinkingText]);

  useEffect(() => {
    if (pendingPrompt && pendingPrompt.trim()) {
      handleSendMessage(pendingPrompt);
      if (onClearPendingPrompt) onClearPendingPrompt();
    }
  }, [pendingPrompt]);

  // Speech to Text Dictation
  const toggleSpeechRecognition = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz nativo. Prueba con Google Chrome.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputPrompt(prev => (prev ? prev + ' ' : '') + transcript);
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  // Screen Capture for Multimodal Vision Inspection
  const handleCaptureScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64Image = canvas.toDataURL('image/png');
      setAttachedImages(prev => [...prev, base64Image]);

      // Stop stream tracks
      stream.getTracks().forEach(track => track.stop());
    } catch (e) {
      console.warn('Screen capture cancelled or not allowed');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach(file => {
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
    setThinkingText('⚡ Inicializando NONA Software Factory Engine...');

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

      const { responseText, updatedProject } = await agentOrchestrator.run(
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

      const updatedFileList: FileItem[] = Object.entries(updatedProject.files).map(([name, file], idx) => ({
        id: (idx + 1).toString(),
        name,
        language: file.language as any,
        content: file.content,
        isModified: true,
      }));

      onUpdateFiles(updatedFileList);

      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantPlaceholderId
            ? { ...msg, content: responseText }
            : msg
        )
      );

      creditLedger.deductCredits(5, `Generación de Software NONA: "${promptToSend.slice(0, 30)}..."`);

      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#6366F1', '#7C3AED', '#A855F7', '#10B981']
      });

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        creditLedger.refundCredits(5, 'Reembolso por fallo en generación');
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantPlaceholderId
              ? { ...msg, content: `⚠️ Error en la generación: ${err.message}` }
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

  const quickPrompts = [
    '🛍️ Tienda E-Commerce con Carrito y Pasarela',
    '📱 App Móvil de Fitness con Marco iOS',
    '🐾 Mascota Virtual Interactiva con Sonidos',
    '🏎️ Juego 3D de Carreras con Three.js',
  ];

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden text-xs select-none font-sans transition-all ${
        isDraggingOver ? 'ring-4 ring-indigo-500/20 bg-indigo-50/20' : ''
      }`}
    >
      
      {/* Top Header */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900">NONA Agent Core</span>
        </div>

        <div className="flex items-center gap-2">
          {onNewProject && (
            <button
              onClick={onNewProject}
              title="Nuevo Proyecto / Limpiar Chat"
              className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1 text-[10px] font-semibold cursor-pointer border border-slate-200"
            >
              <PlusCircle className="w-3 h-3 text-indigo-600" />
              <span>Nuevo</span>
            </button>
          )}

          <span className="text-[10px] flex items-center gap-1.5 text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
            NONA Multi-Agent Factory
          </span>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group relative`}>
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                {isUser ? (
                  <>
                    <span>Tú</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span className="font-semibold text-indigo-600">NONA AI Engine</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                )}
              </div>

              <div
                className={`relative max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed transition-all shadow-2xs ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                }`}
              >
                {msg.images && msg.images.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {msg.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Adjunto"
                        className="w-20 h-20 object-cover rounded-xl border border-white/20 shadow-xs"
                      />
                    ))}
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {!isUser && msg.content && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
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
            <span className="font-semibold">{thinkingText || 'Generando software con NONA Code Engine...'}</span>
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
          <span className="text-[10px] font-bold text-indigo-700">
            {attachedImages.length} imagen(es) listas
          </span>
        </div>
      )}

      {/* Quick Prompts Suggestions */}
      <div className="px-3 py-1.5 border-t border-slate-200 bg-white overflow-x-auto whitespace-nowrap flex gap-1.5 shrink-0">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="px-2.5 py-1 rounded-full bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[10px] text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.txt,.js,.ts,.html,.css,.json,.sql"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />

        <div className="relative flex items-center">
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={isRecording ? '🎙️ Escuchando... habla ahora' : (inspectedElement ? '¿Qué cambio deseas en este elemento?' : 'Escribe tu instrucción o pega/arrastra capturas (Cmd+V)...')}
            rows={2}
            className={`w-full resize-none bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl p-2.5 pl-24 pr-10 text-xs text-slate-900 outline-none transition-all placeholder-slate-400 ${
              isRecording ? 'border-red-500 bg-red-50/20 animate-pulse' : ''
            }`}
          />

          {/* Attach & Audio Buttons Toolbar */}
          <div className="absolute left-2 flex items-center gap-0.5">
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title={isRecording ? 'Detener grabación de voz' : 'Dictar por voz con micrófono'}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isRecording ? 'bg-red-500 text-white animate-bounce' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleCaptureScreen}
              title="Capturar Pantalla en Vivo para Análisis de IA"
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Adjuntar Imágenes o Archivos"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Subir Archivo de Código"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <Paperclip className="w-3 h-3" />
            </button>
          </div>

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={(!inputPrompt.trim() && attachedImages.length === 0 && !inspectedElement) || isGenerating}
            className="absolute right-2.5 p-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white transition-all shadow-xs cursor-pointer"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Voz, Pantalla & Multi-Agent Activos
          </span>
          <span className="flex items-center gap-0.5 text-indigo-600 font-bold">
            <Zap className="w-2.5 h-2.5" /> 5 Créditos / Run
          </span>
        </div>
      </div>

    </div>
  );
};
