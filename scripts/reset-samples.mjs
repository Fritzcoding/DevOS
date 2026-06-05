#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const samplesRoot = path.resolve('samples');
const pristineRoot = path.join(samplesRoot, 'pristine');
const workRoot = path.join(samplesRoot, 'workdir');

rmSync(workRoot, { recursive: true, force: true });
mkdirSync(workRoot, { recursive: true });

for (const sample of [
  'code-fixer',
  'code-fixer-java-codebase',
  'env-builder-node-basic',
  'env-builder-python-basic',
  'file-organizer-messy',
  'file-organizer-logic',
  'file-organizer-ai',
]) {
  const source = path.join(pristineRoot, sample);
  if (!existsSync(source)) {
    throw new Error(`Missing sample: ${source}`);
  }
  cpSync(source, path.join(workRoot, sample), { recursive: true });
}

console.log('[samples] Reset samples/workdir from samples/pristine.');
