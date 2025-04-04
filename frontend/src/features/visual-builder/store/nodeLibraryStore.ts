import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { NodeLibraryItem, NodeLibraryCategory, NodeType } from '../types';

interface NodeLibraryState {
  // Node library
  categories: NodeLibraryCategory[];
  items: NodeLibraryItem[];
  filteredItems: NodeLibraryItem[];
  
  // Filters
  searchQuery: string;
  selectedCategory: string | null;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchNodeLibrary: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  selectCategory: (id: string | null) => void;
  applyFilters: () => void;
}

export const useNodeLibraryStore = create<NodeLibraryState>()(
  devtools(
    (set, get) => ({
      // Initial state
      categories: [],
      items: [],
      filteredItems: [],
      searchQuery: '',
      selectedCategory: null,
      isLoading: false,
      error: null,
      
      // Fetch node library
      fetchNodeLibrary: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // In a real implementation, this would fetch from an API
          // For now, we'll use mock data
          const mockCategories: NodeLibraryCategory[] = [
            {
              id: 'triggers',
              name: 'Triggers',
              description: 'Nodes that start a workflow.',
              icon: 'play-circle',
              nodes: [],
            },
            {
              id: 'actions',
              name: 'Actions',
              description: 'Nodes that perform actions.',
              icon: 'zap',
              nodes: [],
            },
            {
              id: 'conditions',
              name: 'Conditions',
              description: 'Nodes that make decisions.',
              icon: 'git-branch',
              nodes: [],
            },
            {
              id: 'transformations',
              name: 'Transformations',
              description: 'Nodes that transform data.',
              icon: 'refresh-cw',
              nodes: [],
            },
            {
              id: 'ai-models',
              name: 'AI Models',
              description: 'Nodes that use AI models.',
              icon: 'cpu',
              nodes: [],
            },
            {
              id: 'data-sources',
              name: 'Data Sources',
              description: 'Nodes that connect to data sources.',
              icon: 'database',
              nodes: [],
            },
            {
              id: 'outputs',
              name: 'Outputs',
              description: 'Nodes that output data.',
              icon: 'send',
              nodes: [],
            },
          ];
          
          const mockItems: NodeLibraryItem[] = [
            // Triggers
            {
              type: NodeType.TRIGGER,
              label: 'Webhook',
              description: 'Trigger a workflow when a webhook is called.',
              icon: 'globe',
              category: 'triggers',
              inputs: [],
              outputs: [
                { id: 'payload', label: 'Payload', type: 'object' },
              ],
              defaultConfig: {
                path: '/webhook',
                method: 'POST',
              },
            },
            {
              type: NodeType.TRIGGER,
              label: 'Schedule',
              description: 'Trigger a workflow on a schedule.',
              icon: 'clock',
              category: 'triggers',
              inputs: [],
              outputs: [
                { id: 'timestamp', label: 'Timestamp', type: 'string' },
              ],
              defaultConfig: {
                schedule: '0 0 * * *', // Daily at midnight
                timezone: 'UTC',
              },
            },
            
            // Actions
            {
              type: NodeType.ACTION,
              label: 'HTTP Request',
              description: 'Make an HTTP request to an external API.',
              icon: 'send',
              category: 'actions',
              inputs: [
                { id: 'url', label: 'URL', type: 'string', required: true },
                { id: 'method', label: 'Method', type: 'string', required: true, default: 'GET' },
                { id: 'headers', label: 'Headers', type: 'object', required: false },
                { id: 'body', label: 'Body', type: 'object', required: false },
              ],
              outputs: [
                { id: 'response', label: 'Response', type: 'object' },
                { id: 'status', label: 'Status', type: 'number' },
              ],
              defaultConfig: {
                url: 'https://api.example.com',
                method: 'GET',
                headers: {},
              },
            },
            {
              type: NodeType.ACTION,
              label: 'Send Email',
              description: 'Send an email.',
              icon: 'mail',
              category: 'actions',
              inputs: [
                { id: 'to', label: 'To', type: 'string', required: true },
                { id: 'subject', label: 'Subject', type: 'string', required: true },
                { id: 'body', label: 'Body', type: 'string', required: true },
              ],
              outputs: [
                { id: 'success', label: 'Success', type: 'boolean' },
                { id: 'messageId', label: 'Message ID', type: 'string' },
              ],
              defaultConfig: {
                to: '',
                subject: '',
                body: '',
              },
            },
            
            // Conditions
            {
              type: NodeType.CONDITION,
              label: 'If/Else',
              description: 'Branch based on a condition.',
              icon: 'git-branch',
              category: 'conditions',
              inputs: [
                { id: 'condition', label: 'Condition', type: 'boolean', required: true },
              ],
              outputs: [
                { id: 'true', label: 'True', type: 'any' },
                { id: 'false', label: 'False', type: 'any' },
              ],
              defaultConfig: {
                condition: '',
              },
            },
            {
              type: NodeType.CONDITION,
              label: 'Switch',
              description: 'Branch based on multiple conditions.',
              icon: 'git-merge',
              category: 'conditions',
              inputs: [
                { id: 'value', label: 'Value', type: 'any', required: true },
                { id: 'cases', label: 'Cases', type: 'array', required: true },
              ],
              outputs: [
                { id: 'output', label: 'Output', type: 'any' },
                { id: 'default', label: 'Default', type: 'any' },
              ],
              defaultConfig: {
                value: '',
                cases: [],
              },
            },
            
            // Transformations
            {
              type: NodeType.TRANSFORMATION,
              label: 'JSON Transform',
              description: 'Transform JSON data.',
              icon: 'code',
              category: 'transformations',
              inputs: [
                { id: 'input', label: 'Input', type: 'object', required: true },
                { id: 'template', label: 'Template', type: 'object', required: true },
              ],
              outputs: [
                { id: 'output', label: 'Output', type: 'object' },
              ],
              defaultConfig: {
                template: {},
              },
            },
            {
              type: NodeType.TRANSFORMATION,
              label: 'Text Template',
              description: 'Generate text using a template.',
              icon: 'file-text',
              category: 'transformations',
              inputs: [
                { id: 'template', label: 'Template', type: 'string', required: true },
                { id: 'variables', label: 'Variables', type: 'object', required: true },
              ],
              outputs: [
                { id: 'output', label: 'Output', type: 'string' },
              ],
              defaultConfig: {
                template: 'Hello, {{name}}!',
                variables: { name: 'World' },
              },
            },
            
            // AI Models
            {
              type: NodeType.AI_MODEL,
              label: 'Text Generation',
              description: 'Generate text using an AI model.',
              icon: 'type',
              category: 'ai-models',
              inputs: [
                { id: 'prompt', label: 'Prompt', type: 'string', required: true },
                { id: 'maxTokens', label: 'Max Tokens', type: 'number', required: false, default: 100 },
                { id: 'temperature', label: 'Temperature', type: 'number', required: false, default: 0.7 },
              ],
              outputs: [
                { id: 'text', label: 'Text', type: 'string' },
              ],
              defaultConfig: {
                model: 'gpt-3.5-turbo',
                prompt: '',
                maxTokens: 100,
                temperature: 0.7,
              },
            },
            {
              type: NodeType.AI_MODEL,
              label: 'Image Generation',
              description: 'Generate an image using an AI model.',
              icon: 'image',
              category: 'ai-models',
              inputs: [
                { id: 'prompt', label: 'Prompt', type: 'string', required: true },
                { id: 'size', label: 'Size', type: 'string', required: false, default: '512x512' },
              ],
              outputs: [
                { id: 'url', label: 'URL', type: 'string' },
              ],
              defaultConfig: {
                model: 'dall-e-3',
                prompt: '',
                size: '512x512',
              },
            },
            
            // Data Sources
            {
              type: NodeType.DATA_SOURCE,
              label: 'Database Query',
              description: 'Query a database.',
              icon: 'database',
              category: 'data-sources',
              inputs: [
                { id: 'query', label: 'Query', type: 'string', required: true },
                { id: 'parameters', label: 'Parameters', type: 'object', required: false },
              ],
              outputs: [
                { id: 'results', label: 'Results', type: 'array' },
              ],
              defaultConfig: {
                connectionString: '',
                query: 'SELECT * FROM users',
                parameters: {},
              },
            },
            {
              type: NodeType.DATA_SOURCE,
              label: 'File Reader',
              description: 'Read a file.',
              icon: 'file',
              category: 'data-sources',
              inputs: [
                { id: 'path', label: 'Path', type: 'string', required: true },
              ],
              outputs: [
                { id: 'content', label: 'Content', type: 'string' },
              ],
              defaultConfig: {
                path: '',
              },
            },
            
            // Outputs
            {
              type: NodeType.OUTPUT,
              label: 'HTTP Response',
              description: 'Send an HTTP response.',
              icon: 'corner-down-left',
              category: 'outputs',
              inputs: [
                { id: 'body', label: 'Body', type: 'any', required: true },
                { id: 'statusCode', label: 'Status Code', type: 'number', required: false, default: 200 },
                { id: 'headers', label: 'Headers', type: 'object', required: false },
              ],
              outputs: [],
              defaultConfig: {
                statusCode: 200,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            },
            {
              type: NodeType.OUTPUT,
              label: 'File Writer',
              description: 'Write to a file.',
              icon: 'save',
              category: 'outputs',
              inputs: [
                { id: 'path', label: 'Path', type: 'string', required: true },
                { id: 'content', label: 'Content', type: 'string', required: true },
              ],
              outputs: [
                { id: 'success', label: 'Success', type: 'boolean' },
              ],
              defaultConfig: {
                path: '',
                append: false,
              },
            },
          ];
          
          // Assign nodes to categories
          const categoriesWithNodes = mockCategories.map(category => {
            const nodes = mockItems.filter(item => item.category === category.id);
            return { ...category, nodes };
          });
          
          set({
            categories: categoriesWithNodes,
            items: mockItems,
            filteredItems: mockItems,
            isLoading: false,
          });
          
          // Apply any existing filters
          get().applyFilters();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch node library',
            isLoading: false 
          });
        }
      },
      
      // Set search query
      setSearchQuery: (query) => {
        set({ searchQuery: query });
        get().applyFilters();
      },
      
      // Select a category
      selectCategory: (id) => {
        set({ selectedCategory: id });
        get().applyFilters();
      },
      
      // Apply filters
      applyFilters: () => {
        const { items, searchQuery, selectedCategory } = get();
        
        // Filter by category
        let filtered = selectedCategory
          ? items.filter(item => item.category === selectedCategory)
          : items;
        
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(item => 
            item.label.toLowerCase().includes(query) || 
            item.description.toLowerCase().includes(query)
          );
        }
        
        set({ filteredItems: filtered });
      },
    })
  )
);