"""API routes for session sharing and streaming."""

import logging
import datetime
from typing import Dict, List, Optional, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr

from openhands.collaboration.models import (
    Session,
    SessionParticipant,
    SessionInvitation,
    ParticipantRole,
    SessionVisibility,
    SessionSettings,
)
from openhands.collaboration.service import CollaborationService
from openhands.collaboration.storage import CollaborationStorage
from openhands.server.auth_supabase import User, get_current_user

logger = logging.getLogger(__name__)

app = APIRouter(prefix="/api/session-sharing")

# Initialize services
storage = CollaborationStorage()
service = CollaborationService(storage)


# Request and response models
class ShareSessionRequest(BaseModel):
    """Request model for sharing a session."""
    
    conversation_id: str
    title: str
    description: str = ""
    visibility: SessionVisibility = SessionVisibility.PRIVATE
    password: Optional[str] = None
    expires_in: Optional[int] = None  # Expiration time in seconds
    allow_viewer_chat: bool = True
    show_participant_cursors: bool = True
    max_viewers: Optional[int] = None


class InviteUserRequest(BaseModel):
    """Request model for inviting a user to a session."""
    
    email: Optional[EmailStr] = None
    user_id: Optional[str] = None
    role: ParticipantRole = ParticipantRole.VIEWER
    expires_in: Optional[int] = None  # Expiration time in seconds


class UpdateSessionVisibilityRequest(BaseModel):
    """Request model for updating a session's visibility."""
    
    visibility: SessionVisibility
    password: Optional[str] = None


class SessionResponse(BaseModel):
    """Response model for a session."""
    
    id: str
    owner_id: str
    title: str
    description: str
    created_at: str
    updated_at: str
    visibility: str
    expires_at: Optional[str] = None
    is_active: bool
    conversation_id: str
    settings: Dict[str, Any]
    view_count: int
    participant_count: int
    share_url: str


class InvitationResponse(BaseModel):
    """Response model for an invitation."""
    
    id: str
    session_id: str
    created_by: str
    created_at: str
    expires_at: Optional[str] = None
    role: str
    email: Optional[str] = None
    user_id: Optional[str] = None
    token: str
    invitation_url: str


class ParticipantResponse(BaseModel):
    """Response model for a participant."""
    
    id: str
    user_id: str
    role: str
    joined_at: str
    last_active_at: str
    is_online: bool
    settings: Dict[str, Any]


class PublicSessionsResponse(BaseModel):
    """Response model for public sessions."""
    
    sessions: List[SessionResponse]
    total: int


# Helper functions
def _session_to_response(session: Session, participant_count: int = 0, base_url: str = "https://app.openhands.ai") -> SessionResponse:
    """Convert a session to a response model."""
    share_url = f"{base_url}/shared-session/{session.id}"
    
    return SessionResponse(
        id=session.id,
        owner_id=session.owner_id,
        title=session.title,
        description=session.description,
        created_at=session.created_at.isoformat(),
        updated_at=session.updated_at.isoformat(),
        visibility=session.visibility,
        expires_at=session.expires_at.isoformat() if session.expires_at else None,
        is_active=session.is_active,
        conversation_id=session.conversation_id,
        settings=session.settings.model_dump(),
        view_count=session.view_count,
        participant_count=participant_count,
        share_url=share_url,
    )


def _invitation_to_response(invitation: SessionInvitation, base_url: str = "https://app.openhands.ai") -> InvitationResponse:
    """Convert an invitation to a response model."""
    invitation_url = f"{base_url}/join-session?token={invitation.token}"
    
    return InvitationResponse(
        id=invitation.id,
        session_id=invitation.session_id,
        created_by=invitation.created_by,
        created_at=invitation.created_at.isoformat(),
        expires_at=invitation.expires_at.isoformat() if invitation.expires_at else None,
        role=invitation.role,
        email=invitation.email,
        user_id=invitation.user_id,
        token=invitation.token,
        invitation_url=invitation_url,
    )


