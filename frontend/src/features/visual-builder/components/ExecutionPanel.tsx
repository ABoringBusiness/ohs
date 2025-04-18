import React, { useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { X, Play, StopCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ExecutionPanelProps {
  onClose: () => void;
}

const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ onClose }) => {
  const { 
    nodes, 
    currentExecution, 
    executeWorkflow, 
    stopExecution, 
    clearExecutionHistory 
  } = useWorkflowStore();
  
  const [input, setInput] = useState('{}');
  const [inputError, setInputError] = useState<string | null>(null);
  
  // Handle execute
  const handleExecute = async () => {
    try {
      const inputData = JSON.parse(input);
      await executeWorkflow(inputData);
    } catch (error) {
      setInputError('Invalid JSON input');
    }
  };
  
  // Handle stop
  const handleStop = () => {
    stopExecution();
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Execute Workflow</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {/* Input section */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2">Input</h3>
            <div className="relative">
              <textarea
                className={`w-full h-32 p-3 border rounded-md font-mono text-sm ${
                  inputError ? 'border-red-500' : 'border-gray-300'
                }`}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setInputError(null);
                }}
                placeholder="Enter JSON input data..."
              />
              {inputError && (
                <div className="text-red-500 text-sm mt-1">{inputError}</div>
              )}
            </div>
          </div>
          
          {/* Execution status */}
          {currentExecution && (
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2">Execution Status</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center mb-2">
                  <span className="font-medium mr-2">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      currentExecution.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : currentExecution.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : currentExecution.status === 'running'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {currentExecution.status.charAt(0).toUpperCase() +
                      currentExecution.status.slice(1)}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  Started: {new Date(currentExecution.started_at).toLocaleString()}
                </div>
                {currentExecution.completed_at && (
                  <div className="text-sm text-gray-500">
                    Completed:{' '}
                    {new Date(currentExecution.completed_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Node results */}
          {currentExecution && Object.keys(currentExecution.results).length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-2">Node Results</h3>
              <div className="space-y-3">
                {nodes.map((node) => {
                  const result = currentExecution.results[node.id];
                  
                  if (!result) {
                    return null;
                  }
                  
                  return (
                    <div
                      key={node.id}
                      className="border border-gray-200 rounded-md overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center">
                          {getStatusIcon(result.status)}
                          <span className="ml-2 font-medium">
                            {node.data.label}
                          </span>
                        </div>
                        {result.execution_time && (
                          <span className="text-xs text-gray-500">
                            {result.execution_time}ms
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        {result.status === 'error' ? (
                          <div className="text-red-600 text-sm">
                            {result.error || 'An error occurred'}
                          </div>
                        ) : (
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(result.output, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-between">
          <div>
            {currentExecution?.status === 'running' ? (
              <button
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                onClick={handleStop}
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Stop Execution
              </button>
            ) : (
              <button
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                onClick={handleExecute}
              >
                <Play className="h-4 w-4 mr-2" />
                Execute
              </button>
            )}
          </div>
          
          <button
            className="text-gray-600 hover:text-gray-800 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutionPanel;