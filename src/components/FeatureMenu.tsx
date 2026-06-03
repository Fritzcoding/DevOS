import React, { useState, useRef, useEffect } from 'react';
import { Bot, Cloud, Crosshair, FolderOpen, HelpCircle, Laptop, MessageSquare, Package, RefreshCw, Settings, Users, X } from 'lucide-react';

interface FeatureMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onFeatureSelect: (feature: 'code-fixer' | 'environment' | 'organizer' | 'chat' | 'room' | 'help' | 'settings') => void;
  currentProjectPath: string | null;
  onChangeProjectPath: () => void;
  onRefreshProjectPath: () => void;
  onUseCurrentProjectPath: () => void;
  aiStatus?: any;
  onSetActiveAIBackend?: (backend: 'cloud' | 'local') => void;
}

/**
 * Feature Menu Popup - Minimal window showing features & project path
 * Appears on Shimeji click
 */
export const FeatureMenu: React.FC<FeatureMenuProps> = ({
  isOpen,
  onClose,
  onFeatureSelect,
  currentProjectPath,
  onChangeProjectPath,
  onRefreshProjectPath,
  onUseCurrentProjectPath,
  aiStatus,
  onSetActiveAIBackend,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const features = [
    {
      key: 'code-fixer' as const,
      icon: Bot,
      label: 'Code Fixer',
      description: 'Project-aware AI repair',
      color: 'from-slate-900 to-slate-700',
    },
    {
      key: 'environment' as const,
      icon: Package,
      label: 'Environment',
      description: 'Setup & detect environments',
      color: 'from-orange-600 to-orange-500',
    },
    {
      key: 'organizer' as const,
      icon: FolderOpen,
      label: 'File Organizer',
      description: 'Reorganize project files',
      color: 'from-purple-600 to-purple-500',
    },
    {
      key: 'chat' as const,
      icon: MessageSquare,
      label: 'Codebase Chat',
      description: 'Ask with repo context',
      color: 'from-cyan-700 to-cyan-600',
    },
    {
      key: 'room' as const,
      icon: Users,
      label: 'Dev Room',
      description: 'Shared notes by key',
      color: 'from-slate-700 to-slate-600',
    },
  ];

  return (
    <div className="fixed left-16 top-16 z-50 pointer-events-none" data-electron-interactive="true">
      <div
        ref={menuRef}
        className="pointer-events-auto relative max-h-[32rem] w-[22rem] overflow-auto rounded-xl border border-slate-200 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl p-4 animate-popIn"
      >
        <div className="absolute -top-2 left-8 h-4 w-4 rotate-45 rounded-sm bg-white/95 border-t border-l border-slate-200" />

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900">DevOps Lite</p>
            <p className="text-xs text-slate-500">Code workbench and project tools</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid gap-2">
          {features.map(({ key, icon: Icon, label, description, color }) => (
            <button
              key={key}
              onClick={() => {
                onFeatureSelect(key);
                onClose();
              }}
              className={`group flex items-center gap-3 rounded-lg px-4 py-3 bg-gradient-to-r ${color} text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white/15 text-white transition-colors duration-300 group-hover:bg-white/20">
                <Icon className="w-5 h-5" />
              </span>
              <div className="text-left">
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs opacity-90">{description}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project path</div>
            <div className="mt-1 truncate text-xs text-slate-700" title={currentProjectPath || undefined}>
              {currentProjectPath || 'No project path selected'}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onChangeProjectPath}
              className="flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Browse
            </button>
            <button
              onClick={onUseCurrentProjectPath}
              className="flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Crosshair className="w-3.5 h-3.5" />
              Current
            </button>
            <button
              onClick={onRefreshProjectPath}
              className="flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          {aiStatus?.canToggle && (
            <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI route</span>
                <button
                  onClick={() => onFeatureSelect('settings')}
                  className="rounded p-1 text-slate-500 transition hover:bg-slate-200 active:scale-[0.97]"
                  aria-label="Open AI settings"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  ['cloud', Cloud, 'Cloud'],
                  ['local', Laptop, 'Local'],
                ].map(([value, Icon, label]) => (
                  <button
                    key={value as string}
                    onClick={() => onSetActiveAIBackend?.(value as 'cloud' | 'local')}
                    className={`flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold transition active:scale-[0.97] ${
                      aiStatus.settings?.activeBackend === value
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label as string}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onFeatureSelect('settings');
                onClose();
              }}
              className="flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.97]"
            >
              <Settings className="w-4 h-4" />
              AI Settings
            </button>
            <button
              onClick={() => {
                onFeatureSelect('help');
                onClose();
              }}
              className="flex items-center justify-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.97]"
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureMenu;
