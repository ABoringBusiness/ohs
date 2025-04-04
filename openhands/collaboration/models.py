"""Models for the Collaborative Sessions feature."""

import datetime
import enum
import uuid
from typing import Dict, List, Optional, Set, Any

from pydantic import BaseModel, Field, EmailStr


class SessionVisibility(str, enum.Enum):
    """Visibility level of a session."""
    
    PRIVATE = "private"  # Only invited participants can access
    LINK = "link"  # Anyone with the link can access
    PUBLIC = "public"  # Listed in public directory


class ParticipantRole(str, enum.Enum):
    """Role of a participant in a session."""
    
    OWNER = "owner"  # Full control over the session
    COLLABORATOR = "collaborator"  # Can interact with the AI
    VIEWER = "viewer"  # Can only observe
    MODERATOR = "moderator"  # Can manage participants


class SessionSettings(BaseModel):
    """Settings for a collaborative session."""
    
    allow_viewer_chat: bool = True  # Whether viewers can use the side chat
    show_participant_cursors: bool = True  # Whether to show participant cursors
    enable_branching: bool = False  # Whether to allow conversation branching
    require_approval_for_ai_messages: bool = False  # Whether owner must approve messages to AI
    auto_record: bool = False  # Whether to automatically record the session
    max_viewers: Optional[int] = None  # Maximum number of viewers (None = unlimited)
    allow_reactions: bool = True  # Whether to allow reactions to messages
    allow_annotations: bool = True  # Whether to allow annotations on messages


class ParticipantSettings(BaseModel):
    """Settings for a participant in a session."""
    
    display_name: Optional[str] = None  # Custom display name for the session
    color: Optional[str] = None  # Color for identifying the participant
    notifications_enabled: bool = True  # Whether to receive notifications
    show_presence: bool = True  # Whether to show online status
    muted_chat: bool = False  # Whether the side chat is muted


class Session(BaseModel):
    """A collaborative session."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    title: str
    description: str = ""
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    visibility: SessionVisibility = SessionVisibility.PRIVATE
    password_hash: Optional[str] = None
    expires_at: Optional[datetime.datetime] = None
    is_active: bool = True
    conversation_id: str
    settings: SessionSettings = Field(default_factory=SessionSettings)
    tags: List[str] = Field(default_factory=list)
    category: Optional[str] = None
    thumbnail_url: Optional[str] = None
    view_count: int = 0
    
    def update(self, **kwargs):
        """Update the session."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.datetime.utcnow()


class SessionParticipant(BaseModel):
    """A participant in a collaborative session."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: str
    role: ParticipantRole
    joined_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    last_active_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    is_online: bool = False
    settings: ParticipantSettings = Field(default_factory=ParticipantSettings)
    
    def update_activity(self):
        """Update the participant's last activity time."""
        self.last_active_at = datetime.datetime.utcnow()
        self.is_online = True
    
    def set_offline(self):
        """Set the participant as offline."""
        self.is_online = False


class SessionInvitation(BaseModel):
    """An invitation to join a collaborative session."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    created_by: str
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    expires_at: Optional[datetime.datetime] = None
    role: ParticipantRole = ParticipantRole.VIEWER
    email: Optional[EmailStr] = None
    user_id: Optional[str] = None
    token: str = Field(default_factory=lambda: str(uuid.uuid4()))
    is_used: bool = False
    used_at: Optional[datetime.datetime] = None
    
    def mark_as_used(self):
        """Mark the invitation as used."""
        self.is_used = True
        self.used_at = datetime.datetime.utcnow()
    
    def is_valid(self) -> bool:
        """Check if the invitation is valid."""
        if self.is_used:
            return False
        
        if self.expires_at and self.expires_at < datetime.datetime.utcnow():
            return False
        
        return True


class ChatMessage(BaseModel):
    """A message in the side chat of a collaborative session."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: str
    content: str
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    edited_at: Optional[datetime.datetime] = None
    is_deleted: bool = False
    parent_id: Optional[str] = None  # For threaded replies
    
    def edit(self, content: str):
        """Edit the message content."""
        self.content = content
        self.edited_at = datetime.datetime.utcnow()
    
    def delete(self):
        """Mark the message as deleted."""
        self.is_deleted = True
        self.content = ""


class Reaction(BaseModel):
    """A reaction to a message in a collaborative session."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: str
    message_id: str  # Can be AI message ID or chat message ID
    emoji: str
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)


class Annotation(BaseModel):
    """An annotation on a message in a collaborative session."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: str
    message_id: str  # Can be AI message ID or chat message ID
    content: str
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    edited_at: Optional[datetime.datetime] = None
    is_deleted: bool = False
    start_index: Optional[int] = None  # For highlighting specific text
    end_index: Optional[int] = None  # For highlighting specific text
    
    def edit(self, content: str):
        """Edit the annotation content."""
        self.content = content
        self.edited_at = datetime.datetime.utcnow()
    
    def delete(self):
        """Mark the annotation as deleted."""
        self.is_deleted = True
        self.content = ""


class SessionRecording(BaseModel):
    """A recording of a collaborative session."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    title: str
    description: str = ""
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    start_time: datetime.datetime
    end_time: Optional[datetime.datetime] = None
    is_complete: bool = False
    visibility: SessionVisibility = SessionVisibility.PRIVATE
    view_count: int = 0
    
    def complete(self, end_time: datetime.datetime):
        """Mark the recording as complete."""
        self.end_time = end_time
        self.is_complete = True