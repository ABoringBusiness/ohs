import os
import socketio

from openhands.core.logger import openhands_logger as logger
from openhands.server.app import app as base_app
from openhands.server.config.server_config import FrontendType, load_server_config
from openhands.server.frontend_manager import FrontendManager
from openhands.server.listen_socket import sio
from openhands.server.middleware import (
    AttachConversationMiddleware,
    CacheControlMiddleware,
    GitHubTokenMiddleware,
    InMemoryRateLimiter,
    LocalhostCORSMiddleware,
    RateLimitMiddleware,
)
from openhands.server.static import SPAStaticFiles

# Load server configuration
server_config = load_server_config()

# Get frontend type from environment variable or use default
frontend_type_str = os.environ.get('OPENHANDS_FRONTEND_TYPE', 'DEFAULT')
try:
    frontend_type = FrontendType[frontend_type_str]
except (KeyError, ValueError):
    logger.warning(f"Unknown frontend type: {frontend_type_str}. Using default.")
    frontend_type = FrontendType.DEFAULT

# Get the appropriate frontend directory
frontend_directory = FrontendManager.get_frontend_directory(frontend_type)

# Mount the frontend
base_app.mount(
    '/', SPAStaticFiles(directory=frontend_directory, html=True), name='dist'
)

base_app.add_middleware(
    LocalhostCORSMiddleware,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

base_app.add_middleware(CacheControlMiddleware)
base_app.add_middleware(
    RateLimitMiddleware,
    rate_limiter=InMemoryRateLimiter(requests=10, seconds=1),
)
base_app.middleware('http')(AttachConversationMiddleware(base_app))
base_app.middleware('http')(GitHubTokenMiddleware(base_app))

app = socketio.ASGIApp(sio, other_asgi_app=base_app)
