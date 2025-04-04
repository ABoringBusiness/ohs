import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { NodeType } from '../../types';

const TransformationNode: React.FC<NodeProps> = (props) => {
  return <BaseNode {...props} type={NodeType.TRANSFORMATION} />;
};

export default memo(TransformationNode);