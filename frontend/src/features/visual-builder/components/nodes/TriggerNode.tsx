import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { NodeType } from '../../types';

const TriggerNode: React.FC<NodeProps> = (props) => {
  return <BaseNode {...props} type={NodeType.TRIGGER} />;
};

export default memo(TriggerNode);