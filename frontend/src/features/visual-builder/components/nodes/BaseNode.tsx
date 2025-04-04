import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeType } from '../../types';

interface BaseNodeProps extends NodeProps {
  data: {
    label: string;
    description?: string;
    icon?: string;
    inputs: Array<{ id: string; label: string; type: string }>;
    outputs: Array<{ id: string; label: string; type: string }>;
    config: Record<string, any>;
  };
  type: NodeType;
  selected: boolean;
}

const BaseNode: React.FC<BaseNodeProps> = ({ 
  id, 
  data, 
  type, 
  selected,
  isConnectable 
}) => {
  // Get background color based on node type
  const getBackgroundColor = () => {
    switch (type) {
      case NodeType.TRIGGER:
        return 'bg-purple-100';
      case NodeType.ACTION:
        return 'bg-blue-100';
      case NodeType.CONDITION:
        return 'bg-yellow-100';
      case NodeType.TRANSFORMATION:
        return 'bg-green-100';
      case NodeType.AI_MODEL:
        return 'bg-indigo-100';
      case NodeType.DATA_SOURCE:
        return 'bg-orange-100';
      case NodeType.OUTPUT:
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  // Get border color based on node type
  const getBorderColor = () => {
    switch (type) {
      case NodeType.TRIGGER:
        return selected ? 'border-purple-500' : 'border-purple-200';
      case NodeType.ACTION:
        return selected ? 'border-blue-500' : 'border-blue-200';
      case NodeType.CONDITION:
        return selected ? 'border-yellow-500' : 'border-yellow-200';
      case NodeType.TRANSFORMATION:
        return selected ? 'border-green-500' : 'border-green-200';
      case NodeType.AI_MODEL:
        return selected ? 'border-indigo-500' : 'border-indigo-200';
      case NodeType.DATA_SOURCE:
        return selected ? 'border-orange-500' : 'border-orange-200';
      case NodeType.OUTPUT:
        return selected ? 'border-red-500' : 'border-red-200';
      default:
        return selected ? 'border-gray-500' : 'border-gray-200';
    }
  };

  // Get icon color based on node type
  const getIconColor = () => {
    switch (type) {
      case NodeType.TRIGGER:
        return 'text-purple-500';
      case NodeType.ACTION:
        return 'text-blue-500';
      case NodeType.CONDITION:
        return 'text-yellow-500';
      case NodeType.TRANSFORMATION:
        return 'text-green-500';
      case NodeType.AI_MODEL:
        return 'text-indigo-500';
      case NodeType.DATA_SOURCE:
        return 'text-orange-500';
      case NodeType.OUTPUT:
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div
      className={`px-4 pt-2 pb-3 rounded-lg border-2 ${getBorderColor()} ${getBackgroundColor()} shadow-sm min-w-[180px]`}
    >
      {/* Input handles */}
      {data.inputs.length > 0 && (
        <div className="absolute -left-3 top-0 h-full flex flex-col justify-around items-center">
          {data.inputs.map((input, index) => (
            <div key={input.id} className="relative py-2">
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-gray-400"
              />
              <span className="absolute left-4 text-xs text-gray-500 whitespace-nowrap">
                {input.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Node content */}
      <div className="flex items-center mb-2">
        {data.icon && (
          <div className={`mr-2 ${getIconColor()}`}>
            <i className={`icon-${data.icon}`}></i>
          </div>
        )}
        <div className="font-medium truncate">{data.label}</div>
      </div>

      {data.description && (
        <div className="text-xs text-gray-500 mb-2 line-clamp-2">
          {data.description}
        </div>
      )}

      {/* Output handles */}
      {data.outputs.length > 0 && (
        <div className="absolute -right-3 top-0 h-full flex flex-col justify-around items-center">
          {data.outputs.map((output, index) => (
            <div key={output.id} className="relative py-2">
              <span className="absolute right-4 text-xs text-gray-500 whitespace-nowrap">
                {output.label}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-gray-400"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(BaseNode);