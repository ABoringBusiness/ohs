"""
Workflow models for the MCP server
"""

from enum import Enum
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field


class NodeType(str, Enum):
    """Types of nodes in a workflow"""
    TRIGGER = "trigger"
    ACTION = "action"
    CONDITION = "condition"
    TRANSFORMATION = "transformation"
    AI_MODEL = "ai_model"
    DATA_SOURCE = "data_source"
    OUTPUT = "output"


class ConnectionType(str, Enum):
    """Types of connections between nodes"""
    SUCCESS = "success"
    ERROR = "error"
    DEFAULT = "default"


class NodeInput(BaseModel):
    """Input parameter for a node"""
    id: str
    label: str
    type: str
    required: bool
    default: Optional[Any] = None
    options: Optional[List[Any]] = None


class NodeOutput(BaseModel):
    """Output parameter from a node"""
    id: str
    label: str
    type: str


class NodeData(BaseModel):
    """Data associated with a node"""
    label: str
    description: Optional[str] = None
    icon: Optional[str] = None
    inputs: List[NodeInput]
    outputs: List[NodeOutput]
    config: Dict[str, Any] = Field(default_factory=dict)


class Node(BaseModel):
    """Node in a workflow"""
    id: str
    type: NodeType
    position: Dict[str, float]
    data: NodeData
    width: Optional[float] = None
    height: Optional[float] = None


class Edge(BaseModel):
    """Connection between nodes in a workflow"""
    id: str
    source: str
    target: str
    type: ConnectionType = ConnectionType.DEFAULT
    label: Optional[str] = None
    animated: Optional[bool] = None


class Workflow(BaseModel):
    """Workflow definition"""
    id: str
    name: str
    description: Optional[str] = None
    nodes: List[Node]
    edges: List[Edge]
    created_at: datetime
    updated_at: datetime
    published: bool = False
    version: int = 1
    tags: Optional[List[str]] = None
    user_id: Optional[str] = None


class ExecutionStatus(str, Enum):
    """Status of a workflow execution"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class NodeExecutionResult(BaseModel):
    """Result of executing a node"""
    node_id: str
    status: str
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class WorkflowExecution(BaseModel):
    """Execution of a workflow"""
    id: str
    workflow_id: str
    status: ExecutionStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    results: Dict[str, NodeExecutionResult] = Field(default_factory=dict)
    input: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    error: Optional[str] = None


class WorkflowExecutionRequest(BaseModel):
    """Request to execute a workflow"""
    workflow_id: str
    input: Optional[Dict[str, Any]] = None


class WorkflowExecutionResponse(BaseModel):
    """Response from executing a workflow"""
    execution_id: str
    status: ExecutionStatus
    message: str