def _participant_to_response(participant: SessionParticipant) -> ParticipantResponse:
    """Convert a participant to a response model."""
    return ParticipantResponse(
        id=participant.id,
        user_id=participant.user_id,
        role=participant.role,
        joined_at=participant.joined_at.isoformat(),
        last_active_at=participant.last_active_at.isoformat(),
        is_online=participant.is_online,
        settings=participant.settings.model_dump(),
    )


# API routes
@app.post("/share", response_model=SessionResponse)
async def share_session(request: ShareSessionRequest, user: User = Depends(get_current_user)):
    """Share a conversation as a collaborative session."""
    try:
        # Create session settings
        settings = SessionSettings(
            allow_viewer_chat=request.allow_viewer_chat,
            show_participant_cursors=request.show_participant_cursors,
            max_viewers=request.max_viewers,
        )
        
        # Calculate expiration time
        expires_at = None
        if request.expires_in:
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(seconds=request.expires_in)
        
        # Create the session
        session = await service.create_session(
            owner_id=user.id,
            title=request.title,
            description=request.description,
            conversation_id=request.conversation_id,
            visibility=request.visibility,
            password=request.password,
            expires_at=expires_at,
            settings=settings,
            tags=["shared-session"],
            category="shared-conversation",
        )
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to share session",
            )
        
        # Get the participant count
        participants = await service.get_session_participants(session.id)
        
        return _session_to_response(session, len(participants))
    
    except Exception as e:
        logger.error(f"Error sharing session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to share session",
        )


@app.post("/sessions/{session_id}/invite", response_model=InvitationResponse)
async def invite_user(session_id: str, request: InviteUserRequest, user: User = Depends(get_current_user)):
    """Invite a user to a shared session."""
    try:
        # Create the invitation
        invitation = await service.create_invitation(
            session_id=session_id,
            user_id=user.id,
            role=request.role,
            email=request.email,
            target_user_id=request.user_id,
            expires_in=request.expires_in,
        )
        
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to invite users to this session",
            )
        
        return _invitation_to_response(invitation)
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error inviting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to invite user",
        )


@app.put("/sessions/{session_id}/visibility", response_model=SessionResponse)
async def update_session_visibility(session_id: str, request: UpdateSessionVisibilityRequest, user: User = Depends(get_current_user)):
    """Update a session's visibility settings."""
    try:
        # Update the session
        updates = {
            "visibility": request.visibility,
        }
        
        if request.password is not None:
            updates["password"] = request.password
        
        session = await service.update_session(session_id, user.id, **updates)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or you don't have permission to update it",
            )
        
        # Get the participant count
        participants = await service.get_session_participants(session.id)
        
        return _session_to_response(session, len(participants))
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error updating session visibility: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update session visibility",
        )


@app.get("/public", response_model=PublicSessionsResponse)
async def get_public_sessions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
):
    """Get public sessions for streaming."""
    try:
        # Get public sessions
        sessions, total = await service.get_public_sessions(limit, offset)
        
        # Get participant counts
        session_responses = []
        for session in sessions:
            participants = await service.get_session_participants(session.id)
            session_responses.append(_session_to_response(session, len(participants)))
        
        return PublicSessionsResponse(
            sessions=session_responses,
            total=total,
        )
    
    except Exception as e:
        logger.error(f"Error getting public sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get public sessions",
        )


@app.post("/sessions/{session_id}/join", response_model=ParticipantResponse)
async def join_shared_session(
    session_id: str, 
    password: Optional[str] = None, 
    invitation_token: Optional[str] = None, 
    user: User = Depends(get_current_user)
):
    """Join a shared session."""
    try:
        # Join the session
        participant = await service.join_session(
            session_id=session_id,
            user_id=user.id,
            password=password,
            invitation_token=invitation_token,
        )
        
        if not participant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Failed to join session",
            )
        
        return _participant_to_response(participant)
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error joining shared session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join shared session",
        )