import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Bot, Check, ChevronDown, ChevronRight, Clipboard, Columns2, Copy, File, FileCode, Folder, FolderSearch, Lightbulb, Save, Sparkles, X } from 'lucide-react';
import type { TestSample } from '../../window';

type CodeFixScope = 'clipboard' | 'file' | 'codebase';
type CodeFixTab = 'setup' | 'review';
type CodeFixMode = 'manual' | 'ai';

type FileGroup = {
  path: string;
  changes: any[];
  original: string;
  fixed: string;
};

type FileTreeNode = {
  name: string;
  path: string;
  type: 'folder' | 'file';
  children: FileTreeNode[];
  group?: FileGroup;
};

interface Props {
  projectPath: string;
  samples?: TestSample[];
  onUseSample?: (sample: TestSample) => void;
  onResetSamples?: () => void;
  onClose: () => void;
  onBack?: () => void;
}

const scopeLabel: Record<CodeFixScope, string> = {
  clipboard: 'Clipboard snippet',
  file: 'Single file',
  codebase: 'Whole codebase',
};

function buildFileTree(groups: FileGroup[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const folders = new Map<string, FileTreeNode>();

  for (const group of groups) {
    const parts = group.path.split(/[\\/]+/).filter(Boolean);
    if (parts.length === 0) continue;
    let siblings = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;
      if (isFile) {
        siblings.push({ name: part, path: group.path, type: 'file', children: [], group });
        return;
      }

      let folder = folders.get(currentPath);
      if (!folder) {
        folder = { name: part, path: currentPath, type: 'folder', children: [] };
        folders.set(currentPath, folder);
        siblings.push(folder);
      }
      siblings = folder.children;
    });
  }

  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(root);
  return root;
}

export const CodeFixerAgentOverlay: React.FC<Props> = ({ projectPath, samples = [], onUseSample, onResetSamples, onClose, onBack }) => {
  const [activeTab, setActiveTab] = useState<CodeFixTab>('setup');
  const [scope, setScope] = useState<CodeFixScope>('codebase');
  const [mode, setMode] = useState<CodeFixMode>('manual');
  const [instruction, setInstruction] = useState('Find the bug, keep the fix minimal, and apply only what is needed.');
  const [filePath, setFilePath] = useState('');
  const [applyDirectly, setApplyDirectly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [selectedSampleKey, setSelectedSampleKey] = useState('');
  const [sampleContent, setSampleContent] = useState('');
  const [sampleStatus, setSampleStatus] = useState('');
  const [sampleLoading, setSampleLoading] = useState(false);

  const changes = useMemo(() => (Array.isArray(result?.changes) ? result.changes : []), [result]);
  const fileDiffs = useMemo(() => (Array.isArray(result?.fileDiffs) ? result.fileDiffs : []), [result]);
  const fileGroups = useMemo<FileGroup[]>(() => {
    if (fileDiffs.length > 0) {
      return fileDiffs.map((diff: any) => ({
        path: diff.path || 'Clipboard snippet',
        changes: Array.isArray(diff.changes) ? diff.changes : [],
        original: diff.original || '',
        fixed: diff.fixed || '',
      }));
    }

    const groups = new Map<string, any[]>();
    for (const change of changes) {
      const key = change.path || 'Clipboard snippet';
      groups.set(key, [...(groups.get(key) || []), change]);
    }
    return Array.from(groups, ([path, fileChanges]) => ({
      path,
      changes: fileChanges,
      original: fileChanges.map((change) => change.original || '').join('\n\n'),
      fixed: fileChanges.map((change) => change.fixed || '').join('\n\n'),
    }));
  }, [changes, fileDiffs]);
  const selectedGroup = fileGroups.find((group) => group.path === selectedFile) || fileGroups[0];
  const fileTree = useMemo(() => buildFileTree(fileGroups), [fileGroups]);
  const confidence = Number(result?.confidence || 0);
  const codeFixerSamples = samples.filter((sample) => sample.feature === 'code-fixer');
  const selectedSample = codeFixerSamples.find((sample) => sample.key === selectedSampleKey);
  const effectiveProjectPath = selectedSample?.projectPath || projectPath;

  const selectSample = async (sample: TestSample) => {
    setSelectedSampleKey(sample.key);
    setScope((sample.scope as CodeFixScope) || 'codebase');
    setFilePath(sample.scope === 'file' ? sample.filePath || '' : '');
    setError(null);
    setSampleStatus('');
    onUseSample?.(sample);
  };

  useEffect(() => {
    let cancelled = false;
    const loadSample = async () => {
      if (!selectedSample?.path || selectedSample.scope === undefined) return;
      setSampleLoading(true);
      setSampleStatus('');
      try {
        const result = await window.electronAPI.readFile(selectedSample.path);
        if (cancelled) return;
        if (result?.status === 'error') {
          setSampleContent('');
          setSampleStatus(result.error || 'Could not load sample file');
          return;
        }
        setSampleContent(result.content || '');
      } catch (err) {
        if (!cancelled) {
          setSampleContent('');
          setSampleStatus(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setSampleLoading(false);
      }
    };
    loadSample();
    return () => {
      cancelled = true;
    };
  }, [selectedSample?.path, selectedSample?.scope]);

  const saveSelectedSample = async () => {
    if (!selectedSample?.path) return false;
    setSampleStatus('');
    const response = await window.electronAPI.writeFile(selectedSample.path, sampleContent);
    if (response?.status === 'error') {
      setSampleStatus(response.error || 'Could not save sample');
      return false;
    }
    setSampleStatus('Saved');
    return true;
  };

  const copySampleToClipboard = async () => {
    if (!selectedSample || selectedSample.scope !== 'clipboard') return;
    const saved = await saveSelectedSample();
    if (!saved) return;
    const response = await window.electronAPI.writeClipboard(sampleContent);
    setSampleStatus(response?.success ? 'Copied to clipboard' : response?.error || 'Could not copy sample');
  };

  const copySampleCardToClipboard = async (sample: TestSample) => {
    setSelectedSampleKey(sample.key);
    setScope((sample.scope as CodeFixScope) || 'clipboard');
    onUseSample?.(sample);
    try {
      const result = await window.electronAPI.readFile(sample.path);
      if (result?.status === 'error') {
        setSampleStatus(result.error || 'Could not load sample file');
        return;
      }
      const content = result.content || '';
      setSampleContent(content);
      const response = await window.electronAPI.writeClipboard(content);
      setSampleStatus(response?.success ? 'Copied to clipboard' : response?.error || 'Could not copy sample');
    } catch (err) {
      setSampleStatus(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    if (fileGroups.length > 0 && !fileGroups.some((group) => group.path === selectedFile)) {
      setSelectedFile(fileGroups[0].path);
    }
  }, [fileGroups, selectedFile]);

  useEffect(() => {
    if (result?.scope !== 'codebase') return;
    const folders = new Set<string>();
    for (const group of fileGroups) {
      const parts = group.path.split(/[\\/]+/).filter(Boolean);
      let current = '';
      parts.slice(0, -1).forEach((part) => {
        current = current ? `${current}/${part}` : part;
        folders.add(current);
      });
    }
    setExpandedFolders(folders);
  }, [fileGroups, result?.scope]);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((current) => {
      const next = new Set(current);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  };

  const renderTreeNode = (node: FileTreeNode, depth = 0): React.ReactNode => {
    if (node.type === 'folder') {
      const expanded = expandedFolders.has(node.path);
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleFolder(node.path)}
            className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
            style={{ paddingLeft: `${8 + depth * 14}px` }}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Folder className="h-4 w-4 text-slate-500" />
            <span className="truncate" title={node.path}>{node.name}</span>
          </button>
          {expanded && node.children.map((child) => renderTreeNode(child, depth + 1))}
        </div>
      );
    }

    const selected = selectedGroup?.path === node.path;
    const count = node.group?.changes.length || 0;
    return (
      <button
        key={node.path}
        onClick={() => setSelectedFile(node.path)}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
          selected ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
        }`}
        style={{ paddingLeft: `${28 + depth * 14}px` }}
        title={`${node.path} (${count} change${count === 1 ? '' : 's'})`}
      >
        <File className={`h-4 w-4 ${selected ? 'text-white' : 'text-slate-500'}`} />
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${selected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>{count}</span>
      </button>
    );
  };

  const run = async (autoApply = false) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      if (selectedSample?.path) {
        const saved = await saveSelectedSample();
        if (!saved) {
          setActiveTab('setup');
          return;
        }
      }
      if (selectedSample?.scope === 'clipboard') {
        await window.electronAPI.writeClipboard(sampleContent);
      }
      const clipboard = scope === 'clipboard' ? await window.electronAPI.readClipboard() : null;
      const response = await window.electronAPI.runCodeFixAgent({
        projectPath: effectiveProjectPath,
        scope,
        mode,
        instruction,
        filePath: scope === 'file' ? filePath : undefined,
        code: clipboard?.content,
        apply: autoApply || applyDirectly,
      });
      if (response?.status === 'error') {
        setError(response.error || 'Code fixer failed');
        setActiveTab('setup');
        return;
      }
      setResult(response);
      setActiveTab('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setActiveTab('setup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!loading && !(scope === 'file' && !filePath.trim())) {
          run(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, scope, filePath, applyDirectly, effectiveProjectPath, instruction, mode, selectedSample?.path, selectedSample?.scope, sampleContent]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" data-electron-interactive="true">
      <div className="flex h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_30px_120px_rgba(2,6,23,0.35)]">
        <div className="border-b border-slate-200 bg-slate-950 px-6 py-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                <Bot className="h-3.5 w-3.5" />
                Code Fixer Agent
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">Project-aware repair and review</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-300">
                Run a focused fix, then review every file side by side before trusting the result.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onBack && (
                <button onClick={onBack} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Back to menu">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              <button onClick={onClose} className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50 px-5">
          <button
            onClick={() => setActiveTab('setup')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition ${
              activeTab === 'setup' ? 'border-b-2 border-slate-950 text-slate-950' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bot className="h-4 w-4" />
            Setup
          </button>
          <button
            onClick={() => result && setActiveTab('review')}
            disabled={!result}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              activeTab === 'review' ? 'border-b-2 border-slate-950 text-slate-950' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Columns2 className="h-4 w-4" />
            Review
          </button>
        </div>

        {activeTab === 'setup' && (
          <div className="grid min-h-0 flex-1 grid-cols-[20rem_minmax(0,1fr)] overflow-hidden">
            <div className="space-y-5 overflow-auto border-r border-slate-200 bg-slate-50 p-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Scope</div>
                <div className="space-y-2">
                  {[
                    ['clipboard', FileCode, 'Clipboard'],
                    ['file', FileCode, 'Single file'],
                    ['codebase', FolderSearch, 'Codebase'],
                  ].map(([value, Icon, label]) => (
                    <button
                      key={value as string}
                      onClick={() => setScope(value as CodeFixScope)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                        scope === value ? 'border-slate-900 bg-white shadow-sm' : 'border-slate-200 bg-white/70 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block font-semibold text-slate-900">{label as string}</span>
                        <span className="block text-xs text-slate-500">{scopeLabel[value as CodeFixScope]}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Test samples</span>
                  <button onClick={onResetSamples} className="rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">Reset</button>
                </div>
                {codeFixerSamples.length > 0 ? (
                  <div className="space-y-2">
                    {codeFixerSamples.map((sample) => {
                      const active = selectedSampleKey === sample.key;
                      return (
                        <div
                          key={sample.key}
                          className={`rounded-md border transition ${
                            active ? 'border-slate-900 bg-slate-100' : 'border-slate-200 bg-slate-50'
                          }`}
                          title={sample.path}
                        >
                          <div className="flex items-start gap-2 px-3 py-2">
                            <button onClick={() => selectSample(sample)} className="min-w-0 flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <div className="min-w-0 flex-1 text-sm font-semibold text-slate-900">{sample.label}</div>
                                {sample.warning && (
                                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-label={sample.warning}>
                                    <title>{sample.warning}</title>
                                  </AlertTriangle>
                                )}
                              </div>
                              <div className="mt-0.5 truncate text-xs text-slate-500">{sample.description}</div>
                            </button>
                            {sample.scope === 'clipboard' && (
                              <button
                                onClick={() => copySampleCardToClipboard(sample)}
                                className="inline-flex shrink-0 items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                                title="Copy sample to clipboard"
                              >
                                <Copy className="h-3 w-3" />
                                Copy
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">Sample not available.</div>
                )}
              </div>

              {scope === 'file' && (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Relative file path</span>
                  <input
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    placeholder="src/App.tsx"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-900"
                  />
                </label>
              )}

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Fix engine</div>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-1">
                  {[
                    ['manual', 'Manual rules'],
                    ['ai', 'AI agent'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setMode(value as CodeFixMode)}
                      className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                        mode === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Fix instruction</span>
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={7}
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-900"
                />
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={applyDirectly}
                  onChange={(e) => setApplyDirectly(e.target.checked)}
                  disabled={scope === 'clipboard'}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                />
                <span>
                  <span className="block font-medium text-slate-900">Apply directly after review</span>
                  <span className="block text-xs text-slate-500">For file and codebase scope only.</span>
                </span>
              </label>

              <div className="space-y-2">
                <button
                  onClick={() => run(false)}
                  disabled={loading || (scope === 'file' && !filePath.trim())}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {loading ? 'Running...' : 'Preview fix'}
                </button>
                <button
                  onClick={() => run(true)}
                  disabled={loading || (scope === 'file' && !filePath.trim())}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-900 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Auto apply fix
                </button>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Ctrl+Enter auto-applies the fix.
                </div>
              </div>
            </div>

            <div className="min-h-0 overflow-auto p-5">
              {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              {!result && !error && (
                <div className="flex h-full min-h-[28rem] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">
                        {selectedSample ? selectedSample.label : 'Sample editor'}
                      </div>
                      <div className="truncate text-xs text-slate-500" title={selectedSample?.path}>
                        {selectedSample ? selectedSample.path : 'Select a test sample on the left to edit it before running Code Fixer.'}
                      </div>
                    </div>
                    {selectedSample && (
                      <div className="flex shrink-0 items-center gap-2">
                        {selectedSample.scope === 'clipboard' && (
                          <button
                            onClick={copySampleToClipboard}
                            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </button>
                        )}
                        <button
                          onClick={saveSelectedSample}
                          className="flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          <Save className="h-3.5 w-3.5" />
                          Save
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedSample ? (
                    <>
                      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2 text-xs text-slate-500">
                        {selectedSample.scope === 'clipboard' ? <Clipboard className="h-4 w-4" /> : <FileCode className="h-4 w-4" />}
                        <span>
                          {selectedSample.scope === 'clipboard'
                            ? 'Preview fix writes this content to the clipboard first.'
                            : selectedSample.scope === 'file'
                              ? `Preview fix targets ${selectedSample.filePath}.`
                              : 'Preview fix scans the whole sample project; edit the displayed Java file as the starting case.'}
                        </span>
                        {sampleStatus && <span className="ml-auto font-semibold text-slate-700">{sampleStatus}</span>}
                      </div>
                      <textarea
                        value={sampleContent}
                        onChange={(event) => {
                          setSampleContent(event.target.value);
                          setSampleStatus('');
                        }}
                        disabled={sampleLoading}
                        spellCheck={false}
                        className="min-h-0 flex-1 resize-none border-0 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 outline-none"
                      />
                    </>
                  ) : (
                    <div className="flex flex-1 items-center justify-center px-6 text-center">
                      <div>
                        <div className="text-base font-semibold text-slate-900">No fix yet</div>
                        <div className="mt-1 text-sm text-slate-500">Select a sample, edit it here, then run the agent. Results open in the Review tab.</div>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
                    {sampleLoading ? 'Loading sample...' : 'This editor changes the mutable sample under samples/workdir, not the pristine source.'}
                  </div>
                </div>
              )}
              {result && (
                <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 text-center">
                  <div className="max-w-md">
                    <div className="text-base font-semibold text-slate-900">{result.summary || 'Fix review ready'}</div>
                    <div className="mt-2 text-sm text-slate-500">
                      Review {changes.length} change{changes.length === 1 ? '' : 's'} across {fileGroups.length} file{fileGroups.length === 1 ? '' : 's'}.
                    </div>
                    <button
                      onClick={() => setActiveTab('review')}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <Columns2 className="h-4 w-4" />
                      Open Review
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'review' && result && (
          <div className="grid min-h-0 flex-1 grid-cols-[18rem_minmax(0,1fr)] overflow-hidden">
            <aside className="min-h-0 overflow-auto border-r border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className="text-sm font-semibold text-slate-900">{result.summary || 'Code fix complete'}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {result.scope} scope | {result.filesScanned} scanned | {result.filesChanged} changed
                </div>
                <div className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                  Confidence {Math.round(confidence * 100)}%
                </div>
              </div>

              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {result.scope === 'codebase' ? 'Explorer' : 'Changed files'}
              </div>
              {result.scope === 'codebase' ? (
                <div className="rounded-lg border border-slate-200 bg-white p-2">
                  {fileGroups.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500">No file changes were proposed.</div>
                  ) : (
                    fileTree.map((node) => renderTreeNode(node))
                  )}
                </div>
              ) : (
              <div className="space-y-2">
                {fileGroups.length === 0 && (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500">No file changes were proposed.</div>
                )}
                {fileGroups.map((group) => (
                  <button
                    key={group.path}
                    onClick={() => setSelectedFile(group.path)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                      selectedGroup?.path === group.path ? 'border-slate-900 bg-white shadow-sm' : 'border-slate-200 bg-white/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="truncate text-sm font-semibold text-slate-900" title={group.path}>{group.path}</div>
                    <div className="mt-1 text-xs text-slate-500">{group.changes.length} change{group.changes.length === 1 ? '' : 's'}</div>
                  </button>
                ))}
              </div>
              )}

              {result.applied && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  <Check className="h-4 w-4" />
                  Applied to disk
                </div>
              )}
            </aside>

            <main className="min-h-0 overflow-auto p-5">
              {selectedGroup ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 border-b border-slate-200 pb-4">
                    <h3 className="truncate text-lg font-semibold text-slate-900" title={selectedGroup.path}>{selectedGroup.path}</h3>
                    <p className="mt-1 text-sm text-slate-500">Side-by-side before and after for each proposed replacement.</p>
                  </div>

                  <div className="space-y-5">
                    <section className="overflow-hidden rounded-lg border border-slate-200">
                      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="text-sm font-semibold text-slate-900">
                          {result.scope === 'clipboard' ? 'Whole code before and after' : 'Whole file before and after'}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">This view applies the proposed replacements to the selected content in memory.</div>
                      </div>
                      <div className="grid min-h-[24rem] grid-cols-2">
                        <div className="min-w-0 border-r border-slate-200">
                          <div className="border-b border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-700">Before</div>
                          <pre className="h-full max-h-[36rem] overflow-auto bg-rose-50/60 p-4 text-xs leading-relaxed text-rose-950">{selectedGroup.original || ''}</pre>
                        </div>
                        <div className="min-w-0">
                          <div className="border-b border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">After</div>
                          <pre className="h-full max-h-[36rem] overflow-auto bg-emerald-50/60 p-4 text-xs leading-relaxed text-emerald-950">{selectedGroup.fixed || ''}</pre>
                        </div>
                      </div>
                    </section>

                    {selectedGroup.changes.map((change: any, index: number) => (
                      <section key={`${selectedGroup.path}-${index}`} className="overflow-hidden rounded-lg border border-slate-200">
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="text-sm font-semibold text-slate-900">Change {index + 1}</div>
                          {change.explanation && <div className="mt-1 text-sm text-slate-600">{change.explanation}</div>}
                        </div>
                        <div className="grid min-h-[20rem] grid-cols-2">
                          <div className="min-w-0 border-r border-slate-200">
                            <div className="border-b border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-700">Before</div>
                            <pre className="h-full max-h-[32rem] overflow-auto bg-rose-50/60 p-4 text-xs leading-relaxed text-rose-950">{change.original || ''}</pre>
                          </div>
                          <div className="min-w-0">
                            <div className="border-b border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">After</div>
                            <pre className="h-full max-h-[32rem] overflow-auto bg-emerald-50/60 p-4 text-xs leading-relaxed text-emerald-950">{change.fixed || ''}</pre>
                          </div>
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                  <div>
                    <div className="text-base font-semibold text-slate-900">No patch available</div>
                    <div className="mt-1 text-sm text-slate-500">The agent finished without proposing file changes.</div>
                  </div>
                </div>
              )}

              {result.warnings?.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {result.warnings.map((warning: string) => (
                    <div key={warning}>{warning}</div>
                  ))}
                </div>
              )}
            </main>
          </div>
        )}

        {activeTab === 'review' && !result && (
          <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-50 p-6 text-center">
            <div>
              <div className="text-base font-semibold text-slate-900">No review yet</div>
              <div className="mt-1 text-sm text-slate-500">Run a fix first, then review the side-by-side changes here.</div>
              <button
                onClick={() => setActiveTab('setup')}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Back to setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeFixerAgentOverlay;
