"""API routes for the AI Agent Marketplace."""

import logging
from typing import Dict, List, Optional, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, HttpUrl

from openhands.marketplace.models import (
    PricingType,
    AgentCategory,
    AgentAuthor,
    AgentPricing,
    AgentUI,
    AgentDefinition,
    AgentReview,
    AgentInstallation,
    UserAgentLibrary,
)
from openhands.marketplace.storage import MarketplaceStorage
from openhands.marketplace.registry import AgentRegistry
from openhands.marketplace.execution import AgentExecutionEngine
from openhands.server.auth_supabase import User, get_current_user

logger = logging.getLogger(__name__)

app = APIRouter(prefix="/api/marketplace")

# Initialize services
storage = MarketplaceStorage()
registry = AgentRegistry(storage)
execution_engine = AgentExecutionEngine(storage, registry)


# Request and response models
class CreateAgentRequest(BaseModel):
    """Request model for creating an agent."""
    
    name: str
    description: str
    category: AgentCategory
    tags: List[str] = []
    system_prompt: str
    knowledge_base: List[str] = []
    tools: List[str] = []
    ui: Dict[str, Any] = {}
    pricing: Dict[str, Any] = {"type": "free"}


class UpdateAgentRequest(BaseModel):
    """Request model for updating an agent."""
    
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[AgentCategory] = None
    tags: Optional[List[str]] = None
    system_prompt: Optional[str] = None
    knowledge_base: Optional[List[str]] = None
    tools: Optional[List[str]] = None
    ui: Optional[Dict[str, Any]] = None
    pricing: Optional[Dict[str, Any]] = None


class ReviewAgentRequest(BaseModel):
    """Request model for reviewing an agent."""
    
    rating: int
    comment: Optional[str] = None


class AgentResponse(BaseModel):
    """Response model for an agent."""
    
    id: str
    name: str
    description: str
    version: str
    author: Dict[str, Any]
    category: str
    tags: List[str]
    ui: Dict[str, Any]
    pricing: Dict[str, Any]
    created_at: str
    updated_at: str
    published: bool
    downloads: int
    rating: float
    rating_count: int


class AgentDetailResponse(AgentResponse):
    """Response model for detailed agent information."""
    
    system_prompt: str
    knowledge_base: List[str]
    tools: List[Any]


class AgentReviewResponse(BaseModel):
    """Response model for an agent review."""
    
    id: str
    agent_id: str
    user_id: str
    rating: int
    comment: Optional[str]
    created_at: str
    updated_at: str


class AgentInstallationResponse(BaseModel):
    """Response model for an agent installation."""
    
    id: str
    agent_id: str
    installed_at: str
    last_used_at: Optional[str]
    usage_count: int
    is_favorite: bool


class UserLibraryResponse(BaseModel):
    """Response model for a user's agent library."""
    
    active_agent_id: Optional[str]
    installations: List[AgentInstallationResponse]


class SearchAgentsResponse(BaseModel):
    """Response model for searching agents."""
    
    agents: List[AgentResponse]
    total: int


# Helper functions
def _agent_to_response(agent: AgentDefinition) -> AgentResponse:
    """Convert an agent definition to a response model."""
    return AgentResponse(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        version=agent.version,
        author=agent.author.model_dump(),
        category=agent.category,
        tags=agent.tags,
        ui=agent.ui.model_dump(),
        pricing=agent.pricing.model_dump(),
        created_at=agent.created_at.isoformat(),
        updated_at=agent.updated_at.isoformat(),
        published=agent.published,
        downloads=agent.downloads,
        rating=agent.rating,
        rating_count=agent.rating_count,
    )


def _agent_to_detail_response(agent: AgentDefinition) -> AgentDetailResponse:
    """Convert an agent definition to a detailed response model."""
    return AgentDetailResponse(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        version=agent.version,
        author=agent.author.model_dump(),
        category=agent.category,
        tags=agent.tags,
        ui=agent.ui.model_dump(),
        pricing=agent.pricing.model_dump(),
        created_at=agent.created_at.isoformat(),
        updated_at=agent.updated_at.isoformat(),
        published=agent.published,
        downloads=agent.downloads,
        rating=agent.rating,
        rating_count=agent.rating_count,
        system_prompt=agent.system_prompt,
        knowledge_base=agent.knowledge_base,
        tools=agent.tools,
    )


def _review_to_response(review: AgentReview) -> AgentReviewResponse:
    """Convert an agent review to a response model."""
    return AgentReviewResponse(
        id=review.id,
        agent_id=review.agent_id,
        user_id=review.user_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at.isoformat(),
        updated_at=review.updated_at.isoformat(),
    )


