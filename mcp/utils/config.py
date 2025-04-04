"""
Configuration utilities for the MCP server
"""

import os
from functools import lru_cache
from pydantic import BaseSettings


class Settings(BaseSettings):
    """Settings for the MCP server"""
    # Server settings
    host: str = os.getenv("MCP_HOST", "0.0.0.0")
    port: int = int(os.getenv("MCP_PORT", "8000"))
    debug: bool = os.getenv("MCP_DEBUG", "false").lower() == "true"
    
    # Database settings
    database_url: str = os.getenv("MCP_DATABASE_URL", "sqlite:///mcp.db")
    
    # API settings
    api_prefix: str = "/api"
    
    # Security settings
    secret_key: str = os.getenv("MCP_SECRET_KEY", "supersecretkey")
    token_expire_minutes: int = int(os.getenv("MCP_TOKEN_EXPIRE_MINUTES", "60"))
    
    # OpenHands API settings
    openhands_api_url: str = os.getenv("OPENHANDS_API_URL", "http://localhost:3000")
    openhands_api_key: str = os.getenv("OPENHANDS_API_KEY", "")
    
    # Execution settings
    max_concurrent_executions: int = int(os.getenv("MCP_MAX_CONCURRENT_EXECUTIONS", "10"))
    execution_timeout_seconds: int = int(os.getenv("MCP_EXECUTION_TIMEOUT_SECONDS", "300"))
    
    # Storage settings
    storage_path: str = os.getenv("MCP_STORAGE_PATH", "./storage")
    
    class Config:
        """Pydantic config"""
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get settings singleton"""
    return Settings()