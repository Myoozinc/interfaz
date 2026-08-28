import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  User, 
  Zap, 
  RefreshCw, 
  BrainCircuit,
  Image as ImageIcon,
  Paperclip,
  X,
  Globe,
  Mic,
  MicOff,
  Monitor,
  Copy,
  Check,
  RotateCcw,
  Edit3,
  PlusCircle,
  Code2,
  Play
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
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript.trim()) {
          setInputPrompt(prev => (prev ? prev + ' ' + currentTranscript : currentTranscript));
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
    } catch {
      setIsRecording(false);
    }
  };

  // Screen Capture Snapshot
  const handleCaptureScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: false,
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const screenshotBase64 = canvas.toDataURL('image/png');

      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());

      setAttachedImages(prev => [...prev, screenshotBase64]);
      setInputPrompt(prev => 
        prev ? prev + ' [Analiza esta captura de mi pantalla para corregir y mejorar la app]' : 'Analiza esta captura de pantalla de la aplicación y corrige cualquier error o mejora el diseño.'
      );
    } catch {
      // User cancelled screen capture
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
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
            if (typeof reader.result === 'string') {
              setAttachedImages(prev => [...prev, reader.result as string]);
            }
          };
          reader.readAsDataURL(file);
        } else {
          // If code or text file, read text and append to input
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              setInputPrompt(prev => prev + `\n// Archivo: ${file.name}\n` + reader.result);
            }
          };
          reader.readAsText(file);
        }
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setAttachedImages(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              setAttachedImages(prev => [...prev, reader.result as string]);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleEditAndRetry = (text: string) => {
    setInputPrompt(text);
  };

  const quickPrompts = [
    '🍽️ Crear SaaS para restaurantes con reservas y menú',
    '💳 Añadir integración de pagos con Stripe y suscripciones',
    '🎨 Cambiar el diseño del dashboard a modo oscuro violeta',
    '📊 Generar estadísticas de ocupación y ventas en tiempo real',
  ];

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt;
    if ((!promptToSend.trim() && attachedImages.length === 0) || isGenerating) return;

    // Check & deduct credit through CreditLedger
    const hasCredit = onDeductCredit(5);
    if (!hasCredit) return;

    if (onGenerationStart) onGenerationStart();

    // Extract URLs if present
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const detectedLinks = promptToSend.match(urlRegex) || [];

    const currentImages = [...attachedImages];

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: promptToSend,
      images: currentImages.length > 0 ? currentImages : undefined,
      links: detectedLinks.length > 0 ? detectedLinks : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantPlaceholderId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputPrompt('');
    setAttachedImages([]);
    setIsGenerating(true);
    setThinkingText('');

    abortControllerRef.current = new AbortController();

    // Construct FullStackProject from files state
    const projectFilesRecord: Record<string, any> = {};
    files.forEach(f => {
      projectFilesRecord[f.name] = {
        path: f.name,
        content: f.content,
        language: f.language,
      };
    });

    const projectContext: FullStackProject = {
      id: 'proj_' + Date.now(),
      name: 'NONA Application',
      description: promptToSend,
      files: projectFilesRecord,
      environmentVariables: {},
      framework: 'react-vite',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const { responseText, updatedProject } = await agentOrchestrator.run(
        promptToSend,
        projectContext,
        (chunk, isThinking) => {
          if (isThinking) {
            setThinkingText(chunk);
          } else {
            setThinkingText('');
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantPlaceholderId
                  ? { ...msg, content: chunk }
                  : msg
              )
            );
          }
        },
        {
          images: currentImages,
          links: detectedLinks,
          signal: abortControllerRef.current.signal
        }
      );

      // Convert updatedProject.files back to FileItem[]
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

      creditLedger.deductCredits(5, `Generación Qwen 3.8: "${promptToSend.slice(0, 30)}..."`);

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
              ? { ...msg, content: `⚠️ Error del servidor cloud: ${err.message}` }
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
            Qwen 3.8 Cloud (Groq LPU)
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
                    <User className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span className="font-semibold text-indigo-600">Qwen 3.8 Cloud</span>
                  </>
                )}
                <span>• {msg.timestamp}</span>
              </div>

              {/* User Attached Images Preview */}
              {msg.images && msg.images.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5 max-w-[92%]">
                  {msg.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="Referencia"
                      className="w-24 h-24 object-cover rounded-xl border-2 border-indigo-500 shadow-sm"
                    />
                  ))}
                </div>
              )}

              {/* Links Badge */}
              {msg.links && msg.links.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5 max-w-[92%]">
                  {msg.links.map((link, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-medium border border-blue-200">
                      <Globe className="w-2.5 h-2.5" />
                      <span className="max-w-[150px] truncate">{link}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`p-3.5 rounded-2xl max-w-[92%] leading-relaxed break-words shadow-2xs ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-xs shadow-indigo-500/10'
                    : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-xs">
                  {msg.content || (isGenerating && msg.id === messages[messages.length - 1]?.id ? (
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold text-[11px] animate-pulse">
                      <BrainCircuit className="w-4 h-4 animate-spin" />
                      <span>{thinkingText || 'Qwen 3.8 razonando y programando arquitectura...'}</span>
                    </div>
                  ) : '')}
                </div>

                {/* Interactive Code Sync Card inside Assistant Bubble */}
                {!isUser && msg.content && !isGenerating && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Aplicación actualizada
                    </span>
                    <div className="flex items-center gap-1.5">
                      {onSwitchView && (
                        <>
                          <button
                            onClick={() => onSwitchView('preview')}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Play className="w-2.5 h-2.5" /> Preview
                          </button>
                          <button
                            onClick={() => onSwitchView('editor')}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Code2 className="w-2.5 h-2.5" /> Código
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Hover Actions Toolbar */}
              <div className={`mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'mr-1' : 'ml-1'}`}>
                <button
                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                  title="Copiar texto"
                  className="p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-slate-700 shadow-2xs transition-colors cursor-pointer"
                >
                  {copiedMsgId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
                {isUser && (
                  <button
                    onClick={() => handleEditAndRetry(msg.content)}
                    title="Editar y reenviar prompt"
                    className="p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
                {!isUser && msg.content && (
                  <button
                    onClick={() => handleSendMessage(messages[messages.findIndex(m => m.id === msg.id) - 1]?.content || 'Reintentar')}
                    title="Reintentar generación"
                    className="p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 shadow-2xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached Images Thumbnail Bar */}
      {attachedImages.length > 0 && (
        <div className="px-3 py-2 bg-indigo-50/70 border-t border-indigo-100 flex items-center gap-2 overflow-x-auto shrink-0">
          {attachedImages.map((img, idx) => (
            <div key={idx} className="relative group shrink-0">
              <img
                src={img}
                alt="Adjunto"
                className="w-12 h-12 object-cover rounded-lg border border-indigo-300 shadow-2xs"
              />
              <button
                onClick={() => setAttachedImages(prev => prev.filter((_, i) => i !== idx))}
                className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full shadow-xs hover:bg-red-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
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
            placeholder={isRecording ? '🎙️ Escuchando... habla ahora' : 'Escribe tu instrucción o pega/arrastra capturas (Cmd+V)...'}
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
            disabled={(!inputPrompt.trim() && attachedImages.length === 0) || isGenerating}
            className="absolute right-2.5 p-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white transition-all shadow-xs cursor-pointer"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Voz, Pantalla & Qwen 3.8 Activos
          </span>
          <span className="flex items-center gap-0.5 text-indigo-600 font-bold">
            <Zap className="w-2.5 h-2.5" /> 5 Créditos / Run
          </span>
        </div>
      </div>

    </div>
  );
};
