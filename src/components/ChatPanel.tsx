import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  ArrowDownToLine, 
  Cpu, 
  Zap, 
  RefreshCw,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ChatMessage, FileItem, OllamaModelInfo } from '../types';
import { ollamaClient, OllamaService } from '../services/ollama';

interface ChatPanelProps {
  files: FileItem[];
  onApplyCodeToFile: (filename: string, code: string) => void;
  onDeductCredit: (amount: number) => boolean;
  currentModel: string;
  setCurrentModel: (model: string) => void;
  modelsList: OllamaModelInfo[];
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  files,
  onApplyCodeToFile,
  onDeductCredit,
  currentModel,
  setCurrentModel,
  modelsList,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy **NONA AI**, tu asistente autónomo conectado a **Qwen 3.8**. Pídeme crear nuevos componentes, modificar el diseño o generar aplicaciones completas con previsualización en vivo.',
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
    '✨ Agrega una barra de navegación flotante con blur',
    '📊 Añade un componente de métricas con tarjetas interactivas',
    '🎨 Aplica tema oscuro suave con acentos dorados',
    '📱 Haz que la tabla sea responsive para móviles',
  ];

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim() || isGenerating) return;

    // Check & deduct credit
    const hasCredit = onDeductCredit(1);
    if (!hasCredit) {
      return;
    }

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
      modelUsed: currentModel,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputPrompt('');
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();

    // Prepare context of active project files
    const contextPrompt = `Eres NONA AI, un ingeniero senior y diseñador UI/UX especializado en interfaces refinadas, limpias y minimalistas estilo crema y profesional.
Los archivos actuales del proyecto son:
${files.map(f => `--- Archivo: ${f.name} (${f.language}) ---\n${f.content.slice(0, 1500)}`).join('\n\n')}

Instrucción del usuario: "${promptToSend}"

Genera el código necesario o la explicación. Si modificas o creas código, encierra el bloque en formato markdown con el nombre del archivo si es posible, por ejemplo:
\`\`\`html
<!-- código -->
\`\`\``;

    try {
      const fullResponse = await ollamaClient.streamChat(
        currentModel,
        [
          { role: 'system', content: 'Eres NONA AI, asistente de código ultra preciso y refinado.' },
          { role: 'user', content: contextPrompt }
        ],
        (_token, currentText) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantPlaceholderId
                ? { ...msg, content: currentText }
                : msg
            )
          );
        },
        abortControllerRef.current.signal
      );

      // Check if code blocks were returned and parse them
      const blocks = OllamaService.extractCodeBlocks(fullResponse);
      if (blocks.length > 0) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantPlaceholderId
              ? { ...msg, codeSnippets: blocks }
              : msg
          )
        );

        // Confetti celebration
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#A86B32', '#DFC7B1', '#FAF1E8', '#10B981']
        });
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error generating chat:', err);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleApplySnippet = (snippetKey: string, code: string, suggestedFilename?: string) => {
    const target = suggestedFilename || (code.includes('<!DOCTYPE') || code.includes('<div') ? 'index.html' : files[0]?.name || 'index.html');
    onApplyCodeToFile(target, code);
    setAppliedSnippets(prev => ({ ...prev, [snippetKey]: true }));
    setTimeout(() => {
      setAppliedSnippets(prev => ({ ...prev, [snippetKey]: false }));
    }, 2500);
  };

  return (
    <div className="w-84 lg:w-96 bg-[#FAF7F2] border-l border-[#E7E0D6] flex flex-col h-full overflow-hidden text-xs select-none">
      
      {/* Top Header: Model Selector */}
      <div className="p-3 border-b border-[#E7E0D6] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#FAF1E8] border border-[#DFC7B1] flex items-center justify-center text-[#A86B32]">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-[#1C1917]">NONA Agent</span>
        </div>

        {/* Model dropdown */}
        <div className="flex items-center gap-1">
          <Cpu className="w-3 h-3 text-[#8C827A]" />
          <select
            value={currentModel}
            onChange={(e) => setCurrentModel(e.target.value)}
            className="text-[11px] font-semibold text-[#1C1917] bg-[#FAF7F2] border border-[#E7E0D6] rounded-md px-2 py-0.5 outline-none cursor-pointer hover:border-[#DFC7B1]"
          >
            {modelsList.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#8C827A]">
                {isUser ? (
                  <>
                    <span>Tú</span>
                    <User className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-[#A86B32]" />
                    <span className="font-semibold text-[#A86B32]">NONA ({msg.modelUsed || currentModel})</span>
                  </>
                )}
                <span>• {msg.timestamp}</span>
              </div>

              <div
                className={`p-3 rounded-2xl max-w-[92%] leading-relaxed break-words shadow-2xs ${
                  isUser
                    ? 'bg-[#A86B32] text-white rounded-tr-xs'
                    : 'bg-white text-[#1C1917] border border-[#E7E0D6] rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-xs">
                  {msg.content}
                </div>

                {/* If AI provided code blocks, show quick action button */}
                {msg.codeSnippets && msg.codeSnippets.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#E7E0D6] space-y-2">
                    {msg.codeSnippets.map((snippet, sIdx) => {
                      const snippetKey = `${msg.id}-${sIdx}`;
                      const isApplied = appliedSnippets[snippetKey];
                      return (
                        <div key={sIdx} className="bg-[#FAF7F2] p-2 rounded-xl border border-[#E7E0D6]">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-[#8C827A] uppercase">
                              {snippet.language} {snippet.filename ? `• ${snippet.filename}` : ''}
                            </span>
                            <button
                              onClick={() => handleApplySnippet(snippetKey, snippet.code, snippet.filename)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#A86B32] hover:bg-[#8F5622] text-white text-[10px] font-semibold transition-all cursor-pointer"
                            >
                              {isApplied ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>¡Aplicado!</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownToLine className="w-3 h-3" />
                                  <span>Aplicar al Editor</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="text-[10px] font-mono text-[#57534E] max-h-24 overflow-y-auto bg-white p-1.5 rounded-md border border-[#DFC7B1]">
                            {snippet.code.slice(0, 300)}...
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
      <div className="px-3 py-1.5 border-t border-[#E7E0D6] bg-white overflow-x-auto whitespace-nowrap flex gap-1.5">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="px-2.5 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#FAF1E8] border border-[#E7E0D6] hover:border-[#DFC7B1] text-[10px] text-[#57534E] hover:text-[#8F5622] transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 bg-white border-t border-[#E7E0D6]">
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
            placeholder="Pídele a Qwen 3.8 crear o modificar código..."
            rows={2}
            className="w-full resize-none bg-[#FAF7F2] border border-[#E7E0D6] focus:border-[#A86B32] focus:bg-white rounded-xl p-2.5 pr-10 text-xs text-[#1C1917] outline-none transition-all placeholder-[#8C827A]"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isGenerating}
            className="absolute right-2.5 p-1.5 rounded-lg bg-[#A86B32] hover:bg-[#8F5622] disabled:opacity-40 text-white transition-all shadow-2xs cursor-pointer"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#8C827A] px-1">
          <span>Enter para enviar • Shift + Enter salto de línea</span>
          <span className="flex items-center gap-0.5 text-[#A86B32] font-semibold">
            <Zap className="w-2.5 h-2.5" /> 1 Crédito / prompt
          </span>
        </div>
      </div>

    </div>
  );
};
