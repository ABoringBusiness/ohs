"""
API router for the MCP server
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query, Path
from pydantic import BaseModel

from mcp.models.workflow import (
    Workflow,
    WorkflowExecution,
    WorkflowExecutionRequest,
    WorkflowExecutionResponse,
    ExecutionStatus,
)
from mcp.core.workflow_engine import WorkflowEngine
from mcp.api.dependencies import get_workflow_engine, get_current_user

logger = logging.getLogger("mcp.api.router")

# Create router
router = APIRouter()


@router.post("/workflows", response_model=Workflow)
async def create_workflow(
    workflow: Workflow,
    workflow_engine: WorkflowEngine = Depends(get_workflow_engine),
    user_id: Optional[str] = Depends(get_current_user),
):
    """
    Create a new workflow
    
    Args:
        workflow: Workflow to create
        workflow_engine: Workflow engine
        user_id: Current user ID
        
    Returns:
        Created workflow
    """
    # Set user ID
    workflow.user_id = user_id
    
    # In a real implementation, this would save the workflow to a database
    # For now, just return the workflow
    return workflow


@router.get("/workflows/{workflow_id}", response_model=Workflow)
async def get_workflow(
    workflow_id: str = Path(..., description="Workflow ID"),
    workflow_engine: WorkflowEngine = Depends(get_workflow_engine),
    user_id: Optional[str] = Depends(get_current_user),
):
    """
    Get a workflow by ID
    
    Args:
        workflow_id: Workflow ID
        workflow_engine: Workflow engine
        user_id: Current user ID
        
    Returns:
        Workflow if found
        
    Raises:
        HTTPException: If workflow is not found
    """
    # In a real implementation, this would fetch the workflow from a database
    # For now, raise a not found exception
    raise HTTPException(status_code=404, detail="Workflow not found")


@router.post("/workflows/{workflow_id}/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(
    request: WorkflowExecutionRequest,
    background_tasks: BackgroundTasks,
    workflow_engine: WorkflowEngine = Depends(get_workflow_engine),
    user_id: Optional[str] = Depends(get_current_user),
    workflow_id: str = Path(..., description="Workflow ID"),
):
    """
    Execute a workflow
    
    Args:
        request: Execution request
        background_tasks: Background tasks
        workflow_engine: Workflow engine
        user_id: Current user ID
        workflow_id: Workflow ID
        
    Returns:
        Execution response
        
    Raises:
        HTTPException: If workflow is not found
    """
    # In a real implementation, this would fetch the workflow from a database
    # For now, create a dummy workflow
    workflow = Workflow(
        id=workflow_id,
        name="Dummy Workflow",
        nodes=[],
        edges=[],
        created_at="2023-01-01T00:00:00Z",
        updated_at="2023-01-01T00:00:00Z",
        user_id=user_id,
    )
    
    # Execute workflow
    execution = await workflow_engine.execute_workflow(workflow, request.input)
    
    # Return response
    return WorkflowExecutionResponse(
        execution_id=execution.id,
        status=execution.status,
        message="Workflow execution started",
    )


@router.get("/executions/{execution_id}", response_model=WorkflowExecution)
async def get_execution(
    execution_id: str = Path(..., description="Execution ID"),
    workflow_engine: WorkflowEngine = Depends(get_workflow_engine),
    user_id: Optional[str] = Depends(get_current_user),
):
    """
    Get an execution by ID
    
    Args:
        execution_id: Execution ID
        workflow_engine: Workflow engine
        user_id: Current user ID
        
    Returns:
        Execution if found
        
    Raises:
        HTTPException: If execution is not found
    """
    # Get execution
    execution = await workflow_engine.get_execution(execution_id)
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    # Check user ID
    if execution.user_id and execution.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this execution")
    
    return execution


@router.post("/executions/{execution_id}/cancel", response_model=WorkflowExecutionResponse)
async def cancel_execution(
    execution_id: str = Path(..., description="Execution ID"),
    workflow_engine: WorkflowEngine = Depends(get_workflow_engine),
    user_id: Optional[str] = Depends(get_current_user),
):
    """
    Cancel an execution
    
    Args:
        execution_id: Execution ID
        workflow_engine: Workflow engine
        user_id: Current user ID
        
    Returns:
        Execution response
        
    Raises:
        HTTPException: If execution is not found or cannot be cancelled
    """
    # Get execution
    execution = await workflow_engine.get_execution(execution_id)
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    # Check user ID
    if execution.user_id and execution.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this execution")
    
    # Check if execution can be cancelled
    if execution.status != ExecutionStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Execution is not running")
    
    # Cancel execution
    cancelled = await workflow_engine.cancel_execution(execution_id)
    
    if not cancelled:
        raise HTTPException(status_code=400, detail="Failed to cancel execution")
    
    return WorkflowExecutionResponse(
        execution_id=execution_id,
        status=ExecutionStatus.CANCELLED,
        message="Execution cancelled",
    )