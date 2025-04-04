import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { NodeType } from '../../types';

const ActionNode: React.FC<NodeProps> = (props) => {
  return <BaseNode {...props} type={NodeType.ACTION} />;
};

export default memo(ActionNode);