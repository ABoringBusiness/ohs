from __future__ import annotations

import json
from dataclasses import dataclass

from openhands.core.config.app_config import AppConfig
from openhands.server.settings import Settings
from openhands.storage.settings.settings_store import SettingsStore
from openhands.storage.supabase import get_supabase_client
from openhands.utils.async_utils import call_sync_from_async


@dataclass
class SupabaseSettingsStore(SettingsStore):
    user_id: str | None = None
    
    async def load(self) -> Settings | None:
        if not self.user_id:
            return None
            
        client = get_supabase_client()
        response = await call_sync_from_async(
            lambda: client.table("settings").select("settings").eq("user_id", self.user_id).execute()
        )
        
        if not response.data:
            return None
            
        settings_data = response.data[0]["settings"]
        return Settings(**settings_data)
    
    async def store(self, settings: Settings) -> None:
        if not self.user_id:
            return
            
        client = get_supabase_client()
        settings_json = json.loads(settings.model_dump_json(context={'expose_secrets': True}))
        
        # Upsert to handle both insert and update
        await call_sync_from_async(
            lambda: client.table("settings").upsert({
                "user_id": self.user_id,
                "settings": settings_json
            }).execute()
        )
    
    @classmethod
    async def get_instance(
        cls, config: AppConfig, user_id: str | None
    ) -> SupabaseSettingsStore:
        return SupabaseSettingsStore(user_id)
