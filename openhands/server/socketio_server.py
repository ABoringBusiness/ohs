"""Socket.io server implementation for real-time updates."""

import asyncio
import json
import logging
from typing import Dict, List, Set, Any, Optional

import socketio
from fastapi import FastAPI

from openhands.server.auth_supabase import User
from openhands.storage.supabase_client import get_supabase_client

# Set up logging
logger = logging.getLogger(__name__)

# Create a Socket.io server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=logger,
    engineio_logger=logger,
)

# Create an ASGI app for the Socket.io server
socket_app = socketio.ASGIApp(sio)

# Store connected users
connected_users: Dict[str, Set[str]] = {}  # user_id -> set of sid
user_rooms: Dict[str, Set[str]] = {}  # user_id -> set of rooms
room_users: Dict[str, Set[str]] = {}  # room -> set of user_ids


@sio.event
async def connect(sid, environ, auth):
    """Handle client connection."""
    logger.info(f"Client connected: {sid}")
    
    # Verify the token
    token = auth.get("token")
    if not token:
        await sio.disconnect(sid)
        return
    
    try:
        # Verify the token with Supabase
        supabase = get_supabase_client()
        user = supabase.auth.get_user(token)
        
        if not user or not user.user:
            logger.warning(f"Invalid token for client {sid}")
            await sio.disconnect(sid)
            return
        
        user_id = user.user.id
        
        # Store the user ID in the session
        await sio.save_session(sid, {"user_id": user_id})
        
        # Add the user to the connected users
        if user_id not in connected_users:
            connected_users[user_id] = set()
        connected_users[user_id].add(sid)
        
        # Initialize user rooms if needed
        if user_id not in user_rooms:
            user_rooms[user_id] = set()
        
        logger.info(f"User {user_id} connected with sid {sid}")
        
        # Notify the user that they are connected
        await sio.emit("connect_success", {"user_id": user_id}, room=sid)
        
    except Exception as e:
        logger.error(f"Error authenticating user: {e}")
        await sio.disconnect(sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnection."""
    try:
        session = await sio.get_session(sid)
        if not session:
            return
        
        user_id = session.get("user_id")
        if not user_id:
            return
        
        # Remove the user from connected users
        if user_id in connected_users:
            connected_users[user_id].discard(sid)
            if not connected_users[user_id]:
                del connected_users[user_id]
        
        # Remove the user from all rooms
        if user_id in user_rooms:
            for room in list(user_rooms[user_id]):
                await leave_room(sid, {"room": room})
        
        logger.info(f"Client disconnected: {sid}, user_id: {user_id}")
    except Exception as e:
        logger.error(f"Error during disconnection: {e}")


@sio.event
async def join_room(sid, data):
    """Join a room."""
    try:
        room = data.get("room")
        if not room:
            return
        
        session = await sio.get_session(sid)
        user_id = session.get("user_id")
        
        # Add the user to the room
        await sio.enter_room(sid, room)
        
        # Update room tracking
        if user_id not in user_rooms:
            user_rooms[user_id] = set()
        user_rooms[user_id].add(room)
        
        if room not in room_users:
            room_users[room] = set()
        room_users[room].add(user_id)
        
        logger.info(f"User {user_id} joined room {room}")
        
        # Notify the room that a user joined
        await sio.emit(
            "user_joined",
            {"user_id": user_id, "room": room},
            room=room,
            skip_sid=sid,
        )
    except Exception as e:
        logger.error(f"Error joining room: {e}")


@sio.event
async def leave_room(sid, data):
    """Leave a room."""
    try:
        room = data.get("room")
        if not room:
            return
        
        session = await sio.get_session(sid)
        user_id = session.get("user_id")
        
        # Remove the user from the room
        await sio.leave_room(sid, room)
        
        # Update room tracking
        if user_id in user_rooms:
            user_rooms[user_id].discard(room)
        
        if room in room_users:
            room_users[room].discard(user_id)
            if not room_users[room]:
                del room_users[room]
        
        logger.info(f"User {user_id} left room {room}")
        
        # Notify the room that a user left
        await sio.emit(
            "user_left",
            {"user_id": user_id, "room": room},
            room=room,
        )
    except Exception as e:
        logger.error(f"Error leaving room: {e}")


@sio.event
async def send_message(sid, data):
    """Send a message to a room."""
    try:
        room = data.get("room")
        message = data.get("message")
        
        if not room or not message:
            return
        
        session = await sio.get_session(sid)
        user_id = session.get("user_id")
        
        # Check if the user is in the room
        if user_id not in user_rooms or room not in user_rooms[user_id]:
            logger.warning(f"User {user_id} tried to send message to room {room} but is not in the room")
            return
        
        # Send the message to the room
        await sio.emit(
            "message",
            {
                "user_id": user_id,
                "room": room,
                "message": message,
                "timestamp": asyncio.get_event_loop().time(),
            },
            room=room,
        )
        
        logger.info(f"User {user_id} sent message to room {room}")
    except Exception as e:
        logger.error(f"Error sending message: {e}")


# Function to broadcast updates to users
async def broadcast_update(event: str, data: Any, room: Optional[str] = None, user_id: Optional[str] = None):
    """
    Broadcast an update to users.
    
    Args:
        event: The event name.
        data: The data to send.
        room: The room to send to. If None, send to all connected users.
        user_id: The user ID to send to. If None, send to all connected users.
    """
    try:
        if room:
            await sio.emit(event, data, room=room)
        elif user_id:
            if user_id in connected_users:
                for sid in connected_users[user_id]:
                    await sio.emit(event, data, room=sid)
        else:
            await sio.emit(event, data)
    except Exception as e:
        logger.error(f"Error broadcasting update: {e}")


def setup_socketio(app: FastAPI):
    """
    Set up Socket.io with the FastAPI app.
    
    Args:
        app: The FastAPI app.
    """
    app.mount("/socket.io", socket_app)
    logger.info("Socket.io server mounted at /socket.io")