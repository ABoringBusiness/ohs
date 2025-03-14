from __future__ import annotations

import os
from typing import Any

from supabase import create_client, Client
from dotenv import load_dotenv

from openhands.core.logger import openhands_logger as logger

load_dotenv()

def get_supabase_client() -> Client:
    """Get a Supabase client instance."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
    
    return create_client(url, key)
