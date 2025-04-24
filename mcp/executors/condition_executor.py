"""
Executor for condition nodes
"""

import logging
from typing import Dict, Any

from mcp.models.workflow import Node
from mcp.executors.base_executor import BaseNodeExecutor

logger = logging.getLogger("mcp.executors.condition")


class ConditionNodeExecutor(BaseNodeExecutor):
    """Executor for condition nodes"""
    
    async def execute(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a condition node
        
        Args:
            node: Node to execute
            inputs: Node inputs
            context: Execution context
            
        Returns:
            Node outputs
        """
        logger.info(f"Executing condition node: {node.data.label}")
        
        # Get condition type from config
        condition_type = node.data.config.get("type", "if_else")
        
        # Handle different condition types
        if condition_type == "if_else":
            return await self._execute_if_else(node, inputs, context)
        elif condition_type == "switch":
            return await self._execute_switch(node, inputs, context)
        else:
            raise ValueError(f"Unsupported condition type: {condition_type}")
    
    async def _execute_if_else(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute an if/else condition"""
        # Get condition expression
        condition = inputs.get("condition")
        
        if condition is None:
            raise ValueError("Condition is required for if/else node")
        
        # Evaluate condition
        result = bool(condition)
        logger.info(f"Condition evaluated to: {result}")
        
        # Return result
        return {
            "result": result,
            "true": result,
            "false": not result,
        }
    
    async def _execute_switch(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a switch condition"""
        # Get value and cases
        value = inputs.get("value")
        cases = inputs.get("cases", [])
        
        if value is None:
            raise ValueError("Value is required for switch node")
        
        # Find matching case
        matched_case = None
        for case in cases:
            case_value = case.get("value")
            if case_value == value:
                matched_case = case
                break
        
        # Return result
        result = {
            "value": value,
            "matched": matched_case is not None,
            "default": matched_case is None,
        }
        
        # Add case-specific outputs
        if matched_case:
            result["case"] = matched_case.get("id")
            result["output"] = matched_case.get("output")
        
        return result