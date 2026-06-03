import React, { useEffect, useState } from 'react';
import { ArrowLeft, KeyRound, LogIn, Save, X } from 'lucide-react';

interface Props {
  projectPath: string;
  onClose: () => void;
  onBack?: () => void;
}

export const DiscussionRoomOverlay: React.FC<Props> = ({ projectPath, onClose, onBack }) => {
  const [key, setKey] = useState('');
  const [content, setContent] = useState('');
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!joined || !key) return;
    const interval = setInterval(async () => {
      const result = await window.electronAPI.readDiscussionRoom(projectPath, key);
      if (result.success && typeof result.content === 'string' && result.content !== content) {
        setContent(result.content);
        setStatus('Synced');
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [joined, key, projectPath, content]);

  const create = async () => {
    const result = await window.electronAPI.createDiscussionRoom(projectPath);
    if (result.success && result.key) {
      setKey(result.key);
      setContent(result.content || '');
      setJoined(true);
      setStatus(`Created ${result.key}`);
    } else {
      setStatus(result.error || 'Failed to create room');
    }
  };

  const join = async () => {
    const result = await window.electronAPI.joinDiscussionRoom(projectPath, key);
    if (result.success) {
      setContent(result.content || '');
      setJoined(true);
      setStatus(`Joined ${result.key}`);
    } else {
      setStatus(result.error || 'Failed to join room');
    }
  };

  const save = async () => {
    const result = await window.electronAPI.writeDiscussionRoom(projectPath, key, content);
    setStatus(result.success ? 'Saved' : result.error || 'Save failed');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-electron-interactive="true">
      <div className="flex h-[84vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-800 px-5 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold">Development Room</h2>
            <p className="text-xs text-slate-300">File-backed shared room in the selected project. Share the key with teammates using the same folder.</p>
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
          <div className="ml-auto text-xs text-slate-500">{status}</div>
        </div>

        <textarea value={content} onChange={(e) => setContent(e.target.value)} disabled={!joined} className="min-h-0 flex-1 resize-none p-4 font-mono text-sm outline-none disabled:bg-slate-50" placeholder="Create or join a room to start shared development notes..." />

        <div className="flex justify-end border-t border-slate-200 p-3">
          <button onClick={save} disabled={!joined} className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscussionRoomOverlay;
