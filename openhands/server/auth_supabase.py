from datetime import datetime, timedelta
from typing import Dict, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, SecretStr

from openhands.core.config.app_config import AppConfig
from openhands.storage.supabase_client import get_supabase_client

# Security scheme for Swagger UI
security = HTTPBearer()


class TokenData(BaseModel):
    """Data model for JWT token claims."""
    sub: str  # User ID
    exp: datetime  # Expiration time


class User(BaseModel):
    """Data model for user information."""
    id: str
    email: str
    name: Optional[str] = None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    request: Request = None,
) -> User:
    """
    Get the current authenticated user from the JWT token.
    
    Args:
        credentials: The HTTP Authorization header credentials.
        request: The FastAPI request object.
        
    Returns:
        The authenticated user.
        
    Raises:
        HTTPException: If authentication fails.
    """
    try:
        # Get the JWT token from the Authorization header
        token = credentials.credentials
        
        # Verify the token with Supabase
        supabase = get_supabase_client()
        user = supabase.auth.get_user(token)
        
        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create a User object from the Supabase user
        return User(
            id=user.user.id,
            email=user.user.email,
            name=user.user.user_metadata.get("name") if user.user.user_metadata else None,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_user_id(request: Request) -> Optional[str]:
    """
    Get the user ID from the request state.
    
    Args:
        request: The FastAPI request object.
        
    Returns:
        The user ID, or None if not authenticated.
    """
    return getattr(request.state, "user_id", None)


def get_user_token(request: Request) -> Optional[SecretStr]:
    """
    Get the user token from the request state.
    
    Args:
        request: The FastAPI request object.
        
    Returns:
        The user token, or None if not authenticated.
    """
    return getattr(request.state, "user_token", None)