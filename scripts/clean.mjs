#!/usr/bin/env node
import { rmSync } from 'node:fs';

for (const target of ['dist', 'main.js', 'main.js.map', 'preload.js', 'preload.js.map']) {
  rmSync(target, { recursive: true, force: true });
}

console.log('[clean] Removed generated build artifacts.');
