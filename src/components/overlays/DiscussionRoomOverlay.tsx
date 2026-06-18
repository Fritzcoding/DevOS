import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bot, Check, Cloud, KeyRound, LogIn, Save, Send, X } from 'lucide-react';

interface Props {
  projectPath: string;
  onClose: () => void;
  onBack?: () => void;
}

export const DiscussionRoomOverlay: React.FC<Props> = ({ projectPath, onClose, onBack }) => {
  const storageKey = `devops-room:${projectPath || 'default'}`;
  const aiPanelSizeKey = `${storageKey}:ai-panel-size`;
  const resizeStartRef = useRef({ x: 0, y: 0, size: 352 });
  const aiPanelSizeKeyRef = useRef(aiPanelSizeKey);
  const skipPanelSizePersistRef = useRef(false);
  const [key, setKey] = useState(() => localStorage.getItem(`${storageKey}:key`) || '');
  const [syncUrl, setSyncUrl] = useState(() => localStorage.getItem('devops-room:sync-url') || '');
  const [generatedSyncUrl, setGeneratedSyncUrl] = useState('');
  const [content, setContent] = useState('');
  const [joined, setJoined] = useState(() => Boolean(localStorage.getItem(`${storageKey}:key`)));
  const [status, setStatus] = useState('');
  const [dirty, setDirty] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPanelSize, setAiPanelSize] = useState(() => {
    const saved = Number(localStorage.getItem(aiPanelSizeKey));
    return Number.isFinite(saved) && saved >= 260 ? saved : 352;
  });
  const [wideLayout, setWideLayout] = useState(() => window.matchMedia('(min-width: 1024px)').matches);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const handleChange = () => setWideLayout(media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (aiPanelSizeKeyRef.current === aiPanelSizeKey) return;
    skipPanelSizePersistRef.current = true;
    aiPanelSizeKeyRef.current = aiPanelSizeKey;
    const saved = Number(localStorage.getItem(aiPanelSizeKey));
    setAiPanelSize(Number.isFinite(saved) && saved >= 260 ? saved : 352);
  }, [aiPanelSizeKey]);

  useEffect(() => {
    if (skipPanelSizePersistRef.current) {
      skipPanelSizePersistRef.current = false;
      return;
    }
    localStorage.setItem(aiPanelSizeKey, String(Math.round(aiPanelSize)));
  }, [aiPanelSize, aiPanelSizeKey]);

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

  const askAI = async () => {
    const question = aiInput.trim();
    if (!question || aiLoading) return;
    const noteContext = content.trim()
      ? `Dev Room notes:\n${content.slice(0, 6000)}\n\nQuestion:\n${question}`
      : question;
    const nextMessages = [...aiMessages, { role: 'user' as const, content: question }];
    setAiMessages(nextMessages);
    setAiInput('');
    setAiLoading(true);
    try {
      const result = await window.electronAPI.chatWithCodebase(projectPath, noteContext, aiMessages);
      const response = result?.status === 'error' ? result.error || 'AI request failed' : result.response || 'No response.';
      setAiMessages([...nextMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      setAiMessages([...nextMessages, { role: 'assistant', content: error instanceof Error ? error.message : String(error) }]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-electron-interactive="true">
      <div className="flex h-[84vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
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

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
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

          <div
            className="group flex h-3 cursor-row-resize items-center justify-center border-y border-slate-200 bg-slate-100 transition hover:bg-slate-200 lg:h-auto lg:w-3 lg:cursor-col-resize lg:border-x lg:border-y-0"
            title="Drag to resize Ask AI"
            role="separator"
            aria-label="Resize Ask AI panel"
            aria-orientation={wideLayout ? 'vertical' : 'horizontal'}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              resizeStartRef.current = {
                x: event.screenX,
                y: event.screenY,
                size: aiPanelSize,
              };
            }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              const delta = wideLayout
                ? event.screenX - resizeStartRef.current.x
                : event.screenY - resizeStartRef.current.y;
              const min = 260;
              const max = wideLayout
                ? Math.max(320, window.innerWidth - 560)
                : Math.max(320, window.innerHeight - 360);
              setAiPanelSize(Math.min(max, Math.max(min, resizeStartRef.current.size - delta)));
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
          >
            <div className="h-1 w-10 rounded-full bg-slate-300 group-hover:bg-slate-400 lg:h-10 lg:w-1" />
          </div>

          <aside
            className="flex min-h-0 shrink-0 flex-col border-t border-slate-200 bg-slate-50 lg:border-l lg:border-t-0"
            style={wideLayout ? { width: aiPanelSize } : { height: aiPanelSize }}
          >
            <div className="border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Bot className="h-4 w-4 text-slate-600" />
                Ask AI
              </div>
              <p className="mt-1 text-xs text-slate-500">Repo-aware answers using this room's notes as context.</p>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
              {aiMessages.length === 0 && (
                <div className="rounded-md border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
                  Ask about implementation details, bugs, tests, or decisions from the shared notes.
                </div>
              )}
              {aiMessages.map((message, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-3 text-sm ${
                    message.role === 'user'
                      ? 'ml-auto max-w-[88%] bg-slate-900 text-white'
                      : 'mr-auto max-w-[94%] border border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                </div>
              ))}
              {aiLoading && <div className="text-xs text-slate-500">Reading repo context...</div>}
            </div>

            <div className="border-t border-slate-200 bg-white p-3">
              <div className="flex gap-2">
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      askAI();
                    }
                  }}
                  rows={2}
                  className="min-w-0 flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  placeholder="Ask AI about this repo..."
                />
                <button
                  onClick={askAI}
                  disabled={aiLoading || !aiInput.trim()}
                  className="rounded-md bg-slate-900 px-3 py-2 text-white disabled:opacity-50"
                  aria-label="Ask AI"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>

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
