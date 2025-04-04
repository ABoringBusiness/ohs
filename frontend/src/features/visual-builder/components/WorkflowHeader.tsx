import React, { useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { Save, Share2, Copy, Trash2 } from 'lucide-react';

const WorkflowHeader: React.FC = () => {
  const { 
    currentWorkflow, 
    saveWorkflow, 
    publishWorkflow, 
    duplicateWorkflow, 
    deleteWorkflow,
    createNewWorkflow,
  } = useWorkflowStore();
  
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(currentWorkflow?.name || '');
  
  // Handle save
  const handleSave = async () => {
    await saveWorkflow();
  };
  
  // Handle publish
  const handlePublish = async () => {
    await publishWorkflow();
  };
  
  // Handle duplicate
  const handleDuplicate = async () => {
    if (currentWorkflow) {
      await duplicateWorkflow(currentWorkflow.id);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (currentWorkflow && window.confirm('Are you sure you want to delete this workflow?')) {
      await deleteWorkflow(currentWorkflow.id);
      createNewWorkflow('New Workflow');
    }
  };
  
  // Handle rename
  const handleRename = () => {
    if (currentWorkflow) {
      currentWorkflow.name = newName;
      saveWorkflow();
      setIsRenaming(false);
    }
  };
  
  if (!currentWorkflow) {
    return <div className="h-16 border-b border-gray-200"></div>;
  }
  
  return (
    <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center">
        {isRenaming ? (
          <div className="flex items-center">
            <input
              type="text"
              className="border border-gray-300 rounded-md px-2 py-1 mr-2"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <button
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              onClick={handleRename}
            >
              Save
            </button>
            <button
              className="text-gray-600 hover:text-gray-800 text-sm font-medium ml-2"
              onClick={() => setIsRenaming(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <h1 className="text-xl font-semibold mr-2">{currentWorkflow.name}</h1>
            <button
              className="text-gray-500 hover:text-gray-700 text-sm"
              onClick={() => {
                setNewName(currentWorkflow.name);
                setIsRenaming(true);
              }}
            >
              Rename
            </button>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          onClick={handleSave}
          title="Save workflow"
        >
          <Save className="h-4 w-4 mr-1" />
          Save
        </button>
        
        <button
          className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          onClick={handlePublish}
          title="Publish workflow"
        >
          <Share2 className="h-4 w-4 mr-1" />
          {currentWorkflow.published ? 'Update' : 'Publish'}
        </button>
        
        <button
          className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
          onClick={handleDuplicate}
          title="Duplicate workflow"
        >
          <Copy className="h-5 w-5" />
        </button>
        
        <button
          className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-gray-100"
          onClick={handleDelete}
          title="Delete workflow"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default WorkflowHeader;