"""Service for the Collaborative Sessions feature."""

import logging
import datetime
import hashlib
import secrets
from typing import Dict, List, Optional, Any, Tuple

from openhands.collaboration.models import (
    Session,
    SessionParticipant,
    SessionInvitation,
    ChatMessage,
    Reaction,
    Annotation,
    SessionRecording,
    ParticipantRole,
    SessionVisibility,
    SessionSettings,
    ParticipantSettings,
)
from openhands.collaboration.storage import CollaborationStorage

logger = logging.getLogger(__name__)


class CollaborationService:
    """Service for collaborative sessions."""
    
    def __init__(self, storage: CollaborationStorage):
        """Initialize the collaboration service.
        
        Args:
            storage: The collaboration storage service.
        """
        self.storage = storage
    
    async def create_session(self, owner_id: str, title: str, description: str, conversation_id: str, visibility: SessionVisibility = SessionVisibility.PRIVATE, password: Optional[str] = None, expires_at: Optional[datetime.datetime] = None, settings: Optional[SessionSettings] = None, tags: List[str] = None, category: Optional[str] = None, thumbnail_url: Optional[str] = None) -> Optional[Session]:
        """Create a new collaborative session.
        
        Args:
            owner_id: The owner ID.
            title: The session title.
            description: The session description.
            conversation_id: The conversation ID.
            visibility: The session visibility.
            password: The session password (for link visibility).
            expires_at: When the session expires.
            settings: The session settings.
            tags: The session tags.
            category: The session category.
            thumbnail_url: The session thumbnail URL.
            
        Returns:
            The created session, or None if creation failed.
        """
        try:
            # Create the session
            session = Session(
                owner_id=owner_id,
                title=title,
                description=description,
                conversation_id=conversation_id,
                visibility=visibility,
                password_hash=self._hash_password(password) if password else None,
                expires_at=expires_at,
                settings=settings or SessionSettings(),
                tags=tags or [],
                category=category,
                thumbnail_url=thumbnail_url,
            )
            
            # Save the session
            success = await self.storage.create_session(session)
            
            if not success:
                return None
            
            # Add the owner as a participant
            participant = SessionParticipant(
                session_id=session.id,
                user_id=owner_id,
                role=ParticipantRole.OWNER,
                is_online=True,
            )
            
            await self.storage.add_participant(participant)
            
            return session
        
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            return None
    
    async def get_session(self, session_id: str) -> Optional[Session]:
        """Get a collaborative session.
        
        Args:
            session_id: The session ID.
            
        Returns:
            The session, or None if it doesn't exist.
        """
        try:
            return await self.storage.get_session(session_id)
        
        except Exception as e:
            logger.error(f"Error getting session: {e}")
            return None
    
    async def update_session(self, session_id: str, user_id: str, **kwargs) -> Optional[Session]:
        """Update a collaborative session.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
            **kwargs: The fields to update.
            
        Returns:
            The updated session, or None if update failed.
        """
        try:
            # Get the session
            session = await self.storage.get_session(session_id)
            
            if not session:
                return None
            
            # Check if the user is the owner
            if session.owner_id != user_id:
                return None
            
            # Handle password update
            if "password" in kwargs:
                password = kwargs.pop("password")
                kwargs["password_hash"] = self._hash_password(password) if password else None
            
            # Update the session
            session.update(**kwargs)
            
            # Save the session
            success = await self.storage.update_session(session)
            
            if not success:
                return None
            
            return session
        
        except Exception as e:
            logger.error(f"Error updating session: {e}")
            return None
    
    async def delete_session(self, session_id: str, user_id: str) -> bool:
        """Delete a collaborative session.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Get the session
            session = await self.storage.get_session(session_id)
            
            if not session:
                return False
            
            # Check if the user is the owner
            if session.owner_id != user_id:
                return False
            
            # Delete the session
            return await self.storage.delete_session(session_id)
        
        except Exception as e:
            logger.error(f"Error deleting session: {e}")
            return False
    
    async def get_user_sessions(self, user_id: str) -> List[Session]:
        """Get sessions owned by a user.
        
        Args:
            user_id: The user ID.
            
        Returns:
            A list of sessions.
        """
        try:
            return await self.storage.get_sessions_by_owner(user_id)
        
        except Exception as e:
            logger.error(f"Error getting user sessions: {e}")
            return []
    
    async def get_public_sessions(self, limit: int = 20, offset: int = 0) -> Tuple[List[Session], int]:
        """Get public sessions.
        
        Args:
            limit: The maximum number of sessions to return.
            offset: The offset for pagination.
            
        Returns:
            A tuple of (list of sessions, total count).
        """
        try:
            return await self.storage.get_public_sessions(limit, offset)
        
        except Exception as e:
            logger.error(f"Error getting public sessions: {e}")
            return [], 0
    
    async def search_sessions(self, query: str, tags: List[str] = None, category: str = None, limit: int = 20, offset: int = 0) -> Tuple[List[Session], int]:
        """Search for public sessions.
        
        Args:
            query: The search query.
            tags: The tags to filter by.
            category: The category to filter by.
            limit: The maximum number of sessions to return.
            offset: The offset for pagination.
            
        Returns:
            A tuple of (list of sessions, total count).
        """
        try:
            return await self.storage.search_sessions(query, tags, category, limit, offset)
        
        except Exception as e:
            logger.error(f"Error searching sessions: {e}")
            return [], 0
    
    async def join_session(self, session_id: str, user_id: str, password: Optional[str] = None, invitation_token: Optional[str] = None) -> Optional[SessionParticipant]:
        """Join a collaborative session.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
            password: The session password (for link visibility).
            invitation_token: The invitation token.
            
        Returns:
            The session participant, or None if joining failed.
        """
        try:
            # Get the session
            session = await self.storage.get_session(session_id)
            
            if not session:
                return None
            
            # Check if the session is active
            if not session.is_active:
                return None
            
            # Check if the session has expired
            if session.expires_at and session.expires_at < datetime.datetime.utcnow():
                return None
            
            # Check if the user is already a participant
            participant = await self.storage.get_participant(session_id, user_id)
            
            if participant:
                # Update the participant's online status
                participant.update_activity()
                await self.storage.update_participant(participant)
                return participant
            
            # Determine the participant's role
            role = ParticipantRole.VIEWER
            
            # Check invitation token
            if invitation_token:
                invitation = await self.storage.get_invitation_by_token(invitation_token)
                
                if invitation and invitation.session_id == session_id and invitation.is_valid():
                    # Check if the invitation is for this user
                    if invitation.user_id and invitation.user_id != user_id:
                        return None
                    
                    # Use the role from the invitation
                    role = invitation.role
                    
                    # Mark the invitation as used
                    invitation.mark_as_used()
                    await self.storage.update_invitation(invitation)
            
            # Check visibility and password
            if session.visibility == SessionVisibility.PRIVATE:
                # Private sessions require an invitation or ownership
                if session.owner_id != user_id and role == ParticipantRole.VIEWER:
                    return None
            
            elif session.visibility == SessionVisibility.LINK:
                # Link sessions require a password if set
                if session.password_hash and not self._verify_password(password, session.password_hash):
                    return None
            
            # Create the participant
            participant = SessionParticipant(
                session_id=session_id,
                user_id=user_id,
                role=role if session.owner_id != user_id else ParticipantRole.OWNER,
                is_online=True,
            )
            
            # Add the participant
            success = await self.storage.add_participant(participant)
            
            if not success:
                return None
            
            # Increment the view count if this is a new viewer
            if role == ParticipantRole.VIEWER:
                await self.storage.increment_session_view_count(session_id)
            
            return participant
        
        except Exception as e:
            logger.error(f"Error joining session: {e}")
            return None
    
    async def leave_session(self, session_id: str, user_id: str) -> bool:
        """Leave a collaborative session.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
            
        Returns:
            True if leaving was successful, False otherwise.
        """
        try:
            # Get the participant
            participant = await self.storage.get_participant(session_id, user_id)
            
            if not participant:
                return False
            
            # Check if the user is the owner
            if participant.role == ParticipantRole.OWNER:
                # Owners can't leave, they must delete the session
                return False
            
            # Remove the participant
            return await self.storage.remove_participant(session_id, user_id)
        
        except Exception as e:
            logger.error(f"Error leaving session: {e}")
            return False
    
    async def update_participant_status(self, session_id: str, user_id: str, is_online: bool) -> bool:
        """Update a participant's online status.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
            is_online: Whether the participant is online.
            
        Returns:
            True if the update was successful, False otherwise.
        """
        try:
            # Get the participant
            participant = await self.storage.get_participant(session_id, user_id)
            
            if not participant:
                return False
            
            # Update the participant's status
            if is_online:
                participant.update_activity()
            else:
                participant.set_offline()
            
            # Save the participant
            return await self.storage.update_participant(participant)
        
        except Exception as e:
            logger.error(f"Error updating participant status: {e}")
            return False
    
    async def update_participant_settings(self, session_id: str, user_id: str, settings: ParticipantSettings) -> bool:
        """Update a participant's settings.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
            settings: The participant settings.
            
        Returns:
            True if the update was successful, False otherwise.
        """
        try:
            # Get the participant
            participant = await self.storage.get_participant(session_id, user_id)
            
            if not participant:
                return False
            
            # Update the participant's settings
            participant.settings = settings
            
            # Save the participant
            return await self.storage.update_participant(participant)
        
        except Exception as e:
            logger.error(f"Error updating participant settings: {e}")
            return False
    
    async def get_session_participants(self, session_id: str) -> List[SessionParticipant]:
        """Get participants in a session.
        
        Args:
            session_id: The session ID.
            
        Returns:
            A list of participants.
        """
        try:
            return await self.storage.get_session_participants(session_id)
        
        except Exception as e:
            logger.error(f"Error getting session participants: {e}")
            return []
    
    async def update_participant_role(self, session_id: str, user_id: str, target_user_id: str, role: ParticipantRole) -> bool:
        """Update a participant's role.
        
        Args:
            session_id: The session ID.
            user_id: The user ID (must be owner or moderator).
            target_user_id: The target user ID.
            role: The new role.
            
        Returns:
            True if the update was successful, False otherwise.
        """
        try:
            # Get the session
            session = await self.storage.get_session(session_id)
            
            if not session:
                return False
            
            # Get the user's participant
            user_participant = await self.storage.get_participant(session_id, user_id)
            
            if not user_participant:
                return False
            
            # Check if the user has permission to update roles
            if user_participant.role not in [ParticipantRole.OWNER, ParticipantRole.MODERATOR]:
                return False
            
            # Moderators can't change the owner's role
            if user_participant.role == ParticipantRole.MODERATOR and session.owner_id == target_user_id:
                return False
            
            # Get the target participant
            target_participant = await self.storage.get_participant(session_id, target_user_id)
            
            if not target_participant:
                return False
            
            # Can't change the owner's role to anything other than owner
            if session.owner_id == target_user_id and role != ParticipantRole.OWNER:
                return False
            
            # Update the target participant's role
            target_participant.role = role
            
            # Save the target participant
            return await self.storage.update_participant(target_participant)
        
        except Exception as e:
            logger.error(f"Error updating participant role: {e}")
            return False
    
    async def remove_participant(self, session_id: str, user_id: str, target_user_id: str) -> bool:
        """Remove a participant from a session.
        
        Args:
            session_id: The session ID.
            user_id: The user ID (must be owner or moderator).
            target_user_id: The target user ID.
            
        Returns:
            True if the removal was successful, False otherwise.
        """
        try:
            # Get the session
            session = await self.storage.get_session(session_id)
            
            if not session:
                return False
            
            # Get the user's participant
            user_participant = await self.storage.get_participant(session_id, user_id)
            
            if not user_participant:
                return False
            
            # Check if the user has permission to remove participants
            if user_participant.role not in [ParticipantRole.OWNER, ParticipantRole.MODERATOR]:
                return False
            
            # Can't remove the owner
            if session.owner_id == target_user_id:
                return False
            
            # Get the target participant
            target_participant = await self.storage.get_participant(session_id, target_user_id)
            
            if not target_participant:
                return False
            
            # Moderators can't remove other moderators
            if user_participant.role == ParticipantRole.MODERATOR and target_participant.role == ParticipantRole.MODERATOR:
                return False
            
            # Remove the target participant
            return await self.storage.remove_participant(session_id, target_user_id)
        
        except Exception as e:
            logger.error(f"Error removing participant: {e}")
            return False
    
    async def create_invitation(self, session_id: str, user_id: str, role: ParticipantRole = ParticipantRole.VIEWER, email: Optional[str] = None, target_user_id: Optional[str] = None, expires_in: Optional[int] = None) -> Optional[SessionInvitation]:
        """Create a session invitation.
        
        Args:
            session_id: The session ID.
            user_id: The user ID (must be owner or moderator).
            role: The role for the invited user.
            email: The email address to invite.
            target_user_id: The target user ID to invite.
            expires_in: The invitation expiration time in seconds.
            
        Returns:
            The created invitation, or None if creation failed.
        """
        try:
            # Get the session
            session = await self.storage.get_session(session_id)
            
            if not session:
                return None
            
            # Get the user's participant
            user_participant = await self.storage.get_participant(session_id, user_id)
            
            if not user_participant:
                return None
            
            # Check if the user has permission to create invitations
            if user_participant.role not in [ParticipantRole.OWNER, ParticipantRole.MODERATOR]:
                return None
            
            # Moderators can't create owner invitations
            if user_participant.role == ParticipantRole.MODERATOR and role == ParticipantRole.OWNER:
                return None
            
            # Calculate expiration time
            expires_at = None
            if expires_in:
                expires_at = datetime.datetime.utcnow() + datetime.timedelta(seconds=expires_in)
            
            # Create the invitation
            invitation = SessionInvitation(
                session_id=session_id,
                created_by=user_id,
                role=role,
                email=email,
                user_id=target_user_id,
                expires_at=expires_at,
            )
            
            # Save the invitation
            success = await self.storage.create_invitation(invitation)
            
            if not success:
                return None
            
            return invitation
        
        except Exception as e:
            logger.error(f"Error creating invitation: {e}")
            return None
    
    async def get_invitation_by_token(self, token: str) -> Optional[SessionInvitation]:
        """Get a session invitation by token.
        
        Args:
            token: The invitation token.
            
        Returns:
            The invitation, or None if it doesn't exist.
        """
        try:
            return await self.storage.get_invitation_by_token(token)
        
        except Exception as e:
            logger.error(f"Error getting invitation by token: {e}")
            return None
    
    async def get_user_invitations(self, user_id: str, email: Optional[str] = None) -> List[SessionInvitation]:
        """Get invitations for a user.
        
        Args:
            user_id: The user ID.
            email: The user's email address.
            
        Returns:
            A list of invitations.
        """
        try:
            # Get invitations by user ID
            user_invitations = await self.storage.get_invitations_by_user(user_id)
            
            # Get invitations by email if provided
            email_invitations = []
            if email:
                email_invitations = await self.storage.get_invitations_by_email(email)
            
            # Combine and deduplicate
            all_invitations = user_invitations + email_invitations
            unique_invitations = {invitation.id: invitation for invitation in all_invitations}
            
            return list(unique_invitations.values())
        
        except Exception as e:
            logger.error(f"Error getting user invitations: {e}")
            return []
    
    async def delete_invitation(self, invitation_id: str, user_id: str) -> bool:
        """Delete a session invitation.
        
        Args:
            invitation_id: The invitation ID.
            user_id: The user ID (must be owner, moderator, or creator).
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Get all invitations
            all_invitations = []
            sessions = await self.storage.get_sessions_by_owner(user_id)
            
            for session in sessions:
                participants = await self.storage.get_session_participants(session.id)
                for participant in participants:
                    if participant.user_id == user_id and participant.role in [ParticipantRole.OWNER, ParticipantRole.MODERATOR]:
                        # Get invitations for this session
                        response = await self.storage.get_invitation_by_token(invitation_id)
                        if response:
                            all_invitations.append(response)
            
            # Find the invitation
            invitation = next((i for i in all_invitations if i.id == invitation_id), None)
            
            if not invitation:
                return False
            
            # Check if the user has permission to delete the invitation
            if invitation.created_by != user_id:
                # Get the session
                session = await self.storage.get_session(invitation.session_id)
                
                if not session:
                    return False
                
                # Get the user's participant
                user_participant = await self.storage.get_participant(invitation.session_id, user_id)
                
                if not user_participant or user_participant.role not in [ParticipantRole.OWNER, ParticipantRole.MODERATOR]:
                    return False
            
            # Delete the invitation
            return await self.storage.delete_invitation(invitation_id)
        
        except Exception as e:
            logger.error(f"Error deleting invitation: {e}")
            return False
    
    async def add_chat_message(self, session_id: str, user_id: str, content: str, parent_id: Optional[str] = None) -> Optional[ChatMessage]:
        """Add a chat message to a session.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
            content: The message content.
            parent_id: The parent message ID for replies.
            
        Returns:
            The created message, or None if creation failed.
        """
        try:
            # Get the session
            session = await self.storage.get_session(session_id)
            
            if not session:
                return None
            
            # Get the participant
            participant = await self.storage.get_participant(session_id, user_id)
            
            if not participant:
                return None
            
            # Check if the participant can send chat messages
            if participant.role == ParticipantRole.VIEWER and not session.settings.allow_viewer_chat:
                return None
            
            # Create the message
            message = ChatMessage(
                session_id=session_id,
                user_id=user_id,
                content=content,
                parent_id=parent_id,
            )
            
            # Save the message
            success = await self.storage.add_chat_message(message)
            
            if not success:
                return None
            
            return message
        
        except Exception as e:
            logger.error(f"Error adding chat message: {e}")
            return None
    
    async def edit_chat_message(self, message_id: str, user_id: str, content: str) -> Optional[ChatMessage]:
        """Edit a chat message.
        
        Args:
            message_id: The message ID.
            user_id: The user ID.
            content: The new message content.
            
        Returns:
            The updated message, or None if update failed.
        """
        try:
            # Get the message
            message = await self.storage.get_chat_message(message_id)
            
            if not message:
                return None
            
            # Check if the user is the message author
            if message.user_id != user_id:
                return None
            
            # Edit the message
            message.edit(content)
            
            # Save the message
            success = await self.storage.update_chat_message(message)
            
            if not success:
                return None
            
            return message
        
        except Exception as e:
            logger.error(f"Error editing chat message: {e}")
            return None
    
    async def delete_chat_message(self, message_id: str, user_id: str) -> bool:
        """Delete a chat message.
        
        Args:
            message_id: The message ID.
            user_id: The user ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Get the message
            message = await self.storage.get_chat_message(message_id)
            
            if not message:
                return False
            
            # Check if the user is the message author
            if message.user_id != user_id:
                # Check if the user is a moderator or owner
                participant = await self.storage.get_participant(message.session_id, user_id)
                
                if not participant or participant.role not in [ParticipantRole.OWNER, ParticipantRole.MODERATOR]:
                    return False
            
            # Delete the message
            message.delete()
            
            # Save the message
            return await self.storage.update_chat_message(message)
        
        except Exception as e:
            logger.error(f"Error deleting chat message: {e}")
            return False
    
    async def get_chat_messages(self, session_id: str, limit: int = 100, before_id: Optional[str] = None) -> List[ChatMessage]:
        """Get chat messages for a session.
        
        Args:
            session_id: The session ID.
            limit: The maximum number of messages to return.
            before_id: Only return messages before this ID.
            
        Returns:
            A list of chat messages.
        """
        try:
            return await self.storage.get_session_chat_messages(session_id, limit, before_id)
        
        except Exception as e:
            logger.error(f"Error getting chat messages: {e}")
            return []
    
    async def add_reaction(self, session_id: str, user_id: str, message_id: str, emoji: str) -> Optional[Reaction]:
        """Add a reaction to a message.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
            message_id: The message ID.
            emoji: The reaction emoji.
            
        Returns:
            The created reaction, or None if creation failed.
        """
        try:
            # Get the session
            session = await self.storage.get_session(session_id)
            
            if not session:
                return None
            
            # Check if reactions are allowed
            if not session.settings.allow_reactions:
                return None
            
            # Get the participant
            participant = await self.storage.get_participant(session_id, user_id)
            
            if not participant:
                return None
            
            # Create the reaction
            reaction = Reaction(
                session_id=session_id,
                user_id=user_id,
                message_id=message_id,
                emoji=emoji,
            )
            
            # Save the reaction
            success = await self.storage.add_reaction(reaction)
            
            if not success:
                return None
            
            return reaction
        
        except Exception as e:
            logger.error(f"Error adding reaction: {e}")
            return None
    
    async def remove_reaction(self, reaction_id: str, user_id: str) -> bool:
        """Remove a reaction from a message.
        
        Args:
            reaction_id: The reaction ID.
            user_id: The user ID.
            
        Returns:
            True if the removal was successful, False otherwise.
        """
        try:
            # Get the reaction
            reactions = []
            sessions = await self.storage.get_sessions_by_owner(user_id)
            
            for session in sessions:
                participants = await self.storage.get_session_participants(session.id)
                for participant in participants:
                    if participant.user_id == user_id:
                        # Get message reactions
                        messages = await self.storage.get_session_chat_messages(session.id)
                        for message in messages:
                            message_reactions = await self.storage.get_message_reactions(message.id)
                            reactions.extend(message_reactions)
            
            # Find the reaction
            reaction = next((r for r in reactions if r.id == reaction_id), None)
            
            if not reaction:
                return False
            
            # Check if the user is the reaction author
            if reaction.user_id != user_id:
                return False
            
            # Remove the reaction
            return await self.storage.remove_reaction(reaction_id)
        
        except Exception as e:
            logger.error(f"Error removing reaction: {e}")
            return False
    
    async def get_message_reactions(self, message_id: str) -> List[Reaction]:
        """Get reactions for a message.
        
        Args:
            message_id: The message ID.
            
        Returns:
            A list of reactions.
        """
        try:
            return await self.storage.get_message_reactions(message_id)
        
        except Exception as e:
            logger.error(f"Error getting message reactions: {e}")
            return []
    
    async def add_annotation(self, session_id: str, user_id: str, message_id: str, content: str, start_index: Optional[int] = None, end_index: Optional[int] = None) -> Optional[Annotation]:
        """Add an annotation to a message.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
            message_id: The message ID.
            content: The annotation content.
            start_index: The start index for highlighting.
            end_index: The end index for highlighting.
            
        Returns:
            The created annotation, or None if creation failed.
        """
        try:
            # Get the session
            session = await self.storage.get_session(session_id)
            
            if not session:
                return None
            
            # Check if annotations are allowed
            if not session.settings.allow_annotations:
                return None
            
            # Get the participant
            participant = await self.storage.get_participant(session_id, user_id)
            
            if not participant:
                return None
            
            # Create the annotation
            annotation = Annotation(
                session_id=session_id,
                user_id=user_id,
                message_id=message_id,
                content=content,
                start_index=start_index,
                end_index=end_index,
            )
            
            # Save the annotation
            success = await self.storage.add_annotation(annotation)
            
            if not success:
                return None
            
            return annotation
        
        except Exception as e:
            logger.error(f"Error adding annotation: {e}")
            return None
    
    async def edit_annotation(self, annotation_id: str, user_id: str, content: str) -> Optional[Annotation]:
        """Edit an annotation.
        
        Args:
            annotation_id: The annotation ID.
            user_id: The user ID.
            content: The new annotation content.
            
        Returns:
            The updated annotation, or None if update failed.
        """
        try:
            # Get the annotation
            annotation = await self.storage.get_annotation(annotation_id)
            
            if not annotation:
                return None
            
            # Check if the user is the annotation author
            if annotation.user_id != user_id:
                return None
            
            # Edit the annotation
            annotation.edit(content)
            
            # Save the annotation
            success = await self.storage.update_annotation(annotation)
            
            if not success:
                return None
            
            return annotation
        
        except Exception as e:
            logger.error(f"Error editing annotation: {e}")
            return None
    
    async def delete_annotation(self, annotation_id: str, user_id: str) -> bool:
        """Delete an annotation.
        
        Args:
            annotation_id: The annotation ID.
            user_id: The user ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Get the annotation
            annotation = await self.storage.get_annotation(annotation_id)
            
            if not annotation:
                return False
            
            # Check if the user is the annotation author
            if annotation.user_id != user_id:
                # Check if the user is a moderator or owner
                participant = await self.storage.get_participant(annotation.session_id, user_id)
                
                if not participant or participant.role not in [ParticipantRole.OWNER, ParticipantRole.MODERATOR]:
                    return False
            
            # Delete the annotation
            annotation.delete()
            
            # Save the annotation
            return await self.storage.update_annotation(annotation)
        
        except Exception as e:
            logger.error(f"Error deleting annotation: {e}")
            return False
    
    async def get_message_annotations(self, message_id: str) -> List[Annotation]:
        """Get annotations for a message.
        
        Args:
            message_id: The message ID.
            
        Returns:
            A list of annotations.
        """
        try:
            return await self.storage.get_message_annotations(message_id)
        
        except Exception as e:
            logger.error(f"Error getting message annotations: {e}")
            return []
    
    async def start_recording(self, session_id: str, user_id: str, title: str, description: str = "") -> Optional[SessionRecording]:
        """Start recording a session.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
            title: The recording title.
            description: The recording description.
            
        Returns:
            The created recording, or None if creation failed.
        """
        try:
            # Get the session
            session = await self.storage.get_session(session_id)
            
            if not session:
                return None
            
            # Check if the user is the owner
            if session.owner_id != user_id:
                # Check if the user is a moderator
                participant = await self.storage.get_participant(session_id, user_id)
                
                if not participant or participant.role != ParticipantRole.MODERATOR:
                    return None
            
            # Create the recording
            recording = SessionRecording(
                session_id=session_id,
                title=title,
                description=description,
                start_time=datetime.datetime.utcnow(),
                visibility=session.visibility,
            )
            
            # Save the recording
            success = await self.storage.create_recording(recording)
            
            if not success:
                return None
            
            return recording
        
        except Exception as e:
            logger.error(f"Error starting recording: {e}")
            return None
    
    async def stop_recording(self, recording_id: str, user_id: str) -> Optional[SessionRecording]:
        """Stop recording a session.
        
        Args:
            recording_id: The recording ID.
            user_id: The user ID.
            
        Returns:
            The updated recording, or None if update failed.
        """
        try:
            # Get the recording
            recording = await self.storage.get_recording(recording_id)
            
            if not recording:
                return None
            
            # Get the session
            session = await self.storage.get_session(recording.session_id)
            
            if not session:
                return None
            
            # Check if the user is the owner
            if session.owner_id != user_id:
                # Check if the user is a moderator
                participant = await self.storage.get_participant(recording.session_id, user_id)
                
                if not participant or participant.role != ParticipantRole.MODERATOR:
                    return None
            
            # Complete the recording
            recording.complete(datetime.datetime.utcnow())
            
            # Save the recording
            success = await self.storage.update_recording(recording)
            
            if not success:
                return None
            
            return recording
        
        except Exception as e:
            logger.error(f"Error stopping recording: {e}")
            return None
    
    async def update_recording(self, recording_id: str, user_id: str, **kwargs) -> Optional[SessionRecording]:
        """Update a session recording.
        
        Args:
            recording_id: The recording ID.
            user_id: The user ID.
            **kwargs: The fields to update.
            
        Returns:
            The updated recording, or None if update failed.
        """
        try:
            # Get the recording
            recording = await self.storage.get_recording(recording_id)
            
            if not recording:
                return None
            
            # Get the session
            session = await self.storage.get_session(recording.session_id)
            
            if not session:
                return None
            
            # Check if the user is the owner
            if session.owner_id != user_id:
                return None
            
            # Update the recording
            for key, value in kwargs.items():
                if hasattr(recording, key):
                    setattr(recording, key, value)
            
            # Save the recording
            success = await self.storage.update_recording(recording)
            
            if not success:
                return None
            
            return recording
        
        except Exception as e:
            logger.error(f"Error updating recording: {e}")
            return None
    
    async def get_session_recordings(self, session_id: str) -> List[SessionRecording]:
        """Get recordings for a session.
        
        Args:
            session_id: The session ID.
            
        Returns:
            A list of recordings.
        """
        try:
            return await self.storage.get_session_recordings(session_id)
        
        except Exception as e:
            logger.error(f"Error getting session recordings: {e}")
            return []
    
    async def get_public_recordings(self, limit: int = 20, offset: int = 0) -> Tuple[List[SessionRecording], int]:
        """Get public recordings.
        
        Args:
            limit: The maximum number of recordings to return.
            offset: The offset for pagination.
            
        Returns:
            A tuple of (list of recordings, total count).
        """
        try:
            return await self.storage.get_public_recordings(limit, offset)
        
        except Exception as e:
            logger.error(f"Error getting public recordings: {e}")
            return [], 0
    
    async def view_recording(self, recording_id: str) -> bool:
        """Increment a recording's view count.
        
        Args:
            recording_id: The recording ID.
            
        Returns:
            True if the increment was successful, False otherwise.
        """
        try:
            return await self.storage.increment_recording_view_count(recording_id)
        
        except Exception as e:
            logger.error(f"Error viewing recording: {e}")
            return False
    
    def _hash_password(self, password: str) -> str:
        """Hash a password.
        
        Args:
            password: The password to hash.
            
        Returns:
            The hashed password.
        """
        if not password:
            return ""
        
        salt = secrets.token_hex(8)
        hash_obj = hashlib.sha256(f"{password}{salt}".encode())
        return f"{salt}${hash_obj.hexdigest()}"
    
    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a password against a hash.
        
        Args:
            password: The password to verify.
            password_hash: The password hash.
            
        Returns:
            True if the password is correct, False otherwise.
        """
        if not password or not password_hash:
            return False
        
        try:
            salt, hash_value = password_hash.split("$")
            hash_obj = hashlib.sha256(f"{password}{salt}".encode())
            return hash_obj.hexdigest() == hash_value
        
        except Exception:
            return False