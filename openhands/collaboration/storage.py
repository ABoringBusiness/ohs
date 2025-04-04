"""Storage service for the Collaborative Sessions feature."""

import json
import logging
import datetime
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
)
from openhands.storage.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


class CollaborationStorage:
    """Storage service for collaborative sessions."""
    
    def __init__(self, namespace: str = "collaboration"):
        """Initialize the collaboration storage service.
        
        Args:
            namespace: The namespace for storing collaboration data.
        """
        self.namespace = namespace
        self.supabase = get_supabase_client()
    
    async def create_session(self, session: Session) -> bool:
        """Create a new collaborative session.
        
        Args:
            session: The session to create.
            
        Returns:
            True if the creation was successful, False otherwise.
        """
        try:
            # Convert the session to JSON
            session_data = session.model_dump_json()
            
            # Save the session to Supabase
            self.supabase.table("collaboration_sessions").insert({
                "id": session.id,
                "namespace": self.namespace,
                "content": session_data,
            }).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            return False
    
    async def get_session(self, session_id: str) -> Optional[Session]:
        """Get a collaborative session.
        
        Args:
            session_id: The session ID.
            
        Returns:
            The session, or None if it doesn't exist.
        """
        try:
            # Get the session from Supabase
            response = self.supabase.table("collaboration_sessions").select("*").eq("id", session_id).eq("namespace", self.namespace).execute()
            
            if response.data and len(response.data) > 0:
                # Parse the session from JSON
                session_data = json.loads(response.data[0]["content"])
                return Session.model_validate(session_data)
            
            return None
        
        except Exception as e:
            logger.error(f"Error getting session: {e}")
            return None
    
    async def update_session(self, session: Session) -> bool:
        """Update a collaborative session.
        
        Args:
            session: The session to update.
            
        Returns:
            True if the update was successful, False otherwise.
        """
        try:
            # Convert the session to JSON
            session_data = session.model_dump_json()
            
            # Update the session in Supabase
            self.supabase.table("collaboration_sessions").update({
                "content": session_data,
            }).eq("id", session.id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error updating session: {e}")
            return False
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a collaborative session.
        
        Args:
            session_id: The session ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Delete the session from Supabase
            self.supabase.table("collaboration_sessions").delete().eq("id", session_id).eq("namespace", self.namespace).execute()
            
            # Delete all related data
            await self._delete_session_participants(session_id)
            await self._delete_session_invitations(session_id)
            await self._delete_session_chat_messages(session_id)
            await self._delete_session_reactions(session_id)
            await self._delete_session_annotations(session_id)
            await self._delete_session_recordings(session_id)
            
            return True
        
        except Exception as e:
            logger.error(f"Error deleting session: {e}")
            return False
    
    async def get_sessions_by_owner(self, owner_id: str) -> List[Session]:
        """Get all sessions owned by a user.
        
        Args:
            owner_id: The owner ID.
            
        Returns:
            A list of sessions.
        """
        try:
            # Get all sessions from Supabase
            response = self.supabase.table("collaboration_sessions").select("*").eq("namespace", self.namespace).execute()
            
            if not response.data:
                return []
            
            # Parse the sessions from JSON and filter by owner
            sessions = []
            for item in response.data:
                try:
                    session_data = json.loads(item["content"])
                    session = Session.model_validate(session_data)
                    if session.owner_id == owner_id:
                        sessions.append(session)
                except Exception as e:
                    logger.error(f"Error parsing session: {e}")
            
            return sessions
        
        except Exception as e:
            logger.error(f"Error getting sessions by owner: {e}")
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
            # Get all sessions from Supabase
            response = self.supabase.table("collaboration_sessions").select("*").eq("namespace", self.namespace).execute()
            
            if not response.data:
                return [], 0
            
            # Parse the sessions from JSON and filter by visibility
            public_sessions = []
            for item in response.data:
                try:
                    session_data = json.loads(item["content"])
                    session = Session.model_validate(session_data)
                    if session.visibility == SessionVisibility.PUBLIC and session.is_active:
                        public_sessions.append(session)
                except Exception as e:
                    logger.error(f"Error parsing session: {e}")
            
            # Sort by view count and creation time
            public_sessions.sort(key=lambda s: (s.view_count, s.created_at), reverse=True)
            
            # Apply pagination
            paginated_sessions = public_sessions[offset:offset + limit]
            
            return paginated_sessions, len(public_sessions)
        
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
            # Get all sessions from Supabase
            response = self.supabase.table("collaboration_sessions").select("*").eq("namespace", self.namespace).execute()
            
            if not response.data:
                return [], 0
            
            # Parse the sessions from JSON and filter
            filtered_sessions = []
            for item in response.data:
                try:
                    session_data = json.loads(item["content"])
                    session = Session.model_validate(session_data)
                    
                    # Only include public, active sessions
                    if session.visibility != SessionVisibility.PUBLIC or not session.is_active:
                        continue
                    
                    # Apply query filter
                    if query:
                        query_lower = query.lower()
                        if (query_lower not in session.title.lower() and 
                            query_lower not in session.description.lower() and
                            not any(query_lower in tag.lower() for tag in session.tags)):
                            continue
                    
                    # Apply tags filter
                    if tags and not any(tag in session.tags for tag in tags):
                        continue
                    
                    # Apply category filter
                    if category and session.category != category:
                        continue
                    
                    filtered_sessions.append(session)
                except Exception as e:
                    logger.error(f"Error parsing session: {e}")
            
            # Sort by view count and creation time
            filtered_sessions.sort(key=lambda s: (s.view_count, s.created_at), reverse=True)
            
            # Apply pagination
            paginated_sessions = filtered_sessions[offset:offset + limit]
            
            return paginated_sessions, len(filtered_sessions)
        
        except Exception as e:
            logger.error(f"Error searching sessions: {e}")
            return [], 0
    
    async def increment_session_view_count(self, session_id: str) -> bool:
        """Increment a session's view count.
        
        Args:
            session_id: The session ID.
            
        Returns:
            True if the increment was successful, False otherwise.
        """
        try:
            # Get the session
            session = await self.get_session(session_id)
            
            if not session:
                return False
            
            # Increment the view count
            session.view_count += 1
            
            # Update the session
            return await self.update_session(session)
        
        except Exception as e:
            logger.error(f"Error incrementing session view count: {e}")
            return False
    
    async def add_participant(self, participant: SessionParticipant) -> bool:
        """Add a participant to a session.
        
        Args:
            participant: The participant to add.
            
        Returns:
            True if the addition was successful, False otherwise.
        """
        try:
            # Convert the participant to JSON
            participant_data = participant.model_dump_json()
            
            # Save the participant to Supabase
            self.supabase.table("collaboration_participants").insert({
                "id": participant.id,
                "session_id": participant.session_id,
                "user_id": participant.user_id,
                "namespace": self.namespace,
                "content": participant_data,
            }).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error adding participant: {e}")
            return False
    
    async def get_participant(self, session_id: str, user_id: str) -> Optional[SessionParticipant]:
        """Get a participant in a session.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
            
        Returns:
            The participant, or None if they don't exist.
        """
        try:
            # Get the participant from Supabase
            response = self.supabase.table("collaboration_participants").select("*").eq("session_id", session_id).eq("user_id", user_id).eq("namespace", self.namespace).execute()
            
            if response.data and len(response.data) > 0:
                # Parse the participant from JSON
                participant_data = json.loads(response.data[0]["content"])
                return SessionParticipant.model_validate(participant_data)
            
            return None
        
        except Exception as e:
            logger.error(f"Error getting participant: {e}")
            return None
    
    async def update_participant(self, participant: SessionParticipant) -> bool:
        """Update a participant in a session.
        
        Args:
            participant: The participant to update.
            
        Returns:
            True if the update was successful, False otherwise.
        """
        try:
            # Convert the participant to JSON
            participant_data = participant.model_dump_json()
            
            # Update the participant in Supabase
            self.supabase.table("collaboration_participants").update({
                "content": participant_data,
            }).eq("id", participant.id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error updating participant: {e}")
            return False
    
    async def remove_participant(self, session_id: str, user_id: str) -> bool:
        """Remove a participant from a session.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
            
        Returns:
            True if the removal was successful, False otherwise.
        """
        try:
            # Delete the participant from Supabase
            self.supabase.table("collaboration_participants").delete().eq("session_id", session_id).eq("user_id", user_id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error removing participant: {e}")
            return False
    
    async def get_session_participants(self, session_id: str) -> List[SessionParticipant]:
        """Get all participants in a session.
        
        Args:
            session_id: The session ID.
            
        Returns:
            A list of participants.
        """
        try:
            # Get the participants from Supabase
            response = self.supabase.table("collaboration_participants").select("*").eq("session_id", session_id).eq("namespace", self.namespace).execute()
            
            if not response.data:
                return []
            
            # Parse the participants from JSON
            participants = []
            for item in response.data:
                try:
                    participant_data = json.loads(item["content"])
                    participant = SessionParticipant.model_validate(participant_data)
                    participants.append(participant)
                except Exception as e:
                    logger.error(f"Error parsing participant: {e}")
            
            return participants
        
        except Exception as e:
            logger.error(f"Error getting session participants: {e}")
            return []
    
    async def create_invitation(self, invitation: SessionInvitation) -> bool:
        """Create a session invitation.
        
        Args:
            invitation: The invitation to create.
            
        Returns:
            True if the creation was successful, False otherwise.
        """
        try:
            # Convert the invitation to JSON
            invitation_data = invitation.model_dump_json()
            
            # Save the invitation to Supabase
            self.supabase.table("collaboration_invitations").insert({
                "id": invitation.id,
                "session_id": invitation.session_id,
                "token": invitation.token,
                "namespace": self.namespace,
                "content": invitation_data,
            }).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error creating invitation: {e}")
            return False
    
    async def get_invitation_by_token(self, token: str) -> Optional[SessionInvitation]:
        """Get a session invitation by token.
        
        Args:
            token: The invitation token.
            
        Returns:
            The invitation, or None if it doesn't exist.
        """
        try:
            # Get the invitation from Supabase
            response = self.supabase.table("collaboration_invitations").select("*").eq("token", token).eq("namespace", self.namespace).execute()
            
            if response.data and len(response.data) > 0:
                # Parse the invitation from JSON
                invitation_data = json.loads(response.data[0]["content"])
                return SessionInvitation.model_validate(invitation_data)
            
            return None
        
        except Exception as e:
            logger.error(f"Error getting invitation by token: {e}")
            return None
    
    async def get_invitations_by_email(self, email: str) -> List[SessionInvitation]:
        """Get session invitations by email.
        
        Args:
            email: The email address.
            
        Returns:
            A list of invitations.
        """
        try:
            # Get all invitations from Supabase
            response = self.supabase.table("collaboration_invitations").select("*").eq("namespace", self.namespace).execute()
            
            if not response.data:
                return []
            
            # Parse the invitations from JSON and filter by email
            invitations = []
            for item in response.data:
                try:
                    invitation_data = json.loads(item["content"])
                    invitation = SessionInvitation.model_validate(invitation_data)
                    if invitation.email == email and invitation.is_valid():
                        invitations.append(invitation)
                except Exception as e:
                    logger.error(f"Error parsing invitation: {e}")
            
            return invitations
        
        except Exception as e:
            logger.error(f"Error getting invitations by email: {e}")
            return []
    
    async def get_invitations_by_user(self, user_id: str) -> List[SessionInvitation]:
        """Get session invitations by user.
        
        Args:
            user_id: The user ID.
            
        Returns:
            A list of invitations.
        """
        try:
            # Get all invitations from Supabase
            response = self.supabase.table("collaboration_invitations").select("*").eq("namespace", self.namespace).execute()
            
            if not response.data:
                return []
            
            # Parse the invitations from JSON and filter by user
            invitations = []
            for item in response.data:
                try:
                    invitation_data = json.loads(item["content"])
                    invitation = SessionInvitation.model_validate(invitation_data)
                    if invitation.user_id == user_id and invitation.is_valid():
                        invitations.append(invitation)
                except Exception as e:
                    logger.error(f"Error parsing invitation: {e}")
            
            return invitations
        
        except Exception as e:
            logger.error(f"Error getting invitations by user: {e}")
            return []
    
    async def update_invitation(self, invitation: SessionInvitation) -> bool:
        """Update a session invitation.
        
        Args:
            invitation: The invitation to update.
            
        Returns:
            True if the update was successful, False otherwise.
        """
        try:
            # Convert the invitation to JSON
            invitation_data = invitation.model_dump_json()
            
            # Update the invitation in Supabase
            self.supabase.table("collaboration_invitations").update({
                "content": invitation_data,
            }).eq("id", invitation.id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error updating invitation: {e}")
            return False
    
    async def delete_invitation(self, invitation_id: str) -> bool:
        """Delete a session invitation.
        
        Args:
            invitation_id: The invitation ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Delete the invitation from Supabase
            self.supabase.table("collaboration_invitations").delete().eq("id", invitation_id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error deleting invitation: {e}")
            return False
    
    async def add_chat_message(self, message: ChatMessage) -> bool:
        """Add a chat message to a session.
        
        Args:
            message: The message to add.
            
        Returns:
            True if the addition was successful, False otherwise.
        """
        try:
            # Convert the message to JSON
            message_data = message.model_dump_json()
            
            # Save the message to Supabase
            self.supabase.table("collaboration_chat_messages").insert({
                "id": message.id,
                "session_id": message.session_id,
                "user_id": message.user_id,
                "namespace": self.namespace,
                "content": message_data,
            }).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error adding chat message: {e}")
            return False
    
    async def get_chat_message(self, message_id: str) -> Optional[ChatMessage]:
        """Get a chat message.
        
        Args:
            message_id: The message ID.
            
        Returns:
            The message, or None if it doesn't exist.
        """
        try:
            # Get the message from Supabase
            response = self.supabase.table("collaboration_chat_messages").select("*").eq("id", message_id).eq("namespace", self.namespace).execute()
            
            if response.data and len(response.data) > 0:
                # Parse the message from JSON
                message_data = json.loads(response.data[0]["content"])
                return ChatMessage.model_validate(message_data)
            
            return None
        
        except Exception as e:
            logger.error(f"Error getting chat message: {e}")
            return None
    
    async def update_chat_message(self, message: ChatMessage) -> bool:
        """Update a chat message.
        
        Args:
            message: The message to update.
            
        Returns:
            True if the update was successful, False otherwise.
        """
        try:
            # Convert the message to JSON
            message_data = message.model_dump_json()
            
            # Update the message in Supabase
            self.supabase.table("collaboration_chat_messages").update({
                "content": message_data,
            }).eq("id", message.id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error updating chat message: {e}")
            return False
    
    async def get_session_chat_messages(self, session_id: str, limit: int = 100, before_id: Optional[str] = None) -> List[ChatMessage]:
        """Get chat messages for a session.
        
        Args:
            session_id: The session ID.
            limit: The maximum number of messages to return.
            before_id: Only return messages before this ID.
            
        Returns:
            A list of chat messages.
        """
        try:
            # Get the messages from Supabase
            response = self.supabase.table("collaboration_chat_messages").select("*").eq("session_id", session_id).eq("namespace", self.namespace).execute()
            
            if not response.data:
                return []
            
            # Parse the messages from JSON
            messages = []
            for item in response.data:
                try:
                    message_data = json.loads(item["content"])
                    message = ChatMessage.model_validate(message_data)
                    if not message.is_deleted:
                        messages.append(message)
                except Exception as e:
                    logger.error(f"Error parsing chat message: {e}")
            
            # Sort by creation time
            messages.sort(key=lambda m: m.created_at, reverse=True)
            
            # Apply before_id filter
            if before_id:
                before_index = next((i for i, m in enumerate(messages) if m.id == before_id), None)
                if before_index is not None:
                    messages = messages[before_index + 1:]
            
            # Apply limit
            messages = messages[:limit]
            
            # Reverse back to chronological order
            messages.reverse()
            
            return messages
        
        except Exception as e:
            logger.error(f"Error getting session chat messages: {e}")
            return []
    
    async def add_reaction(self, reaction: Reaction) -> bool:
        """Add a reaction to a message.
        
        Args:
            reaction: The reaction to add.
            
        Returns:
            True if the addition was successful, False otherwise.
        """
        try:
            # Convert the reaction to JSON
            reaction_data = reaction.model_dump_json()
            
            # Save the reaction to Supabase
            self.supabase.table("collaboration_reactions").insert({
                "id": reaction.id,
                "session_id": reaction.session_id,
                "user_id": reaction.user_id,
                "message_id": reaction.message_id,
                "namespace": self.namespace,
                "content": reaction_data,
            }).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error adding reaction: {e}")
            return False
    
    async def remove_reaction(self, reaction_id: str) -> bool:
        """Remove a reaction from a message.
        
        Args:
            reaction_id: The reaction ID.
            
        Returns:
            True if the removal was successful, False otherwise.
        """
        try:
            # Delete the reaction from Supabase
            self.supabase.table("collaboration_reactions").delete().eq("id", reaction_id).eq("namespace", self.namespace).execute()
            
            return True
        
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
            # Get the reactions from Supabase
            response = self.supabase.table("collaboration_reactions").select("*").eq("message_id", message_id).eq("namespace", self.namespace).execute()
            
            if not response.data:
                return []
            
            # Parse the reactions from JSON
            reactions = []
            for item in response.data:
                try:
                    reaction_data = json.loads(item["content"])
                    reaction = Reaction.model_validate(reaction_data)
                    reactions.append(reaction)
                except Exception as e:
                    logger.error(f"Error parsing reaction: {e}")
            
            return reactions
        
        except Exception as e:
            logger.error(f"Error getting message reactions: {e}")
            return []
    
    async def add_annotation(self, annotation: Annotation) -> bool:
        """Add an annotation to a message.
        
        Args:
            annotation: The annotation to add.
            
        Returns:
            True if the addition was successful, False otherwise.
        """
        try:
            # Convert the annotation to JSON
            annotation_data = annotation.model_dump_json()
            
            # Save the annotation to Supabase
            self.supabase.table("collaboration_annotations").insert({
                "id": annotation.id,
                "session_id": annotation.session_id,
                "user_id": annotation.user_id,
                "message_id": annotation.message_id,
                "namespace": self.namespace,
                "content": annotation_data,
            }).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error adding annotation: {e}")
            return False
    
    async def get_annotation(self, annotation_id: str) -> Optional[Annotation]:
        """Get an annotation.
        
        Args:
            annotation_id: The annotation ID.
            
        Returns:
            The annotation, or None if it doesn't exist.
        """
        try:
            # Get the annotation from Supabase
            response = self.supabase.table("collaboration_annotations").select("*").eq("id", annotation_id).eq("namespace", self.namespace).execute()
            
            if response.data and len(response.data) > 0:
                # Parse the annotation from JSON
                annotation_data = json.loads(response.data[0]["content"])
                return Annotation.model_validate(annotation_data)
            
            return None
        
        except Exception as e:
            logger.error(f"Error getting annotation: {e}")
            return None
    
    async def update_annotation(self, annotation: Annotation) -> bool:
        """Update an annotation.
        
        Args:
            annotation: The annotation to update.
            
        Returns:
            True if the update was successful, False otherwise.
        """
        try:
            # Convert the annotation to JSON
            annotation_data = annotation.model_dump_json()
            
            # Update the annotation in Supabase
            self.supabase.table("collaboration_annotations").update({
                "content": annotation_data,
            }).eq("id", annotation.id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error updating annotation: {e}")
            return False
    
    async def get_message_annotations(self, message_id: str) -> List[Annotation]:
        """Get annotations for a message.
        
        Args:
            message_id: The message ID.
            
        Returns:
            A list of annotations.
        """
        try:
            # Get the annotations from Supabase
            response = self.supabase.table("collaboration_annotations").select("*").eq("message_id", message_id).eq("namespace", self.namespace).execute()
            
            if not response.data:
                return []
            
            # Parse the annotations from JSON
            annotations = []
            for item in response.data:
                try:
                    annotation_data = json.loads(item["content"])
                    annotation = Annotation.model_validate(annotation_data)
                    if not annotation.is_deleted:
                        annotations.append(annotation)
                except Exception as e:
                    logger.error(f"Error parsing annotation: {e}")
            
            return annotations
        
        except Exception as e:
            logger.error(f"Error getting message annotations: {e}")
            return []
    
    async def create_recording(self, recording: SessionRecording) -> bool:
        """Create a session recording.
        
        Args:
            recording: The recording to create.
            
        Returns:
            True if the creation was successful, False otherwise.
        """
        try:
            # Convert the recording to JSON
            recording_data = recording.model_dump_json()
            
            # Save the recording to Supabase
            self.supabase.table("collaboration_recordings").insert({
                "id": recording.id,
                "session_id": recording.session_id,
                "namespace": self.namespace,
                "content": recording_data,
            }).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error creating recording: {e}")
            return False
    
    async def get_recording(self, recording_id: str) -> Optional[SessionRecording]:
        """Get a session recording.
        
        Args:
            recording_id: The recording ID.
            
        Returns:
            The recording, or None if it doesn't exist.
        """
        try:
            # Get the recording from Supabase
            response = self.supabase.table("collaboration_recordings").select("*").eq("id", recording_id).eq("namespace", self.namespace).execute()
            
            if response.data and len(response.data) > 0:
                # Parse the recording from JSON
                recording_data = json.loads(response.data[0]["content"])
                return SessionRecording.model_validate(recording_data)
            
            return None
        
        except Exception as e:
            logger.error(f"Error getting recording: {e}")
            return None
    
    async def update_recording(self, recording: SessionRecording) -> bool:
        """Update a session recording.
        
        Args:
            recording: The recording to update.
            
        Returns:
            True if the update was successful, False otherwise.
        """
        try:
            # Convert the recording to JSON
            recording_data = recording.model_dump_json()
            
            # Update the recording in Supabase
            self.supabase.table("collaboration_recordings").update({
                "content": recording_data,
            }).eq("id", recording.id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error updating recording: {e}")
            return False
    
    async def get_session_recordings(self, session_id: str) -> List[SessionRecording]:
        """Get recordings for a session.
        
        Args:
            session_id: The session ID.
            
        Returns:
            A list of recordings.
        """
        try:
            # Get the recordings from Supabase
            response = self.supabase.table("collaboration_recordings").select("*").eq("session_id", session_id).eq("namespace", self.namespace).execute()
            
            if not response.data:
                return []
            
            # Parse the recordings from JSON
            recordings = []
            for item in response.data:
                try:
                    recording_data = json.loads(item["content"])
                    recording = SessionRecording.model_validate(recording_data)
                    recordings.append(recording)
                except Exception as e:
                    logger.error(f"Error parsing recording: {e}")
            
            # Sort by creation time
            recordings.sort(key=lambda r: r.created_at, reverse=True)
            
            return recordings
        
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
            # Get all recordings from Supabase
            response = self.supabase.table("collaboration_recordings").select("*").eq("namespace", self.namespace).execute()
            
            if not response.data:
                return [], 0
            
            # Parse the recordings from JSON and filter by visibility
            public_recordings = []
            for item in response.data:
                try:
                    recording_data = json.loads(item["content"])
                    recording = SessionRecording.model_validate(recording_data)
                    if recording.visibility == SessionVisibility.PUBLIC and recording.is_complete:
                        public_recordings.append(recording)
                except Exception as e:
                    logger.error(f"Error parsing recording: {e}")
            
            # Sort by view count and creation time
            public_recordings.sort(key=lambda r: (r.view_count, r.created_at), reverse=True)
            
            # Apply pagination
            paginated_recordings = public_recordings[offset:offset + limit]
            
            return paginated_recordings, len(public_recordings)
        
        except Exception as e:
            logger.error(f"Error getting public recordings: {e}")
            return [], 0
    
    async def increment_recording_view_count(self, recording_id: str) -> bool:
        """Increment a recording's view count.
        
        Args:
            recording_id: The recording ID.
            
        Returns:
            True if the increment was successful, False otherwise.
        """
        try:
            # Get the recording
            recording = await self.get_recording(recording_id)
            
            if not recording:
                return False
            
            # Increment the view count
            recording.view_count += 1
            
            # Update the recording
            return await self.update_recording(recording)
        
        except Exception as e:
            logger.error(f"Error incrementing recording view count: {e}")
            return False
    
    async def _delete_session_participants(self, session_id: str) -> bool:
        """Delete all participants for a session.
        
        Args:
            session_id: The session ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Delete the participants from Supabase
            self.supabase.table("collaboration_participants").delete().eq("session_id", session_id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error deleting session participants: {e}")
            return False
    
    async def _delete_session_invitations(self, session_id: str) -> bool:
        """Delete all invitations for a session.
        
        Args:
            session_id: The session ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Delete the invitations from Supabase
            self.supabase.table("collaboration_invitations").delete().eq("session_id", session_id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error deleting session invitations: {e}")
            return False
    
    async def _delete_session_chat_messages(self, session_id: str) -> bool:
        """Delete all chat messages for a session.
        
        Args:
            session_id: The session ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Delete the chat messages from Supabase
            self.supabase.table("collaboration_chat_messages").delete().eq("session_id", session_id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error deleting session chat messages: {e}")
            return False
    
    async def _delete_session_reactions(self, session_id: str) -> bool:
        """Delete all reactions for a session.
        
        Args:
            session_id: The session ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Delete the reactions from Supabase
            self.supabase.table("collaboration_reactions").delete().eq("session_id", session_id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error deleting session reactions: {e}")
            return False
    
    async def _delete_session_annotations(self, session_id: str) -> bool:
        """Delete all annotations for a session.
        
        Args:
            session_id: The session ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Delete the annotations from Supabase
            self.supabase.table("collaboration_annotations").delete().eq("session_id", session_id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error deleting session annotations: {e}")
            return False
    
    async def _delete_session_recordings(self, session_id: str) -> bool:
        """Delete all recordings for a session.
        
        Args:
            session_id: The session ID.
            
        Returns:
            True if the deletion was successful, False otherwise.
        """
        try:
            # Delete the recordings from Supabase
            self.supabase.table("collaboration_recordings").delete().eq("session_id", session_id).eq("namespace", self.namespace).execute()
            
            return True
        
        except Exception as e:
            logger.error(f"Error deleting session recordings: {e}")
            return False