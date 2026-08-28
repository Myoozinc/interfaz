import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  User, 
  ArrowDownToLine, 
  Zap, 
  RefreshCw,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ChatMessage, FileItem } from '../types';
import { aiEngine } from '../services/aiGenerator';

interface ChatPanelProps {
  files: FileItem[];
  onApplyCodeToFile: (filename: string, code: string) => void;
  onDeductCredit: (amount: number) => boolean;
  onGenerationStart?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  files: _files,
  onApplyCodeToFile,
  onDeductCredit,
  onGenerationStart,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy **NONA AI**. Pídeme crear cualquier aplicación, juego 3D interactivo, componente o diseño en tiempo real.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [appliedSnippets, setAppliedSnippets] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const quickPrompts = [
    '🎮 Crear juego 3D de música en un mundo virtual',
    '📊 Crear dashboard financiero con KPIs en tiempo real',
    '✨ Crear landing page SaaS moderna con animaciones',
    '🎨 Cambiar diseño a modo oscuro violeta con efectos glass',
  ];

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim() || isGenerating) return;

    // Check & deduct credit
    const hasCredit = onDeductCredit(1);
    if (!hasCredit) return;

    if (onGenerationStart) onGenerationStart();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: promptToSend,
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
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();

    try {
      const { codeBlocks } = await aiEngine.generateAppCode(
        promptToSend,
        (_chunk, fullText) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantPlaceholderId
                ? { ...msg, content: fullText }
                : msg
            )
          );
        },
        abortControllerRef.current.signal
      );

      if (codeBlocks.length > 0) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantPlaceholderId
              ? { ...msg, codeSnippets: codeBlocks }
              : msg
          )
        );

        // Auto-apply primary code block directly to active file/index.html so preview updates immediately!
        const primaryBlock = codeBlocks[0];
        const targetFilename = primaryBlock.filename || 'index.html';
        onApplyCodeToFile(targetFilename, primaryBlock.code);

        // Confetti celebration
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#6366F1', '#7C3AED', '#A855F7', '#10B981']
        });
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error generating:', err);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleManualApplySnippet = (snippetKey: string, code: string, suggestedFilename?: string) => {
    const target = suggestedFilename || 'index.html';
    onApplyCodeToFile(target, code);
    setAppliedSnippets(prev => ({ ...prev, [snippetKey]: true }));
    setTimeout(() => {
      setAppliedSnippets(prev => ({ ...prev, [snippetKey]: false }));
    }, 2500);
  };

  return (
    <div className="w-84 lg:w-96 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden text-xs select-none shadow-xs">
      
      {/* Top Header */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900">NONA AI</span>
        </div>

        <span className="text-[10px] flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          Motor Activo
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                {isUser ? (
                  <>
                    <span>Tú</span>
                    <User className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span className="font-semibold text-indigo-600">NONA</span>
                  </>
                )}
                <span>• {msg.timestamp}</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl max-w-[92%] leading-relaxed break-words shadow-2xs ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-xs shadow-indigo-500/10'
                    : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-xs">
                  {msg.content}
                </div>

                {/* If AI provided code blocks */}
                {msg.codeSnippets && msg.codeSnippets.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-2">
                    {msg.codeSnippets.map((snippet, sIdx) => {
                      const snippetKey = `${msg.id}-${sIdx}`;
                      const isApplied = appliedSnippets[snippetKey];
                      return (
                        <div key={sIdx} className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              {snippet.language} {snippet.filename ? `• ${snippet.filename}` : ''}
                            </span>
                            <button
                              onClick={() => handleManualApplySnippet(snippetKey, snippet.code, snippet.filename)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold transition-all cursor-pointer shadow-2xs"
                            >
                              {isApplied ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>¡Aplicado!</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownToLine className="w-3 h-3" />
                                  <span>Re-aplicar al Editor</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="text-[10px] font-mono text-slate-600 max-h-24 overflow-y-auto bg-white p-1.5 rounded-lg border border-slate-200">
                            {snippet.code.slice(0, 250)}...
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="px-3 py-1.5 border-t border-slate-200 bg-white overflow-x-auto whitespace-nowrap flex gap-1.5">
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
      <div className="p-3 bg-white border-t border-slate-200">
        <div className="relative flex items-center">
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Pídele a NONA crear un juego 3D, app o interfaz..."
            rows={2}
            className="w-full resize-none bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl p-2.5 pr-10 text-xs text-slate-900 outline-none transition-all placeholder-slate-400"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isGenerating}
            className="absolute right-2.5 p-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white transition-all shadow-xs cursor-pointer"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>Enter para enviar • Shift + Enter salto de línea</span>
          <span className="flex items-center gap-0.5 text-indigo-600 font-semibold">
            <Zap className="w-2.5 h-2.5" /> 1 Crédito / prompt
          </span>
        </div>
      </div>

    </div>
  );
};
