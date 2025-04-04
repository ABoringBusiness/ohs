import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Node, 
  Edge, 
  Workflow, 
  NodeType, 
  ConnectionType,
  WorkflowExecution
} from '../types';
import { v4 as uuidv4 } from 'uuid';

interface WorkflowState {
  // Current workflow
  currentWorkflow: Workflow | null;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  
  // Workflow list
  workflows: Workflow[];
  isLoading: boolean;
  error: string | null;
  
  // Execution
  currentExecution: WorkflowExecution | null;
  executionHistory: WorkflowExecution[];
  
  // Actions
  createNewWorkflow: (name: string, description?: string) => void;
  loadWorkflow: (id: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  publishWorkflow: () => Promise<void>;
  duplicateWorkflow: (id: string) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  
  // Node actions
  addNode: (type: NodeType, position: { x: number; y: number }, data: any) => void;
  updateNode: (id: string, data: Partial<Node>) => void;
  removeNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  
  // Edge actions
  addEdge: (source: string, target: string, type?: ConnectionType) => void;
  updateEdge: (id: string, data: Partial<Edge>) => void;
  removeEdge: (id: string) => void;
  selectEdge: (id: string | null) => void;
  
  // Execution actions
  executeWorkflow: (input?: Record<string, any>) => Promise<void>;
  stopExecution: () => void;
  clearExecutionHistory: () => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentWorkflow: null,
        nodes: [],
        edges: [],
        selectedNodeId: null,
        selectedEdgeId: null,
        workflows: [],
        isLoading: false,
        error: null,
        currentExecution: null,
        executionHistory: [],
        
        // Create a new workflow
        createNewWorkflow: (name, description) => {
          const id = uuidv4();
          const newWorkflow: Workflow = {
            id,
            name,
            description: description || '',
            nodes: [],
            edges: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            published: false,
            version: 1,
            tags: [],
          };
          
          set({
            currentWorkflow: newWorkflow,
            nodes: [],
            edges: [],
            selectedNodeId: null,
            selectedEdgeId: null,
            workflows: [...get().workflows, newWorkflow],
          });
        },
        
        // Load a workflow
        loadWorkflow: async (id) => {
          set({ isLoading: true, error: null });
          
          try {
            // In a real implementation, this would fetch from an API
            const workflow = get().workflows.find(w => w.id === id);
            
            if (!workflow) {
              throw new Error(`Workflow with ID ${id} not found`);
            }
            
            set({
              currentWorkflow: workflow,
              nodes: workflow.nodes,
              edges: workflow.edges,
              selectedNodeId: null,
              selectedEdgeId: null,
              isLoading: false,
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load workflow',
              isLoading: false 
            });
          }
        },
        
        // Save the current workflow
        saveWorkflow: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const { currentWorkflow, nodes, edges } = get();
            
            if (!currentWorkflow) {
              throw new Error('No workflow is currently active');
            }
            
            const updatedWorkflow: Workflow = {
              ...currentWorkflow,
              nodes,
              edges,
              updated_at: new Date().toISOString(),
            };
            
            // In a real implementation, this would save to an API
            set({
              currentWorkflow: updatedWorkflow,
              workflows: get().workflows.map(w => 
                w.id === updatedWorkflow.id ? updatedWorkflow : w
              ),
              isLoading: false,
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to save workflow',
              isLoading: false 
            });
          }
        },
        
        // Publish a workflow
        publishWorkflow: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const { currentWorkflow } = get();
            
            if (!currentWorkflow) {
              throw new Error('No workflow is currently active');
            }
            
            const publishedWorkflow: Workflow = {
              ...currentWorkflow,
              published: true,
              updated_at: new Date().toISOString(),
            };
            
            // In a real implementation, this would publish to an API
            set({
              currentWorkflow: publishedWorkflow,
              workflows: get().workflows.map(w => 
                w.id === publishedWorkflow.id ? publishedWorkflow : w
              ),
              isLoading: false,
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to publish workflow',
              isLoading: false 
            });
          }
        },
        
        // Duplicate a workflow
        duplicateWorkflow: async (id) => {
          set({ isLoading: true, error: null });
          
          try {
            const workflowToDuplicate = get().workflows.find(w => w.id === id);
            
            if (!workflowToDuplicate) {
              throw new Error(`Workflow with ID ${id} not found`);
            }
            
            const newId = uuidv4();
            const duplicatedWorkflow: Workflow = {
              ...workflowToDuplicate,
              id: newId,
              name: `${workflowToDuplicate.name} (Copy)`,
              published: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              version: 1,
            };
            
            set({
              workflows: [...get().workflows, duplicatedWorkflow],
              isLoading: false,
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to duplicate workflow',
              isLoading: false 
            });
          }
        },
        
        // Delete a workflow
        deleteWorkflow: async (id) => {
          set({ isLoading: true, error: null });
          
          try {
            // In a real implementation, this would delete from an API
            set({
              workflows: get().workflows.filter(w => w.id !== id),
              currentWorkflow: get().currentWorkflow?.id === id ? null : get().currentWorkflow,
              nodes: get().currentWorkflow?.id === id ? [] : get().nodes,
              edges: get().currentWorkflow?.id === id ? [] : get().edges,
              isLoading: false,
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete workflow',
              isLoading: false 
            });
          }
        },
        
        // Add a node
        addNode: (type, position, data) => {
          const newNode: Node = {
            id: uuidv4(),
            type,
            position,
            data: {
              label: data.label || `New ${type} node`,
              description: data.description || '',
              icon: data.icon || '',
              inputs: data.inputs || [],
              outputs: data.outputs || [],
              config: data.config || {},
            },
          };
          
          set({
            nodes: [...get().nodes, newNode],
            selectedNodeId: newNode.id,
          });
        },
        
        // Update a node
        updateNode: (id, data) => {
          set({
            nodes: get().nodes.map(node => 
              node.id === id ? { ...node, ...data } : node
            ),
          });
        },
        
        // Remove a node
        removeNode: (id) => {
          set({
            nodes: get().nodes.filter(node => node.id !== id),
            edges: get().edges.filter(edge => 
              edge.source !== id && edge.target !== id
            ),
            selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
          });
        },
        
        // Select a node
        selectNode: (id) => {
          set({
            selectedNodeId: id,
            selectedEdgeId: null,
          });
        },
        
        // Add an edge
        addEdge: (source, target, type = ConnectionType.DEFAULT) => {
          const newEdge: Edge = {
            id: uuidv4(),
            source,
            target,
            type,
            animated: type === ConnectionType.SUCCESS,
          };
          
          set({
            edges: [...get().edges, newEdge],
            selectedEdgeId: newEdge.id,
          });
        },
        
        // Update an edge
        updateEdge: (id, data) => {
          set({
            edges: get().edges.map(edge => 
              edge.id === id ? { ...edge, ...data } : edge
            ),
          });
        },
        
        // Remove an edge
        removeEdge: (id) => {
          set({
            edges: get().edges.filter(edge => edge.id !== id),
            selectedEdgeId: get().selectedEdgeId === id ? null : get().selectedEdgeId,
          });
        },
        
        // Select an edge
        selectEdge: (id) => {
          set({
            selectedEdgeId: id,
            selectedNodeId: null,
          });
        },
        
        // Execute the workflow
        executeWorkflow: async (input) => {
          set({ 
            isLoading: true, 
            error: null,
            currentExecution: {
              id: uuidv4(),
              workflow_id: get().currentWorkflow?.id || '',
              status: 'running',
              started_at: new Date().toISOString(),
              results: {},
              input,
            },
          });
          
          try {
            // In a real implementation, this would execute the workflow via an API
            // For now, we'll simulate execution with a timeout
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Simulate results
            const results: Record<string, any> = {};
            get().nodes.forEach(node => {
              results[node.id] = {
                node_id: node.id,
                status: Math.random() > 0.2 ? 'success' : 'error',
                output: { result: 'Sample output' },
                error: Math.random() > 0.8 ? 'Sample error' : undefined,
                execution_time: Math.floor(Math.random() * 1000),
              };
            });
            
            const execution: WorkflowExecution = {
              ...get().currentExecution!,
              status: 'completed',
              completed_at: new Date().toISOString(),
              results,
            };
            
            set({
              currentExecution: execution,
              executionHistory: [execution, ...get().executionHistory],
              isLoading: false,
            });
          } catch (error) {
            const failedExecution: WorkflowExecution = {
              ...get().currentExecution!,
              status: 'failed',
              completed_at: new Date().toISOString(),
              results: {},
            };
            
            set({ 
              error: error instanceof Error ? error.message : 'Failed to execute workflow',
              currentExecution: failedExecution,
              executionHistory: [failedExecution, ...get().executionHistory],
              isLoading: false,
            });
          }
        },
        
        // Stop the current execution
        stopExecution: () => {
          if (get().currentExecution?.status === 'running') {
            const stoppedExecution: WorkflowExecution = {
              ...get().currentExecution,
              status: 'failed',
              completed_at: new Date().toISOString(),
            };
            
            set({
              currentExecution: stoppedExecution,
              executionHistory: [stoppedExecution, ...get().executionHistory],
            });
          }
        },
        
        // Clear execution history
        clearExecutionHistory: () => {
          set({
            executionHistory: [],
          });
        },
      }),
      {
        name: 'workflow-storage',
        partialize: (state) => ({
          workflows: state.workflows,
        }),
      }
    )
  )
);