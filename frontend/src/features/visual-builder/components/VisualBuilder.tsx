import React, { useEffect, useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { useNodeLibraryStore } from '../store/nodeLibraryStore';
import { NodeType } from '../types';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import NodeLibrary from './NodeLibrary';
import NodeProperties from './NodeProperties';
import WorkflowControls from './WorkflowControls';
import WorkflowHeader from './WorkflowHeader';
import ExecutionPanel from './ExecutionPanel';

// Custom node types
import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import TransformationNode from './nodes/TransformationNode';
import AIModelNode from './nodes/AIModelNode';
import DataSourceNode from './nodes/DataSourceNode';
import OutputNode from './nodes/OutputNode';

// Define node types
const nodeTypes = {
  [NodeType.TRIGGER]: TriggerNode,
  [NodeType.ACTION]: ActionNode,
  [NodeType.CONDITION]: ConditionNode,
  [NodeType.TRANSFORMATION]: TransformationNode,
  [NodeType.AI_MODEL]: AIModelNode,
  [NodeType.DATA_SOURCE]: DataSourceNode,
  [NodeType.OUTPUT]: OutputNode,
};

// Flow component (inside ReactFlowProvider)
const Flow = () => {
  const { nodes, edges, selectedNodeId, addNode, updateNode, removeNode, selectNode, addEdge, removeEdge } = useWorkflowStore();
  const { filteredItems } = useNodeLibraryStore();
  const reactFlowInstance = useReactFlow();
  
  // Handle node drag from library
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };
  
  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    const nodeId = event.dataTransfer.getData('application/reactflow/nodeId');
    
    if (nodeId) {
      // This is an existing node, do nothing
      return;
    }
    
    const nodeType = event.dataTransfer.getData('application/reactflow/type') as NodeType;
    const nodeData = event.dataTransfer.getData('application/reactflow/data');
    
    if (!nodeType || !nodeData) {
      return;
    }
    
    // Get position from drop event
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    // Find the node data from the library
    const nodeItem = filteredItems.find(item => item.type === nodeType && item.label === JSON.parse(nodeData).label);
    
    if (nodeItem) {
      addNode(nodeType, position, {
        label: nodeItem.label,
        description: nodeItem.description,
        icon: nodeItem.icon,
        inputs: nodeItem.inputs,
        outputs: nodeItem.outputs,
        config: { ...nodeItem.defaultConfig },
      });
    }
  };
  
  // Handle connections
  const onConnect = (params: any) => {
    addEdge(params.source, params.target);
  };
  
  // Handle node selection
  const onNodeClick = (_: React.MouseEvent, node: any) => {
    selectNode(node.id);
  };
  
  // Handle edge selection
  const onEdgeClick = (_: React.MouseEvent, edge: any) => {
    selectNode(null); // Deselect node
  };
  
  // Handle pane click (deselect)
  const onPaneClick = () => {
    selectNode(null);
  };
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={() => {}}
      onEdgesChange={() => {}}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      nodeTypes={nodeTypes}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
};

// Main Visual Builder component
const VisualBuilder: React.FC = () => {
  const { currentWorkflow, createNewWorkflow, loadWorkflow, saveWorkflow } = useWorkflowStore();
  const { fetchNodeLibrary } = useNodeLibraryStore();
  const [showExecution, setShowExecution] = useState(false);
  
  // Initialize
  useEffect(() => {
    fetchNodeLibrary();
    
    // Create a new workflow if none exists
    if (!currentWorkflow) {
      createNewWorkflow('New Workflow');
    }
  }, []);
  
  return (
    <div className="flex h-screen">
      {/* Left sidebar - Node Library */}
      <div className="w-64 border-r border-gray-200 overflow-y-auto">
        <NodeLibrary />
      </div>
      
      {/* Main area - Flow */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <WorkflowHeader />
        
        {/* Flow area */}
        <div className="flex-1 relative">
          <ReactFlowProvider>
            <Flow />
          </ReactFlowProvider>
        </div>
        
        {/* Workflow controls */}
        <WorkflowControls onExecute={() => setShowExecution(true)} />
      </div>
      
      {/* Right sidebar - Node Properties */}
      <div className="w-80 border-l border-gray-200 overflow-y-auto">
        <NodeProperties />
      </div>
      
      {/* Execution panel (modal) */}
      {showExecution && (
        <ExecutionPanel onClose={() => setShowExecution(false)} />
      )}
    </div>
  );
};

export default VisualBuilder;