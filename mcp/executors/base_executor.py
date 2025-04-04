"""
Base class for node executors
"""

import abc
from typing import Dict, Any

from mcp.models.workflow import Node


class BaseNodeExecutor(abc.ABC):
    """Base class for node executors"""
    
    async def initialize(self):
        """Initialize the executor"""
        pass
    
    async def shutdown(self):
        """Shut down the executor"""
        pass
    
    @abc.abstractmethod
    async def execute(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a node
        
        Args:
            node: Node to execute
            inputs: Node inputs
            context: Execution context
            
        Returns:
            Node outputs
        """
        pass