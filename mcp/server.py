#!/usr/bin/env python3
"""
MCP (Master Control Program) Server
Handles execution of workflows created in the Visual Builder
"""

import os
import logging
import asyncio
import uvicorn
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from mcp.api.router import router as api_router
from mcp.core.workflow_engine import WorkflowEngine
from mcp.models.workflow import Workflow, WorkflowExecution, ExecutionStatus
from mcp.utils.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("mcp")

# Create FastAPI app
app = FastAPI(
    title="MCP Server",
    description="Master Control Program for executing Visual Builder workflows",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")

# Create workflow engine
workflow_engine = WorkflowEngine()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting MCP Server")
    await workflow_engine.initialize()

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    logger.info("Shutting down MCP Server")
    await workflow_engine.shutdown()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    # Get settings
    settings = get_settings()
    
    # Run server
    uvicorn.run(
        "server:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info",
    )