import type { ApplyResult, OrganizerOperation, OrganizerPreview } from '../engine/types';

export type OrganizerIPCEvent =
  | { type: 'file-organizer.preview.created'; preview: OrganizerPreview }
  | { type: 'file-organizer.apply.completed'; result: ApplyResult }
  | { type: 'file-organizer.apply.failed'; error: string }
  | { type: 'file-organizer.rollback.completed'; result: ApplyResult };

export interface OrganizerApplyRequest {
  folderPath: string;
  operations: OrganizerOperation[];
  dryRun?: boolean;
}

export interface OrganizerRollbackRequest {
  folderPath: string;
  rollbackBatchId: string;
}
