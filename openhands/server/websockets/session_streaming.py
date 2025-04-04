"""WebSocket handlers for session streaming."""

import json
import logging
import asyncio
from typing import Dict, List, Set, Any, Optional

from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException
from pydantic import BaseModel

from openhands.collaboration.service import CollaborationService
from openhands.collaboration.storage import CollaborationStorage
from openhands.server.auth_supabase import get_current_user_ws

logger = logging.getLogger(__name__)

# Initialize services
storage = CollaborationStorage()
service = CollaborationService(storage)


class SessionStreamingManager:
    """Manager for session streaming WebSockets."""
    
    def __init__(self):
        """Initialize the session streaming manager."""
        self.active_sessions: Dict[str, Set[WebSocket]] = {}
        self.user_sessions: Dict[str, Set[str]] = {}
        self.session_messages: Dict[str, List[Dict[str, Any]]] = {}
        self.max_messages = 100  # Maximum number of messages to keep per session
    
    async def connect(self, websocket: WebSocket, session_id: str, user_id: str):
        """Connect a WebSocket to a session.
        
        Args:
            websocket: The WebSocket connection.
            session_id: The session ID.
            user_id: The user ID.
        """
        await websocket.accept()
        
        # Add the WebSocket to the session
        if session_id not in self.active_sessions:
            self.active_sessions[session_id] = set()
        self.active_sessions[session_id].add(websocket)
        
        # Add the session to the user's sessions
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = set()
        self.user_sessions[user_id].add(session_id)
        
        # Send the session history
        if session_id in self.session_messages:
            for message in self.session_messages[session_id]:
                await websocket.send_json(message)
        
        # Notify other participants
        await self.broadcast_participant_joined(session_id, user_id)
        
        # Update the participant's online status
        await service.update_participant_status(session_id, user_id, True)
    
    async def disconnect(self, websocket: WebSocket, session_id: str, user_id: str):
        """Disconnect a WebSocket from a session.
        
        Args:
            websocket: The WebSocket connection.
            session_id: The session ID.
            user_id: The user ID.
        """
        # Remove the WebSocket from the session
        if session_id in self.active_sessions:
            self.active_sessions[session_id].discard(websocket)
            
            # Clean up if no more WebSockets in the session
            if not self.active_sessions[session_id]:
                del self.active_sessions[session_id]
                if session_id in self.session_messages:
                    del self.session_messages[session_id]
        
        # Remove the session from the user's sessions
        if user_id in self.user_sessions:
            self.user_sessions[user_id].discard(session_id)
            
            # Clean up if no more sessions for the user
            if not self.user_sessions[user_id]:
                del self.user_sessions[user_id]
        
        # Notify other participants
        await self.broadcast_participant_left(session_id, user_id)
        
        # Update the participant's online status
        await service.update_participant_status(session_id, user_id, False)
    
    async def broadcast_message(self, session_id: str, message: Dict[str, Any]):
        """Broadcast a message to all WebSockets in a session.
        
        Args:
            session_id: The session ID.
            message: The message to broadcast.
        """
        # Add the message to the session history
        if session_id not in self.session_messages:
            self.session_messages[session_id] = []
        
        self.session_messages[session_id].append(message)
        
        # Limit the number of messages
        if len(self.session_messages[session_id]) > self.max_messages:
            self.session_messages[session_id] = self.session_messages[session_id][-self.max_messages:]
        
        # Broadcast the message
        if session_id in self.active_sessions:
            for websocket in self.active_sessions[session_id]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting message: {e}")
    
    async def broadcast_participant_joined(self, session_id: str, user_id: str):
        """Broadcast a participant joined message.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
        """
        # Get the participant
        participant = await storage.get_participant(session_id, user_id)
        
        if not participant:
            return
        
        # Broadcast the message
        await self.broadcast_message(
            session_id,
            {
                "type": "participant_joined",
                "participant": {
                    "id": participant.id,
                    "user_id": participant.user_id,
                    "role": participant.role,
                    "joined_at": participant.joined_at.isoformat(),
                    "last_active_at": participant.last_active_at.isoformat(),
                    "is_online": participant.is_online,
                    "settings": participant.settings.model_dump(),
                },
            },
        )
    
    async def broadcast_participant_left(self, session_id: str, user_id: str):
        """Broadcast a participant left message.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
        """
        # Broadcast the message
        await self.broadcast_message(
            session_id,
            {
                "type": "participant_left",
                "user_id": user_id,
            },
        )
    
    async def broadcast_chat_message(self, session_id: str, message_id: str):
        """Broadcast a chat message.
        
        Args:
            session_id: The session ID.
            message_id: The message ID.
        """
        # Get the message
        message = await storage.get_chat_message(message_id)
        
        if not message:
            return
        
        # Get reactions and annotations
        reactions = await storage.get_message_reactions(message_id)
        annotations = await storage.get_message_annotations(message_id)
        
        # Broadcast the message
        await self.broadcast_message(
            session_id,
            {
                "type": "chat_message",
                "message": {
                    "id": message.id,
                    "user_id": message.user_id,
                    "content": message.content,
                    "created_at": message.created_at.isoformat(),
                    "edited_at": message.edited_at.isoformat() if message.edited_at else None,
                    "parent_id": message.parent_id,
                    "reactions": [
                        {
                            "id": reaction.id,
                            "user_id": reaction.user_id,
                            "emoji": reaction.emoji,
                            "created_at": reaction.created_at.isoformat(),
                        }
                        for reaction in reactions
                    ],
                    "annotations": [
                        {
                            "id": annotation.id,
                            "user_id": annotation.user_id,
                            "content": annotation.content,
                            "created_at": annotation.created_at.isoformat(),
                            "edited_at": annotation.edited_at.isoformat() if annotation.edited_at else None,
                            "start_index": annotation.start_index,
                            "end_index": annotation.end_index,
                        }
                        for annotation in annotations
                        if not annotation.is_deleted
                    ],
                },
            },
        )
    
    async def broadcast_ai_message(self, session_id: str, message: Dict[str, Any]):
        """Broadcast an AI message.
        
        Args:
            session_id: The session ID.
            message: The AI message.
        """
        # Broadcast the message
        await self.broadcast_message(
            session_id,
            {
                "type": "ai_message",
                "message": message,
            },
        )
    
    async def broadcast_cursor_position(self, session_id: str, user_id: str, position: Dict[str, Any]):
        """Broadcast a cursor position update.
        
        Args:
            session_id: The session ID.
            user_id: The user ID.
            position: The cursor position.
        """
        # Broadcast the message
        await self.broadcast_message(
            session_id,
            {
                "type": "cursor_position",
                "user_id": user_id,
                "position": position,
            },
        )