def _installation_to_response(installation: AgentInstallation) -> AgentInstallationResponse:
    """Convert an agent installation to a response model."""
    return AgentInstallationResponse(
        id=installation.id,
        agent_id=installation.agent_id,
        installed_at=installation.installed_at.isoformat(),
        last_used_at=installation.last_used_at.isoformat() if installation.last_used_at else None,
        usage_count=installation.usage_count,
        is_favorite=installation.is_favorite,
    )


def _library_to_response(library: UserAgentLibrary) -> UserLibraryResponse:
    """Convert a user agent library to a response model."""
    return UserLibraryResponse(
        active_agent_id=library.active_agent_id,
        installations=[_installation_to_response(i) for i in library.installations.values()],
    )


# API routes
@app.get("/agents", response_model=SearchAgentsResponse)
async def search_agents(
    query: Optional[str] = None,
    category: Optional[str] = None,
    tags: Optional[str] = None,
    author_id: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
):
    """Search for agents in the marketplace."""
    try:
        # Parse tags
        tag_list = tags.split(",") if tags else None
        
        # Search for agents
        agents, total = await storage.search_agents(
            query=query,
            category=category,
            tags=tag_list,
            author_id=author_id,
            limit=limit,
            offset=offset,
        )
        
        return SearchAgentsResponse(
            agents=[_agent_to_response(agent) for agent in agents],
            total=total,
        )
    
    except Exception as e:
        logger.error(f"Error searching agents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search agents",
        )


@app.get("/agents/{agent_id}", response_model=AgentDetailResponse)
async def get_agent(agent_id: str, user: User = Depends(get_current_user)):
    """Get detailed information about an agent."""
    try:
        # Get the agent definition
        agent = await storage.get_agent_definition(agent_id)
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )
        
        # Check if the agent is published or the user is the author
        if not agent.published and agent.author.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this agent",
            )
        
        return _agent_to_detail_response(agent)
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error getting agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get agent",
        )


@app.post("/agents", response_model=AgentDetailResponse)
async def create_agent(request: CreateAgentRequest, user: User = Depends(get_current_user)):
    """Create a new agent."""
    try:
        # Create the author
        author = AgentAuthor(
            id=user.id,
            name=user.name or user.email,
            email=user.email,
        )
        
        # Create the pricing
        pricing = AgentPricing.model_validate(request.pricing)
        
        # Create the UI
        ui = AgentUI.model_validate(request.ui)
        
        # Create the agent definition
        agent = AgentDefinition(
            name=request.name,
            description=request.description,
            version="1.0.0",  # Initial version
            author=author,
            category=request.category,
            tags=request.tags,
            system_prompt=request.system_prompt,
            knowledge_base=request.knowledge_base,
            tools=request.tools,
            ui=ui,
            pricing=pricing,
        )
        
        # Register the agent
        agent = await registry.register_agent(agent, user.id)
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create agent",
            )
        
        return _agent_to_detail_response(agent)
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error creating agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create agent",
        )


@app.put("/agents/{agent_id}", response_model=AgentDetailResponse)
async def update_agent(agent_id: str, request: UpdateAgentRequest, user: User = Depends(get_current_user)):
    """Update an existing agent."""
    try:
        # Prepare the updates
        updates = {}
        
        if request.name is not None:
            updates["name"] = request.name
        
        if request.description is not None:
            updates["description"] = request.description
        
        if request.category is not None:
            updates["category"] = request.category
        
        if request.tags is not None:
            updates["tags"] = request.tags
        
        if request.system_prompt is not None:
            updates["system_prompt"] = request.system_prompt
        
        if request.knowledge_base is not None:
            updates["knowledge_base"] = request.knowledge_base
        
        if request.tools is not None:
            updates["tools"] = request.tools
        
        if request.ui is not None:
            updates["ui"] = AgentUI.model_validate(request.ui)
        
        if request.pricing is not None:
            updates["pricing"] = AgentPricing.model_validate(request.pricing)
        
        # Update the agent
        agent = await registry.update_agent(agent_id, updates, user.id)
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or you don't have permission to update it",
            )
        
        return _agent_to_detail_response(agent)
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error updating agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update agent",
        )


@app.post("/agents/{agent_id}/publish")
async def publish_agent(agent_id: str, user: User = Depends(get_current_user)):
    """Publish an agent to the marketplace."""
    try:
        # Publish the agent
        success = await registry.publish_agent(agent_id, user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or you don't have permission to publish it",
            )
        
        return {"message": "Agent published successfully"}
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error publishing agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to publish agent",
        )


