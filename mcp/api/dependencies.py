"""
Dependencies for the MCP API
"""

import logging
from typing import Optional
from fastapi import Depends, HTTPException, Header

from mcp.core.workflow_engine import WorkflowEngine

logger = logging.getLogger("mcp.api.dependencies")

# Singleton workflow engine
_workflow_engine = None


async def get_workflow_engine() -> WorkflowEngine:
    """
    Get the workflow engine singleton
    
    Returns:
        Workflow engine
    """
    global _workflow_engine
    
    if _workflow_engine is None:
        logger.info("Creating workflow engine")
        _workflow_engine = WorkflowEngine()
        await _workflow_engine.initialize()
    
    return _workflow_engine


async def get_current_user(
    authorization: Optional[str] = Header(None, description="Bearer token")
) -> Optional[str]:
    """
    Get the current user ID from the authorization header
    
    Args:
        authorization: Authorization header
        
    Returns:
        User ID if authenticated, None otherwise
    """
    if not authorization:
        return None
    
    # Extract token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    token = parts[1]
    
    # In a real implementation, this would validate the token
    # For now, just return a dummy user ID
    return "user123"