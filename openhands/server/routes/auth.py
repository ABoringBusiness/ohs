from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr

from openhands.server.auth_supabase import User, get_current_user
from openhands.storage.supabase_client import get_supabase_client

app = APIRouter(prefix="/api/auth")


class SignUpRequest(BaseModel):
    """Request model for user sign-up."""
    email: EmailStr
    password: str
    name: str = None


class SignInRequest(BaseModel):
    """Request model for user sign-in."""
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Response model for authentication operations."""
    access_token: str
    token_type: str = "bearer"
    user: User


@app.post("/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest):
    """
    Register a new user.
    
    Args:
        request: The sign-up request.
        
    Returns:
        The authentication response with access token and user information.
        
    Raises:
        HTTPException: If sign-up fails.
    """
    try:
        supabase = get_supabase_client()
        
        # Create the user in Supabase Auth
        user_data = {
            "email": request.email,
            "password": request.password,
        }
        
        if request.name:
            user_data["data"] = {"name": request.name}
        
        auth_response = supabase.auth.sign_up(user_data)
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user",
            )
        
        # Return the access token and user information
        return AuthResponse(
            access_token=auth_response.session.access_token,
            user=User(
                id=auth_response.user.id,
                email=auth_response.user.email,
                name=request.name,
            ),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sign-up failed: {str(e)}",
        )


@app.post("/signin", response_model=AuthResponse)
async def signin(request: SignInRequest):
    """
    Authenticate a user.
    
    Args:
        request: The sign-in request.
        
    Returns:
        The authentication response with access token and user information.
        
    Raises:
        HTTPException: If sign-in fails.
    """
    try:
        supabase = get_supabase_client()
        
        # Sign in the user
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        
        # Return the access token and user information
        return AuthResponse(
            access_token=auth_response.session.access_token,
            user=User(
                id=auth_response.user.id,
                email=auth_response.user.email,
                name=auth_response.user.user_metadata.get("name") if auth_response.user.user_metadata else None,
            ),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )


@app.post("/signout")
async def signout(user: User = Depends(get_current_user)):
    """
    Sign out the current user.
    
    Args:
        user: The current authenticated user.
        
    Returns:
        A success message.
    """
    try:
        supabase = get_supabase_client()
        supabase.auth.sign_out()
        
        return {"message": "Successfully signed out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sign-out failed: {str(e)}",
        )


@app.get("/me", response_model=User)
async def get_me(user: User = Depends(get_current_user)):
    """
    Get the current authenticated user.
    
    Args:
        user: The current authenticated user.
        
    Returns:
        The user information.
    """
    return user