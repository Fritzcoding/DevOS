#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const fixturesRoot = path.resolve('tests', 'fixtures');
const pristineRoot = path.join(fixturesRoot, 'pristine');
const workRoot = path.join(fixturesRoot, 'workdir');

rmSync(workRoot, { recursive: true, force: true });
mkdirSync(workRoot, { recursive: true });

for (const fixture of ['environment-node-python', 'organizer-mixed-files', 'organizer-logic-files', 'organizer-ai-files']) {
  const source = path.join(pristineRoot, fixture);
  if (!existsSync(source)) {
    throw new Error(`Missing pristine fixture: ${source}`);
  }
  cpSync(source, path.join(workRoot, fixture), { recursive: true });
}

console.log('[fixtures] Reset tests/fixtures/workdir from pristine fixtures.');
