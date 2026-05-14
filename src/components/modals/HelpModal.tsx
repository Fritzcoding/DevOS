import React, { useState } from 'react';
import { X, ChevronRight, AlertCircle, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { helpContent } from '../../data/help-content';

interface HelpModalProps {
  onClose: () => void;
}

/**
 * Revamped Help Modal with 4 tabs:
 * 1. Getting Started - Quick overview
 * 2. Features - Detailed HOW-TOs for each feature
 * 3. Shortcuts - Keyboard reference
 * 4. Troubleshooting - FAQ & common issues
 */
export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'getting-started' | 'features' | 'shortcuts' | 'faq'>('getting-started');
  const [selectedFeature, setSelectedFeature] = useState<'code-fixer' | 'environment' | 'organizer' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
    { id: 'features', label: 'Features', icon: '⚡' },
    { id: 'shortcuts', label: 'Shortcuts', icon: '⌨️' },
    { id: 'faq', label: 'FAQ', icon: '❓' },
  ];

  // Filter shortcuts based on search
  const filteredShortcuts = helpContent.globalShortcuts.filter(
    (shortcut) =>
      shortcut.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">DevOps Lite Help</h1>
          {!selectedFeature ? (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              aria-label="Close help"
            >
              <X className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={() => setSelectedFeature(null)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors flex items-center gap-1"
              aria-label="Go back"
            >
              <ChevronLeft className="w-6 h-6" />
              Back
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200 bg-gray-50 px-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedFeature(null);
              }}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <AnimatePresence mode="wait">
            {/* Getting Started Tab */}
            {activeTab === 'getting-started' && (
              <motion.div key="getting-started" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="prose prose-sm max-w-none">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome to DevOps Lite!</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {helpContent.gettingStarted.content}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
              <motion.div key="features" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {!selectedFeature ? (
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(helpContent.features).map(([key, feature]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedFeature(key as any)}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-400 transition-all text-left"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{feature.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{feature.shortDescription}</p>
                            {feature.shortcut && (
                              <div className="mt-2 text-xs">
                                Shortcut: <kbd className="bg-gray-200 px-2 py-1 rounded">{feature.shortcut}</kbd>
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    {selectedFeature && (
                      <div>
                        {/* Keyboard Shortcut Display */}
                        {helpContent.features[selectedFeature].shortcut && (
                          <div className="bg-blue-50 border-l-4 border-blue-600 rounded px-4 py-3 mb-6">
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Keyboard Shortcut</p>
                            <kbd className="bg-blue-600 text-white px-4 py-2 rounded font-semibold text-lg">
                              {helpContent.features[selectedFeature].shortcut}
                            </kbd>
                          </div>
                        )}

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {helpContent.features[selectedFeature].title}
                        </h2>
                        <p className="text-gray-600 mb-6">{helpContent.features[selectedFeature].fullDescription}</p>

                        <div className="space-y-6">
                          {helpContent.features[selectedFeature].steps.map((step, idx) => (
                            <div key={idx} className="border-l-4 border-blue-400 pl-4 py-2">
                              <h3 className="font-bold text-gray-900">{step.title}</h3>
                              <p className="text-gray-700 mt-1">{step.description}</p>
                              {step.example && (
                                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700">
                                  {step.example}
                                </div>
                              )}
                              {step.tips && (
                                <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside">
                                  {step.tips.map((tip, i) => (
                                    <li key={i}>{tip}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>

                        {helpContent.features[selectedFeature].limitations && (
                          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                            <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Limitations
                            </h4>
                            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                              {helpContent.features[selectedFeature].limitations!.map((limit, i) => (
                                <li key={i}>{limit}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {helpContent.features[selectedFeature].troubleshooting && (
                          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                            <h4 className="font-bold text-blue-900 mb-3">Troubleshooting</h4>
                            <div className="space-y-3">
                              {helpContent.features[selectedFeature].troubleshooting!.map((ts, i) => (
                                <div key={i}>
                                  <p className="text-sm font-medium text-blue-900">❓ {ts.issue}</p>
                                  <p className="text-sm text-blue-800 mt-1">✓ {ts.solution}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Shortcuts Tab */}
            {activeTab === 'shortcuts' && (
              <motion.div key="shortcuts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search shortcuts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-4">Global Shortcuts</h3>
                <div className="space-y-2 mb-6">
                  {filteredShortcuts.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                      <span className="text-gray-700">{shortcut.action}</span>
                      <kbd className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-4">In-App Shortcuts</h3>
                <div className="space-y-4">
                  {Object.entries(helpContent.inAppShortcuts).map(([feature, shortcuts]) => (
                    <div key={feature}>
                      <p className="font-semibold text-gray-700 capitalize mb-2">{feature.replace('-', ' ')}</p>
                      <div className="space-y-2">
                        {shortcuts.map((shortcut, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-gray-600 text-sm">{shortcut.action}</span>
                            <kbd className="bg-gray-300 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                              {shortcut.key}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <motion.div key="faq" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-4">
                  {helpContent.faq.map((item, idx) => (
                    <details key={idx} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer">
                      <summary className="font-bold text-gray-900 hover:text-blue-600 transition-colors">
                        {item.question}
                      </summary>
                      <p className="mt-3 text-gray-700 text-sm">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-4 text-sm text-gray-500 text-center">
          💡 Tip: Use <kbd className="bg-gray-300 px-2 py-1 rounded text-xs">Ctrl+Alt+C</kbd> to open Code Fixer anytime
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HelpModal;