@app.post("/agents/{agent_id}/unpublish")
async def unpublish_agent(agent_id: str, user: User = Depends(get_current_user)):
    """Unpublish an agent from the marketplace."""
    try:
        # Unpublish the agent
        success = await registry.unpublish_agent(agent_id, user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or you don't have permission to unpublish it",
            )
        
        return {"message": "Agent unpublished successfully"}
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error unpublishing agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unpublish agent",
        )


@app.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str, user: User = Depends(get_current_user)):
    """Delete an agent from the marketplace."""
    try:
        # Delete the agent
        success = await registry.delete_agent(agent_id, user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or you don't have permission to delete it",
            )
        
        return {"message": "Agent deleted successfully"}
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error deleting agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete agent",
        )


@app.post("/agents/{agent_id}/install")
async def install_agent(agent_id: str, user: User = Depends(get_current_user)):
    """Install an agent for the current user."""
    try:
        # Install the agent
        installation = await registry.install_agent(agent_id, user.id)
        
        if not installation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or not published",
            )
        
        return {"message": "Agent installed successfully"}
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error installing agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to install agent",
        )


@app.post("/agents/{agent_id}/uninstall")
async def uninstall_agent(agent_id: str, user: User = Depends(get_current_user)):
    """Uninstall an agent for the current user."""
    try:
        # Uninstall the agent
        success = await registry.uninstall_agent(agent_id, user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or not installed",
            )
        
        return {"message": "Agent uninstalled successfully"}
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error uninstalling agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to uninstall agent",
        )


@app.post("/agents/{agent_id}/activate")
async def activate_agent(agent_id: str, user: User = Depends(get_current_user)):
    """Set an agent as active for the current user."""
    try:
        # Set the active agent
        success = await execution_engine.set_active_agent(agent_id, user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or not installed",
            )
        
        return {"message": "Agent activated successfully"}
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error activating agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate agent",
        )


@app.post("/agents/{agent_id}/favorite")
async def set_agent_favorite(agent_id: str, is_favorite: bool = True, user: User = Depends(get_current_user)):
    """Set an agent as a favorite for the current user."""
    try:
        # Set the agent as a favorite
        success = await registry.set_agent_favorite(agent_id, user.id, is_favorite)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or not installed",
            )
        
        return {"message": f"Agent {'added to' if is_favorite else 'removed from'} favorites successfully"}
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error setting agent favorite: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to {'add' if is_favorite else 'remove'} agent {'to' if is_favorite else 'from'} favorites",
        )


@app.post("/agents/{agent_id}/review", response_model=AgentReviewResponse)
async def review_agent(agent_id: str, request: ReviewAgentRequest, user: User = Depends(get_current_user)):
    """Review an agent."""
    try:
        # Review the agent
        review = await registry.review_agent(
            agent_id=agent_id,
            user_id=user.id,
            rating=request.rating,
            comment=request.comment,
        )
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or not published",
            )
        
        return _review_to_response(review)
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error reviewing agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to review agent",
        )


@app.delete("/reviews/{review_id}")
async def delete_review(review_id: str, user: User = Depends(get_current_user)):
    """Delete an agent review."""
    try:
        # Delete the review
        success = await registry.delete_review(review_id, user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found or you don't have permission to delete it",
            )
        
        return {"message": "Review deleted successfully"}
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error deleting review: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete review",
        )


@app.get("/agents/{agent_id}/reviews", response_model=List[AgentReviewResponse])
async def get_agent_reviews(agent_id: str, user: User = Depends(get_current_user)):
    """Get reviews for an agent."""
    try:
        # Get the agent reviews
        reviews = await storage.get_agent_reviews(agent_id)
        
        return [_review_to_response(review) for review in reviews]
    
    except Exception as e:
        logger.error(f"Error getting agent reviews: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get agent reviews",
        )


@app.get("/library", response_model=UserLibraryResponse)
async def get_user_library(user: User = Depends(get_current_user)):
    """Get the current user's agent library."""
    try:
        # Get the user's agent library
        library = await storage.get_user_library(user.id)
        
        return _library_to_response(library)
    
    except Exception as e:
        logger.error(f"Error getting user library: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user library",
        )


@app.get("/active-agent", response_model=Optional[AgentDetailResponse])
async def get_active_agent(user: User = Depends(get_current_user)):
    """Get the current user's active agent."""
    try:
        # Get the active agent
        agent = await execution_engine.get_active_agent(user.id)
        
        if not agent:
            return None
        
        return _agent_to_detail_response(agent)
    
    except Exception as e:
        logger.error(f"Error getting active agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get active agent",
        )