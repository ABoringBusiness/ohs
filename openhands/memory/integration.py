"""Integration layer for the AI Memory Management System."""

import logging
from typing import Dict, List, Optional, Any

from openhands.memory.models import MemoryCollection, MemoryItem, UserMemory
from openhands.memory.processor import MemoryProcessor
from openhands.memory.storage import MemoryStorage

logger = logging.getLogger(__name__)


class MemoryIntegration:
    """Integration layer for injecting memories into AI context."""
    
    def __init__(self, storage: MemoryStorage, processor: MemoryProcessor):
        """Initialize the memory integration.
        
        Args:
            storage: The memory storage service.
            processor: The memory processor.
        """
        self.storage = storage
        self.processor = processor
    
    async def get_relevant_memories(self, user_id: str, context: str, max_memories: int = 5) -> List[MemoryItem]:
        """Get relevant memories for a given context.
        
        Args:
            user_id: The user ID.
            context: The current context.
            max_memories: The maximum number of memories to return.
            
        Returns:
            A list of relevant memory items.
        """
        try:
            # Get the user memory
            user_memory = await self.storage.get_user_memory(user_id)
            
            # Get the active collection
            active_collection = user_memory.get_active_collection()
            if not active_collection:
                return []
            
            # Get all memories from the active collection
            memories = active_collection.get_all_memories()
            
            # Calculate relevance scores
            scored_memories = [
                (memory, self.processor.calculate_relevance_score(memory, context))
                for memory in memories
            ]
            
            # Sort by relevance score (descending)
            scored_memories.sort(key=lambda x: x[1], reverse=True)
            
            # Return the top N memories
            return [memory for memory, score in scored_memories[:max_memories]]
        
        except Exception as e:
            logger.error(f"Error getting relevant memories: {e}")
            return []
    
    async def inject_memories_into_context(self, user_id: str, context: str, max_tokens: int = 1000) -> str:
        """Inject relevant memories into the context.
        
        Args:
            user_id: The user ID.
            context: The current context.
            max_tokens: The maximum number of tokens to add.
            
        Returns:
            The context with injected memories.
        """
        try:
            # Get relevant memories
            memories = await self.get_relevant_memories(user_id, context)
            
            if not memories:
                return context
            
            # Format memories as text
            memory_text = "Relevant information from memory:\n\n"
            
            for memory in memories:
                memory_entry = f"- {memory.content}\n"
                
                # Add the memory if it fits within the token limit
                if len(memory_text + memory_entry) * 4 <= max_tokens:  # Rough estimate: 4 chars per token
                    memory_text += memory_entry
                else:
                    break
            
            # Inject memories into the context
            return f"{memory_text}\n\n{context}"
        
        except Exception as e:
            logger.error(f"Error injecting memories into context: {e}")
            return context
    
    async def extract_and_store_memories(self, user_id: str, conversation: List[Dict[str, Any]], conversation_id: str) -> bool:
        """Extract memories from a conversation and store them.
        
        Args:
            user_id: The user ID.
            conversation: The conversation messages.
            conversation_id: The conversation ID.
            
        Returns:
            True if the extraction and storage was successful, False otherwise.
        """
        try:
            # Get the user memory
            user_memory = await self.storage.get_user_memory(user_id)
            
            # Get the active collection
            active_collection = user_memory.get_active_collection()
            if not active_collection:
                # Create a default collection if none exists
                active_collection = await self.storage.create_collection(
                    user_id=user_id,
                    name="Default Collection",
                    description="Default collection for memories",
                )
                
                if not active_collection:
                    return False
            
            # Extract memories from the conversation
            memories = self.processor.extract_memories_from_conversation(
                conversation=conversation,
                source_id=conversation_id,
            )
            
            # Store the memories
            for memory in memories:
                await self.storage.add_memory(
                    user_id=user_id,
                    collection_id=active_collection.id,
                    memory=memory,
                )
            
            return True
        
        except Exception as e:
            logger.error(f"Error extracting and storing memories: {e}")
            return False