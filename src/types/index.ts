export interface FileItem {
  id: string;
  name: string;
  language: 'html' | 'css' | 'javascript' | 'typescript' | 'json' | 'markdown';
  content: string;
  isModified?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  codeSnippets?: {
    filename?: string;
    language: string;
    code: string;
  }[];
  costCredits?: number;
  modelUsed?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  files: FileItem[];
}

export interface OllamaModelInfo {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

export interface UserCredits {
  balance: number;
  maxFree: number;
  totalUsed: number;
  plan: 'free' | 'starter' | 'pro';
}
