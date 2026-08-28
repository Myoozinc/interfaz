import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Sparkles, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  Wand2, 
  Globe
} from 'lucide-react';
import type { AgentEvent } from '../core/types';
import { agentEvents } from '../core/agent/AgentEvents';

export const AgentActivityStream: React.FC = () => {
  const [events, setEvents] = useState<AgentEvent[]>([
    {
      id: 'init_evt',
      type: 'agent.completed',
      timestamp: new Date().toLocaleTimeString(),
      message: 'Agent Orchestrator listo para recibir instrucciones',
    }
  ]);

  useEffect(() => {
    const handleEvent = (evt: AgentEvent) => {
      setEvents(prev => [evt, ...prev.slice(0, 40)]);
    };

    agentEvents.on('*', handleEvent);
  }, []);

  return (
    <div className="h-44 bg-slate-900 text-slate-200 border-t border-slate-800 flex flex-col font-mono text-[11px] select-none">
      <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-bold text-slate-300 tracking-wider text-[10px] uppercase">
            NONA Agent Activity Stream
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Live Event Bus
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-slate-800/40">
        {events.map((evt) => (
          <div key={evt.id} className="pt-1.5 flex items-start gap-2 text-slate-300">
            <span className="text-slate-500 shrink-0 text-[10px] font-sans">[{evt.timestamp}]</span>
            
            <div className="flex items-center gap-1.5">
              {evt.type.includes('file') ? <FileCode className="w-3 h-3 text-indigo-400" /> :
               evt.type.includes('image') || evt.type.includes('video') ? <Wand2 className="w-3 h-3 text-violet-400" /> :
               evt.type.includes('deployment') ? <Globe className="w-3 h-3 text-blue-400" /> :
               evt.type.includes('completed') ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> :
               evt.type.includes('error') || evt.type.includes('failed') ? <AlertCircle className="w-3 h-3 text-red-400" /> :
               <Sparkles className="w-3 h-3 text-amber-400" />}
              
              <span className={
                evt.type.includes('error') ? 'text-red-400 font-bold' :
                evt.type.includes('completed') ? 'text-emerald-300' :
                'text-slate-300'
              }>
                {evt.message}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
