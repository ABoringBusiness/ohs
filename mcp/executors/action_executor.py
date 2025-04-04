"""
Executor for action nodes
"""

import logging
import aiohttp
from typing import Dict, Any

from mcp.models.workflow import Node
from mcp.executors.base_executor import BaseNodeExecutor

logger = logging.getLogger("mcp.executors.action")


class ActionNodeExecutor(BaseNodeExecutor):
    """Executor for action nodes"""
    
    async def initialize(self):
        """Initialize the executor"""
        # Create HTTP session
        self.session = aiohttp.ClientSession()
    
    async def shutdown(self):
        """Shut down the executor"""
        # Close HTTP session
        if hasattr(self, "session") and self.session:
            await self.session.close()
    
    async def execute(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute an action node
        
        Args:
            node: Node to execute
            inputs: Node inputs
            context: Execution context
            
        Returns:
            Node outputs
        """
        logger.info(f"Executing action node: {node.data.label}")
        
        # Get action type from config
        action_type = node.data.config.get("type", "http_request")
        
        # Handle different action types
        if action_type == "http_request":
            return await self._execute_http_request(node, inputs, context)
        elif action_type == "send_email":
            return await self._execute_send_email(node, inputs, context)
        else:
            raise ValueError(f"Unsupported action type: {action_type}")
    
    async def _execute_http_request(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute an HTTP request action"""
        # Get request parameters
        url = inputs.get("url")
        method = inputs.get("method", "GET").upper()
        headers = inputs.get("headers", {})
        body = inputs.get("body")
        
        if not url:
            raise ValueError("URL is required for HTTP request")
        
        logger.info(f"Making HTTP request: {method} {url}")
        
        # Make request
        try:
            async with self.session.request(
                method, url, headers=headers, json=body if body else None
            ) as response:
                # Get response data
                response_data = await response.json(content_type=None)
                
                return {
                    "response": response_data,
                    "status": response.status,
                    "headers": dict(response.headers),
                }
        except Exception as e:
            logger.error(f"HTTP request failed: {str(e)}")
            raise
    
    async def _execute_send_email(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a send email action"""
        # Get email parameters
        to = inputs.get("to")
        subject = inputs.get("subject")
        body = inputs.get("body")
        
        if not to:
            raise ValueError("Recipient (to) is required for sending email")
        if not subject:
            raise ValueError("Subject is required for sending email")
        if not body:
            raise ValueError("Body is required for sending email")
        
        logger.info(f"Sending email to {to}: {subject}")
        
        # In a real implementation, this would send an email
        # For now, just log it
        logger.info(f"Email to: {to}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body: {body}")
        
        return {
            "success": True,
            "messageId": f"email_{hash(to + subject)}",
        }