# Create a global instance of the session streaming manager
manager = SessionStreamingManager()


async def handle_session_streaming(websocket: WebSocket, session_id: str):
    """Handle a session streaming WebSocket connection.
    
    Args:
        websocket: The WebSocket connection.
        session_id: The session ID.
    """
    # Authenticate the user
    try:
        user = await get_current_user_ws(websocket)
    except HTTPException:
        await websocket.close(code=1008, reason="Authentication failed")
        return
    
    # Check if the user has access to the session
    try:
        # Get the session
        session = await service.get_session(session_id)
        
        if not session:
            await websocket.close(code=1008, reason="Session not found")
            return
        
        # Join the session if not already a participant
        participant = await storage.get_participant(session_id, user.id)
        
        if not participant:
            participant = await service.join_session(
                session_id=session_id,
                user_id=user.id,
            )
            
            if not participant:
                await websocket.close(code=1008, reason="Failed to join session")
                return
        
        # Connect to the session
        await manager.connect(websocket, session_id, user.id)
        
        # Handle messages
        try:
            while True:
                message = await websocket.receive_json()
                
                # Handle different message types
                message_type = message.get("type")
                
                if message_type == "chat_message":
                    # Add a chat message
                    content = message.get("content")
                    parent_id = message.get("parent_id")
                    
                    if content:
                        chat_message = await service.add_chat_message(
                            session_id=session_id,
                            user_id=user.id,
                            content=content,
                            parent_id=parent_id,
                        )
                        
                        if chat_message:
                            await manager.broadcast_chat_message(session_id, chat_message.id)
                
                elif message_type == "cursor_position":
                    # Update cursor position
                    position = message.get("position")
                    
                    if position:
                        await manager.broadcast_cursor_position(session_id, user.id, position)
                
                elif message_type == "ping":
                    # Respond to ping
                    await websocket.send_json({"type": "pong"})
        
        except WebSocketDisconnect:
            # Disconnect from the session
            await manager.disconnect(websocket, session_id, user.id)
        
        except Exception as e:
            logger.error(f"Error handling session streaming: {e}")
            await manager.disconnect(websocket, session_id, user.id)
    
    except Exception as e:
        logger.error(f"Error setting up session streaming: {e}")
        await websocket.close(code=1011, reason="Internal server error")