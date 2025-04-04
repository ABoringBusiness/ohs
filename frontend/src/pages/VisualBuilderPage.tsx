import React, { useState } from 'react';
import VisualBuilder from '../features/visual-builder/components/VisualBuilder';
import TemplateGallery from '../features/visual-builder/components/TemplateGallery';
import { useWorkflowStore } from '../features/visual-builder/store/workflowStore';
import { Plus, BookOpen } from 'lucide-react';

const VisualBuilderPage: React.FC = () => {
  const { loadWorkflow, createNewWorkflow } = useWorkflowStore();
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  
  // Handle template selection
  const handleTemplateSelected = async (workflowId: string) => {
    await loadWorkflow(workflowId);
    setShowTemplateGallery(false);
  };
  
  // Handle new workflow
  const handleNewWorkflow = () => {
    createNewWorkflow('New Workflow');
  };
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">Visual Builder</h1>
          <div className="ml-6 flex space-x-2">
            <button
              className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={handleNewWorkflow}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Workflow
            </button>
            <button
              className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => setShowTemplateGallery(true)}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Templates
            </button>
          </div>
        </div>
        
        <div>
          <a
            href="https://docs.openhands.ai/visual-builder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Documentation
          </a>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <VisualBuilder />
      </div>
      
      {/* Template gallery */}
      {showTemplateGallery && (
        <TemplateGallery
          onClose={() => setShowTemplateGallery(false)}
          onTemplateSelected={handleTemplateSelected}
        />
      )}
    </div>
  );
};

export default VisualBuilderPage;