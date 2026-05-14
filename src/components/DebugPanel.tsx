import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Trash2, Filter, Search } from 'lucide-react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  context?: Record<string, any>;
  stack?: string;
}

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Browser-only logging (no Node dependencies)
class BrowserLogger {
  private entries: LogEntry[] = [];
  private maxEntries = 256;
  private onNewEntry: ((entry: LogEntry) => void) | null = null;

  log(level: LogLevel, source: string, message: string, context?: Record<string, any>, stack?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      context,
      stack,
    };
    
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
    
    if (this.onNewEntry) {
      this.onNewEntry(entry);
    }
    
    // Also log to console
    console[level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'log'](`[${source}] ${message}`, context);
  }

  getEntries(): LogEntry[] {
    return this.entries;
  }

  setOnNewEntry(callback: ((entry: LogEntry) => void) | null) {
    this.onNewEntry = callback;
  }

  clear() {
    this.entries = [];
  }

  getLogsDirPath() {
    return 'Browser Memory (no file storage)';
  }
}

const logger = new BrowserLogger();

/**
 * Debug Panel Component
 * Toggled with Ctrl+Shift+D
 * Displays real-time logs with filtering and search
 */
export const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Load initial logs and subscribe to new entries
  useEffect(() => {
    setEntries(logger.getEntries());

    // Listen for new log entries
    const handleNewEntry = (entry: LogEntry) => {
      setEntries((prev) => {
        const updated = [...prev, entry];
        // Keep only last 256 entries
        return updated.slice(-256);
      });
    };

    logger.setOnNewEntry(handleNewEntry);

    return () => {
      // Cleanup listener
      logger.setOnNewEntry(null);
    };
  }, []);

  // Auto-scroll to latest entry
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, autoScroll]);

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesLevel = filterLevel === 'all' || entry.level === filterLevel;
    const matchesSearch =
      searchQuery === '' ||
      entry.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  if (!isOpen) return null;

  const levelColors: { [key in LogLevel]: string } = {
    debug: 'bg-gray-100 text-gray-700',
    info: 'bg-blue-100 text-blue-700',
    warn: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Dark overlay (optional) */}
      <div className="absolute inset-0 bg-black bg-opacity-20" onClick={onClose} />

      {/* Debug Panel */}
      <div className="relative w-full bg-gray-900 text-white shadow-2xl flex flex-col max-h-96 z-50 border-t border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-950">
          <h3 className="text-lg font-bold">Debug Console</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => logger.clear()}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Clear logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Close debug panel (Ctrl+Shift+D)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 p-3 border-b border-gray-700 bg-gray-850 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-64">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Auto-scroll toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Auto-scroll</span>
          </label>

          {/* Entry count */}
          <div className="text-xs text-gray-500">
            {filteredEntries.length} / {entries.length}
          </div>
        </div>

        {/* Log Entries */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs bg-gray-900">
          {filteredEntries.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No logs match the filter</div>
          ) : (
            filteredEntries.map((entry, idx) => (
              <div
                key={idx}
                className={`p-2 rounded flex items-start gap-2 ${levelColors[entry.level]}`}
              >
                {/* Timestamp */}
                <span className="text-gray-500 flex-shrink-0 min-w-32">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>

                {/* Level badge */}
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 w-14 text-center ${
                    entry.level === 'error'
                      ? 'bg-red-600'
                      : entry.level === 'warn'
                        ? 'bg-yellow-600'
                        : entry.level === 'info'
                          ? 'bg-blue-600'
                          : 'bg-gray-600'
                  }`}
                >
                  {entry.level.toUpperCase()}
                </span>

                {/* Source */}
                <span className="bg-black bg-opacity-30 px-2 py-0.5 rounded flex-shrink-0">
                  {entry.source}
                </span>

                {/* Message */}
                <div className="flex-1">
                  <div className="break-words">{entry.message}</div>
                  {entry.context && (
                    <div className="mt-1 text-xs opacity-75 max-h-16 overflow-auto">
                      {JSON.stringify(entry.context, null, 2)}
                    </div>
                  )}
                  {entry.stack && (
                    <div className="mt-1 text-xs opacity-60 max-h-16 overflow-auto border-l-2 border-opacity-50 pl-2">
                      {entry.stack}
                    </div>
                  )}
                </div>

                {/* Copy button */}
                <button
                  onClick={() => {
                    const text = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}`;
                    navigator.clipboard.writeText(text);
                  }}
                  className="p-1 hover:bg-black hover:bg-opacity-30 rounded flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                  title="Copy to clipboard"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Footer / Status */}
        <div className="border-t border-gray-700 px-4 py-2 bg-gray-950 text-xs text-gray-500 flex justify-between">
          <span>
            Logs stored in: {logger.getLogsDirPath()}
          </span>
          <span>
            Tip: Press <kbd>Ctrl+Shift+D</kbd> to toggle
          </span>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
