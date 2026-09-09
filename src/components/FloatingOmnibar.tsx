import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUp, 
  Mic, 
  MicOff, 
  Code2, 
  MessageSquare, 
  Cpu, 
  ChevronDown, 
  Crosshair, 
  X, 
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  Globe,
  Plus,
  Link2,
  Loader2
} from 'lucide-react';
import type { ChatAttachment } from '../types';
import { webSearchService } from '../core/services/WebSearchService';

export interface FloatingOmnibarProps {
  onSendMessage: (text: string, mode?: 'chat' | 'builder', model?: string, attachments?: ChatAttachment[]) => void;
  isGenerating?: boolean;
  inspectedElement?: string | null;
  onClearInspectedElement?: () => void;
  attachedImages?: string[];
  onAddImage?: (base64: string) => void;
  onRemoveImage?: (index: number) => void;
  attachments?: ChatAttachment[];
  onAddAttachment?: (att: ChatAttachment) => void;
  onRemoveAttachment?: (id: string) => void;
  placeholder?: string;
  className?: string;
  initialText?: string;
}

export const FloatingOmnibar: React.FC<FloatingOmnibarProps> = ({
  onSendMessage,
  isGenerating = false,
  inspectedElement,
  onClearInspectedElement,
  attachedImages = [],
  onAddImage,
  onRemoveImage,
  attachments: externalAttachments,
  onAddAttachment: externalAddAttachment,
  onRemoveAttachment: externalRemoveAttachment,
  placeholder = "Pregunta lo que sea, adjunta audio, video, enlaces web...",
  className = "",
  initialText = ""
}) => {
  const [inputText, setInputText] = useState(initialText);
  const [mode, setMode] = useState<'chat' | 'builder'>('builder');
  const [selectedModel, setSelectedModel] = useState<'qwen3.8' | 'gemini-flash' | 'ollama'>('qwen3.8');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);

  // Local fallback attachments if not managed externally
  const [localAttachments, setLocalAttachments] = useState<ChatAttachment[]>([]);
  const activeAttachments = externalAttachments || localAttachments;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const universalFileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
      textareaRef.current?.focus();
    }
  }, [initialText]);

  // Voice to text initialization
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
        setInputText(prev => (prev ? prev + ' ' + currentTranscript : currentTranscript));
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, []);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (isGenerating) return;
    const trimmed = inputText.trim();
    if (!trimmed && activeAttachments.length === 0 && attachedImages.length === 0 && !inspectedElement) return;

    onSendMessage(trimmed, mode, selectedModel, activeAttachments);
    setInputText('');
    setLocalAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const addAttachment = (att: ChatAttachment) => {
    if (externalAddAttachment) {
      externalAddAttachment(att);
    } else {
      setLocalAttachments(prev => [...prev, att]);
    }
    // Also trigger legacy onAddImage if image
    if (att.type === 'image' && onAddImage) {
      onAddImage(att.url);
    }
  };

  const removeAttachment = (id: string, idx: number) => {
    if (externalRemoveAttachment) {
      externalRemoveAttachment(id);
    } else {
      setLocalAttachments(prev => prev.filter(a => a.id !== id));
    }
    if (onRemoveImage) {
      onRemoveImage(idx);
    }
  };

  const handleUniversalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      let type: ChatAttachment['type'] = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('audio/')) type = 'audio';
      else if (file.type.startsWith('video/')) type = 'video';

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newAtt: ChatAttachment = {
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            name: file.name,
            type,
            url: event.target.result as string,
            size: file.size,
            mimeType: file.type,
          };
          addAttachment(newAtt);
        }
      };

      if (type === 'document' && (file.name.endsWith('.txt') || file.name.endsWith('.json') || file.name.endsWith('.js') || file.name.endsWith('.html') || file.name.endsWith('.css'))) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });

    e.target.value = '';
    setIsPlusMenuOpen(false);
  };

  const handleAddUrlReference = async () => {
    const url = inputUrl.trim();
    if (!url) return;

    setIsScrapingUrl(true);
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
      const scraped = await webSearchService.scrapeReferenceUrl(targetUrl);
      const newAtt: ChatAttachment = {
        id: 'url_' + Date.now(),
        name: scraped?.title || targetUrl,
        type: 'url',
        url: targetUrl,
        title: scraped?.title || targetUrl,
        description: scraped?.description || '',
        extractedText: scraped?.content || '',
      };
      addAttachment(newAtt);
      setInputUrl('');
      setIsUrlModalOpen(false);
      setIsPlusMenuOpen(false);
    } catch {
      const fallbackAtt: ChatAttachment = {
        id: 'url_' + Date.now(),
        name: targetUrl,
        type: 'url',
        url: targetUrl,
        title: targetUrl,
      };
      addAttachment(fallbackAtt);
      setInputUrl('');
      setIsUrlModalOpen(false);
      setIsPlusMenuOpen(false);
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 180) + 'px';
  };

  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
      
      {/* Floating Card Container */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-900/5 transition-all focus-within:border-indigo-500/80 focus-within:ring-4 focus-within:ring-indigo-500/10 p-2 sm:p-3">
        
        {/* Inspected Element Floating Chip */}
        {inspectedElement && (
          <div className="mb-2 px-3 py-1.5 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center justify-between text-indigo-900 text-xs animate-fade-in">
            <div className="flex items-center gap-2 truncate">
              <Crosshair className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="font-semibold truncate">Elemento: {inspectedElement}</span>
            </div>
            <button
              type="button"
              onClick={onClearInspectedElement}
              className="p-0.5 text-indigo-500 hover:text-indigo-800 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Universal Attachments Bar (Images, Audio, Video, Docs, URLs) */}
        {(activeAttachments.length > 0 || attachedImages.length > 0) && (
          <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {activeAttachments.map((att, idx) => (
              <div key={att.id} className="relative group shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-800 shadow-2xs">
                {att.type === 'image' && (
                  <img src={att.url} alt={att.name} className="w-5 h-5 object-cover rounded-md" />
                )}
                {att.type === 'audio' && <Music className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                {att.type === 'video' && <Video className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                {att.type === 'document' && <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                {att.type === 'url' && <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                
                <span className="truncate max-w-[120px] text-[11px]">{att.title || att.name}</span>

                <button
                  type="button"
                  onClick={() => removeAttachment(att.id, idx)}
                  className="w-4 h-4 rounded-full bg-slate-300 hover:bg-red-500 hover:text-white flex items-center justify-center text-[10px] transition-colors cursor-pointer ml-1"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Legacy attachedImages fallback */}
            {activeAttachments.length === 0 && attachedImages.map((img, idx) => (
              <div key={idx} className="relative group shrink-0">
                <img src={img} alt="Captura adjunta" className="w-10 h-10 object-cover rounded-xl border border-slate-200" />
                {onRemoveImage && (
                  <button
                    type="button"
                    onClick={() => onRemoveImage(idx)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal Popover for URL / Reference Web App */}
        {isUrlModalOpen && (
          <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2 animate-fade-in">
            <Globe className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUrlReference()}
              placeholder="Pega la URL de la web, app o documentación..."
              className="flex-1 text-xs bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 font-sans"
              disabled={isScrapingUrl}
            />
            <button
              type="button"
              onClick={handleAddUrlReference}
              disabled={!inputUrl.trim() || isScrapingUrl}
              className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {isScrapingUrl ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Anexar'}
            </button>
            <button
              type="button"
              onClick={() => setIsUrlModalOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording 
              ? "🎙️ Escuchando tu voz..." 
              : inspectedElement 
              ? "¿Qué modificación quieres hacer en este elemento?" 
              : placeholder
          }
          rows={1}
          className="w-full px-2 py-1 text-sm bg-transparent border-none resize-none focus:outline-none placeholder-slate-400 text-slate-800 max-h-44 leading-relaxed font-sans"
        />

        {/* Bottom Multifunction Toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
          
          <div className="flex items-center gap-1 sm:gap-1.5">
            
            {/* Plus Attachments Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Adjuntar multimedia o enlaces de referencia"
              >
                <Plus className="w-4 h-4" />
              </button>

              <input
                ref={universalFileInputRef}
                type="file"
                multiple
                accept="image/*,audio/*,video/*,.pdf,.txt,.json,.js,.ts,.html,.css"
                onChange={handleUniversalFileChange}
                className="hidden"
              />

              {isPlusMenuOpen && (
                <div className="absolute left-0 bottom-9 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 text-xs animate-fade-in space-y-0.5">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Adjuntos & Referencias
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      universalFileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Archivos Multimedia</div>
                      <div className="text-[10px] text-slate-400 font-normal">Audio, video, imágenes o código</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      setIsUrlModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <Link2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Enlace Web / App de Referencia</div>
                      <div className="text-[10px] text-slate-400 font-normal">Analiza sitios web externos o docs</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      setInputText(prev => (prev ? prev + ' [Inspeccionar UI]' : '[Inspeccionar elemento]'));
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Elemento de Vista Previa</div>
                      <div className="text-[10px] text-slate-400 font-normal">Selecciona y edita con precisión</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Segmented Mode Pill: Chat | App Builder */}
            <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/60 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setMode('chat')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mode === 'chat' 
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3 h-3 text-indigo-600" />
                <span>Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('builder')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mode === 'builder' 
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Code2 className="w-3 h-3 text-violet-600" />
                <span>App Builder</span>
              </button>
            </div>

            {/* Model Selector Micro-Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <Cpu className="w-3 h-3 text-indigo-600" />
                <span className="truncate max-w-[110px] sm:max-w-[140px]">
                  {selectedModel === 'qwen3.8' ? 'Qwen 3.8 27B' : selectedModel === 'gemini-flash' ? 'Gemini 2.5 Flash' : 'Ollama Local'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isModelMenuOpen && (
                <div className="absolute left-0 bottom-9 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 text-xs animate-fade-in">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Motor de Inferencia
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedModel('qwen3.8'); setIsModelMenuOpen(false); }}
                    className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      selectedModel === 'qwen3.8' ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-amber-500 mt-0.5">⚡</span>
                    <div>
                      <div className="text-xs">Qwen 3.8 27B (Groq LPU)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Inferencia ultrarrápida a ~400 t/s</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedModel('gemini-flash'); setIsModelMenuOpen(false); }}
                    className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      selectedModel === 'gemini-flash' ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-blue-500 mt-0.5">✨</span>
                    <div>
                      <div className="text-xs">Gemini 2.5 Flash</div>
                      <div className="text-[10px] text-slate-400 font-normal">Visión multimodal y razonamiento</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedModel('ollama'); setIsModelMenuOpen(false); }}
                    className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      selectedModel === 'ollama' ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-slate-600 mt-0.5">🦙</span>
                    <div>
                      <div className="text-xs">Ollama Local</div>
                      <div className="text-[10px] text-slate-400 font-normal">Inferencia privada localhost:11434</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Right Actions (Voice Mic & Send Button) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleRecording}
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={isRecording ? 'Detener dictado' : 'Dictar por voz'}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={isGenerating || (!inputText.trim() && activeAttachments.length === 0 && attachedImages.length === 0 && !inspectedElement)}
              className="w-7 h-7 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
              title="Enviar instrucción"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
