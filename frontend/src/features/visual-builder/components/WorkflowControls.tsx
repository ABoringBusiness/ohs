import React from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { Play, AlertCircle } from 'lucide-react';

interface WorkflowControlsProps {
  onExecute: () => void;
}

const WorkflowControls: React.FC<WorkflowControlsProps> = ({ onExecute }) => {
  const { nodes, edges, currentWorkflow } = useWorkflowStore();
  
  // Check if workflow is valid
  const isValid = () => {
    // Must have at least one node
    if (nodes.length === 0) {
      return false;
    }
    
    // Must have at least one trigger node
    const hasTrigger = nodes.some((node) => node.type === 'trigger');
    if (!hasTrigger) {
      return false;
    }
    
    // All nodes must be connected
    const connectedNodeIds = new Set<string>();
    
    // Start with trigger nodes
    nodes
      .filter((node) => node.type === 'trigger')
      .forEach((node) => connectedNodeIds.add(node.id));
    
    // Traverse the graph
    let prevSize = 0;
    while (prevSize !== connectedNodeIds.size) {
      prevSize = connectedNodeIds.size;
      
      edges.forEach((edge) => {
        if (connectedNodeIds.has(edge.source)) {
          connectedNodeIds.add(edge.target);
        }
      });
    }
    
    // All nodes should be connected
    return connectedNodeIds.size === nodes.length;
  };
  
  // Get validation messages
  const getValidationMessages = () => {
    const messages = [];
    
    if (nodes.length === 0) {
      messages.push('Workflow must have at least one node');
    }
    
    const hasTrigger = nodes.some((node) => node.type === 'trigger');
    if (!hasTrigger) {
      messages.push('Workflow must have at least one trigger node');
    }
    
    // Check for disconnected nodes
    const connectedNodeIds = new Set<string>();
    
    // Start with trigger nodes
    nodes
      .filter((node) => node.type === 'trigger')
      .forEach((node) => connectedNodeIds.add(node.id));
    
    // Traverse the graph
    let prevSize = 0;
    while (prevSize !== connectedNodeIds.size) {
      prevSize = connectedNodeIds.size;
      
      edges.forEach((edge) => {
        if (connectedNodeIds.has(edge.source)) {
          connectedNodeIds.add(edge.target);
        }
      });
    }
    
    // Find disconnected nodes
    const disconnectedNodes = nodes.filter(
      (node) => !connectedNodeIds.has(node.id)
    );
    
    if (disconnectedNodes.length > 0) {
      messages.push(
        `${disconnectedNodes.length} node(s) are not connected to the workflow`
      );
    }
    
    return messages;
  };
  
  const validationMessages = getValidationMessages();
  const valid = validationMessages.length === 0;
  
  return (
    <div className="h-16 border-t border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center">
        {!valid && (
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <div>
              <span className="font-medium">Invalid workflow:</span>
              <ul className="list-disc list-inside">
                {validationMessages.map((message, index) => (
                  <li key={index} className="text-sm">
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            valid
              ? 'text-white bg-green-600 hover:bg-green-700'
              : 'text-gray-400 bg-gray-200 cursor-not-allowed'
          }`}
          onClick={valid ? onExecute : undefined}
          disabled={!valid}
        >
          <Play className="h-4 w-4 mr-2" />
          Execute Workflow
        </button>
      </div>
    </div>
  );
};

export default WorkflowControls;