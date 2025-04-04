import React from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { NodeInput } from '../types';
import { Trash2 } from 'lucide-react';

const NodeProperties: React.FC = () => {
  const { nodes, selectedNodeId, updateNode, removeNode } = useWorkflowStore();
  
  // Get the selected node
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  
  if (!selectedNode) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Node Properties</h2>
        <div className="text-gray-500 text-center py-8">
          Select a node to view and edit its properties.
        </div>
      </div>
    );
  }
  
  // Update node data
  const updateNodeData = (key: string, value: any) => {
    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        [key]: value,
      },
    });
  };
  
  // Update node config
  const updateNodeConfig = (key: string, value: any) => {
    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        config: {
          ...selectedNode.data.config,
          [key]: value,
        },
      },
    });
  };
  
  // Render input field based on type
  const renderInputField = (input: NodeInput) => {
    const configValue = selectedNode.data.config[input.id] ?? input.default ?? '';
    
    switch (input.type) {
      case 'string':
        return (
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={configValue}
            onChange={(e) => updateNodeConfig(input.id, e.target.value)}
          />
        );
        
      case 'number':
        return (
          <input
            type="number"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={configValue}
            onChange={(e) => updateNodeConfig(input.id, parseFloat(e.target.value))}
          />
        );
        
      case 'boolean':
        return (
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={configValue}
            onChange={(e) => updateNodeConfig(input.id, e.target.checked)}
          />
        );
        
      case 'object':
        return (
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            value={typeof configValue === 'object' ? JSON.stringify(configValue, null, 2) : configValue}
            onChange={(e) => {
              try {
                updateNodeConfig(input.id, JSON.parse(e.target.value));
              } catch {
                updateNodeConfig(input.id, e.target.value);
              }
            }}
            rows={4}
          />
        );
        
      default:
        return (
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={configValue}
            onChange={(e) => updateNodeConfig(input.id, e.target.value)}
          />
        );
    }
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Node Properties</h2>
        <button
          className="text-red-500 hover:text-red-700"
          onClick={() => removeNode(selectedNode.id)}
          title="Delete node"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
      
      {/* Basic properties */}
      <div className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={selectedNode.data.label}
            onChange={(e) => updateNodeData('label', e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            value={selectedNode.data.description || ''}
            onChange={(e) => updateNodeData('description', e.target.value)}
            rows={2}
          />
        </div>
      </div>
      
      {/* Configuration */}
      <div>
        <h3 className="text-md font-semibold mb-3">Configuration</h3>
        
        {selectedNode.data.inputs.length > 0 ? (
          <div className="space-y-4">
            {selectedNode.data.inputs.map((input) => (
              <div key={input.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {input.label}
                  {input.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderInputField(input)}
                {input.description && (
                  <p className="text-xs text-gray-500 mt-1">{input.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">
            This node has no configurable properties.
          </div>
        )}
      </div>
      
      {/* Inputs and Outputs */}
      <div className="mt-6">
        <h3 className="text-md font-semibold mb-3">Inputs & Outputs</h3>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Inputs</h4>
          {selectedNode.data.inputs.length > 0 ? (
            <ul className="text-sm text-gray-600">
              {selectedNode.data.inputs.map((input) => (
                <li key={input.id} className="mb-1">
                  <span className="font-medium">{input.label}</span>
                  <span className="text-gray-500 ml-1">({input.type})</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 text-sm">This node has no inputs.</div>
          )}
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Outputs</h4>
          {selectedNode.data.outputs.length > 0 ? (
            <ul className="text-sm text-gray-600">
              {selectedNode.data.outputs.map((output) => (
                <li key={output.id} className="mb-1">
                  <span className="font-medium">{output.label}</span>
                  <span className="text-gray-500 ml-1">({output.type})</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 text-sm">This node has no outputs.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeProperties;