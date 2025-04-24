"""
Factory for creating node executors
"""

import logging
from typing import Dict, Type

from mcp.models.workflow import NodeType
from mcp.executors.base_executor import BaseNodeExecutor
from mcp.executors.trigger_executor import TriggerNodeExecutor
from mcp.executors.action_executor import ActionNodeExecutor
from mcp.executors.condition_executor import ConditionNodeExecutor
from mcp.executors.transformation_executor import TransformationNodeExecutor
from mcp.executors.ai_model_executor import AIModelNodeExecutor
from mcp.executors.data_source_executor import DataSourceNodeExecutor
from mcp.executors.output_executor import OutputNodeExecutor

logger = logging.getLogger("mcp.node_executor_factory")


class NodeExecutorFactory:
    """Factory for creating node executors"""
    
    def __init__(self):
        """Initialize the factory"""
        self.executors: Dict[NodeType, BaseNodeExecutor] = {}
        self.executor_classes: Dict[NodeType, Type[BaseNodeExecutor]] = {
            NodeType.TRIGGER: TriggerNodeExecutor,
            NodeType.ACTION: ActionNodeExecutor,
            NodeType.CONDITION: ConditionNodeExecutor,
            NodeType.TRANSFORMATION: TransformationNodeExecutor,
            NodeType.AI_MODEL: AIModelNodeExecutor,
            NodeType.DATA_SOURCE: DataSourceNodeExecutor,
            NodeType.OUTPUT: OutputNodeExecutor,
        }
    
    async def initialize(self):
        """Initialize all executors"""
        logger.info("Initializing node executors")
        for node_type, executor_class in self.executor_classes.items():
            logger.debug(f"Initializing {node_type} executor")
            executor = executor_class()
            await executor.initialize()
            self.executors[node_type] = executor
    
    async def shutdown(self):
        """Shut down all executors"""
        logger.info("Shutting down node executors")
        for node_type, executor in self.executors.items():
            logger.debug(f"Shutting down {node_type} executor")
            await executor.shutdown()
    
    def get_executor(self, node_type: NodeType) -> BaseNodeExecutor:
        """
        Get executor for a node type
        
        Args:
            node_type: Node type
            
        Returns:
            Node executor
            
        Raises:
            ValueError: If no executor is found for the node type
        """
        if node_type not in self.executors:
            raise ValueError(f"No executor found for node type: {node_type}")
        
        return self.executors[node_type]