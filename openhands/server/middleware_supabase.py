from typing import Callable

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from openhands.storage.supabase_client import get_supabase_client


class SupabaseAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle Supabase authentication.
    
    This middleware extracts the JWT token from the Authorization header,
    verifies it with Supabase, and attaches the user ID to the request state.
    """
    
    async def dispatch(self, request: Request, call_next: Callable):
        """
        Process the request and attach user information if authenticated.
        
        Args:
            request: The FastAPI request object.
            call_next: The next middleware or route handler.
            
        Returns:
            The response from the next middleware or route handler.
        """
        # Skip authentication for public routes
        if self._is_public_route(request.url.path):
            return await call_next(request)
        
        # Get the Authorization header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            # No token provided, continue without authentication
            # This allows routes to handle authentication themselves if needed
            return await call_next(request)
        
        # Extract the token
        token = auth_header.replace("Bearer ", "")
        
        try:
            # Verify the token with Supabase
            supabase = get_supabase_client()
            user = supabase.auth.get_user(token)
            
            if not user or not user.user:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid authentication credentials"},
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Attach user information to the request state
            request.state.user_id = user.user.id
            request.state.user_token = token
            request.state.user_email = user.user.email
            
            # For backward compatibility with GitHub auth
            request.state.github_user_id = user.user.id
            
            # Continue processing the request
            return await call_next(request)
        except Exception as e:
            # If token verification fails, continue without authentication
            # This allows routes to handle authentication themselves if needed
            return await call_next(request)
    
    def _is_public_route(self, path: str) -> bool:
        """
        Check if a route is public (doesn't require authentication).
        
        Args:
            path: The request path.
            
        Returns:
            True if the route is public, False otherwise.
        """
        public_prefixes = [
            "/assets",
            "/api/auth",
            "/api/public",
            "/docs",
            "/redoc",
            "/openapi.json",
        ]
        
        return any(path.startswith(prefix) for prefix in public_prefixes)