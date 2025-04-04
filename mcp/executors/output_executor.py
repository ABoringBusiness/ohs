"""
Executor for output nodes
"""

import logging
import os
import json
from typing import Dict, Any

from mcp.models.workflow import Node
from mcp.executors.base_executor import BaseNodeExecutor
from mcp.utils.config import get_settings

logger = logging.getLogger("mcp.executors.output")


class OutputNodeExecutor(BaseNodeExecutor):
    """Executor for output nodes"""
    
    async def initialize(self):
        """Initialize the executor"""
        self.settings = get_settings()
        # Ensure storage directory exists
        os.makedirs(self.settings.storage_path, exist_ok=True)
    
    async def execute(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute an output node
        
        Args:
            node: Node to execute
            inputs: Node inputs
            context: Execution context
            
        Returns:
            Node outputs
        """
        logger.info(f"Executing output node: {node.data.label}")
        
        # Get output type from config
        output_type = node.data.config.get("type", "http_response")
        
        # Handle different output types
        if output_type == "http_response":
            return await self._execute_http_response(node, inputs, context)
        elif output_type == "file_writer":
            return await self._execute_file_writer(node, inputs, context)
        elif output_type == "webhook":
            return await self._execute_webhook(node, inputs, context)
        else:
            raise ValueError(f"Unsupported output type: {output_type}")
    
    async def _execute_http_response(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute an HTTP response output"""
        # Get response parameters
        body = inputs.get("body")
        status_code = inputs.get("statusCode", 200)
        headers = inputs.get("headers", {})
        
        if body is None:
            raise ValueError("Body is required for HTTP response")
        
        logger.info(f"Generating HTTP response with status {status_code}")
        
        # In a real implementation, this would set the response for the HTTP request
        # For now, just return the response data
        return {
            "body": body,
            "statusCode": status_code,
            "headers": headers,
        }
    
    async def _execute_file_writer(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a file writer output"""
        # Get file parameters
        path = inputs.get("path")
        content = inputs.get("content")
        append = node.data.config.get("append", False)
        
        if not path:
            raise ValueError("Path is required for file writer")
        if content is None:
            raise ValueError("Content is required for file writer")
        
        logger.info(f"Writing to file: {path}")
        
        try:
            # Ensure path is within storage directory
            full_path = os.path.join(self.settings.storage_path, os.path.basename(path))
            
            # Write file
            mode = "a" if append else "w"
            with open(full_path, mode) as f:
                f.write(content)
            
            return {
                "success": True,
                "path": path,
                "size": len(content),
            }
        except Exception as e:
            logger.error(f"File writing failed: {str(e)}")
            raise
    
    async def _execute_webhook(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a webhook output"""
        # Get webhook parameters
        url = inputs.get("url")
        payload = inputs.get("payload")
        headers = inputs.get("headers", {})
        
        if not url:
            raise ValueError("URL is required for webhook")
        if payload is None:
            raise ValueError("Payload is required for webhook")
        
        logger.info(f"Sending webhook to: {url}")
        
        # In a real implementation, this would send an HTTP request to the webhook URL
        # For now, just log it
        logger.info(f"Webhook URL: {url}")
        logger.info(f"Webhook payload: {json.dumps(payload)}")
        logger.info(f"Webhook headers: {json.dumps(headers)}")
        
        return {
            "success": True,
            "url": url,
        }