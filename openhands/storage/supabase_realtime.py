"""Supabase realtime listener implementation."""

import asyncio
import json
import logging
from typing import Dict, List, Any, Callable, Awaitable

from openhands.storage.supabase_client import get_supabase_client
from openhands.server.socketio_server import broadcast_update

# Set up logging
logger = logging.getLogger(__name__)

# Store active subscriptions
subscriptions: Dict[str, Any] = {}


async def setup_realtime_listeners():
    """Set up realtime listeners for Supabase tables."""
    try:
        supabase = get_supabase_client()
        
        # Listen for changes to the conversations table
        conversations_subscription = supabase.table("conversations").on(
            "INSERT",
            lambda payload: asyncio.create_task(
                handle_conversation_change("INSERT", payload)
            ),
        ).on(
            "UPDATE",
            lambda payload: asyncio.create_task(
                handle_conversation_change("UPDATE", payload)
            ),
        ).on(
            "DELETE",
            lambda payload: asyncio.create_task(
                handle_conversation_change("DELETE", payload)
            ),
        ).subscribe()
        
        subscriptions["conversations"] = conversations_subscription
        
        # Listen for changes to the settings table
        settings_subscription = supabase.table("settings").on(
            "INSERT",
            lambda payload: asyncio.create_task(
                handle_settings_change("INSERT", payload)
            ),
        ).on(
            "UPDATE",
            lambda payload: asyncio.create_task(
                handle_settings_change("UPDATE", payload)
            ),
        ).on(
            "DELETE",
            lambda payload: asyncio.create_task(
                handle_settings_change("DELETE", payload)
            ),
        ).subscribe()
        
        subscriptions["settings"] = settings_subscription
        
        # Listen for changes to the files table
        files_subscription = supabase.table("files").on(
            "INSERT",
            lambda payload: asyncio.create_task(
                handle_files_change("INSERT", payload)
            ),
        ).on(
            "UPDATE",
            lambda payload: asyncio.create_task(
                handle_files_change("UPDATE", payload)
            ),
        ).on(
            "DELETE",
            lambda payload: asyncio.create_task(
                handle_files_change("DELETE", payload)
            ),
        ).subscribe()
        
        subscriptions["files"] = files_subscription
        
        logger.info("Supabase realtime listeners set up successfully")
    except Exception as e:
        logger.error(f"Error setting up realtime listeners: {e}")


async def handle_conversation_change(event_type: str, payload: Dict[str, Any]):
    """
    Handle changes to the conversations table.
    
    Args:
        event_type: The type of event (INSERT, UPDATE, DELETE).
        payload: The payload from Supabase.
    """
    try:
        record = payload.get("new" if event_type != "DELETE" else "old", {})
        conversation_id = record.get("id", "").split("/")[0]
        namespace = record.get("namespace")
        
        if not conversation_id:
            return
        
        # Broadcast the update to the conversation room
        await broadcast_update(
            f"conversation_{event_type.lower()}",
            {
                "conversation_id": conversation_id,
                "namespace": namespace,
                "record": record,
            },
            room=f"conversation_{conversation_id}",
        )
        
        logger.info(f"Broadcast conversation {event_type.lower()} event for {conversation_id}")
    except Exception as e:
        logger.error(f"Error handling conversation change: {e}")


async def handle_settings_change(event_type: str, payload: Dict[str, Any]):
    """
    Handle changes to the settings table.
    
    Args:
        event_type: The type of event (INSERT, UPDATE, DELETE).
        payload: The payload from Supabase.
    """
    try:
        record = payload.get("new" if event_type != "DELETE" else "old", {})
        user_id = record.get("id", "").split("/")[0]
        namespace = record.get("namespace")
        
        if not user_id:
            return
        
        # Broadcast the update to the user
        await broadcast_update(
            f"settings_{event_type.lower()}",
            {
                "user_id": user_id,
                "namespace": namespace,
                "record": record,
            },
            user_id=user_id,
        )
        
        logger.info(f"Broadcast settings {event_type.lower()} event for user {user_id}")
    except Exception as e:
        logger.error(f"Error handling settings change: {e}")


async def handle_files_change(event_type: str, payload: Dict[str, Any]):
    """
    Handle changes to the files table.
    
    Args:
        event_type: The type of event (INSERT, UPDATE, DELETE).
        payload: The payload from Supabase.
    """
    try:
        record = payload.get("new" if event_type != "DELETE" else "old", {})
        file_id = record.get("id", "")
        namespace = record.get("namespace")
        
        if not file_id:
            return
        
        # Extract user ID or conversation ID from the file ID
        parts = file_id.split("/")
        if len(parts) >= 2:
            if parts[0] == "user":
                user_id = parts[1]
                await broadcast_update(
                    f"file_{event_type.lower()}",
                    {
                        "file_id": file_id,
                        "namespace": namespace,
                        "record": record,
                    },
                    user_id=user_id,
                )
                logger.info(f"Broadcast file {event_type.lower()} event for user {user_id}")
            elif parts[0] == "conversation":
                conversation_id = parts[1]
                await broadcast_update(
                    f"file_{event_type.lower()}",
                    {
                        "file_id": file_id,
                        "namespace": namespace,
                        "record": record,
                    },
                    room=f"conversation_{conversation_id}",
                )
                logger.info(f"Broadcast file {event_type.lower()} event for conversation {conversation_id}")
    except Exception as e:
        logger.error(f"Error handling files change: {e}")


async def cleanup_realtime_listeners():
    """Clean up realtime listeners."""
    try:
        for name, subscription in subscriptions.items():
            subscription.unsubscribe()
            logger.info(f"Unsubscribed from {name} table")
        
        subscriptions.clear()
        logger.info("Cleaned up all realtime listeners")
    except Exception as e:
        logger.error(f"Error cleaning up realtime listeners: {e}")