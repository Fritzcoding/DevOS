import React, { useState } from 'react';
import { ArrowLeft, Brain, FolderTree, Play, X } from 'lucide-react';

interface Props {
  projectPath: string;
  onClose: () => void;
  onBack?: () => void;
  onPlanReady: (plan: any) => void;
}

export const FileOrganizerWorkbench: React.FC<Props> = ({ projectPath, onClose, onBack, onPlanReady }) => {
  const [mode, setMode] = useState<'professional' | 'ai'>('professional');
  const [instruction, setInstruction] = useState('Sort this project into a professional structure while keeping source code imports safe.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.organizeFolder(projectPath, undefined, mode, instruction);
      if (result?.status === 'error') {
        setError(result.error || 'Organizer failed');
        return;
      }
      onPlanReady(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-electron-interactive="true">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-purple-700 px-5 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold">File Organizer</h2>
            <p className="text-xs text-purple-100">Create a professional or AI-guided organization plan before applying changes.</p>
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

        <div className="space-y-4 p-5">
          <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            {projectPath}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setMode('professional')} className={`rounded-md border p-4 text-left ${mode === 'professional' ? 'border-purple-700 bg-purple-50' : 'border-slate-200'}`}>
              <FolderTree className="mb-2 h-5 w-5 text-purple-700" />
              <div className="font-semibold">Professional sorting</div>
              <div className="text-xs text-slate-500">Conservative rules for docs, assets, scripts, tests, and cleanup.</div>
            </button>
            <button onClick={() => setMode('ai')} className={`rounded-md border p-4 text-left ${mode === 'ai' ? 'border-purple-700 bg-purple-50' : 'border-slate-200'}`}>
              <Brain className="mb-2 h-5 w-5 text-purple-700" />
              <div className="font-semibold">AI instruction</div>
              <div className="text-xs text-slate-500">Describe exactly how the selected path should be sorted.</div>
            </button>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Sorting instruction</span>
            <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} rows={5} className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>

          {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>
            <button onClick={run} disabled={loading} className="flex items-center gap-2 rounded-md bg-purple-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              <Play className="h-4 w-4" /> {loading ? 'Planning...' : 'Create Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileOrganizerWorkbench;
