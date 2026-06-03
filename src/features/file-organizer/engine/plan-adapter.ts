import crypto from 'crypto';
import path from 'path';
import type { OrganizerOperation, OrganizerRiskLevel } from './types';

type LegacyOrganizationPlan = {
  moves?: Array<{ from: string; to: string; reason?: string; confidence?: number; risk?: OrganizerRiskLevel }>;
  redundant_files?: Array<{ path: string; reason?: string; action?: 'DELETE' | 'ARCHIVE' }>;
  new_dirs_to_create?: string[];
  refactor_plan?: Array<{ from: string; to: string; reason?: string; confidence?: number; risk?: OrganizerRiskLevel }>;
};

export function legacyPlanToOperations(plan: LegacyOrganizationPlan): OrganizerOperation[] {
  const operations: OrganizerOperation[] = [];
  const moves = plan.refactor_plan?.length ? plan.refactor_plan : plan.moves || [];

  for (const move of moves) {
    const isRename = path.posix.basename(move.from.replace(/\\/g, '/')) !== path.posix.basename(move.to.replace(/\\/g, '/'));
    operations.push({
      id: operationId(isRename ? 'rename' : 'move', move.from, move.to),
      type: isRename ? 'rename' : 'move',
      from: move.from,
      to: move.to,
      reason: move.reason || 'Move suggested by file organizer.',
      confidence: move.confidence ?? 0.9,
      risk: move.risk || 'low',
      reversible: true,
    });
  }

  for (const file of plan.redundant_files || []) {
    operations.push({
      id: operationId('archive', file.path, `.shimeji-trash/${file.path}`),
      type: 'archive',
      from: file.path,
      to: `.shimeji-trash/${file.path}`,
      reason: file.reason || 'Archive redundant file for reversible cleanup.',
      confidence: 0.9,
      risk: 'medium',
      reversible: true,
    });
  }

  return operations;
}

function operationId(type: string, from?: string, to?: string): string {
  return crypto.createHash('sha256').update(`${type}:${from || ''}:${to || ''}`).digest('hex');
}
