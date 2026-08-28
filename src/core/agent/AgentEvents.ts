import type { AgentEvent, AgentEventType } from '../types';

type EventCallback = (event: AgentEvent) => void;

export class AgentEventEmitter {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(type: AgentEventType | '*', callback: EventCallback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);
  }

  off(type: AgentEventType | '*', callback: EventCallback) {
    const list = this.listeners.get(type);
    if (!list) return;
    this.listeners.set(type, list.filter(cb => cb !== callback));
  }

  emit(type: AgentEventType, message: string, data?: any): AgentEvent {
    const event: AgentEvent = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      type,
      timestamp: new Date().toLocaleTimeString(),
      message,
      data,
    };

    const specific = this.listeners.get(type) || [];
    const wildcard = this.listeners.get('*') || [];
    [...specific, ...wildcard].forEach(cb => {
      try { cb(event); } catch (e) { console.error('Error in agent event listener:', e); }
    });

    return event;
  }
}

export const agentEvents = new AgentEventEmitter();
