from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime

from openhands.core.config.app_config import AppConfig
from openhands.core.logger import openhands_logger as logger
from openhands.storage.conversation.conversation_store import ConversationStore
from openhands.storage.data_models.conversation_metadata import ConversationMetadata
from openhands.storage.data_models.conversation_metadata_result_set import ConversationMetadataResultSet
from openhands.storage.supabase import get_supabase_client
from openhands.utils.search_utils import offset_to_page_id, page_id_to_offset
from openhands.utils.async_utils import call_sync_from_async


@dataclass
class SupabaseConversationStore(ConversationStore):
    user_id: str | None = None
    
    async def save_metadata(self, metadata: ConversationMetadata) -> None:
        client = get_supabase_client()
        data = {
            "id": metadata.conversation_id,
            "github_user_id": self.user_id or metadata.github_user_id,
            "selected_repository": metadata.selected_repository,
            "selected_branch": metadata.selected_branch,
            "title": metadata.title,
            "last_updated_at": metadata.last_updated_at.isoformat() if metadata.last_updated_at else None,
            "created_at": metadata.created_at.isoformat() if metadata.created_at else None
        }
        
        # Upsert to handle both insert and update
        await call_sync_from_async(
            lambda: client.table("conversations").upsert(data).execute()
        )
    
    async def get_metadata(self, conversation_id: str) -> ConversationMetadata:
        client = get_supabase_client()
        query = client.table("conversations").select("*").eq("id", conversation_id)
        
        if self.user_id:
            query = query.eq("github_user_id", self.user_id)
            
        response = await call_sync_from_async(lambda: query.execute())
        
        if not response.data:
            raise FileNotFoundError(f"Conversation {conversation_id} not found")
        
        data = response.data[0]
        return ConversationMetadata(
            conversation_id=data["id"],
            github_user_id=data["github_user_id"],
            selected_repository=data["selected_repository"],
            selected_branch=data["selected_branch"],
            title=data["title"],
            last_updated_at=datetime.fromisoformat(data["last_updated_at"]) if data["last_updated_at"] else None,
            created_at=datetime.fromisoformat(data["created_at"])
        )
    
    async def delete_metadata(self, conversation_id: str) -> None:
        client = get_supabase_client()
        query = client.table("conversations").delete().eq("id", conversation_id)
        
        if self.user_id:
            query = query.eq("github_user_id", self.user_id)
            
        await call_sync_from_async(lambda: query.execute())
    
    async def exists(self, conversation_id: str) -> bool:
        try:
            await self.get_metadata(conversation_id)
            return True
        except FileNotFoundError:
            return False
    
    async def search(
        self,
        page_id: str | None = None,
        limit: int = 20,
    ) -> ConversationMetadataResultSet:
        client = get_supabase_client()
        query = client.table("conversations").select("*")
        
        if self.user_id:
            query = query.eq("github_user_id", self.user_id)
        
        # Add ordering
        query = query.order("created_at", desc=True)
        
        # Add pagination
        start = page_id_to_offset(page_id)
        query = query.range(start, start + limit - 1)
        
        response = await call_sync_from_async(lambda: query.execute())
        
        conversations = []
        for data in response.data:
            conversations.append(
                ConversationMetadata(
                    conversation_id=data["id"],
                    github_user_id=data["github_user_id"],
                    selected_repository=data["selected_repository"],
                    selected_branch=data["selected_branch"],
                    title=data["title"],
                    last_updated_at=datetime.fromisoformat(data["last_updated_at"]) if data["last_updated_at"] else None,
                    created_at=datetime.fromisoformat(data["created_at"])
                )
            )
        
        # Calculate next page ID
        count_query = client.table("conversations").select("count", count="exact")
        if self.user_id:
            count_query = count_query.eq("github_user_id", self.user_id)
        
        count_response = await call_sync_from_async(lambda: count_query.execute())
        total_count = count_response.count
        
        next_page_id = offset_to_page_id(start + limit, start + limit < total_count)
        
        return ConversationMetadataResultSet(conversations, next_page_id)
    
    @classmethod
    async def get_instance(
        cls, config: AppConfig, user_id: str | None
    ) -> SupabaseConversationStore:
        return SupabaseConversationStore(user_id)
