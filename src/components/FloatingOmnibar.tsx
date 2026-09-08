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
  Image as ImageIcon
} from 'lucide-react';

export interface FloatingOmnibarProps {
  onSendMessage: (text: string, mode?: 'chat' | 'builder', model?: string) => void;
  isGenerating?: boolean;
  inspectedElement?: string | null;
  onClearInspectedElement?: () => void;
  attachedImages?: string[];
  onAddImage?: (base64: string) => void;
  onRemoveImage?: (index: number) => void;
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
  placeholder = "Pregunta lo que sea, @ para archivos, / para acciones...",
  className = "",
  initialText = ""
}) => {
  const [inputText, setInputText] = useState(initialText);
  const [mode, setMode] = useState<'chat' | 'builder'>('builder');
  const [selectedModel, setSelectedModel] = useState<'qwen3.8' | 'gemini-flash' | 'ollama'>('qwen3.8');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (!trimmed && attachedImages.length === 0 && !inspectedElement) return;

    onSendMessage(trimmed, mode, selectedModel);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && onAddImage) {
          onAddImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
    setIsPlusMenuOpen(false);
  };

  // Auto-resize textarea
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

        {/* Attached Images Thumbnail Bar */}
        {attachedImages.length > 0 && (
          <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1">
            {attachedImages.map((img, idx) => (
              <div key={idx} className="relative group shrink-0">
                <img
                  src={img}
                  alt="Captura adjunta"
                  className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-2xs"
                />
                {onRemoveImage && (
                  <button
                    type="button"
                    onClick={() => onRemoveImage(idx)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs cursor-pointer hover:bg-red-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
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

        {/* Sub-bar Controls */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          
          {/* Left Actions (+ menu, Mode Toggle, Model Selector) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/*,.txt,.md,.json,.html,.css,.js"
              multiple
              className="hidden"
            />

            {/* + Button Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                title="Adjuntar o herramientas"
                className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="text-base font-medium leading-none">+</span>
              </button>

              {isPlusMenuOpen && (
                <div className="absolute left-0 bottom-9 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 text-xs animate-fade-in">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Adjuntar imagen/archivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      setInputText(prev => (prev ? prev + ' [Inspeccionar UI]' : '[Inspeccionar elemento]'));
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Modificar elemento visual</span>
                  </button>
                </div>
              )}
            </div>

            {/* Segmented Mode Pill: Chat | App Builder (Claude Desktop style) */}
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

            {/* Model Selector Micro-Dropdown (Antigravity & Ollama style) */}
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
              disabled={isGenerating || (!inputText.trim() && attachedImages.length === 0 && !inspectedElement)}
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
