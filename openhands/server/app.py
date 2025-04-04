import warnings
from contextlib import asynccontextmanager
import os

with warnings.catch_warnings():
    warnings.simplefilter('ignore')

from fastapi import (
    FastAPI,
)
from fastapi.middleware.cors import CORSMiddleware

import openhands.agenthub  # noqa F401 (we import this to get the agents registered)
from openhands import __version__
from openhands.server.middleware_supabase import SupabaseAuthMiddleware
from openhands.server.routes.auth import app as auth_api_router
from openhands.server.routes.conversation import app as conversation_api_router
from openhands.server.routes.feedback import app as feedback_api_router
from openhands.server.routes.files import app as files_api_router
from openhands.server.routes.github import app as github_api_router
from openhands.server.routes.manage_conversations import (
    app as manage_conversation_api_router,
)
from openhands.server.routes.memory import app as memory_api_router
from openhands.server.routes.public import app as public_api_router
from openhands.server.routes.security import app as security_api_router
from openhands.server.routes.settings import app as settings_router
from openhands.server.routes.trajectory import app as trajectory_router
from openhands.server.shared import conversation_manager
from openhands.server.socketio_server import setup_socketio
from openhands.storage.supabase_realtime import setup_realtime_listeners, cleanup_realtime_listeners


@asynccontextmanager
async def _lifespan(app: FastAPI):
    # Set up Supabase realtime listeners
    await setup_realtime_listeners()
    
    async with conversation_manager:
        yield
    
    # Clean up Supabase realtime listeners
    await cleanup_realtime_listeners()


app = FastAPI(
    title='OpenHands',
    description='OpenHands: Code Less, Make More',
    version=__version__,
    lifespan=_lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Add Supabase authentication middleware
app.add_middleware(SupabaseAuthMiddleware)

# Set up Socket.io
setup_socketio(app)


@app.get('/health')
async def health():
    return 'OK'


# Include all routers
app.include_router(public_api_router)
app.include_router(auth_api_router)  # Add the new auth router
app.include_router(files_api_router)
app.include_router(security_api_router)
app.include_router(feedback_api_router)
app.include_router(conversation_api_router)
app.include_router(manage_conversation_api_router)
app.include_router(settings_router)
app.include_router(github_api_router)
app.include_router(trajectory_router)
app.include_router(memory_api_router)  # Add the memory management router
