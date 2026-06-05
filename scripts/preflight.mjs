#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const requiredNode = [20, 19, 0];
const requiredNpmMajor = 10;
const installMode = process.argv.includes('--install');

function parseVersion(value) {
  return String(value).replace(/^v/, '').split('.').map((part) => Number.parseInt(part, 10) || 0);
}

function isAtLeast(actual, required) {
  for (let i = 0; i < required.length; i += 1) {
    if ((actual[i] || 0) > required[i]) return true;
    if ((actual[i] || 0) < required[i]) return false;
  }
  return true;
}

function fail(message, detail = '') {
  console.error(`\n[preflight] ${message}`);
  if (detail) console.error(detail);
  process.exit(1);
}

const nodeVersion = parseVersion(process.version);
if (!isAtLeast(nodeVersion, requiredNode)) {
  fail(
    `Node.js ${requiredNode.join('.')} or newer is required. Current: ${process.version}`,
    'Install the current Node.js LTS from https://nodejs.org/ or use nvm/fnm/Volta, then run npm run setup again.'
  );
}

let npmVersionText = '';
try {
  npmVersionText = execSync('npm --version', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
} catch {
  fail('npm was not found on PATH.', 'Install Node.js from https://nodejs.org/; npm is included with the installer.');
}

const npmVersion = parseVersion(npmVersionText);
if ((npmVersion[0] || 0) < requiredNpmMajor) {
  fail(
    `npm ${requiredNpmMajor}.x or newer is required. Current: ${npmVersionText}`,
    'Run npm install -g npm@latest or update Node.js, then run npm run setup again.'
  );
}

if (!existsSync('package-lock.json')) {
  fail('package-lock.json is missing.', 'This repo uses npm. Restore the lockfile before installing so every laptop gets the same dependency tree.');
}

if (!installMode && !existsSync('node_modules')) {
  console.warn('[preflight] node_modules is missing. Run npm run setup to install dependencies before launching the app.');
}

if (!existsSync('.env.local')) {
  console.warn('[preflight] .env.local is missing. Cloud AI will ask for a key in AI Settings; local Ollama can still be used.');
}

console.log(`[preflight] OK: Node ${process.version}, npm ${npmVersionText}`);
