/**
 * Setup Steps Overlay Component
 * Displays environment builder results and execution
 */

import React, { useState } from 'react';
import { Play, Check, AlertCircle, X } from 'lucide-react';

interface SetupStep {
  step: number;
  description: string;
  command: string;
  platform: 'mac' | 'windows' | 'linux' | 'universal';
  required: boolean;
}

interface SetupStepsProps {
  detected_type: string;
  missing_tools: string[];
  setup_steps: SetupStep[];
  env_vars_needed: string[];
  estimated_minutes: number;
  onExecuteStep?: (step: SetupStep) => Promise<boolean>;
  onClose?: () => void;
}

const SetupStepsOverlay: React.FC<SetupStepsProps> = ({
  detected_type,
  missing_tools,
  setup_steps,
  env_vars_needed,
  estimated_minutes,
  onExecuteStep,
  onClose,
}) => {
  const [executing, setExecuting] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [output, setOutput] = useState<Map<number, string>>(new Map());

  const handleExecuteStep = async (step: SetupStep) => {
    setExecuting(step.step);
    setOutput(new Map(output).set(step.step, 'Executing...'));

    try {
      const success = await onExecuteStep?.(step);
      setCompleted(new Set(completed).add(step.step));
      setOutput((prev) => new Map(prev).set(step.step, success ? '✓ Complete' : '⚠️ Failed'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setOutput((prev) => new Map(prev).set(step.step, `❌ Error: ${message}`));
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Environment Setup</h2>
            <p className="text-sm opacity-90 mt-1">Detected: {detected_type}</p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 p-2 rounded transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm text-gray-600">Project Type</div>
              <div className="font-bold text-blue-600">{detected_type}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="text-sm text-gray-600">Est. Time</div>
              <div className="font-bold text-yellow-600">{estimated_minutes} min</div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-sm text-gray-600">Missing Tools</div>
              <div className="font-bold text-red-600">{missing_tools.length}</div>
            </div>
          </div>

          {/* Missing Tools */}
          {missing_tools.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Missing Tools:</h3>
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {missing_tools.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Env Vars */}
          {env_vars_needed.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Environment Variables Needed:</h3>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <code className="text-xs text-gray-700 space-y-1">
                  {env_vars_needed.map((v) => (
                    <div key={v}>{v}</div>
                  ))}
                </code>
              </div>
            </div>
          )}

          {/* Setup Steps */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Setup Steps:</h3>
            <div className="space-y-2">
              {setup_steps.map((step) => (
                <div key={step.step} className="border rounded p-3 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-200 text-gray-700 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {step.step}
                        </span>
                        <h4 className="font-medium text-gray-900">{step.description}</h4>
                        {!step.required && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Optional</span>}
                      </div>
                      <code className="block bg-gray-900 text-green-400 text-xs p-2 rounded mt-2 overflow-x-auto font-mono">
                        $ {step.command}
                      </code>
                      <div className="text-xs text-gray-500 mt-1">Platform: {step.platform}</div>
                    </div>
                    <div className="flex flex-col items-center gap-2 ml-3">
                      {completed.has(step.step) ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <button
                          onClick={() => handleExecuteStep(step)}
                          disabled={executing === step.step}
                          className="p-2 hover:bg-blue-100 rounded transition disabled:opacity-50"
                          title="Run step"
                        >
                          <Play className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                    </div>
                  </div>
                  {output.has(step.step) && (
                    <div className="bg-gray-100 text-gray-700 text-xs p-2 rounded mt-2 max-h-20 overflow-y-auto font-mono">
                      {output.get(step.step)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupStepsOverlay;
