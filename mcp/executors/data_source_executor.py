"""
Executor for data source nodes
"""

import logging
import aiohttp
import aiosqlite
import os
from typing import Dict, Any, List

from mcp.models.workflow import Node
from mcp.executors.base_executor import BaseNodeExecutor
from mcp.utils.config import get_settings

logger = logging.getLogger("mcp.executors.data_source")


class DataSourceNodeExecutor(BaseNodeExecutor):
    """Executor for data source nodes"""
    
    async def initialize(self):
        """Initialize the executor"""
        self.settings = get_settings()
        # Create HTTP session
        self.session = aiohttp.ClientSession()
        # Ensure storage directory exists
        os.makedirs(self.settings.storage_path, exist_ok=True)
    
    async def shutdown(self):
        """Shut down the executor"""
        # Close HTTP session
        if hasattr(self, "session") and self.session:
            await self.session.close()
    
    async def execute(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a data source node
        
        Args:
            node: Node to execute
            inputs: Node inputs
            context: Execution context
            
        Returns:
            Node outputs
        """
        logger.info(f"Executing data source node: {node.data.label}")
        
        # Get data source type from config
        source_type = node.data.config.get("type", "database_query")
        
        # Handle different data source types
        if source_type == "database_query":
            return await self._execute_database_query(node, inputs, context)
        elif source_type == "file_reader":
            return await self._execute_file_reader(node, inputs, context)
        elif source_type == "api_request":
            return await self._execute_api_request(node, inputs, context)
        else:
            raise ValueError(f"Unsupported data source type: {source_type}")
    
    async def _execute_database_query(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a database query"""
        # Get query parameters
        query = inputs.get("query")
        parameters = inputs.get("parameters", {})
        connection_string = node.data.config.get("connectionString", "")
        
        if not query:
            raise ValueError("Query is required for database query")
        
        logger.info(f"Executing database query: {query}")
        
        # For simplicity, we'll use SQLite
        # In a real implementation, this would support multiple database types
        try:
            # Use a temporary SQLite database
            db_path = os.path.join(self.settings.storage_path, "temp.db")
            
            async with aiosqlite.connect(db_path) as db:
                # Execute query
                db.row_factory = aiosqlite.Row
                cursor = await db.execute(query, parameters)
                rows = await cursor.fetchall()
                
                # Convert rows to dictionaries
                results = []
                for row in rows:
                    results.append({key: row[key] for key in row.keys()})
                
                return {
                    "results": results,
                    "count": len(results),
                }
        except Exception as e:
            logger.error(f"Database query failed: {str(e)}")
            raise
    
    async def _execute_file_reader(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a file reader"""
        # Get file parameters
        path = inputs.get("path")
        
        if not path:
            raise ValueError("Path is required for file reader")
        
        logger.info(f"Reading file: {path}")
        
        try:
            # Ensure path is within storage directory
            full_path = os.path.join(self.settings.storage_path, os.path.basename(path))
            
            # Read file
            if not os.path.exists(full_path):
                raise ValueError(f"File not found: {path}")
            
            with open(full_path, "r") as f:
                content = f.read()
            
            return {
                "content": content,
                "size": len(content),
                "path": path,
            }
        except Exception as e:
            logger.error(f"File reading failed: {str(e)}")
            raise
    
    async def _execute_api_request(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute an API request"""
        # Get request parameters
        url = inputs.get("url")
        method = inputs.get("method", "GET").upper()
        headers = inputs.get("headers", {})
        params = inputs.get("params", {})
        body = inputs.get("body")
        
        if not url:
            raise ValueError("URL is required for API request")
        
        logger.info(f"Making API request: {method} {url}")
        
        # Make request
        try:
            async with self.session.request(
                method, url, headers=headers, params=params, json=body if body else None
            ) as response:
                # Get response data
                response_data = await response.json(content_type=None)
                
                return {
                    "data": response_data,
                    "status": response.status,
                    "headers": dict(response.headers),
                }
        except Exception as e:
            logger.error(f"API request failed: {str(e)}")
            raise