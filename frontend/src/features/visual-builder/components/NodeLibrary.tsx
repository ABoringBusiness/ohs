import React, { useEffect } from 'react';
import { useNodeLibraryStore } from '../store/nodeLibraryStore';
import { NodeLibraryItem } from '../types';
import { Search, X } from 'lucide-react';

const NodeLibrary: React.FC = () => {
  const { 
    categories, 
    filteredItems, 
    searchQuery, 
    selectedCategory,
    fetchNodeLibrary,
    setSearchQuery,
    selectCategory,
  } = useNodeLibraryStore();
  
  // Fetch node library on mount
  useEffect(() => {
    fetchNodeLibrary();
  }, [fetchNodeLibrary]);
  
  // Handle drag start
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/data', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };
  
  // Render a node item
  const renderNodeItem = (item: NodeLibraryItem) => (
    <div
      key={`${item.type}-${item.label}`}
      className="p-3 border border-gray-200 rounded-md mb-2 cursor-grab hover:bg-gray-50"
      draggable
      onDragStart={(e) => onDragStart(e, item.type, { label: item.label })}
    >
      <div className="flex items-center mb-1">
        <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-md mr-2">
          <i className={`icon-${item.icon}`}></i>
        </div>
        <div className="font-medium">{item.label}</div>
      </div>
      <div className="text-sm text-gray-500">{item.description}</div>
    </div>
  );
  
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Node Library</h2>
      
      {/* Search */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md"
          placeholder="Search nodes..."
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
      
      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`px-3 py-1 text-sm rounded-full ${
            selectedCategory === null
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}
          onClick={() => selectCategory(null)}
        >
          All
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
          </button>
        ))}
      </div>
      
      {/* Node list */}
      <div className="space-y-4">
        {selectedCategory === null ? (
          // Group by category
          categories.map((category) => {
            const categoryItems = filteredItems.filter(
              (item) => item.category === category.id
            );
            
            if (categoryItems.length === 0) {
              return null;
            }
            
            return (
              <div key={category.id}>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">
                  {category.name}
                </h3>
                <div>{categoryItems.map(renderNodeItem)}</div>
              </div>
            );
          })
        ) : (
          // Show selected category
          <div>{filteredItems.map(renderNodeItem)}</div>
        )}
        
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No nodes found. Try a different search or category.
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeLibrary;