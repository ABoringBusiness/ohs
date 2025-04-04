import React, { useEffect, useState } from 'react';
import { useTemplateStore } from '../store/templateStore';
import { useWorkflowStore } from '../store/workflowStore';
import { Search, X, Filter, ChevronDown, Star, Clock } from 'lucide-react';

interface TemplateGalleryProps {
  onClose: () => void;
  onTemplateSelected: (workflowId: string) => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ 
  onClose,
  onTemplateSelected
}) => {
  const { 
    templates,
    filteredTemplates,
    categories,
    selectedCategory,
    searchQuery,
    difficultyFilter,
    sortBy,
    fetchTemplates,
    fetchCategories,
    selectCategory,
    setSearchQuery,
    setDifficultyFilter,
    setSortBy,
    useTemplate
  } = useTemplateStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch templates and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchTemplates(), fetchCategories()]);
      } catch (error) {
        setError('Failed to load templates');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [fetchTemplates, fetchCategories]);
  
  // Handle template selection
  const handleSelectTemplate = async (templateId: string) => {
    setIsLoading(true);
    try {
      const workflowId = await useTemplate(templateId);
      onTemplateSelected(workflowId);
    } catch (error) {
      setError('Failed to use template');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render difficulty badge
  const renderDifficultyBadge = (difficulty: string) => {
    let color;
    switch (difficulty) {
      case 'beginner':
        color = 'bg-green-100 text-green-800';
        break;
      case 'intermediate':
        color = 'bg-yellow-100 text-yellow-800';
        break;
      case 'advanced':
        color = 'bg-red-100 text-red-800';
        break;
      default:
        color = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </span>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Template Gallery</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            
            {/* Filter button */}
            <button
              className={`flex items-center px-3 py-2 rounded-md border ${
                showFilters || difficultyFilter || sortBy !== 'popularity'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-gray-300 text-gray-700'
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex flex-wrap gap-4">
                {/* Difficulty filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <div className="flex space-x-2">
                    <button
                      className={`px-3 py-1 text-sm rounded-md ${
                        difficultyFilter === null
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      onClick={() => setDifficultyFilter(null)}
                    >
                      All
                    </button>
                    <button
                      className={`px-3 py-1 text-sm rounded-md ${
                        difficultyFilter === 'beginner'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      onClick={() => setDifficultyFilter('beginner')}
                    >
                      Beginner
                    </button>
                    <button
                      className={`px-3 py-1 text-sm rounded-md ${
                        difficultyFilter === 'intermediate'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      onClick={() => setDifficultyFilter('intermediate')}
                    >
                      Intermediate
                    </button>
                    <button
                      className={`px-3 py-1 text-sm rounded-md ${
                        difficultyFilter === 'advanced'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      onClick={() => setDifficultyFilter('advanced')}
                    >
                      Advanced
                    </button>
                  </div>
                </div>
                
                {/* Sort by */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort by
                  </label>
                  <div className="flex space-x-2">
                    <button
                      className={`flex items-center px-3 py-1 text-sm rounded-md ${
                        sortBy === 'popularity'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      onClick={() => setSortBy('popularity')}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Popularity
                    </button>
                    <button
                      className={`flex items-center px-3 py-1 text-sm rounded-md ${
                        sortBy === 'newest'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      onClick={() => setSortBy('newest')}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Newest
                    </button>
                    <button
                      className={`flex items-center px-3 py-1 text-sm rounded-md ${
                        sortBy === 'oldest'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      onClick={() => setSortBy('oldest')}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Oldest
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Categories */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className={`px-3 py-1 text-sm rounded-full ${
                selectedCategory === null
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
              onClick={() => selectCategory(null)}
            >
              All Categories
            </button>
            
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
                onClick={() => selectCategory(category.id)}
              >
                {category.name}
                <span className="ml-1 text-xs">({category.count})</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-500">
              {error}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No templates found. Try a different search or category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-40 bg-gray-100">
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2">
                      {renderDifficultyBadge(template.difficulty)}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{template.name}</h3>
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="ml-1 text-sm">{template.popularity}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {template.author.avatar ? (
                          <img
                            src={template.author.avatar}
                            alt={template.author.name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 mr-2"></div>
                        )}
                        <span className="text-xs text-gray-500">
                          {template.author.name}
                        </span>
                      </div>
                      
                      <button
                        className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                        onClick={() => handleSelectTemplate(template.id)}
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            className="text-gray-600 hover:text-gray-800 font-medium"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;