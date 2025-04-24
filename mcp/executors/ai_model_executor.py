"""
Executor for AI model nodes
"""

import logging
import aiohttp
from typing import Dict, Any, Optional

from mcp.models.workflow import Node
from mcp.executors.base_executor import BaseNodeExecutor
from mcp.utils.config import get_settings

logger = logging.getLogger("mcp.executors.ai_model")


class AIModelNodeExecutor(BaseNodeExecutor):
    """Executor for AI model nodes"""
    
    async def initialize(self):
        """Initialize the executor"""
        self.settings = get_settings()
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
        Execute an AI model node
        
        Args:
            node: Node to execute
            inputs: Node inputs
            context: Execution context
            
        Returns:
            Node outputs
        """
        logger.info(f"Executing AI model node: {node.data.label}")
        
        # Get model type from config
        model_type = node.data.config.get("type", "text_generation")
        
        # Handle different model types
        if model_type == "text_generation":
            return await self._execute_text_generation(node, inputs, context)
        elif model_type == "image_generation":
            return await self._execute_image_generation(node, inputs, context)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
    
    async def _execute_text_generation(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a text generation model"""
        # Get model parameters
        model = node.data.config.get("model", "gpt-3.5-turbo")
        prompt = inputs.get("prompt")
        max_tokens = inputs.get("maxTokens", 100)
        temperature = inputs.get("temperature", 0.7)
        
        if not prompt:
            raise ValueError("Prompt is required for text generation")
        
        logger.info(f"Generating text with model {model}")
        
        # Call OpenHands API
        try:
            # Use the OpenHands API to generate text
            api_url = f"{self.settings.openhands_api_url}/api/ai/generate"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.settings.openhands_api_key}",
            }
            payload = {
                "model": model,
                "prompt": prompt,
                "max_tokens": max_tokens,
                "temperature": temperature,
            }
            
            async with self.session.post(api_url, json=payload, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise ValueError(f"API request failed with status {response.status}: {error_text}")
                
                result = await response.json()
                
                return {
                    "text": result.get("text", ""),
                    "model": model,
                    "usage": result.get("usage", {}),
                }
        except Exception as e:
            logger.error(f"Text generation failed: {str(e)}")
            raise
    
    async def _execute_image_generation(
        self, node: Node, inputs: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute an image generation model"""
        # Get model parameters
        model = node.data.config.get("model", "dall-e-3")
        prompt = inputs.get("prompt")
        size = inputs.get("size", "512x512")
        
        if not prompt:
            raise ValueError("Prompt is required for image generation")
        
        logger.info(f"Generating image with model {model}")
        
        # Call OpenHands API
        try:
            # Use the OpenHands API to generate an image
            api_url = f"{self.settings.openhands_api_url}/api/ai/generate-image"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.settings.openhands_api_key}",
            }
            payload = {
                "model": model,
                "prompt": prompt,
                "size": size,
            }
            
            async with self.session.post(api_url, json=payload, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise ValueError(f"API request failed with status {response.status}: {error_text}")
                
                result = await response.json()
                
                return {
                    "url": result.get("url", ""),
                    "model": model,
                }
        except Exception as e:
            logger.error(f"Image generation failed: {str(e)}")
            raise