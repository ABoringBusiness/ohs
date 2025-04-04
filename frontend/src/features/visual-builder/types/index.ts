/**
 * Types for the Visual Builder feature
 */

// Node types
export enum NodeType {
  TRIGGER = 'trigger',
  ACTION = 'action',
  CONDITION = 'condition',
  TRANSFORMATION = 'transformation',
  AI_MODEL = 'ai_model',
  DATA_SOURCE = 'data_source',
  OUTPUT = 'output',
}

// Connection types
export enum ConnectionType {
  SUCCESS = 'success',
  ERROR = 'error',
  DEFAULT = 'default',
}

// Node interface
export interface Node {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
  width?: number;
  height?: number;
}

// Edge interface
export interface Edge {
  id: string;
  source: string;
  target: string;
  type: ConnectionType;
  label?: string;
  animated?: boolean;
}

// Node data interface
export interface NodeData {
  label: string;
  description?: string;
  icon?: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  config: Record<string, any>;
}

// Node input interface
export interface NodeInput {
  id: string;
  label: string;
  type: string;
  required: boolean;
  default?: any;
  options?: any[];
}

// Node output interface
export interface NodeOutput {
  id: string;
  label: string;
  type: string;
}

// Workflow interface
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  created_at: string;
  updated_at: string;
  published: boolean;
  version: number;
  tags?: string[];
}

// Template interface
export interface Template {
  id: string;
  name: string;
  description: string;
  workflow: Workflow;
  thumbnail: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popularity: number;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// Category interface
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

// Execution result
export interface ExecutionResult {
  node_id: string;
  status: 'success' | 'error' | 'running';
  output?: any;
  error?: string;
  execution_time?: number;
}

// Workflow execution
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  results: Record<string, ExecutionResult>;
  input?: Record<string, any>;
}

// Node library item
export interface NodeLibraryItem {
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  category: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  defaultConfig: Record<string, any>;
}

// Node library category
export interface NodeLibraryCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodes: NodeLibraryItem[];
}