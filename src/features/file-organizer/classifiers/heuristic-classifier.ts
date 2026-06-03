import path from 'path';
import type { ClassificationResult, FileCategory } from '../engine/types';

const CATEGORY_BY_EXTENSION: Record<string, FileCategory> = {
  '.ts': 'code',
  '.tsx': 'code',
  '.js': 'code',
  '.jsx': 'code',
  '.py': 'code',
  '.java': 'code',
  '.go': 'code',
  '.rs': 'code',
  '.md': 'document',
  '.txt': 'document',
  '.pdf': 'document',
  '.doc': 'document',
  '.docx': 'document',
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.gif': 'image',
  '.webp': 'image',
  '.svg': 'development-asset',
  '.mp4': 'video',
  '.mov': 'video',
  '.csv': 'dataset',
  '.jsonl': 'dataset',
  '.parquet': 'dataset',
  '.zip': 'archive',
  '.tar': 'archive',
  '.gz': 'archive',
  '.7z': 'archive',
  '.log': 'logs',
  '.env': 'config',
  '.yml': 'config',
  '.yaml': 'config',
  '.toml': 'config',
  '.ini': 'config',
  '.onnx': 'ai-model',
  '.safetensors': 'ai-model',
  '.gguf': 'ai-model',
};

export function classifyByHeuristics(relPath: string): ClassificationResult {
  const normalized = relPath.replace(/\\/g, '/').toLowerCase();
  const ext = path.posix.extname(normalized);
  let category = CATEGORY_BY_EXTENSION[ext] || 'unknown';
  const tags = new Set<string>();

  if (normalized.includes('/test') || normalized.includes('.test.') || normalized.includes('.spec.')) tags.add('test');
  if (normalized.includes('research') || normalized.includes('paper')) category = 'research';
  if (normalized.includes('invoice') || normalized.includes('receipt') || normalized.includes('tax')) category = 'financial';
  if (normalized.includes('academic') || normalized.includes('university') || normalized.includes('thesis')) category = 'academic';
  if (normalized.includes('screenshot')) tags.add('screenshot');
  if (normalized.includes('typescript') || ['.ts', '.tsx'].includes(ext)) tags.add('typescript');
  if (normalized.includes('electron')) tags.add('electron');
  if (normalized.includes('react') || ext === '.tsx' || ext === '.jsx') tags.add('react');
  if (normalized.includes('docker')) tags.add('docker');
  if (normalized.includes('kubernetes') || normalized.includes('k8s')) tags.add('kubernetes');
  if (normalized.includes('tmp') || normalized.includes('temp') || normalized.endsWith('.bak')) category = 'temporary';

  return {
    category,
    tags: Array.from(tags),
    confidence: category === 'unknown' ? 0.35 : 0.78,
    reason: `Heuristic classification from extension "${ext || 'none'}" and path signals.`,
  };
}
