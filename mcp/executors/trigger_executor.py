"""
Executor for trigger nodes
"""

import logging
from typing import Dict, Any

from mcp.models.workflow import Node
from mcp.executors.base_executor import BaseNodeExecutor

logger = logging.getLogger("mcp.executors.trigger")


class TriggerNodeExecutor(BaseNodeExecutor):
    """Executor for trigger nodes"""
    
    async def execute(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a trigger node
        
        Args:
            node: Node to execute
            inputs: Node inputs
            context: Execution context
            
        Returns:
            Node outputs
        """
        logger.info(f"Executing trigger node: {node.data.label}")
        
        # Get trigger type from config
        trigger_type = node.data.config.get("type", "manual")
        
        # Handle different trigger types
        if trigger_type == "webhook":
            return await self._execute_webhook_trigger(node, inputs, context)
        elif trigger_type == "schedule":
            return await self._execute_schedule_trigger(node, inputs, context)
        else:
            # Default to manual trigger
            return await self._execute_manual_trigger(node, inputs, context)
    
    async def _execute_webhook_trigger(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a webhook trigger"""
        # In a real implementation, this would handle webhook data
        # For now, just pass through the input
        return {
            "payload": context["input"],
            "headers": context["input"].get("headers", {}),
            "method": context["input"].get("method", "POST"),
        }
    
    async def _execute_schedule_trigger(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a schedule trigger"""
        # In a real implementation, this would handle schedule data
        # For now, just return the current time
        import datetime
        
        return {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "schedule": node.data.config.get("schedule", ""),
            "timezone": node.data.config.get("timezone", "UTC"),
        }
    
    async def _execute_manual_trigger(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a manual trigger"""
        # Simply pass through the input
        return {
            "payload": context["input"],
        }