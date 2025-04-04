"""
Executor for transformation nodes
"""

import logging
import json
import re
from typing import Dict, Any

from mcp.models.workflow import Node
from mcp.executors.base_executor import BaseNodeExecutor

logger = logging.getLogger("mcp.executors.transformation")


class TransformationNodeExecutor(BaseNodeExecutor):
    """Executor for transformation nodes"""
    
    async def execute(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a transformation node
        
        Args:
            node: Node to execute
            inputs: Node inputs
            context: Execution context
            
        Returns:
            Node outputs
        """
        logger.info(f"Executing transformation node: {node.data.label}")
        
        # Get transformation type from config
        transformation_type = node.data.config.get("type", "json_transform")
        
        # Handle different transformation types
        if transformation_type == "json_transform":
            return await self._execute_json_transform(node, inputs, context)
        elif transformation_type == "text_template":
            return await self._execute_text_template(node, inputs, context)
        else:
            raise ValueError(f"Unsupported transformation type: {transformation_type}")
    
    async def _execute_json_transform(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a JSON transformation"""
        # Get input and template
        input_data = inputs.get("input")
        template = inputs.get("template")
        
        if input_data is None:
            raise ValueError("Input data is required for JSON transformation")
        if template is None:
            raise ValueError("Template is required for JSON transformation")
        
        # Apply template
        try:
            output = self._apply_json_template(input_data, template)
            return {
                "output": output,
            }
        except Exception as e:
            logger.error(f"JSON transformation failed: {str(e)}")
            raise
    
    async def _execute_text_template(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a text template transformation"""
        # Get template and variables
        template = inputs.get("template")
        variables = inputs.get("variables", {})
        
        if template is None:
            raise ValueError("Template is required for text template transformation")
        
        # Apply template
        try:
            output = self._apply_text_template(template, variables)
            return {
                "output": output,
            }
        except Exception as e:
            logger.error(f"Text template transformation failed: {str(e)}")
            raise
    
    def _apply_json_template(self, input_data: Any, template: Any) -> Any:
        """
        Apply a JSON template to input data
        
        Args:
            input_data: Input data
            template: Template
            
        Returns:
            Transformed data
        """
        # Handle different types
        if isinstance(template, dict):
            # Process object
            result = {}
            for key, value in template.items():
                # Check for special keys
                if key.startswith("$"):
                    # Handle special operators
                    if key == "$value":
                        return input_data
                    elif key == "$select" and isinstance(value, str):
                        return self._select_value(input_data, value)
                    elif key == "$transform" and isinstance(value, dict):
                        return self._apply_json_template(input_data, value["template"])
                else:
                    # Regular key, process value
                    result[key] = self._apply_json_template(input_data, value)
            return result
        elif isinstance(template, list):
            # Process array
            return [self._apply_json_template(input_data, item) for item in template]
        else:
            # Primitive value, return as is
            return template
    
    def _select_value(self, data: Any, path: str) -> Any:
        """
        Select a value from data using a path
        
        Args:
            data: Data to select from
            path: Path to select
            
        Returns:
            Selected value
        """
        # Split path into parts
        parts = path.split(".")
        
        # Traverse data
        current = data
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            elif isinstance(current, list) and part.isdigit():
                index = int(part)
                if 0 <= index < len(current):
                    current = current[index]
                else:
                    return None
            else:
                return None
        
        return current
    
    def _apply_text_template(self, template: str, variables: Dict[str, Any]) -> str:
        """
        Apply variables to a text template
        
        Args:
            template: Template string
            variables: Variables to apply
            
        Returns:
            Rendered template
        """
        # Replace variables in the format {{variable}}
        result = template
        for key, value in variables.items():
            result = re.sub(r'\{\{\s*' + re.escape(key) + r'\s*\}\}', str(value), result)
        
        return result