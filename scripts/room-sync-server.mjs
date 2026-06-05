#!/usr/bin/env node
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';

const app = express();
const port = Number(process.env.PORT || 8787);
const dataDir = path.resolve(process.env.ROOM_SYNC_DATA_DIR || '.devops-lite', 'remote-rooms');

app.use(express.json({ limit: '2mb' }));

function roomPath(key) {
  const clean = String(key || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!clean) throw new Error('Room key is required');
  return path.join(dataDir, `${clean}.md`);
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/rooms/:key', async (req, res) => {
  try {
    const file = roomPath(req.params.key);
    const content = await fs.readFile(file, 'utf8');
    const stat = await fs.stat(file);
    res.json({ content, updatedAt: stat.mtimeMs });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.put('/rooms/:key', async (req, res) => {
  try {
    const file = roomPath(req.params.key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, String(req.body?.content || ''), 'utf8');
    const stat = await fs.stat(file);
    res.json({ updatedAt: stat.mtimeMs });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[room-sync] Listening on http://0.0.0.0:${port}`);
  console.log(`[room-sync] Data directory: ${dataDir}`);
});
