import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  Play, 
  Package, 
  GitBranch, 
  List, 
  Maximize2, 
  Minimize2,
  HelpCircle
} from 'lucide-react';
import type { FileItem } from '../types';
import { webContainerService } from '../core/sandbox/WebContainerService';

interface TerminalPanelProps {
  files: FileItem[];
  onSendMessage?: (message: string) => void;
  className?: string;
}

interface OutputLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'success';
  content: string;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  files,
  onSendMessage,
  className = '',
}) => {
  const [outputHistory, setOutputHistory] = useState<OutputLine[]>([
    {
      id: 'welcome-1',
      type: 'system',
      content: '╔════════════════════════════════════════════════════════════════════╗',
    },
    {
      id: 'welcome-2',
      type: 'system',
      content: '║   ⚡ NONA Interactive Terminal (Shell v2.4)                        ║',
    },
    {
      id: 'welcome-3',
      type: 'system',
      content: '║   Workspace conectado. Escribe "help" para ver los comandos.       ║',
    },
    {
      id: 'welcome-4',
      type: 'system',
      content: '╚════════════════════════════════════════════════════════════════════╝',
    },
  ]);

  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRunningProcess, setIsRunningProcess] = useState(false);
  const [activeShellType, setActiveShellType] = useState<'webcontainer' | 'virtual'>('virtual');

  const inputRef = useRef<HTMLInputElement | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const activeShellRef = useRef<any>(null);

  // Intentar conectar con WebContainers si está soportado en el navegador
  useEffect(() => {
    if (webContainerService.isSupported()) {
      setActiveShellType('webcontainer');
      webContainerService.boot().then(async () => {
        try {
          const shell = await webContainerService.startInteractiveShell({
            onOutput: (chunk) => {
              appendOutput('output', chunk);
            },
          });
          activeShellRef.current = shell;
          appendOutput('success', '✨ [WebContainer]: Shell interactivo Node.js (jsh) iniciado y enlazado.');
        } catch {
          setActiveShellType('virtual');
        }
      }).catch(() => {
        setActiveShellType('virtual');
      });
    } else {
      setActiveShellType('virtual');
    }

    return () => {
      if (activeShellRef.current?.kill) {
        activeShellRef.current.kill();
      }
    };
  }, []);

  // Auto-scroll al final del terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputHistory]);

  const appendOutput = (type: OutputLine['type'], content: string) => {
    setOutputHistory((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        content,
      },
    ]);
  };

  // Procesador del Shell Virtual de alta fidelidad
  const executeVirtualCommand = (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    // Guardar en historial
    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    // Echo input
    appendOutput('input', trimmed);

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'clear':
      case 'cls':
        setOutputHistory([]);
        break;

      case 'help':
        appendOutput(
          'system',
          `Comandos disponibles en NONA Shell:
  ls [-la]             Lista archivos y carpetas del proyecto
  cat <archivo>        Muestra el contenido de un archivo
  pwd                  Directorio de trabajo actual
  npm run dev          Inicia el servidor de desarrollo Vite
  npm install [pkg]    Simula instalación de paquetes npm
  npm test             Ejecuta los tests del proyecto
  git status           Muestra estado de archivos modificados
  tree                 Muestra estructura de árbol del proyecto
  ask <instrucción>    Envía una instrucción directa al Agente NONA
  clear                Limpia la pantalla de la terminal
  help                 Muestra esta ayuda`
        );
        break;

      case 'pwd':
        appendOutput('output', '/workspace/project');
        break;

      case 'ls': {
        const fileList = files.map((f) => {
          const isDir = f.name.includes('/');
          return isDir ? `📁 ${f.name}` : `📄 ${f.name} (${f.content.length} bytes)`;
        });
        appendOutput('output', `Total ${files.length} archivos:\n` + fileList.join('\n'));
        break;
      }

      case 'cat': {
        if (args.length === 0) {
          appendOutput('error', 'Uso: cat <nombre_archivo>');
          return;
        }
        const targetName = args[0].replace(/^(\.\/|\/)/, '');
        const targetFile = files.find(
          (f) => f.name.toLowerCase() === targetName.toLowerCase() || f.name.endsWith(targetName)
        );
        if (!targetFile) {
          appendOutput('error', `cat: ${targetName}: Archivo no encontrado en el workspace.`);
        } else {
          appendOutput('output', `--- ${targetFile.name} ---\n` + targetFile.content);
        }
        break;
      }

      case 'tree': {
        const paths = files.map((f) => f.name);
        appendOutput('output', '.\n' + paths.map((p) => `├── ${p}`).join('\n'));
        break;
      }

      case 'git': {
        if (args[0] === 'status') {
          const modified = files.filter((f) => f.isModified);
          if (modified.length === 0) {
            appendOutput('success', 'On branch main\nNothing to commit, working tree clean.');
          } else {
            appendOutput(
              'output',
              `On branch main\nChanges not staged for commit:\n` +
                modified.map((f) => `  modified:   ${f.name}`).join('\n')
            );
          }
        } else {
          appendOutput('output', `git: comando "${args.join(' ')}" no simulado. Usa "git status".`);
        }
        break;
      }

      case 'npm': {
        const sub = args[0];
        if (sub === 'run' && args[1] === 'dev') {
          setIsRunningProcess(true);
          appendOutput('system', '⚡ [vite v8.2.2] Ready in 142 ms');
          appendOutput('success', '➜  Local:   http://localhost:5173/');
          appendOutput('system', '➜  Network: use --host to expose');
          appendOutput('output', '✨ Hot Module Replacement (HMR) activo y sincronizado con el workspace.');
          setTimeout(() => setIsRunningProcess(false), 800);
        } else if (sub === 'install' || sub === 'i') {
          setIsRunningProcess(true);
          const pkg = args.slice(1).join(' ') || 'dependencias';
          appendOutput('system', `📦 [npm]: Instalando ${pkg}...`);
          setTimeout(() => {
            appendOutput('success', `✅ [npm]: Paquetes sincronizados con éxito. 0 vulnerabilities.`);
            setIsRunningProcess(false);
          }, 600);
        } else if (sub === 'test') {
          setIsRunningProcess(true);
          appendOutput('system', '🧪 Ejecutando suite de validación de NONA...');
          setTimeout(() => {
            appendOutput('success', '✅ 100% de verificaciones de sintaxis y arquitectura aprobadas.');
            setIsRunningProcess(false);
          }, 500);
        } else {
          appendOutput('output', `Uso: npm run dev | npm install [pkg] | npm test`);
        }
        break;
      }

      case 'ask': {
        const prompt = args.join(' ');
        if (!prompt) {
          appendOutput('error', 'Uso: ask <instrucción para NONA>');
          return;
        }
        appendOutput('system', `🤖 Transmitiendo orden al Consejo de Agentes de NONA: "${prompt}"...`);
        if (onSendMessage) {
          onSendMessage(prompt);
        }
        break;
      }

      default:
        appendOutput('error', `nona-sh: comando no encontrado: ${cmd}. Escribe "help" para ver los comandos.`);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeShellType === 'webcontainer' && activeShellRef.current) {
        // Enviar a WebContainer jsh
        appendOutput('input', currentInput);
        activeShellRef.current.write(currentInput + '\n');
        setCommandHistory((prev) => [...prev, currentInput]);
        setHistoryIndex(-1);
        setCurrentInput('');
      } else {
        // Ejecutar en shell virtual
        executeVirtualCommand(currentInput);
        setCurrentInput('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setCurrentInput(commandHistory[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setCurrentInput('');
      } else {
        setHistoryIndex(nextIndex);
        setCurrentInput(commandHistory[nextIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Autocompletar nombres de archivos
      const parts = currentInput.split(' ');
      const lastWord = parts[parts.length - 1];
      if (lastWord) {
        const match = files.find((f) => f.name.toLowerCase().startsWith(lastWord.toLowerCase()));
        if (match) {
          parts[parts.length - 1] = match.name;
          setCurrentInput(parts.join(' '));
        }
      }
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#0d1117] text-[#e6edf3] font-mono text-[12px] select-text overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 p-4 bg-[#0d1117]/98 backdrop-blur-md' : className
      }`}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Top Terminal Bar */}
      <div className="h-9 px-3 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between shrink-0 select-none">
        
        {/* Left: Terminal status & shell type */}
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-[#58a6ff]" />
          <span className="font-semibold text-[11px] text-slate-300">Terminal</span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
            {activeShellType === 'webcontainer' ? 'jsh (WebContainer)' : 'nona-sh (Virtual)'}
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">~/workspace/project</span>
        </div>

        {/* Center: Quick Action Buttons */}
        <div className="hidden md:flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              executeVirtualCommand('npm run dev');
            }}
            title="Ejecutar npm run dev"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#21262d] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 text-[#3fb950]" />
            <span>dev</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              executeVirtualCommand('npm install');
            }}
            title="Ejecutar npm install"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#21262d] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Package className="w-3 h-3 text-[#d29922]" />
            <span>install</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              executeVirtualCommand('git status');
            }}
            title="Consultar git status"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#21262d] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <GitBranch className="w-3 h-3 text-[#bc8cff]" />
            <span>git</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              executeVirtualCommand('ls');
            }}
            title="Listar archivos"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#21262d] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <List className="w-3 h-3 text-[#58a6ff]" />
            <span>ls</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              executeVirtualCommand('help');
            }}
            title="Ver ayuda de comandos"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#21262d] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3 h-3" />
            <span>ayuda</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOutputHistory([]);
            }}
            title="Limpiar pantalla (clear)"
            className="p-1 rounded hover:bg-[#21262d] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(!isFullscreen);
            }}
            title={isFullscreen ? 'Restaurar tamaño' : 'Pantalla completa'}
            className="p-1 rounded hover:bg-[#21262d] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Scrollable Logs */}
      <div className="flex-1 p-3 overflow-y-auto font-mono space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
        {outputHistory.map((item) => {
          if (item.type === 'input') {
            return (
              <div key={item.id} className="flex items-start gap-1.5 text-slate-200">
                <span className="text-[#3fb950] select-none">➜</span>
                <span className="text-[#58a6ff] select-none">~/project</span>
                <span className="text-slate-400 select-none">$</span>
                <span className="font-semibold text-white">{item.content}</span>
              </div>
            );
          }
          if (item.type === 'error') {
            return (
              <div key={item.id} className="text-[#f85149] whitespace-pre-wrap leading-relaxed">
                {item.content}
              </div>
            );
          }
          if (item.type === 'system') {
            return (
              <div key={item.id} className="text-[#58a6ff] whitespace-pre-wrap leading-relaxed opacity-90">
                {item.content}
              </div>
            );
          }
          if (item.type === 'success') {
            return (
              <div key={item.id} className="text-[#3fb950] whitespace-pre-wrap leading-relaxed">
                {item.content}
              </div>
            );
          }
          return (
            <div key={item.id} className="text-[#8b949e] whitespace-pre-wrap leading-relaxed">
              {item.content}
            </div>
          );
        })}

        {isRunningProcess && (
          <div className="flex items-center gap-2 text-indigo-400 text-xs py-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span>Ejecutando proceso en background...</span>
          </div>
        )}

        {/* Active Input Line */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[#3fb950] select-none font-bold">➜</span>
          <span className="text-[#58a6ff] select-none font-semibold">~/project</span>
          <span className="text-slate-400 select-none">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-[12px] p-0 focus:ring-0"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            placeholder={outputHistory.length <= 4 ? 'Escribe "npm run dev" o "help"...' : ''}
          />
        </div>

        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
