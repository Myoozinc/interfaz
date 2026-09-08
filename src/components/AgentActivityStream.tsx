import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Sparkles, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  Wand2, 
  Globe,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import type { AgentEvent } from '../core/types';
import { agentEvents } from '../core/agent/AgentEvents';

export const AgentActivityStream: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [events, setEvents] = useState<AgentEvent[]>([
    {
      id: 'init_evt',
      type: 'agent.completed',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: 'Agent Orchestrator listo para recibir instrucciones',
    }
  ]);

  useEffect(() => {
    const handleEvent = (evt: AgentEvent) => {
      setEvents(prev => [evt, ...prev.slice(0, 40)]);
    };

    agentEvents.on('*', handleEvent);
  }, []);

  const latestEvent = events[0] || null;

  return (
    <div className="bg-slate-950 text-slate-200 border-t border-slate-800 flex flex-col font-mono text-[11px] select-none shrink-0 transition-all">
      
      {/* Sleek Minimalist Status Strip (Only 26px height when collapsed) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-6.5 px-3 bg-slate-950 hover:bg-slate-900/90 flex items-center justify-between cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          <Terminal className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Activity
          </span>
          <span className="text-slate-600 shrink-0">|</span>
          {latestEvent && (
            <span className="text-[10px] text-slate-300 truncate max-w-[400px] sm:max-w-[650px]">
              {latestEvent.message}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Expanded Log Drawer */}
      {isExpanded && (
        <div className="h-40 overflow-y-auto p-3 space-y-1 divide-y divide-slate-800/40 bg-slate-900/95">
          {events.map((evt) => (
            <div key={evt.id} className="pt-1 flex items-start gap-2 text-slate-300">
              <span className="text-slate-500 shrink-0 text-[10px] font-sans">[{evt.timestamp}]</span>
              
              <div className="flex items-center gap-1.5">
                {evt.type.includes('file') ? <FileCode className="w-3 h-3 text-indigo-400" /> :
                 evt.type.includes('image') || evt.type.includes('video') ? <Wand2 className="w-3 h-3 text-violet-400" /> :
                 evt.type.includes('deployment') ? <Globe className="w-3 h-3 text-blue-400" /> :
                 evt.type.includes('completed') ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> :
                 evt.type.includes('error') || evt.type.includes('failed') ? <AlertCircle className="w-3 h-3 text-red-400" /> :
                 <Sparkles className="w-3 h-3 text-amber-400" />}
                
                <span className={
                  evt.type.includes('error') ? 'text-red-400' :
                  evt.type.includes('completed') ? 'text-emerald-300' :
                  evt.type.includes('thinking') ? 'text-indigo-300' :
                  'text-slate-300'
                }>
                  {evt.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
