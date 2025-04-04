"""API routes for the AI Memory Management System."""

import logging
from typing import Dict, List, Optional, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from openhands.memory.models import MemoryCollection, MemoryItem, MemorySource, MemorySourceType
from openhands.memory.processor import MemoryProcessor
from openhands.memory.storage import MemoryStorage
from openhands.memory.integration import MemoryIntegration
from openhands.server.auth_supabase import User, get_current_user

logger = logging.getLogger(__name__)

app = APIRouter(prefix="/api/memory")

# Initialize services
storage = MemoryStorage()
processor = MemoryProcessor()
integration = MemoryIntegration(storage, processor)


# Request and response models
class CreateCollectionRequest(BaseModel):
    """Request model for creating a memory collection."""
    
    name: str
    description: str = ""


class UpdateCollectionRequest(BaseModel):
    """Request model for updating a memory collection."""
    
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_shared: Optional[bool] = None
    shared_with: Optional[List[str]] = None


class CreateMemoryRequest(BaseModel):
    """Request model for creating a memory item."""
    
    content: str
    source_type: MemorySourceType
    source_identifier: str
    source_metadata: Dict[str, Any] = {}
    tags: List[str] = []
    is_pinned: bool = False
    metadata: Dict[str, Any] = {}


class UpdateMemoryRequest(BaseModel):
    """Request model for updating a memory item."""
    
    content: Optional[str] = None
    is_pinned: Optional[bool] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class CollectionResponse(BaseModel):
    """Response model for a memory collection."""
    
    id: str
    name: str
    description: str
    owner_id: str
    created_at: str
    updated_at: str
    is_active: bool
    is_shared: bool
    shared_with: List[str]
    memory_count: int


class MemoryResponse(BaseModel):
    """Response model for a memory item."""
    
    id: str
    content: str
    source: Dict[str, Any]
    created_at: str
    updated_at: str
    relevance_score: float
    is_pinned: bool
    tags: List[str]
    metadata: Dict[str, Any]


class CollectionsResponse(BaseModel):
    """Response model for a list of memory collections."""
    
    collections: List[CollectionResponse]
    active_collection_id: Optional[str]


class MemoriesResponse(BaseModel):
    """Response model for a list of memory items."""
    
    memories: List[MemoryResponse]
    total: int


# API routes
@app.get("/collections", response_model=CollectionsResponse)
async def get_collections(user: User = Depends(get_current_user)):
    """Get all memory collections for the current user."""
    try:
        # Get the user memory
        user_memory = await storage.get_user_memory(user.id)
        
        # Convert collections to response format
        collections = []
        for collection in user_memory.get_all_collections():
            collections.append(CollectionResponse(
                id=collection.id,
                name=collection.name,
                description=collection.description,
                owner_id=collection.owner_id,
                created_at=collection.created_at.isoformat(),
                updated_at=collection.updated_at.isoformat(),
                is_active=collection.is_active,
                is_shared=collection.is_shared,
                shared_with=collection.shared_with,
                memory_count=len(collection.memory_items),
            ))
        
        return CollectionsResponse(
            collections=collections,
            active_collection_id=user_memory.active_collection_id,
        )
    
    except Exception as e:
        logger.error(f"Error getting collections: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get collections",
        )


@app.post("/collections", response_model=CollectionResponse)
async def create_collection(request: CreateCollectionRequest, user: User = Depends(get_current_user)):
    """Create a new memory collection."""
    try:
        # Create the collection
        collection = await storage.create_collection(
            user_id=user.id,
            name=request.name,
            description=request.description,
        )
        
        if not collection:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create collection",
            )
        
        return CollectionResponse(
            id=collection.id,
            name=collection.name,
            description=collection.description,
            owner_id=collection.owner_id,
            created_at=collection.created_at.isoformat(),
            updated_at=collection.updated_at.isoformat(),
            is_active=collection.is_active,
            is_shared=collection.is_shared,
            shared_with=collection.shared_with,
            memory_count=len(collection.memory_items),
        )
    
    except Exception as e:
        logger.error(f"Error creating collection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create collection",
        )


