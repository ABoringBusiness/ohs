"""
Logging utilities for the MCP server
"""

import logging
import sys
from typing import Optional

from mcp.utils.config import get_settings


def setup_logging(name: Optional[str] = None, level: Optional[int] = None) -> logging.Logger:
    """
    Set up logging for the MCP server
    
    Args:
        name: Logger name
        level: Logging level
        
    Returns:
        Logger instance
    """
    settings = get_settings()
    
    # Set default level based on debug mode
    if level is None:
        level = logging.DEBUG if settings.debug else logging.INFO
    
    # Create logger
    logger = logging.getLogger(name or "mcp")
    logger.setLevel(level)
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    # Create formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    console_handler.setFormatter(formatter)
    
    # Add handler to logger
    logger.addHandler(console_handler)
    
    return logger