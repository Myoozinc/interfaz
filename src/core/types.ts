export interface ProjectFile {
  path: string;
  content: string;
  language: string;
  isModified?: boolean;
  size?: number;
}

export interface FullStackProject {
  id: string;
  name: string;
  description: string;
  files: Record<string, ProjectFile>;
  environmentVariables: Record<string, string>;
  databaseSchema?: string;
  framework: 'react-vite' | 'nextjs' | 'html-tailwind' | 'express-api';
  createdAt: string;
  updatedAt: string;
  gitRepo?: string;
  deploymentUrl?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      items?: any;
    }>;
    required?: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  success: boolean;
  output: string;
  data?: any;
  error?: string;
}

export type AgentEventType =
  | 'agent.started'
  | 'agent.thinking'
  | 'agent.plan.created'
  | 'agent.tool.started'
  | 'agent.tool.completed'
  | 'agent.file.created'
  | 'agent.file.modified'
  | 'agent.command.started'
  | 'agent.command.completed'
  | 'agent.build.started'
  | 'agent.build.failed'
  | 'agent.build.completed'
  | 'agent.test.started'
  | 'agent.test.failed'
  | 'agent.test.completed'
  | 'agent.image.started'
  | 'agent.image.progress'
  | 'agent.image.completed'
  | 'agent.video.started'
  | 'agent.video.completed'
  | 'deployment.started'
  | 'deployment.completed'
  | 'agent.completed'
  | 'agent.error';

export interface AgentEvent {
  id: string;
  type: AgentEventType;
  timestamp: string;
  message: string;
  data?: any;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'charge' | 'refund' | 'deposit' | 'bonus';
  amount: number;
  balanceAfter: number;
  reason: string;
  jobId?: string;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  userId: string;
  projectId: string;
  type: 'image' | 'video' | 'texture' | 'audio';
  url: string;
  prompt: string;
  workflow?: string;
  metadata?: Record<string, any>;
  jobId?: string;
  createdAt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

export interface SubsystemCheck {
  id: string;
  name: string;
  category: 'core' | 'ai' | 'media' | 'workspace' | 'integrations' | 'saas';
  status: 'PASS' | 'FAIL' | 'NOT_CONFIGURED' | 'CHECKING';
  message: string;
  details?: string;
  latencyMs?: number;
}
