import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { NodeType } from '../../types';

const AIModelNode: React.FC<NodeProps> = (props) => {
  return <BaseNode {...props} type={NodeType.AI_MODEL} />;
};

export default memo(AIModelNode);