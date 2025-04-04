"""Agent execution engine for the AI Agent Marketplace."""

import logging
from typing import Dict, List, Optional, Any

from openhands.marketplace.models import (
    AgentDefinition,
    UserAgentLibrary,
)
from openhands.marketplace.storage import MarketplaceStorage
from openhands.marketplace.registry import AgentRegistry

logger = logging.getLogger(__name__)


class AgentExecutionEngine:
    """Execution engine for AI agents."""
    
    def __init__(self, storage: MarketplaceStorage, registry: AgentRegistry):
        """Initialize the agent execution engine.
        
        Args:
            storage: The marketplace storage service.
            registry: The agent registry service.
        """
        self.storage = storage
        self.registry = registry
        self.active_agents: Dict[str, AgentDefinition] = {}  # user_id -> agent
    
    async def get_active_agent(self, user_id: str) -> Optional[AgentDefinition]:
        """Get the active agent for a user.
        
        Args:
            user_id: The user ID.
            
        Returns:
            The active agent definition, or None if no agent is active.
        """
        try:
            # Check if the agent is already loaded
            if user_id in self.active_agents:
                return self.active_agents[user_id]
            
            # Get the user's agent library
            library = await self.storage.get_user_library(user_id)
            
            # Check if an agent is active
            if not library.active_agent_id:
                return None
            
            # Get the agent definition
            agent = await self.storage.get_agent_definition(library.active_agent_id)
            
            if not agent:
                return None
            
            # Cache the agent
            self.active_agents[user_id] = agent
            
            # Record the agent usage
            await self.registry.record_agent_usage(agent.id, user_id)
            
            return agent
        
        except Exception as e:
            logger.error(f"Error getting active agent: {e}")
            return None
    
    async def set_active_agent(self, agent_id: str, user_id: str) -> bool:
        """Set the active agent for a user.
        
        Args:
            agent_id: The agent ID.
            user_id: The user ID.
            
        Returns:
            True if the activation was successful, False otherwise.
        """
        try:
            # Set the active agent in the registry
            success = await self.registry.set_active_agent(agent_id, user_id)
            
            if not success:
                return False
            
            # Clear the cached agent
            if user_id in self.active_agents:
                del self.active_agents[user_id]
            
            # Load the new agent
            agent = await self.get_active_agent(user_id)
            
            return agent is not None
        
        except Exception as e:
            logger.error(f"Error setting active agent: {e}")
            return False
    
    async def get_system_prompt(self, user_id: str) -> str:
        """Get the system prompt for a user's active agent.
        
        Args:
            user_id: The user ID.
            
        Returns:
            The system prompt, or a default prompt if no agent is active.
        """
        try:
            # Get the active agent
            agent = await self.get_active_agent(user_id)
            
            if not agent:
                return "You are a helpful AI assistant."
            
            return agent.system_prompt
        
        except Exception as e:
            logger.error(f"Error getting system prompt: {e}")
            return "You are a helpful AI assistant."
    
    async def get_tools(self, user_id: str) -> List[Dict[str, Any]]:
        """Get the tools for a user's active agent.
        
        Args:
            user_id: The user ID.
            
        Returns:
            A list of tool configurations, or an empty list if no agent is active.
        """
        try:
            # Get the active agent
            agent = await self.get_active_agent(user_id)
            
            if not agent:
                return []
            
            # Convert tools to the format expected by the LLM
            tools = []
            for tool in agent.tools:
                if isinstance(tool, str):
                    # Built-in tool
                    tools.append({"type": tool})
                else:
                    # Custom tool
                    tools.append({
                        "type": tool.type,
                        "name": tool.name,
                        "description": tool.description,
                        "config": tool.config,
                        "required": tool.required,
                    })
            
            return tools
        
        except Exception as e:
            logger.error(f"Error getting tools: {e}")
            return []
    
    async def prepare_context(self, user_id: str, message: str) -> Dict[str, Any]:
        """Prepare the context for a user's active agent.
        
        Args:
            user_id: The user ID.
            message: The user message.
            
        Returns:
            The context for the LLM.
        """
        try:
            # Get the active agent
            agent = await self.get_active_agent(user_id)
            
            if not agent:
                return {
                    "system_prompt": "You are a helpful AI assistant.",
                    "tools": [],
                    "knowledge_base": [],
                    "agent_name": "Default Assistant",
                }
            
            return {
                "system_prompt": agent.system_prompt,
                "tools": await self.get_tools(user_id),
                "knowledge_base": agent.knowledge_base,
                "agent_name": agent.name,
            }
        
        except Exception as e:
            logger.error(f"Error preparing context: {e}")
            return {
                "system_prompt": "You are a helpful AI assistant.",
                "tools": [],
                "knowledge_base": [],
                "agent_name": "Default Assistant",
            }