@app.get("/collections/{collection_id}", response_model=CollectionResponse)
async def get_collection(collection_id: str, user: User = Depends(get_current_user)):
    """Get a memory collection by ID."""
    try:
        # Get the collection
        collection = await storage.get_collection(user.id, collection_id)
        
        if not collection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found",
            )
        
        return CollectionResponse(
            id=collection.id,
            name=collection.name,
            description=collection.description,
            owner_id=collection.owner_id,
            created_at=collection.created_at.isoformat(),
            updated_at=collection.updated_at.isoformat(),
            is_active=collection.is_active,
            is_shared=collection.is_shared,
            shared_with=collection.shared_with,
            memory_count=len(collection.memory_items),
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error getting collection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get collection",
        )


@app.put("/collections/{collection_id}", response_model=CollectionResponse)
async def update_collection(collection_id: str, request: UpdateCollectionRequest, user: User = Depends(get_current_user)):
    """Update a memory collection."""
    try:
        # Update the collection
        success = await storage.update_collection(
            user_id=user.id,
            collection_id=collection_id,
            name=request.name,
            description=request.description,
            is_active=request.is_active,
            is_shared=request.is_shared,
            shared_with=request.shared_with,
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found",
            )
        
        # Get the updated collection
        collection = await storage.get_collection(user.id, collection_id)
        
        return CollectionResponse(
            id=collection.id,
            name=collection.name,
            description=collection.description,
            owner_id=collection.owner_id,
            created_at=collection.created_at.isoformat(),
            updated_at=collection.updated_at.isoformat(),
            is_active=collection.is_active,
            is_shared=collection.is_shared,
            shared_with=collection.shared_with,
            memory_count=len(collection.memory_items),
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error updating collection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update collection",
        )


@app.delete("/collections/{collection_id}")
async def delete_collection(collection_id: str, user: User = Depends(get_current_user)):
    """Delete a memory collection."""
    try:
        # Delete the collection
        success = await storage.delete_collection(user.id, collection_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found",
            )
        
        return {"message": "Collection deleted successfully"}
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error deleting collection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete collection",
        )


@app.post("/collections/{collection_id}/activate")
async def activate_collection(collection_id: str, user: User = Depends(get_current_user)):
    """Set a memory collection as active."""
    try:
        # Set the active collection
        success = await storage.set_active_collection(user.id, collection_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found",
            )
        
        return {"message": "Collection activated successfully"}
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error activating collection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate collection",
        )


@app.get("/collections/{collection_id}/memories", response_model=MemoriesResponse)
async def get_memories(collection_id: str, user: User = Depends(get_current_user)):
    """Get all memory items in a collection."""
    try:
        # Get the collection
        collection = await storage.get_collection(user.id, collection_id)
        
        if not collection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found",
            )
        
        # Convert memories to response format
        memories = []
        for memory in collection.get_all_memories():
            memories.append(MemoryResponse(
                id=memory.id,
                content=memory.content,
                source=memory.source.model_dump(),
                created_at=memory.created_at.isoformat(),
                updated_at=memory.updated_at.isoformat(),
                relevance_score=memory.relevance_score,
                is_pinned=memory.is_pinned,
                tags=memory.tags,
                metadata=memory.metadata,
            ))
        
        return MemoriesResponse(
            memories=memories,
            total=len(memories),
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error getting memories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get memories",
        )


@app.post("/collections/{collection_id}/memories", response_model=MemoryResponse)
async def create_memory(collection_id: str, request: CreateMemoryRequest, user: User = Depends(get_current_user)):
    """Create a new memory item in a collection."""
    try:
        # Create the memory source
        source = MemorySource(
            type=request.source_type,
            identifier=request.source_identifier,
            metadata=request.source_metadata,
        )
        
        # Create the memory item
        memory = MemoryItem(
            content=request.content,
            source=source,
            is_pinned=request.is_pinned,
            tags=request.tags,
            metadata=request.metadata,
        )
        
        # Add the memory to the collection
        success = await storage.add_memory(user.id, collection_id, memory)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found",
            )
        
        return MemoryResponse(
            id=memory.id,
            content=memory.content,
            source=memory.source.model_dump(),
            created_at=memory.created_at.isoformat(),
            updated_at=memory.updated_at.isoformat(),
            relevance_score=memory.relevance_score,
            is_pinned=memory.is_pinned,
            tags=memory.tags,
            metadata=memory.metadata,
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error creating memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create memory",
        )


