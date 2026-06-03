import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Grip, Send, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  projectPath: string;
  visible: boolean;
  panelSize: { width: number; height: number };
  onPanelSizeChange: (size: { width: number; height: number }) => void;
  onClose: () => void;
  onBack?: () => void;
}

export const CodebaseChatOverlay: React.FC<Props> = ({ projectPath, visible, panelSize, onPanelSizeChange, onClose, onBack }) => {
  const storageKey = `devops-codebase-chat:${projectPath}`;
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setMessages(Array.isArray(saved) ? saved : []);
    } catch {
      setMessages([]);
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-80)));
  }, [messages, storageKey]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const nextMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const result = await window.electronAPI.chatWithCodebase(projectPath, text, messages);
      const content = result?.status === 'error' ? result.error || 'Chat failed' : result.response || '';
      setMessages([...nextMessages, { role: 'assistant', content }]);
    } catch (err) {
      setMessages([...nextMessages, { role: 'assistant', content: err instanceof Error ? err.message : String(err) }]);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-electron-interactive="true">
      <div
        className="relative flex min-h-[420px] min-w-[420px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
        style={{
          width: Math.max(420, panelSize.width - 32),
          height: Math.max(420, panelSize.height - 32),
        }}
      >
        <div className="flex items-center justify-between bg-blue-700 px-5 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold">Codebase Chat</h2>
            <p className="text-xs text-blue-100">{projectPath}</p>
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

        <div className="flex-1 space-y-3 overflow-auto bg-slate-50 p-4">
          {messages.length === 0 && <div className="text-sm text-slate-500">Ask about bugs, architecture, files, tests, or implementation details.</div>}
          {messages.map((message, index) => (
            <div key={index} className={`rounded-lg p-3 text-sm ${message.role === 'user' ? 'ml-auto max-w-[80%] bg-blue-700 text-white' : 'mr-auto max-w-[88%] border border-slate-200 bg-white text-slate-800'}`}>
              <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
            </div>
          ))}
          {loading && <div className="text-sm text-slate-500">Reading codebase...</div>}
        </div>

        <div className="flex gap-2 border-t border-slate-200 p-3">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }} rows={2} className="flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Ask anything about this codebase..." />
          <button onClick={send} disabled={loading || !input.trim()} className="rounded-md bg-blue-700 px-4 py-2 text-white disabled:opacity-50">
            <Send className="h-5 w-5" />
          </button>
        </div>

        <div
          className="absolute bottom-1 right-1 cursor-nwse-resize rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          title="Resize panel"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            resizeStartRef.current = {
              x: event.screenX,
              y: event.screenY,
              width: panelSize.width,
              height: panelSize.height,
            };
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            const deltaX = event.screenX - resizeStartRef.current.x;
            const deltaY = event.screenY - resizeStartRef.current.y;
            onPanelSizeChange({
              width: resizeStartRef.current.width + deltaX,
              height: resizeStartRef.current.height + deltaY,
            });
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
        >
          <Grip className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

export default CodebaseChatOverlay;
