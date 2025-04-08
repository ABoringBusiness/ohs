"""Storage service for the AI Agent Marketplace."""

import json
import logging
from typing import Dict, List, Optional, Any, Tuple

from openhands.marketplace.models import (
    AgentDefinition,
    AgentReview,
    UserAgentLibrary,
)
from openhands.storage.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


class MarketplaceStorage:
    """Storage service for the AI Agent Marketplace."""
    
    def __init__(self, namespace: str = "marketplace"):
        """Initialize the marketplace storage service.
        
        Args:
            namespace: The namespace for storing marketplace data.
        """
        self.namespace = namespace
        self.supabase = get_supabase_client()
    
    async def get_agent_definition(self, agent_id: str) -> Optional[AgentDefinition]:
        """Get an agent definition.
        
        Args:
            agent_id: The agent ID.
            
        Returns:
            The agent definition, or None if it doesn't exist.
        """
        try:
            # Get the agent definition from Supabase
            response = self.supabase.table("agents").select("*").eq("id", agent_id).eq("namespace", self.namespace).execute()
            
            if response.data and len(response.data) > 0:
                # Parse the agent definition from JSON
                agent_data = json.loads(response.data[0]["content"])
                return AgentDefinition.model_validate(agent_data)
            
            return None
        
        except Exception as e:
            logger.error(f"Error getting agent definition: {e}")
            return None
    
    async def save_agent_definition(self, agent: AgentDefinition) -> bool:
        """Save an agent definition.
        
        Args:
            agent: The agent definition.
            
        Returns:
            True if the save was successful, False otherwise.
        """
        try:
            # Convert the agent definition to JSON
            agent_data = agent.model_dump_json()
            
            # Save the agent definition to Supabase
            self.supabase.table("agents").upsert({
                "id": agent.id,
                "namespace": self.namespace,
                "content": agent_data,
            }).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error saving agent definition: {e}")
            return False
    
    async def delete_agent_definition(self, agent_id: str) -> bool:
        """Delete an agent definition.
        
        Args:
            agent_id: The agent ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Delete the agent definition from Supabase
            self.supabase.table("agents").delete().eq("id", agent_id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error deleting agent definition: {e}")
            return False
    
    async def search_agents(self, query: str = None, category: str = None, tags: List[str] = None, author_id: str = None, limit: int = 20, offset: int = 0) -> Tuple[List[AgentDefinition], int]:
        """Search for agent definitions.
        
        Args:
            query: The search query.
            category: The agent category.
            tags: The agent tags.
            author_id: The author ID.
            limit: The maximum number of results to return.
            offset: The offset for pagination.
            
        Returns:
            A tuple of (list of agent definitions, total count).
        """
        try:
            # Get all agent definitions from Supabase
            response = self.supabase.table("agents").select("*").eq("namespace", self.namespace).execute()
            
            if not response.data:
                return [], 0
            
            # Parse the agent definitions from JSON
            all_agents = []
            for item in response.data:
                try:
                    agent_data = json.loads(item["content"])
                    agent = AgentDefinition.model_validate(agent_data)
                    all_agents.append(agent)
                except Exception as e:
                    logger.error(f"Error parsing agent definition: {e}")
            
            # Filter the agents
            filtered_agents = all_agents
            
            if query:
                query = query.lower()
                filtered_agents = [
                    a for a in filtered_agents
                    if query in a.name.lower() or query in a.description.lower() or any(query in tag.lower() for tag in a.tags)
                ]
            
            if category:
                filtered_agents = [a for a in filtered_agents if a.category == category]
            
            if tags:
                filtered_agents = [a for a in filtered_agents if any(tag in a.tags for tag in tags)]
            
            if author_id:
                filtered_agents = [a for a in filtered_agents if a.author.id == author_id]
            
            # Only include published agents
            filtered_agents = [a for a in filtered_agents if a.published]
            
            # Sort by rating and downloads
            filtered_agents.sort(key=lambda a: (a.rating, a.downloads), reverse=True)
            
            # Apply pagination
            paginated_agents = filtered_agents[offset:offset + limit]
            
            return paginated_agents, len(filtered_agents)
        
        except Exception as e:
            logger.error(f"Error searching agents: {e}")
            return [], 0
    
    async def get_user_library(self, user_id: str) -> UserAgentLibrary:
        """Get a user's agent library.
        
        Args:
            user_id: The user ID.
            
        Returns:
            The user's agent library.
        """
        try:
            # Get the user library from Supabase
            response = self.supabase.table("agent_libraries").select("*").eq("id", f"user/{user_id}").eq("namespace", self.namespace).execute()
            
            if response.data and len(response.data) > 0:
                # Parse the user library from JSON
                library_data = json.loads(response.data[0]["content"])
                return UserAgentLibrary.model_validate(library_data)
            
            # If no user library exists, create a new one
            user_library = UserAgentLibrary(user_id=user_id)
            await self.save_user_library(user_library)
            return user_library
        
        except Exception as e:
            logger.error(f"Error getting user library: {e}")
            # Return a new user library if there was an error
            return UserAgentLibrary(user_id=user_id)
    
    async def save_user_library(self, library: UserAgentLibrary) -> bool:
        """Save a user's agent library.
        
        Args:
            library: The user's agent library.
            
        Returns:
            True if the save was successful, False otherwise.
        """
        try:
            # Convert the user library to JSON
            library_data = library.model_dump_json()
            
            # Save the user library to Supabase
            self.supabase.table("agent_libraries").upsert({
                "id": f"user/{library.user_id}",
                "namespace": self.namespace,
                "content": library_data,
            }).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error saving user library: {e}")
            return False
    
    async def get_agent_reviews(self, agent_id: str) -> List[AgentReview]:
        """Get reviews for an agent.
        
        Args:
            agent_id: The agent ID.
            
        Returns:
            A list of agent reviews.
        """
        try:
            # Get the agent reviews from Supabase
            response = self.supabase.table("agent_reviews").select("*").eq("agent_id", agent_id).eq("namespace", self.namespace).execute()
            
            if not response.data:
                return []
            
            # Parse the agent reviews from JSON
            reviews = []
            for item in response.data:
                try:
                    review_data = json.loads(item["content"])
                    review = AgentReview.model_validate(review_data)
                    reviews.append(review)
                except Exception as e:
                    logger.error(f"Error parsing agent review: {e}")
            
            return reviews
        
        except Exception as e:
            logger.error(f"Error getting agent reviews: {e}")
            return []
    
    async def save_agent_review(self, review: AgentReview) -> bool:
        """Save an agent review.
        
        Args:
            review: The agent review.
            
        Returns:
            True if the save was successful, False otherwise.
        """
        try:
            # Convert the agent review to JSON
            review_data = review.model_dump_json()
            
            # Save the agent review to Supabase
            self.supabase.table("agent_reviews").upsert({
                "id": review.id,
                "agent_id": review.agent_id,
                "user_id": review.user_id,
                "namespace": self.namespace,
                "content": review_data,
            }).execute()
            
            # Update the agent's rating
            await self.update_agent_rating(review.agent_id)
            
            return True
        
        except Exception as e:
            logger.error(f"Error saving agent review: {e}")
            return False
    
    async def delete_agent_review(self, review_id: str) -> bool:
        """Delete an agent review.
        
        Args:
            review_id: The review ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Get the review to get the agent ID
            response = self.supabase.table("agent_reviews").select("*").eq("id", review_id).eq("namespace", self.namespace).execute()
            
            if not response.data or len(response.data) == 0:
                return False
            
            agent_id = json.loads(response.data[0]["content"]).get("agent_id")
            
            # Delete the agent review from Supabase
            self.supabase.table("agent_reviews").delete().eq("id", review_id).eq("namespace", self.namespace).execute()
            
            # Update the agent's rating
            if agent_id:
                await self.update_agent_rating(agent_id)
            
            return True
        
        except Exception as e:
            logger.error(f"Error deleting agent review: {e}")
            return False
    
    async def update_agent_rating(self, agent_id: str) -> bool:
        """Update an agent's rating based on reviews.
        
        Args:
            agent_id: The agent ID.
            
        Returns:
            True if the update was successful, False otherwise.
        """
        try:
            # Get the agent reviews
            reviews = await self.get_agent_reviews(agent_id)
            
            if not reviews:
                return True
            
            # Calculate the average rating
            total_rating = sum(review.rating for review in reviews)
            average_rating = total_rating / len(reviews)
            
            # Get the agent definition
            agent = await self.get_agent_definition(agent_id)
            
            if not agent:
                return False
            
            # Update the agent's rating
            agent.rating = average_rating
            agent.rating_count = len(reviews)
            
            # Save the agent definition
            return await self.save_agent_definition(agent)
        
        except Exception as e:
            logger.error(f"Error updating agent rating: {e}")
            return False
    
    async def increment_agent_downloads(self, agent_id: str) -> bool:
        """Increment an agent's download count.
        
        Args:
            agent_id: The agent ID.
            
        Returns:
            True if the increment was successful, False otherwise.
        """
        try:
            # Get the agent definition
            agent = await self.get_agent_definition(agent_id)
            
            if not agent:
                return False
            
            # Increment the download count
            agent.downloads += 1
            
            # Save the agent definition
            return await self.save_agent_definition(agent)
        
        except Exception as e:
            logger.error(f"Error incrementing agent downloads: {e}")
            return False