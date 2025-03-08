#!/usr/bin/env python3
"""
Migration script to move data from file-based storage to Supabase.
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

from openhands.core.config import load_app_config
from openhands.core.logger import openhands_logger as logger
from openhands.server.settings import Settings
from openhands.storage import get_file_store
from openhands.storage.conversation.file_conversation_store import FileConversationStore
from openhands.storage.conversation.supabase_conversation_store import SupabaseConversationStore
from openhands.storage.data_models.conversation_metadata import ConversationMetadata
from openhands.storage.settings.file_settings_store import FileSettingsStore
from openhands.storage.settings.supabase_settings_store import SupabaseSettingsStore
from openhands.storage.supabase import get_supabase_client

load_dotenv()

# Validate Supabase connection
def validate_supabase_connection():
    try:
        client = get_supabase_client()
        # Test query to verify connection
        response = client.table("conversations").select("count", count="exact").limit(1).execute()
        logger.info("Supabase connection successful")
        return True
    except Exception as e:
        logger.error(f"Supabase connection failed: {e}")
        return False

# Migrate conversations
async def migrate_conversations(config, dry_run=False):
    file_store = get_file_store(config.file_store, config.file_store_path)
    file_conversation_store = FileConversationStore(file_store)
    supabase_conversation_store = SupabaseConversationStore()
    
    # Get all conversations
    try:
        conversation_result_set = await file_conversation_store.search(limit=1000)
        conversations = conversation_result_set.results
        logger.info(f"Found {len(conversations)} conversations to migrate")
        
        # Track migration stats
        success_count = 0
        error_count = 0
        
        for conversation in conversations:
            try:
                # Validate conversation data
                if not conversation.conversation_id:
                    logger.warning(f"Skipping conversation with empty ID")
                    error_count += 1
                    continue
                
                logger.info(f"Migrating conversation: {conversation.conversation_id}")
                
                if not dry_run:
                    # Save to Supabase
                    await supabase_conversation_store.save_metadata(conversation)
                    
                    # Verify migration
                    migrated = await supabase_conversation_store.get_metadata(conversation.conversation_id)
                    if migrated.conversation_id == conversation.conversation_id:
                        success_count += 1
                    else:
                        logger.error(f"Verification failed for conversation: {conversation.conversation_id}")
                        error_count += 1
                else:
                    logger.info(f"DRY RUN: Would migrate conversation {conversation.conversation_id}")
                    success_count += 1
            except Exception as e:
                logger.error(f"Error migrating conversation {conversation.conversation_id}: {e}")
                error_count += 1
        
        logger.info(f"Migration complete. Success: {success_count}, Errors: {error_count}")
        return success_count, error_count
    except Exception as e:
        logger.error(f"Error during conversation migration: {e}")
        return 0, 0

# Migrate settings
async def migrate_settings(config, dry_run=False):
    file_store = get_file_store(config.file_store, config.file_store_path)
    file_settings_store = FileSettingsStore(file_store)
    
    try:
        settings = await file_settings_store.load()
        if not settings:
            logger.info("No settings found to migrate")
            return 0, 0
        
        logger.info("Migrating settings")
        
        if not dry_run:
            # For settings, we need user_id
            # In a real migration, you'd need to map settings to users
            # For this example, we'll use a default user ID
            user_id = os.environ.get("DEFAULT_USER_ID", "default_user")
            supabase_settings_store = SupabaseSettingsStore(user_id)
            
            # Save to Supabase
            await supabase_settings_store.store(settings)
            
            # Verify migration
            migrated_settings = await supabase_settings_store.load()
            if migrated_settings:
                logger.info("Settings migration successful")
                return 1, 0
            else:
                logger.error("Settings verification failed")
                return 0, 1
        else:
            logger.info("DRY RUN: Would migrate settings")
            return 1, 0
    except Exception as e:
        logger.error(f"Error during settings migration: {e}")
        return 0, 1

# Main migration function
async def run_migration(dry_run=False):
    if not validate_supabase_connection():
        logger.error("Aborting migration due to Supabase connection failure")
        return False
    
    config = load_app_config()
    
    # Create migration timestamp
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Starting migration at {timestamp}")
    
    # Migrate conversations
    conv_success, conv_errors = await migrate_conversations(config, dry_run)
    
    # Migrate settings
    settings_success, settings_errors = await migrate_settings(config, dry_run)
    
    # Report results
    logger.info(f"Migration summary:")
    logger.info(f"  Conversations: {conv_success} successful, {conv_errors} errors")
    logger.info(f"  Settings: {settings_success} successful, {settings_errors} errors")
    
    if not dry_run:
        # Write migration report
        report = {
            "timestamp": timestamp,
            "conversations": {"success": conv_success, "errors": conv_errors},
            "settings": {"success": settings_success, "errors": settings_errors},
            "complete": True
        }
        
        report_path = Path(f"migration_report_{timestamp}.json")
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Migration report written to {report_path}")
    
    return conv_errors == 0 and settings_errors == 0

if __name__ == "__main__":
    # Parse command line arguments
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        logger.info("Running in DRY RUN mode - no data will be written")
    
    success = asyncio.run(run_migration(dry_run))
    sys.exit(0 if success else 1)
