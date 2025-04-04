import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Template, Category } from '../types';

interface TemplateState {
  // Templates
  templates: Template[];
  filteredTemplates: Template[];
  selectedTemplate: Template | null;
  
  // Categories
  categories: Category[];
  selectedCategory: string | null;
  
  // Filters
  searchQuery: string;
  difficultyFilter: string | null;
  sortBy: 'popularity' | 'newest' | 'oldest';
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTemplates: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  selectTemplate: (id: string | null) => void;
  selectCategory: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setDifficultyFilter: (difficulty: string | null) => void;
  setSortBy: (sortBy: 'popularity' | 'newest' | 'oldest') => void;
  applyFilters: () => void;
  useTemplate: (id: string) => Promise<string>;
}

export const useTemplateStore = create<TemplateState>()(
  devtools(
    (set, get) => ({
      // Initial state
      templates: [],
      filteredTemplates: [],
      selectedTemplate: null,
      categories: [],
      selectedCategory: null,
      searchQuery: '',
      difficultyFilter: null,
      sortBy: 'popularity',
      isLoading: false,
      error: null,
      
      // Fetch templates
      fetchTemplates: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // In a real implementation, this would fetch from an API
          // For now, we'll use mock data
          const mockTemplates: Template[] = [
            {
              id: '1',
              name: 'Customer Support Bot',
              description: 'A workflow that handles customer inquiries and routes them to the appropriate department.',
              workflow: {
                id: '101',
                name: 'Customer Support Bot',
                nodes: [],
                edges: [],
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
                published: true,
                version: 1,
              },
              thumbnail: 'https://via.placeholder.com/300x200?text=Customer+Support',
              category: 'customer-support',
              difficulty: 'beginner',
              popularity: 4.8,
              created_at: '2023-01-01T00:00:00Z',
              author: {
                id: 'user1',
                name: 'John Doe',
                avatar: 'https://via.placeholder.com/50',
              },
            },
            {
              id: '2',
              name: 'Content Generator',
              description: 'Generate blog posts, social media content, and more with AI.',
              workflow: {
                id: '102',
                name: 'Content Generator',
                nodes: [],
                edges: [],
                created_at: '2023-01-02T00:00:00Z',
                updated_at: '2023-01-02T00:00:00Z',
                published: true,
                version: 1,
              },
              thumbnail: 'https://via.placeholder.com/300x200?text=Content+Generator',
              category: 'content-creation',
              difficulty: 'intermediate',
              popularity: 4.5,
              created_at: '2023-01-02T00:00:00Z',
              author: {
                id: 'user2',
                name: 'Jane Smith',
                avatar: 'https://via.placeholder.com/50',
              },
            },
            {
              id: '3',
              name: 'Data Analysis Pipeline',
              description: 'Process and analyze data from various sources.',
              workflow: {
                id: '103',
                name: 'Data Analysis Pipeline',
                nodes: [],
                edges: [],
                created_at: '2023-01-03T00:00:00Z',
                updated_at: '2023-01-03T00:00:00Z',
                published: true,
                version: 1,
              },
              thumbnail: 'https://via.placeholder.com/300x200?text=Data+Analysis',
              category: 'data-processing',
              difficulty: 'advanced',
              popularity: 4.2,
              created_at: '2023-01-03T00:00:00Z',
              author: {
                id: 'user3',
                name: 'Alex Johnson',
                avatar: 'https://via.placeholder.com/50',
              },
            },
            {
              id: '4',
              name: 'E-commerce Product Recommender',
              description: 'Recommend products to users based on their browsing history and preferences.',
              workflow: {
                id: '104',
                name: 'E-commerce Product Recommender',
                nodes: [],
                edges: [],
                created_at: '2023-01-04T00:00:00Z',
                updated_at: '2023-01-04T00:00:00Z',
                published: true,
                version: 1,
              },
              thumbnail: 'https://via.placeholder.com/300x200?text=Product+Recommender',
              category: 'e-commerce',
              difficulty: 'intermediate',
              popularity: 4.6,
              created_at: '2023-01-04T00:00:00Z',
              author: {
                id: 'user4',
                name: 'Sarah Williams',
                avatar: 'https://via.placeholder.com/50',
              },
            },
            {
              id: '5',
              name: 'Social Media Monitor',
              description: 'Monitor social media mentions and sentiment about your brand.',
              workflow: {
                id: '105',
                name: 'Social Media Monitor',
                nodes: [],
                edges: [],
                created_at: '2023-01-05T00:00:00Z',
                updated_at: '2023-01-05T00:00:00Z',
                published: true,
                version: 1,
              },
              thumbnail: 'https://via.placeholder.com/300x200?text=Social+Media+Monitor',
              category: 'social-media',
              difficulty: 'beginner',
              popularity: 4.3,
              created_at: '2023-01-05T00:00:00Z',
              author: {
                id: 'user5',
                name: 'Michael Brown',
                avatar: 'https://via.placeholder.com/50',
              },
            },
          ];
          
          set({
            templates: mockTemplates,
            filteredTemplates: mockTemplates,
            isLoading: false,
          });
          
          // Apply any existing filters
          get().applyFilters();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch templates',
            isLoading: false 
          });
        }
      },
      
      // Fetch categories
      fetchCategories: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // In a real implementation, this would fetch from an API
          // For now, we'll use mock data
          const mockCategories: Category[] = [
            {
              id: 'customer-support',
              name: 'Customer Support',
              description: 'Templates for handling customer inquiries and support.',
              icon: 'headset',
              count: 1,
            },
            {
              id: 'content-creation',
              name: 'Content Creation',
              description: 'Templates for generating various types of content.',
              icon: 'edit',
              count: 1,
            },
            {
              id: 'data-processing',
              name: 'Data Processing',
              description: 'Templates for processing and analyzing data.',
              icon: 'database',
              count: 1,
            },
            {
              id: 'e-commerce',
              name: 'E-commerce',
              description: 'Templates for e-commerce applications.',
              icon: 'shopping-cart',
              count: 1,
            },
            {
              id: 'social-media',
              name: 'Social Media',
              description: 'Templates for social media management and analysis.',
              icon: 'share',
              count: 1,
            },
          ];
          
          set({
            categories: mockCategories,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch categories',
            isLoading: false 
          });
        }
      },
      
      // Select a template
      selectTemplate: (id) => {
        if (id === null) {
          set({ selectedTemplate: null });
          return;
        }
        
        const template = get().templates.find(t => t.id === id);
        set({ selectedTemplate: template || null });
      },
      
      // Select a category
      selectCategory: (id) => {
        set({ 
          selectedCategory: id,
        });
        
        get().applyFilters();
      },
      
      // Set search query
      setSearchQuery: (query) => {
        set({ searchQuery: query });
        get().applyFilters();
      },
      
      // Set difficulty filter
      setDifficultyFilter: (difficulty) => {
        set({ difficultyFilter: difficulty });
        get().applyFilters();
      },
      
      // Set sort by
      setSortBy: (sortBy) => {
        set({ sortBy });
        get().applyFilters();
      },
      
      // Apply filters
      applyFilters: () => {
        const { templates, selectedCategory, searchQuery, difficultyFilter, sortBy } = get();
        
        // Filter by category
        let filtered = selectedCategory
          ? templates.filter(t => t.category === selectedCategory)
          : templates;
        
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(t => 
            t.name.toLowerCase().includes(query) || 
            t.description.toLowerCase().includes(query)
          );
        }
        
        // Filter by difficulty
        if (difficultyFilter) {
          filtered = filtered.filter(t => t.difficulty === difficultyFilter);
        }
        
        // Sort
        switch (sortBy) {
          case 'popularity':
            filtered = [...filtered].sort((a, b) => b.popularity - a.popularity);
            break;
          case 'newest':
            filtered = [...filtered].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            break;
          case 'oldest':
            filtered = [...filtered].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            break;
        }
        
        set({ filteredTemplates: filtered });
      },
      
      // Use a template
      useTemplate: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const template = get().templates.find(t => t.id === id);
          
          if (!template) {
            throw new Error(`Template with ID ${id} not found`);
          }
          
          // In a real implementation, this would create a new workflow based on the template
          // For now, we'll just return the template's workflow ID
          
          set({ isLoading: false });
          return template.workflow.id;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to use template',
            isLoading: false 
          });
          throw error;
        }
      },
    })
  )
);