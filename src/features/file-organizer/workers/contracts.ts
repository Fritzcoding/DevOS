import type { OrganizerConfig, OrganizerPreview } from '../engine/types';

export type OrganizerWorkerRequest =
  | { type: 'scan'; rootDir: string; config?: Partial<OrganizerConfig>; instruction?: string }
  | { type: 'shutdown' };

export type OrganizerWorkerResponse =
  | { type: 'preview'; preview: OrganizerPreview }
  | { type: 'progress'; message: string; progress: number }
  | { type: 'error'; error: string };
