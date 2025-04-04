import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { NodeType } from '../../types';

const ConditionNode: React.FC<NodeProps> = (props) => {
  return <BaseNode {...props} type={NodeType.CONDITION} />;
};

export default memo(ConditionNode);