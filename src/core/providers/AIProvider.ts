import type { ToolDefinition } from '../types';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  images?: string[];
  toolCallId?: string;
  name?: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  signal?: AbortSignal;
}

export interface AIProvider {
  id: string;
  name: string;
  checkHealth(): Promise<{ ok: boolean; message: string; details?: any }>;
  listModels(): Promise<string[]>;
  chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string>;
  streamChat(
    messages: AIMessage[],
    onToken: (token: string, fullText: string, isThinking?: boolean) => void,
    options?: AICompletionOptions
  ): Promise<string>;
}
