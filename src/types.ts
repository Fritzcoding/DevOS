import type {
  FixCodeRequest,
  FixCodeResponse,
  ChatRequest,
  ChatResponse,
  DetectEnvRequest,
  DetectEnvResponse,
  SetupEnvRequest,
  SetupEnvResponse,
  IPCError,
  IPCErrorCode,
} from './ipc-types';

export type { FixCodeRequest, FixCodeResponse, ChatRequest, ChatResponse, IPCError, IPCErrorCode };

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  language?: string;
  children?: FileNode[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface DebugIssue {
  id: string;
  type: "error" | "warning" | "info";
  line: number;
  message: string;
  suggestion?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "review" | "done";
  assignee: string;
}

export interface FileOrganizationResult {
  [category: string]: OrganizedFile[];
}

export interface OrganizedFile {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number | string;
}

export interface EnvironmentDetection {
  nodejs: boolean;
  python: boolean;
  java: boolean;
  frameworks: string[];
}

/**
 * Legacy interface maintained for backward compatibility
 * Use FixCodeResponse from ipc-types.ts for new code
 */
export interface AIResponse {
  fixedCode?: string;
  explanation: string;
  warnings?: string[];
  response?: string;
}

export interface AIResponse {
  fixedCode?: string;
  explanation: string;
  warnings?: string[];
  response?: string;
}

export interface ToolConfig {
  folderPath?: string;
  projectPath?: string;
  selectedFiles?: string[];
  rules?: Record<string, string[]>;
}
