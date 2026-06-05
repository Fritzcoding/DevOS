import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Cloud, KeyRound, LogIn, Save, X } from 'lucide-react';

interface Props {
  projectPath: string;
  onClose: () => void;
  onBack?: () => void;
}

export const DiscussionRoomOverlay: React.FC<Props> = ({ projectPath, onClose, onBack }) => {
  const storageKey = `devops-room:${projectPath || 'default'}`;
  const [key, setKey] = useState(() => localStorage.getItem(`${storageKey}:key`) || '');
  const [syncUrl, setSyncUrl] = useState(() => localStorage.getItem('devops-room:sync-url') || '');
  const [generatedSyncUrl, setGeneratedSyncUrl] = useState('');
  const [content, setContent] = useState('');
  const [joined, setJoined] = useState(() => Boolean(localStorage.getItem(`${storageKey}:key`)));
  const [status, setStatus] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    localStorage.setItem('devops-room:sync-url', syncUrl.trim());
  }, [syncUrl]);

  useEffect(() => {
    let cancelled = false;
    window.electronAPI.getDiscussionSyncInfo().then((result) => {
      if (cancelled || !result.success || !result.url) return;
      setGeneratedSyncUrl(result.url);
      setSyncUrl((current) => current.trim() || result.url || '');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const savedKey = localStorage.getItem(`${storageKey}:key`) || '';
    setKey(savedKey);
    setJoined(Boolean(savedKey));
    setContent('');
    setDirty(false);
  }, [storageKey]);

  useEffect(() => {
    if (!joined || !key) return;
    const interval = setInterval(async () => {
      const result = await window.electronAPI.readDiscussionRoom(projectPath, key, syncUrl.trim() || undefined);
      if (result.success && typeof result.content === 'string' && result.content !== content && !dirty) {
        setContent(result.content);
        setStatus(result.remote ? 'Synced remote' : 'Synced local');
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [joined, key, projectPath, content, dirty, syncUrl]);

  useEffect(() => {
    if (!joined || !key || !dirty) return;
    const timeout = setTimeout(async () => {
      const result = await window.electronAPI.writeDiscussionRoom(projectPath, key, content, syncUrl.trim() || undefined);
      if (result.success) {
        setDirty(false);
        setStatus(result.remote ? 'Autosaved remote' : 'Autosaved');
      } else {
        setStatus(result.error || 'Autosave failed');
      }
    }, 700);
    return () => clearTimeout(timeout);
  }, [content, dirty, joined, key, projectPath, syncUrl]);

  const create = async () => {
    const result = await window.electronAPI.createDiscussionRoom(projectPath, syncUrl.trim() || undefined);
    if (result.success && result.key) {
      setKey(result.key);
      setContent(result.content || '');
      setJoined(true);
      setDirty(false);
      localStorage.setItem(`${storageKey}:key`, result.key);
      setStatus(result.remote ? `Created remote ${result.key}` : `Created ${result.key}`);
    } else {
      setStatus(result.error || 'Failed to create room');
    }
  };

  const join = async () => {
    const result = await window.electronAPI.joinDiscussionRoom(projectPath, key, syncUrl.trim() || undefined);
    if (result.success) {
      const normalizedKey = result.key || key;
      setKey(normalizedKey);
      setContent(result.content || '');
      setJoined(true);
      setDirty(false);
      localStorage.setItem(`${storageKey}:key`, normalizedKey);
      setStatus(result.remote ? `Joined remote ${normalizedKey}` : `Joined ${normalizedKey}`);
    } else {
      setStatus(result.error || 'Failed to join room');
    }
  };

  const save = async () => {
    const result = await window.electronAPI.writeDiscussionRoom(projectPath, key, content, syncUrl.trim() || undefined);
    if (result.success) setDirty(false);
    setStatus(result.success ? (result.remote ? 'Saved remote' : 'Saved') : result.error || 'Save failed');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-electron-interactive="true">
      <div className="flex h-[84vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-800 px-5 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold">Development Room</h2>
            <p className="text-xs text-slate-300">Auto-saved room by key. Share the generated sync URL for another laptop.</p>
          </div>
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold hover:bg-white/10" aria-label="Back to menu">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button onClick={onClose} className="rounded p-2 hover:bg-white/10" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-200 p-3">
          <button onClick={create} className="flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            <KeyRound className="h-4 w-4" /> Create
          </button>
          <input value={key} onChange={(e) => setKey(e.target.value.toUpperCase())} placeholder="ROOM KEY" className="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold uppercase" />
          <button onClick={join} disabled={!key.trim()} className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">
            <LogIn className="h-4 w-4" /> Join
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Cloud className="h-4 w-4 text-slate-400" />
            <input value={syncUrl} onChange={(e) => setSyncUrl(e.target.value)} placeholder={generatedSyncUrl || 'Sync URL'} className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="ml-auto text-xs text-slate-500">{status}</div>
        </div>

        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setDirty(true);
          }}
          disabled={!joined}
          className="min-h-0 flex-1 resize-none p-4 font-mono text-sm outline-none disabled:bg-slate-50"
          placeholder="Create or join a room to start shared development notes..."
        />

        <div className="flex items-center justify-between border-t border-slate-200 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {dirty ? <Save className="h-4 w-4 text-amber-600" /> : <Check className="h-4 w-4 text-emerald-600" />}
            {joined ? (dirty ? 'Unsaved changes' : 'Saved') : 'No room joined'}
          </div>
          <button onClick={save} disabled={!joined} className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscussionRoomOverlay;
