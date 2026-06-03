export type OrganizerMode = 'manual' | 'smart-assist' | 'autonomous' | 'professional' | 'ai';
export type OrganizerRiskLevel = 'low' | 'medium' | 'high';
export type OrganizerActionType = 'move' | 'archive' | 'rename' | 'mkdir';
export type FileCategory =
  | 'code'
  | 'document'
  | 'image'
  | 'video'
  | 'dataset'
  | 'archive'
  | 'project'
  | 'config'
  | 'temporary'
  | 'logs'
  | 'research'
  | 'academic'
  | 'financial'
  | 'ai-model'
  | 'development-asset'
  | 'unknown';

export interface OrganizerFeatureFlags {
  enabled: boolean;
  semanticIndexing: boolean;
  aiReasoning: boolean;
  autonomousApply: boolean;
  watchers: boolean;
}

export interface OrganizerConfig {
  rootDir: string;
  mode: OrganizerMode;
  confidenceThreshold: number;
  maxOperationsPerRun: number;
  protectedDirectories: string[];
  featureFlags: OrganizerFeatureFlags;
}

export interface FileMetadata {
  relPath: string;
  absPath: string;
  sizeBytes: number;
  extension: string;
  modifiedAt: string;
  category: FileCategory;
  tags: string[];
  hash?: string;
  embeddingId?: string;
  summary?: string;
}

export interface ClassificationResult {
  category: FileCategory;
  tags: string[];
  confidence: number;
  reason: string;
}

export interface OrganizerOperation {
  id: string;
  type: OrganizerActionType;
  from?: string;
  to?: string;
  reason: string;
  confidence: number;
  risk: OrganizerRiskLevel;
  reversible: boolean;
}

export interface OrganizerPreview {
  generatedAt: string;
  rootDir: string;
  mode: OrganizerMode;
  operations: OrganizerOperation[];
  metadata: FileMetadata[];
  summary: string;
  riskLevel: OrganizerRiskLevel;
  warnings: string[];
}

export interface RollbackEntry {
  id: string;
  operationId: string;
  type: OrganizerActionType;
  from?: string;
  to?: string;
  rollbackFrom?: string;
  rollbackTo?: string;
  timestamp: string;
  status: 'applied' | 'rolled-back' | 'failed';
  error?: string;
}

export interface ApplyResult {
  success: boolean;
  appliedCount: number;
  skippedCount: number;
  fileOperationCount?: number;
  directoryOperationCount?: number;
  rollbackBatchId: string;
  rollbackLogPath: string;
  errors: string[];
}

export interface AIProvider {
  classify?(file: FileMetadata): Promise<ClassificationResult>;
  summarize?(content: string, metadata: FileMetadata): Promise<string>;
  embed?(input: string): Promise<number[]>;
}

export interface VectorIndex {
  upsert(id: string, vector: number[], metadata: Record<string, unknown>): Promise<void>;
  search(vector: number[], limit: number): Promise<Array<{ id: string; score: number }>>;
}
