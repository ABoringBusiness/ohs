"""Models for the AI Memory Management System."""

import datetime
import enum
import uuid
from typing import Dict, List, Optional, Set, Any

from pydantic import BaseModel, Field


class MemorySourceType(str, enum.Enum):
    """Type of memory source."""
    
    CONVERSATION = "conversation"
    DOCUMENT = "document"
    CODE = "code"
    MANUAL = "manual"
    IMPORTED = "imported"


class MemorySource(BaseModel):
    """Source of a memory item."""
    
    type: MemorySourceType
    identifier: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class MemoryItem(BaseModel):
    """A single memory item."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    source: MemorySource
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    relevance_score: float = 1.0
    is_pinned: bool = False
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    def update_content(self, content: str) -> None:
        """Update the content of the memory item."""
        self.content = content
        self.updated_at = datetime.datetime.utcnow()


class MemoryCollection(BaseModel):
    """A collection of memory items."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    owner_id: str
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    is_active: bool = True
    is_shared: bool = False
    shared_with: List[str] = Field(default_factory=list)
    memory_items: Dict[str, MemoryItem] = Field(default_factory=dict)
    
    def add_memory(self, memory: MemoryItem) -> None:
        """Add a memory item to the collection."""
        self.memory_items[memory.id] = memory
        self.updated_at = datetime.datetime.utcnow()
    
    def remove_memory(self, memory_id: str) -> Optional[MemoryItem]:
        """Remove a memory item from the collection."""
        memory = self.memory_items.pop(memory_id, None)
        if memory:
            self.updated_at = datetime.datetime.utcnow()
        return memory
    
    def get_memory(self, memory_id: str) -> Optional[MemoryItem]:
        """Get a memory item by ID."""
        return self.memory_items.get(memory_id)
    
    def get_all_memories(self) -> List[MemoryItem]:
        """Get all memory items in the collection."""
        return list(self.memory_items.values())
    
    def get_pinned_memories(self) -> List[MemoryItem]:
        """Get all pinned memory items in the collection."""
        return [m for m in self.memory_items.values() if m.is_pinned]
    
    def get_memories_by_tag(self, tag: str) -> List[MemoryItem]:
        """Get all memory items with a specific tag."""
        return [m for m in self.memory_items.values() if tag in m.tags]
    
    def get_memories_by_source_type(self, source_type: MemorySourceType) -> List[MemoryItem]:
        """Get all memory items with a specific source type."""
        return [m for m in self.memory_items.values() if m.source.type == source_type]
    
    def search_memories(self, query: str) -> List[MemoryItem]:
        """Search for memory items containing the query string."""
        query = query.lower()
        return [m for m in self.memory_items.values() if query in m.content.lower()]


class UserMemory(BaseModel):
    """User's memory management settings and collections."""
    
    user_id: str
    active_collection_id: Optional[str] = None
    collections: Dict[str, MemoryCollection] = Field(default_factory=dict)
    
    def add_collection(self, collection: MemoryCollection) -> None:
        """Add a memory collection."""
        self.collections[collection.id] = collection
    
    def remove_collection(self, collection_id: str) -> Optional[MemoryCollection]:
        """Remove a memory collection."""
        return self.collections.pop(collection_id, None)
    
    def get_collection(self, collection_id: str) -> Optional[MemoryCollection]:
        """Get a memory collection by ID."""
        return self.collections.get(collection_id)
    
    def get_all_collections(self) -> List[MemoryCollection]:
        """Get all memory collections."""
        return list(self.collections.values())
    
    def get_active_collection(self) -> Optional[MemoryCollection]:
        """Get the active memory collection."""
        if self.active_collection_id:
            return self.collections.get(self.active_collection_id)
        return None
    
    def set_active_collection(self, collection_id: str) -> bool:
        """Set the active memory collection."""
        if collection_id in self.collections:
            self.active_collection_id = collection_id
            return True
        return False
    
    def add_memory_to_active_collection(self, memory: MemoryItem) -> bool:
        """Add a memory item to the active collection."""
        active_collection = self.get_active_collection()
        if active_collection:
            active_collection.add_memory(memory)
            return True
        return False
    
    def get_all_memories(self) -> List[MemoryItem]:
        """Get all memory items across all collections."""
        all_memories = []
        for collection in self.collections.values():
            all_memories.extend(collection.get_all_memories())
        return all_memories
    
    def search_all_memories(self, query: str) -> Dict[str, List[MemoryItem]]:
        """Search for memory items containing the query string across all collections."""
        results = {}
        for collection_id, collection in self.collections.items():
            matches = collection.search_memories(query)
            if matches:
                results[collection_id] = matches
        return results