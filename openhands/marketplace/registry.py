"""Agent registry service for the AI Agent Marketplace."""

import logging
import re
from typing import Dict, List, Optional, Any, Tuple

from openhands.marketplace.models import (
    AgentDefinition,
    AgentReview,
    UserAgentLibrary,
    AgentInstallation,
)
from openhands.marketplace.storage import MarketplaceStorage

logger = logging.getLogger(__name__)


class AgentRegistry:
    """Registry service for AI agents."""
    
    def __init__(self, storage: MarketplaceStorage):
        """Initialize the agent registry.
        
        Args:
            storage: The marketplace storage service.
        """
        self.storage = storage
    
    async def register_agent(self, agent: AgentDefinition, user_id: str) -> Optional[AgentDefinition]:
        """Register a new agent.
        
        Args:
            agent: The agent definition.
            user_id: The user ID of the creator.
            
        Returns:
            The registered agent definition, or None if registration failed.
        """
        try:
            # Validate the agent definition
            validation_errors = self._validate_agent(agent)
            if validation_errors:
                logger.error(f"Agent validation failed: {validation_errors}")
                return None
            
            # Set the author ID
            agent.author.id = user_id
            
            # Save the agent definition
            success = await self.storage.save_agent_definition(agent)
            
            if not success:
                return None
            
            return agent
        
        except Exception as e:
            logger.error(f"Error registering agent: {e}")
            return None
    
    async def update_agent(self, agent_id: str, updates: Dict[str, Any], user_id: str) -> Optional[AgentDefinition]:
        """Update an existing agent.
        
        Args:
            agent_id: The agent ID.
            updates: The updates to apply.
            user_id: The user ID of the updater.
            
        Returns:
            The updated agent definition, or None if the update failed.
        """
        try:
            # Get the agent definition
            agent = await self.storage.get_agent_definition(agent_id)
            
            if not agent:
                logger.error(f"Agent not found: {agent_id}")
                return None
            
            # Check if the user is the author
            if agent.author.id != user_id:
                logger.error(f"User {user_id} is not the author of agent {agent_id}")
                return None
            
            # Apply the updates
            agent.update(**updates)
            
            # Validate the updated agent
            validation_errors = self._validate_agent(agent)
            if validation_errors:
                logger.error(f"Agent validation failed: {validation_errors}")
                return None
            
            # Save the updated agent definition
            success = await self.storage.save_agent_definition(agent)
            
            if not success:
                return None
            
            return agent
        
        except Exception as e:
            logger.error(f"Error updating agent: {e}")
            return None
    
    async def publish_agent(self, agent_id: str, user_id: str) -> bool:
        """Publish an agent to the marketplace.
        
        Args:
            agent_id: The agent ID.
            user_id: The user ID of the publisher.
            
        Returns:
            True if the publication was successful, False otherwise.
        """
        try:
            # Get the agent definition
            agent = await self.storage.get_agent_definition(agent_id)
            
            if not agent:
                logger.error(f"Agent not found: {agent_id}")
                return False
            
            # Check if the user is the author
            if agent.author.id != user_id:
                logger.error(f"User {user_id} is not the author of agent {agent_id}")
                return False
            
            # Validate the agent definition
            validation_errors = self._validate_agent(agent)
            if validation_errors:
                logger.error(f"Agent validation failed: {validation_errors}")
                return False
            
            # Set the agent as published
            agent.published = True
            
            # Save the updated agent definition
            return await self.storage.save_agent_definition(agent)
        
        except Exception as e:
            logger.error(f"Error publishing agent: {e}")
            return False
    
    async def unpublish_agent(self, agent_id: str, user_id: str) -> bool:
        """Unpublish an agent from the marketplace.
        
        Args:
            agent_id: The agent ID.
            user_id: The user ID of the unpublisher.
            
        Returns:
            True if the unpublication was successful, False otherwise.
        """
        try:
            # Get the agent definition
            agent = await self.storage.get_agent_definition(agent_id)
            
            if not agent:
                logger.error(f"Agent not found: {agent_id}")
                return False
            
            # Check if the user is the author
            if agent.author.id != user_id:
                logger.error(f"User {user_id} is not the author of agent {agent_id}")
                return False
            
            # Set the agent as unpublished
            agent.published = False
            
            # Save the updated agent definition
            return await self.storage.save_agent_definition(agent)
        
        except Exception as e:
            logger.error(f"Error unpublishing agent: {e}")
            return False
    
    async def delete_agent(self, agent_id: str, user_id: str) -> bool:
        """Delete an agent from the marketplace.
        
        Args:
            agent_id: The agent ID.
            user_id: The user ID of the deleter.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Get the agent definition
            agent = await self.storage.get_agent_definition(agent_id)
            
            if not agent:
                logger.error(f"Agent not found: {agent_id}")
                return False
            
            # Check if the user is the author
            if agent.author.id != user_id:
                logger.error(f"User {user_id} is not the author of agent {agent_id}")
                return False
            
            # Delete the agent definition
            return await self.storage.delete_agent_definition(agent_id)
        
        except Exception as e:
            logger.error(f"Error deleting agent: {e}")
            return False
    
    async def install_agent(self, agent_id: str, user_id: str) -> Optional[AgentInstallation]:
        """Install an agent for a user.
        
        Args:
            agent_id: The agent ID.
            user_id: The user ID.
            
        Returns:
            The agent installation, or None if the installation failed.
        """
        try:
            # Get the agent definition
            agent = await self.storage.get_agent_definition(agent_id)
            
            if not agent:
                logger.error(f"Agent not found: {agent_id}")
                return None
            
            # Check if the agent is published
            if not agent.published:
                logger.error(f"Agent is not published: {agent_id}")
                return None
            
            # Get the user's agent library
            library = await self.storage.get_user_library(user_id)
            
            # Install the agent
            installation = library.install_agent(agent_id)
            
            # Save the user's agent library
            success = await self.storage.save_user_library(library)
            
            if not success:
                return None
            
            # Increment the agent's download count
            await self.storage.increment_agent_downloads(agent_id)
            
            return installation
        
        except Exception as e:
            logger.error(f"Error installing agent: {e}")
            return None
    
    async def uninstall_agent(self, agent_id: str, user_id: str) -> bool:
        """Uninstall an agent for a user.
        
        Args:
            agent_id: The agent ID.
            user_id: The user ID.
            
        Returns:
            True if the uninstallation was successful, False otherwise.
        """
        try:
            # Get the user's agent library
            library = await self.storage.get_user_library(user_id)
            
            # Uninstall the agent
            success = library.uninstall_agent(agent_id)
            
            if not success:
                return False
            
            # Save the user's agent library
            return await self.storage.save_user_library(library)
        
        except Exception as e:
            logger.error(f"Error uninstalling agent: {e}")
            return False
    
    async def set_active_agent(self, agent_id: str, user_id: str) -> bool:
        """Set the active agent for a user.
        
        Args:
            agent_id: The agent ID.
            user_id: The user ID.
            
        Returns:
            True if the activation was successful, False otherwise.
        """
        try:
            # Get the user's agent library
            library = await self.storage.get_user_library(user_id)
            
            # Set the active agent
            success = library.set_active_agent(agent_id)
            
            if not success:
                return False
            
            # Save the user's agent library
            return await self.storage.save_user_library(library)
        
        except Exception as e:
            logger.error(f"Error setting active agent: {e}")
            return False
    
    async def record_agent_usage(self, agent_id: str, user_id: str) -> bool:
        """Record usage of an agent by a user.
        
        Args:
            agent_id: The agent ID.
            user_id: The user ID.
            
        Returns:
            True if the recording was successful, False otherwise.
        """
        try:
            # Get the user's agent library
            library = await self.storage.get_user_library(user_id)
            
            # Record the agent usage
            success = library.record_agent_usage(agent_id)
            
            if not success:
                return False
            
            # Save the user's agent library
            return await self.storage.save_user_library(library)
        
        except Exception as e:
            logger.error(f"Error recording agent usage: {e}")
            return False
    
    async def set_agent_favorite(self, agent_id: str, user_id: str, is_favorite: bool) -> bool:
        """Set an agent as a favorite for a user.
        
        Args:
            agent_id: The agent ID.
            user_id: The user ID.
            is_favorite: Whether the agent is a favorite.
            
        Returns:
            True if the operation was successful, False otherwise.
        """
        try:
            # Get the user's agent library
            library = await self.storage.get_user_library(user_id)
            
            # Set the agent as a favorite
            success = library.set_favorite(agent_id, is_favorite)
            
            if not success:
                return False
            
            # Save the user's agent library
            return await self.storage.save_user_library(library)
        
        except Exception as e:
            logger.error(f"Error setting agent favorite: {e}")
            return False
    
    async def review_agent(self, agent_id: str, user_id: str, rating: int, comment: Optional[str] = None) -> Optional[AgentReview]:
        """Review an agent.
        
        Args:
            agent_id: The agent ID.
            user_id: The user ID of the reviewer.
            rating: The rating (1-5).
            comment: The review comment.
            
        Returns:
            The agent review, or None if the review failed.
        """
        try:
            # Get the agent definition
            agent = await self.storage.get_agent_definition(agent_id)
            
            if not agent:
                logger.error(f"Agent not found: {agent_id}")
                return None
            
            # Check if the agent is published
            if not agent.published:
                logger.error(f"Agent is not published: {agent_id}")
                return None
            
            # Validate the rating
            if rating < 1 or rating > 5:
                logger.error(f"Invalid rating: {rating}")
                return None
            
            # Create the review
            review = AgentReview(
                agent_id=agent_id,
                user_id=user_id,
                rating=rating,
                comment=comment,
            )
            
            # Save the review
            success = await self.storage.save_agent_review(review)
            
            if not success:
                return None
            
            return review
        
        except Exception as e:
            logger.error(f"Error reviewing agent: {e}")
            return None
    
    async def delete_review(self, review_id: str, user_id: str) -> bool:
        """Delete an agent review.
        
        Args:
            review_id: The review ID.
            user_id: The user ID of the deleter.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Get the agent reviews
            reviews = []
            for agent in await self.storage.search_agents()[0]:
                reviews.extend(await self.storage.get_agent_reviews(agent.id))
            
            # Find the review
            review = next((r for r in reviews if r.id == review_id), None)
            
            if not review:
                logger.error(f"Review not found: {review_id}")
                return False
            
            # Check if the user is the reviewer
            if review.user_id != user_id:
                logger.error(f"User {user_id} is not the reviewer of review {review_id}")
                return False
            
            # Delete the review
            return await self.storage.delete_agent_review(review_id)
        
        except Exception as e:
            logger.error(f"Error deleting review: {e}")
            return False
    
    def _validate_agent(self, agent: AgentDefinition) -> List[str]:
        """Validate an agent definition.
        
        Args:
            agent: The agent definition.
            
        Returns:
            A list of validation errors, or an empty list if the agent is valid.
        """
        errors = []
        
        # Check required fields
        if not agent.name:
            errors.append("Agent name is required")
        
        if not agent.description:
            errors.append("Agent description is required")
        
        if not agent.version:
            errors.append("Agent version is required")
        
        if not agent.system_prompt:
            errors.append("Agent system prompt is required")
        
        # Validate version format (semver)
        if agent.version and not re.match(r'^\d+\.\d+\.\d+$', agent.version):
            errors.append("Agent version must be in semver format (e.g., 1.0.0)")
        
        # Validate pricing
        if agent.pricing.type != "free" and (agent.pricing.amount is None or agent.pricing.currency is None):
            errors.append("Paid agents must have an amount and currency")
        
        return errors