@app.get("/collections/{collection_id}/memories/{memory_id}", response_model=MemoryResponse)
async def get_memory(collection_id: str, memory_id: str, user: User = Depends(get_current_user)):
    """Get a memory item by ID."""
    try:
        # Get the collection
        collection = await storage.get_collection(user.id, collection_id)
        
        if not collection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found",
            )
        
        # Get the memory item
        memory = collection.get_memory(memory_id)
        
        if not memory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found",
            )
        
        return MemoryResponse(
            id=memory.id,
            content=memory.content,
            source=memory.source.model_dump(),
            created_at=memory.created_at.isoformat(),
            updated_at=memory.updated_at.isoformat(),
            relevance_score=memory.relevance_score,
            is_pinned=memory.is_pinned,
            tags=memory.tags,
            metadata=memory.metadata,
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error getting memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get memory",
        )


@app.put("/collections/{collection_id}/memories/{memory_id}", response_model=MemoryResponse)
async def update_memory(collection_id: str, memory_id: str, request: UpdateMemoryRequest, user: User = Depends(get_current_user)):
    """Update a memory item."""
    try:
        # Update the memory item
        success = await storage.update_memory(
            user_id=user.id,
            collection_id=collection_id,
            memory_id=memory_id,
            content=request.content,
            is_pinned=request.is_pinned,
            tags=request.tags,
            metadata=request.metadata,
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found",
            )
        
        # Get the updated memory item
        collection = await storage.get_collection(user.id, collection_id)
        memory = collection.get_memory(memory_id)
        
        return MemoryResponse(
            id=memory.id,
            content=memory.content,
            source=memory.source.model_dump(),
            created_at=memory.created_at.isoformat(),
            updated_at=memory.updated_at.isoformat(),
            relevance_score=memory.relevance_score,
            is_pinned=memory.is_pinned,
            tags=memory.tags,
            metadata=memory.metadata,
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error updating memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update memory",
        )


@app.delete("/collections/{collection_id}/memories/{memory_id}")
async def delete_memory(collection_id: str, memory_id: str, user: User = Depends(get_current_user)):
    """Delete a memory item."""
    try:
        # Delete the memory item
        success = await storage.delete_memory(user.id, collection_id, memory_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found",
            )
        
        return {"message": "Memory deleted successfully"}
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error deleting memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete memory",
        )


@app.post("/collections/{collection_id}/export")
async def export_collection(collection_id: str, user: User = Depends(get_current_user)):
    """Export a memory collection."""
    try:
        # Export the collection
        collection_data = await storage.export_collection(user.id, collection_id)
        
        if not collection_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found",
            )
        
        return collection_data
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error exporting collection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export collection",
        )


@app.post("/collections/import", response_model=CollectionResponse)
async def import_collection(collection_data: Dict[str, Any], user: User = Depends(get_current_user)):
    """Import a memory collection."""
    try:
        # Import the collection
        collection = await storage.import_collection(user.id, collection_data)
        
        if not collection:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to import collection",
            )
        
        return CollectionResponse(
            id=collection.id,
            name=collection.name,
            description=collection.description,
            owner_id=collection.owner_id,
            created_at=collection.created_at.isoformat(),
            updated_at=collection.updated_at.isoformat(),
            is_active=collection.is_active,
            is_shared=collection.is_shared,
            shared_with=collection.shared_with,
            memory_count=len(collection.memory_items),
        )
    
    except Exception as e:
        logger.error(f"Error importing collection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to import collection",
        )