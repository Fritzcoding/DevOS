import React, { useState } from 'react';
import { ArrowLeft, Package, Play, X } from 'lucide-react';
import type { TestSample } from '../../window';

interface Props {
  projectPath: string;
  samples?: TestSample[];
  onUseSample?: (sample: TestSample) => void;
  onResetSamples?: () => void;
  onClose: () => void;
  onBack?: () => void;
  onDetected: (data: any) => void;
}

export const EnvironmentBuilderWorkbench: React.FC<Props> = ({
  projectPath,
  samples = [],
  onUseSample,
  onResetSamples,
  onClose,
  onBack,
  onDetected,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const envSamples = samples.filter((item) => item.feature === 'environment');

  const run = async () => {
    if (!projectPath) {
      setError('Please select a project path or use the test sample first');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.detectEnv(projectPath);
      if (result?.status === 'error') {
        setError(result.error || 'Failed to detect environment');
        return;
      }
      onDetected({
        detected_type: result?.detected_type || 'unknown',
        missing_tools: result?.missing_tools || [],
        setup_steps: result?.setup_steps || [],
        env_vars_needed: result?.env_vars_needed || [],
        estimated_minutes: result?.estimated_minutes || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-electron-interactive="true">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-emerald-700 px-5 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold">Environment Builder</h2>
            <p className="text-xs text-emerald-100">Detect project tools and setup steps before running commands.</p>
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
            {projectPath || 'No project path selected'}
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Test sample</span>
              <button onClick={onResetSamples} className="rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">Reset</button>
            </div>
            {envSamples.length ? (
              <div className="grid gap-2">
                {envSamples.map((sample) => (
                  <button
                    key={sample.key}
                    onClick={() => onUseSample?.(sample)}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100"
                    title={sample.path}
                  >
                    <div className="text-sm font-semibold text-slate-900">{sample.label}</div>
                    <div className="truncate text-xs text-slate-500">{sample.description}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">Samples not available.</div>
            )}
          </div>

          {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>
            <button onClick={run} disabled={loading} className="flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              <Play className="h-4 w-4" /> {loading ? 'Detecting...' : 'Detect Environment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentBuilderWorkbench;
