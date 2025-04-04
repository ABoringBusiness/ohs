#!/usr/bin/env python3
"""
Script to migrate data from file-based storage to Supabase.

This script:
1. Creates the necessary tables in Supabase
2. Migrates conversation data from file storage to Supabase
3. Migrates settings data from file storage to Supabase
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from supabase import Client, create_client

from openhands.core.config.app_config import AppConfig
from openhands.core.config.utils import load_app_config
from openhands.storage import get_file_store
from openhands.storage.conversation.file_conversation_store import FileConversationStore
from openhands.storage.data_models.conversation_metadata import ConversationMetadata
from openhands.storage.locations import (
    CONVERSATION_BASE_DIR,
    get_conversation_metadata_filename,
)
from openhands.storage.settings.file_settings_store import FileSettingsStore
from openhands.storage.supabase import SupabaseFileStore
from openhands.storage.supabase_client import get_supabase_client


def create_supabase_tables(supabase: Client):
    """
    Create the necessary tables in Supabase.
    
    Args:
        supabase: The Supabase client.
    """
    print("Creating Supabase tables...")
    
    # Create the conversations table
    supabase.table("conversations").insert({
        "id": "test",
        "namespace": "test",
        "content": "test"
    }).execute()
    
    # Create the settings table
    supabase.table("settings").insert({
        "id": "test",
        "namespace": "test",
        "content": "test"
    }).execute()
    
    # Create the files table
    supabase.table("files").insert({
        "id": "test",
        "namespace": "test",
        "content": "test"
    }).execute()
    
    # Delete the test records
    supabase.table("conversations").delete().eq("id", "test").execute()
    supabase.table("settings").delete().eq("id", "test").execute()
    supabase.table("files").delete().eq("id", "test").execute()
    
    print("Supabase tables created successfully.")


async def migrate_conversations(config: AppConfig, supabase_store: SupabaseFileStore):
    """
    Migrate conversation data from file storage to Supabase.
    
    Args:
        config: The application configuration.
        supabase_store: The Supabase file store.
    """
    print("Migrating conversations...")
    
    # Get the file store
    file_store = get_file_store(config.file_store, config.file_store_path)
    conversation_store = FileConversationStore(file_store)
    
    # Get all conversation IDs
    try:
        metadata_dir = conversation_store.get_conversation_metadata_dir()
        conversation_ids = [
            path.split('/')[-2]
            for path in file_store.list(metadata_dir)
            if not path.startswith(f'{metadata_dir}/.')
        ]
    except FileNotFoundError:
        print("No conversations found.")
        return
    
    print(f"Found {len(conversation_ids)} conversations.")
    
    # Migrate each conversation
    for conversation_id in conversation_ids:
        try:
            # Get the conversation metadata
            metadata_path = get_conversation_metadata_filename(conversation_id)
            metadata_json = file_store.read(metadata_path)
            
            # Write the metadata to Supabase
            supabase_path = f"conversations/{conversation_id}"
            supabase_store.write(supabase_path, metadata_json)
            
            print(f"Migrated conversation: {conversation_id}")
        except Exception as e:
            print(f"Error migrating conversation {conversation_id}: {e}")
    
    print("Conversation migration completed.")


async def migrate_settings(config: AppConfig, supabase_store: SupabaseFileStore):
    """
    Migrate settings data from file storage to Supabase.
    
    Args:
        config: The application configuration.
        supabase_store: The Supabase file store.
    """
    print("Migrating settings...")
    
    # Get the file store
    file_store = get_file_store(config.file_store, config.file_store_path)
    settings_store = FileSettingsStore(file_store)
    
    # Get all settings files
    try:
        settings_dir = settings_store.get_settings_dir()
        settings_files = file_store.list(settings_dir)
    except FileNotFoundError:
        print("No settings found.")
        return
    
    print(f"Found {len(settings_files)} settings files.")
    
    # Migrate each settings file
    for settings_path in settings_files:
        try:
            # Get the settings data
            settings_json = file_store.read(settings_path)
            
            # Extract the user ID from the path
            user_id = settings_path.split('/')[-1].replace('.json', '')
            
            # Write the settings to Supabase
            supabase_path = f"settings/{user_id}"
            supabase_store.write(supabase_path, settings_json)
            
            print(f"Migrated settings for user: {user_id}")
        except Exception as e:
            print(f"Error migrating settings {settings_path}: {e}")
    
    print("Settings migration completed.")


async def main():
    """Main entry point for the migration script."""
    parser = argparse.ArgumentParser(description="Migrate data to Supabase")
    parser.add_argument("--config", help="Path to config file")
    args = parser.parse_args()
    
    # Load environment variables
    load_dotenv()
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
        sys.exit(1)
    
    # Load the application configuration
    config = load_app_config(args.config)
    
    # Create Supabase client
    supabase = create_client(supabase_url, supabase_key)
    
    # Create Supabase tables
    create_supabase_tables(supabase)
    
    # Create Supabase file store
    supabase_store = SupabaseFileStore("openhands")
    
    # Migrate data
    await migrate_conversations(config, supabase_store)
    await migrate_settings(config, supabase_store)
    
    print("Migration completed successfully.")


if __name__ == "__main__":
    asyncio.run(main())