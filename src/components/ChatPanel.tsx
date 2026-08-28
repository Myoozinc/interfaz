import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  User, 
  Zap, 
  RefreshCw,
  BrainCircuit
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
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [thinkingText, setThinkingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const quickPrompts = [
    '🍽️ Crear SaaS para restaurantes con reservas y menú',
    '💳 Añadir integración de pagos con Stripe y suscripciones',
    '🎨 Cambiar el diseño del dashboard a modo oscuro violeta',
    '📊 Generar estadísticas de ocupación y ventas en tiempo real',
  ];

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim() || isGenerating) return;

    // Check & deduct credit through CreditLedger
    const hasCredit = onDeductCredit(5);
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
        abortControllerRef.current.signal
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

      creditLedger.deductCredits(5, `Generación de software: "${promptToSend.slice(0, 30)}..."`);

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
              ? { ...msg, content: `⚠️ Error del agente: ${err.message}. Asegúrate de que Ollama esté ejecutándose en tu Mac.` }
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
    <div className="w-84 lg:w-96 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden text-xs select-none shadow-xs font-sans">
      
      {/* Top Header */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900">NONA Agent Core</span>
        </div>

        <span className="text-[10px] flex items-center gap-1.5 text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
          Qwen 3.8 / 2.5 Active
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
                    <span className="font-semibold text-indigo-600">NONA Agent</span>
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
                  {msg.content || (isGenerating && msg.id === messages[messages.length - 1]?.id ? (
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold text-[11px] animate-pulse">
                      <BrainCircuit className="w-4 h-4 animate-spin" />
                      <span>{thinkingText || 'Razonando y construyendo software full-stack...'}</span>
                    </div>
                  ) : '')}
                </div>
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
            placeholder="Pídele al agente crear o modificar cualquier aplicación full-stack..."
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
          <span>AI Software Factory • Bucle de razonamiento activo</span>
          <span className="flex items-center gap-0.5 text-indigo-600 font-bold">
            <Zap className="w-2.5 h-2.5" /> 5 Créditos / Run
          </span>
        </div>
      </div>

    </div>
  );
};
