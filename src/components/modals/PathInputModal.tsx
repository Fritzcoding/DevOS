import React, { useState } from 'react';
import { ArrowLeft, FolderOpen, X, Check } from 'lucide-react';

interface PathInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSelectPath: (path: string) => Promise<void>;
  title?: string;
  description?: string;
}

/**
 * Path Input Modal - Allows user to browse or type a project path
 */
export const PathInputModal: React.FC<PathInputModalProps> = ({
  isOpen,
  onClose,
  onBack,
  onSelectPath,
  title = 'Select Project Path',
  description = 'Choose a folder to analyze',
}) => {
  const [manualPath, setManualPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBrowse = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI?.selectProjectPath?.();
      if (result?.success && result?.path) {
        await onSelectPath(result.path);
        onClose();
      } else if (!result?.canceled) {
        setError('Failed to select path');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to select path';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPath.trim()) {
      setError('Please enter a valid path');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await onSelectPath(manualPath.trim());
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid path';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" data-electron-interactive="true">
      <div className="relative w-full max-w-md rounded-lg border border-white/70 bg-white shadow-2xl animate-popIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                aria-label="Back to menu"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Browse Button */}
          <button
            onClick={handleBrowse}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-white font-semibold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FolderOpen className="w-5 h-5" />
            {isLoading ? 'Opening...' : 'Browse Folder'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-sm text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Manual Input */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Enter path manually
            </label>
            <input
              type="text"
              value={manualPath}
              onChange={(e) => {
                setManualPath(e.target.value);
                setError(null);
              }}
              placeholder="C:\projects\my-app or /home/user/projects/my-app"
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !manualPath.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 px-4 py-3 text-white font-semibold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-5 h-5" />
              {isLoading ? 'Processing...' : 'Confirm Path'}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PathInputModal;
