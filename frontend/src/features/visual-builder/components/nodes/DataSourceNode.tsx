import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { NodeType } from '../../types';

const DataSourceNode: React.FC<NodeProps> = (props) => {
  return <BaseNode {...props} type={NodeType.DATA_SOURCE} />;
};

export default memo(DataSourceNode);