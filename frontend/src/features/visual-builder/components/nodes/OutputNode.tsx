import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { NodeType } from '../../types';

const OutputNode: React.FC<NodeProps> = (props) => {
  return <BaseNode {...props} type={NodeType.OUTPUT} />;
};

export default memo(OutputNode);