"""Storage service for the AI Memory Management System."""

import json
import logging
from typing import Dict, List, Optional, Any

from openhands.memory.models import MemoryCollection, MemoryItem, UserMemory
from openhands.storage.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


class MemoryStorage:
    """Storage service for memory items and collections."""
    
    def __init__(self, namespace: str = "memory"):
        """Initialize the memory storage service.
        
        Args:
            namespace: The namespace for storing memory data.
        """
        self.namespace = namespace
        self.supabase = get_supabase_client()
    
    async def get_user_memory(self, user_id: str) -> UserMemory:
        """Get a user's memory settings and collections.
        
        Args:
            user_id: The user ID.
            
        Returns:
            The user's memory settings and collections.
        """
        try:
            # Get the user memory from Supabase
            response = self.supabase.table("memory").select("*").eq("id", f"user/{user_id}").eq("namespace", self.namespace).execute()
            
            if response.data and len(response.data) > 0:
                # Parse the user memory from JSON
                memory_data = json.loads(response.data[0]["content"])
                return UserMemory.model_validate(memory_data)
            
            # If no user memory exists, create a new one
            user_memory = UserMemory(user_id=user_id)
            await self.save_user_memory(user_memory)
            return user_memory
        
        except Exception as e:
            logger.error(f"Error getting user memory: {e}")
            # Return a new user memory if there was an error
            return UserMemory(user_id=user_id)
    
    async def save_user_memory(self, user_memory: UserMemory) -> bool:
        """Save a user's memory settings and collections.
        
        Args:
            user_memory: The user's memory settings and collections.
            
        Returns:
            True if the save was successful, False otherwise.
        """
        try:
            # Convert the user memory to JSON
            memory_data = user_memory.model_dump_json()
            
            # Save the user memory to Supabase
            self.supabase.table("memory").upsert({
                "id": f"user/{user_memory.user_id}",
                "namespace": self.namespace,
                "content": memory_data,
            }).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error saving user memory: {e}")
            return False
    
    async def create_collection(self, user_id: str, name: str, description: str = "") -> Optional[MemoryCollection]:
        """Create a new memory collection.
        
        Args:
            user_id: The user ID.
            name: The name of the collection.
            description: The description of the collection.
            
        Returns:
            The created memory collection, or None if there was an error.
        """
        try:
            # Get the user memory
            user_memory = await self.get_user_memory(user_id)
            
            # Create a new collection
            collection = MemoryCollection(
                name=name,
                description=description,
                owner_id=user_id,
            )
            
            # Add the collection to the user memory
            user_memory.add_collection(collection)
            
            # If this is the first collection, set it as active
            if len(user_memory.collections) == 1:
                user_memory.active_collection_id = collection.id
            
            # Save the user memory
            if await self.save_user_memory(user_memory):
                return collection
            
            return None
        
        except Exception as e:
            logger.error(f"Error creating collection: {e}")
            return None
    
    async def get_collection(self, user_id: str, collection_id: str) -> Optional[MemoryCollection]:
        """Get a memory collection.
        
        Args:
            user_id: The user ID.
            collection_id: The collection ID.
            
        Returns:
            The memory collection, or None if it doesn't exist.
        """
        try:
            # Get the user memory
            user_memory = await self.get_user_memory(user_id)
            
            # Get the collection
            return user_memory.get_collection(collection_id)
        
        except Exception as e:
            logger.error(f"Error getting collection: {e}")
            return None
    
    async def update_collection(self, user_id: str, collection_id: str, name: Optional[str] = None, description: Optional[str] = None, is_active: Optional[bool] = None, is_shared: Optional[bool] = None, shared_with: Optional[List[str]] = None) -> bool:
        """Update a memory collection.
        
        Args:
            user_id: The user ID.
            collection_id: The collection ID.
            name: The new name of the collection.
            description: The new description of the collection.
            is_active: Whether the collection is active.
            is_shared: Whether the collection is shared.
            shared_with: The list of user IDs the collection is shared with.
            
        Returns:
            True if the update was successful, False otherwise.
        """
        try:
            # Get the user memory
            user_memory = await self.get_user_memory(user_id)
            
            # Get the collection
            collection = user_memory.get_collection(collection_id)
            if not collection:
                return False
            
            # Update the collection
            if name is not None:
                collection.name = name
            if description is not None:
                collection.description = description
            if is_active is not None:
                collection.is_active = is_active
            if is_shared is not None:
                collection.is_shared = is_shared
            if shared_with is not None:
                collection.shared_with = shared_with
            
            # Save the user memory
            return await self.save_user_memory(user_memory)
        
        except Exception as e:
            logger.error(f"Error updating collection: {e}")
            return False
    
    async def delete_collection(self, user_id: str, collection_id: str) -> bool:
        """Delete a memory collection.
        
        Args:
            user_id: The user ID.
            collection_id: The collection ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Get the user memory
            user_memory = await self.get_user_memory(user_id)
            
            # Remove the collection
            collection = user_memory.remove_collection(collection_id)
            if not collection:
                return False
            
            # If the active collection was deleted, set a new active collection
            if user_memory.active_collection_id == collection_id:
                if user_memory.collections:
                    user_memory.active_collection_id = next(iter(user_memory.collections))
                else:
                    user_memory.active_collection_id = None
            
            # Save the user memory
            return await self.save_user_memory(user_memory)
        
        except Exception as e:
            logger.error(f"Error deleting collection: {e}")
            return False
    
    async def set_active_collection(self, user_id: str, collection_id: str) -> bool:
        """Set the active memory collection.
        
        Args:
            user_id: The user ID.
            collection_id: The collection ID.
            
        Returns:
            True if the update was successful, False otherwise.
        """
        try:
            # Get the user memory
            user_memory = await self.get_user_memory(user_id)
            
            # Set the active collection
            if not user_memory.set_active_collection(collection_id):
                return False
            
            # Save the user memory
            return await self.save_user_memory(user_memory)
        
        except Exception as e:
            logger.error(f"Error setting active collection: {e}")
            return False
    
    async def add_memory(self, user_id: str, collection_id: str, memory: MemoryItem) -> bool:
        """Add a memory item to a collection.
        
        Args:
            user_id: The user ID.
            collection_id: The collection ID.
            memory: The memory item to add.
            
        Returns:
            True if the addition was successful, False otherwise.
        """
        try:
            # Get the user memory
            user_memory = await self.get_user_memory(user_id)
            
            # Get the collection
            collection = user_memory.get_collection(collection_id)
            if not collection:
                return False
            
            # Add the memory to the collection
            collection.add_memory(memory)
            
            # Save the user memory
            return await self.save_user_memory(user_memory)
        
        except Exception as e:
            logger.error(f"Error adding memory: {e}")
            return False
    
    async def update_memory(self, user_id: str, collection_id: str, memory_id: str, content: Optional[str] = None, is_pinned: Optional[bool] = None, tags: Optional[List[str]] = None, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Update a memory item.
        
        Args:
            user_id: The user ID.
            collection_id: The collection ID.
            memory_id: The memory item ID.
            content: The new content of the memory item.
            is_pinned: Whether the memory item is pinned.
            tags: The new tags for the memory item.
            metadata: The new metadata for the memory item.
            
        Returns:
            True if the update was successful, False otherwise.
        """
        try:
            # Get the user memory
            user_memory = await self.get_user_memory(user_id)
            
            # Get the collection
            collection = user_memory.get_collection(collection_id)
            if not collection:
                return False
            
            # Get the memory item
            memory = collection.get_memory(memory_id)
            if not memory:
                return False
            
            # Update the memory item
            if content is not None:
                memory.update_content(content)
            if is_pinned is not None:
                memory.is_pinned = is_pinned
            if tags is not None:
                memory.tags = tags
            if metadata is not None:
                memory.metadata = metadata
            
            # Save the user memory
            return await self.save_user_memory(user_memory)
        
        except Exception as e:
            logger.error(f"Error updating memory: {e}")
            return False
    
    async def delete_memory(self, user_id: str, collection_id: str, memory_id: str) -> bool:
        """Delete a memory item.
        
        Args:
            user_id: The user ID.
            collection_id: The collection ID.
            memory_id: The memory item ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Get the user memory
            user_memory = await self.get_user_memory(user_id)
            
            # Get the collection
            collection = user_memory.get_collection(collection_id)
            if not collection:
                return False
            
            # Remove the memory item
            memory = collection.remove_memory(memory_id)
            if not memory:
                return False
            
            # Save the user memory
            return await self.save_user_memory(user_memory)
        
        except Exception as e:
            logger.error(f"Error deleting memory: {e}")
            return False
    
    async def export_collection(self, user_id: str, collection_id: str) -> Optional[Dict[str, Any]]:
        """Export a memory collection.
        
        Args:
            user_id: The user ID.
            collection_id: The collection ID.
            
        Returns:
            The exported collection data, or None if there was an error.
        """
        try:
            # Get the user memory
            user_memory = await self.get_user_memory(user_id)
            
            # Get the collection
            collection = user_memory.get_collection(collection_id)
            if not collection:
                return None
            
            # Export the collection
            return collection.model_dump()
        
        except Exception as e:
            logger.error(f"Error exporting collection: {e}")
            return None
    
    async def import_collection(self, user_id: str, collection_data: Dict[str, Any]) -> Optional[MemoryCollection]:
        """Import a memory collection.
        
        Args:
            user_id: The user ID.
            collection_data: The collection data to import.
            
        Returns:
            The imported collection, or None if there was an error.
        """
        try:
            # Get the user memory
            user_memory = await self.get_user_memory(user_id)
            
            # Create a new collection from the data
            collection = MemoryCollection.model_validate(collection_data)
            
            # Update the owner ID to the current user
            collection.owner_id = user_id
            
            # Add the collection to the user memory
            user_memory.add_collection(collection)
            
            # Save the user memory
            if await self.save_user_memory(user_memory):
                return collection
            
            return None
        
        except Exception as e:
            logger.error(f"Error importing collection: {e}")
            return None