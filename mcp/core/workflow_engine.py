"""
Workflow execution engine for the MCP server
"""

import asyncio
import time
import traceback
from datetime import datetime
from typing import Dict, Any, Optional, List, Set
import logging

from mcp.models.workflow import (
    Workflow,
    Node,
    Edge,
    NodeType,
    WorkflowExecution,
    NodeExecutionResult,
    ExecutionStatus,
)
from mcp.executors.node_executor_factory import NodeExecutorFactory
from mcp.utils.config import get_settings

logger = logging.getLogger("mcp.workflow_engine")


class WorkflowEngine:
    """Engine for executing workflows"""
    
    def __init__(self):
        """Initialize the workflow engine"""
        self.settings = get_settings()
        self.node_executor_factory = NodeExecutorFactory()
        self.active_executions: Dict[str, asyncio.Task] = {}
        self.execution_semaphore = asyncio.Semaphore(self.settings.max_concurrent_executions)
    
    async def initialize(self):
        """Initialize the workflow engine"""
        logger.info("Initializing workflow engine")
        await self.node_executor_factory.initialize()
    
    async def shutdown(self):
        """Shut down the workflow engine"""
        logger.info("Shutting down workflow engine")
        # Cancel all active executions
        for execution_id, task in self.active_executions.items():
            if not task.done():
                logger.info(f"Cancelling execution {execution_id}")
                task.cancel()
        
        # Wait for all tasks to complete
        if self.active_executions:
            await asyncio.gather(*self.active_executions.values(), return_exceptions=True)
        
        # Shut down node executors
        await self.node_executor_factory.shutdown()
    
    async def execute_workflow(
        self, workflow: Workflow, input_data: Optional[Dict[str, Any]] = None
    ) -> WorkflowExecution:
        """
        Execute a workflow
        
        Args:
            workflow: Workflow to execute
            input_data: Input data for the workflow
            
        Returns:
            Execution result
        """
        # Create execution record
        execution = WorkflowExecution(
            id=f"exec_{int(time.time() * 1000)}",
            workflow_id=workflow.id,
            status=ExecutionStatus.PENDING,
            started_at=datetime.utcnow(),
            input=input_data or {},
            user_id=workflow.user_id,
        )
        
        # Start execution in background
        task = asyncio.create_task(self._execute_workflow_task(workflow, execution))
        self.active_executions[execution.id] = task
        
        # Clean up when done
        task.add_done_callback(
            lambda t: self.active_executions.pop(execution.id, None)
        )
        
        return execution
    
    async def _execute_workflow_task(
        self, workflow: Workflow, execution: WorkflowExecution
    ) -> WorkflowExecution:
        """
        Execute a workflow task
        
        Args:
            workflow: Workflow to execute
            execution: Execution record
            
        Returns:
            Updated execution record
        """
        async with self.execution_semaphore:
            try:
                logger.info(f"Starting execution {execution.id} of workflow {workflow.id}")
                execution.status = ExecutionStatus.RUNNING
                
                # Find trigger nodes
                trigger_nodes = [
                    node for node in workflow.nodes if node.type == NodeType.TRIGGER
                ]
                
                if not trigger_nodes:
                    raise ValueError("Workflow must have at least one trigger node")
                
                # Execute workflow
                execution_context = {
                    "input": execution.input or {},
                    "results": {},
                    "errors": {},
                }
                
                # Start with trigger nodes
                for trigger_node in trigger_nodes:
                    await self._execute_node(workflow, trigger_node, execution, execution_context)
                
                # Mark as completed
                execution.status = ExecutionStatus.COMPLETED
                execution.completed_at = datetime.utcnow()
                logger.info(f"Completed execution {execution.id} of workflow {workflow.id}")
                
            except asyncio.CancelledError:
                logger.warning(f"Execution {execution.id} was cancelled")
                execution.status = ExecutionStatus.CANCELLED
                execution.completed_at = datetime.utcnow()
                execution.error = "Execution was cancelled"
                
            except Exception as e:
                logger.error(f"Error executing workflow {workflow.id}: {str(e)}")
                logger.error(traceback.format_exc())
                execution.status = ExecutionStatus.FAILED
                execution.completed_at = datetime.utcnow()
                execution.error = str(e)
            
            return execution
    
    async def _execute_node(
        self,
        workflow: Workflow,
        node: Node,
        execution: WorkflowExecution,
        context: Dict[str, Any],
    ) -> NodeExecutionResult:
        """
        Execute a single node in the workflow
        
        Args:
            workflow: Workflow containing the node
            node: Node to execute
            execution: Execution record
            context: Execution context
            
        Returns:
            Node execution result
        """
        # Check if node has already been executed
        if node.id in execution.results:
            return execution.results[node.id]
        
        # Create result record
        result = NodeExecutionResult(
            node_id=node.id,
            status="running",
            started_at=datetime.utcnow(),
        )
        execution.results[node.id] = result
        
        try:
            logger.info(f"Executing node {node.id} ({node.data.label}) of type {node.type}")
            
            # Get node executor
            executor = self.node_executor_factory.get_executor(node.type)
            
            # Prepare inputs
            node_inputs = {}
            for input_def in node.data.inputs:
                # Get input from context or use default
                if input_def.id in context["input"]:
                    node_inputs[input_def.id] = context["input"][input_def.id]
                elif input_def.id in node.data.config:
                    node_inputs[input_def.id] = node.data.config[input_def.id]
                elif input_def.default is not None:
                    node_inputs[input_def.id] = input_def.default
                elif input_def.required:
                    raise ValueError(f"Required input {input_def.id} not provided for node {node.id}")
            
            # Execute node
            start_time = time.time()
            output = await executor.execute(node, node_inputs, context)
            execution_time = time.time() - start_time
            
            # Update result
            result.status = "success"
            result.output = output
            result.execution_time = execution_time
            result.completed_at = datetime.utcnow()
            
            # Update context with output
            for output_def in node.data.outputs:
                if output_def.id in output:
                    context["results"][f"{node.id}.{output_def.id}"] = output[output_def.id]
            
            # Find and execute connected nodes
            await self._execute_connected_nodes(workflow, node, execution, context)
            
            return result
            
        except Exception as e:
            logger.error(f"Error executing node {node.id}: {str(e)}")
            logger.error(traceback.format_exc())
            
            # Update result
            result.status = "error"
            result.error = str(e)
            result.completed_at = datetime.utcnow()
            
            # Update context with error
            context["errors"][node.id] = str(e)
            
            # Find and execute error edges
            await self._execute_error_edges(workflow, node, execution, context)
            
            return result
    
    async def _execute_connected_nodes(
        self,
        workflow: Workflow,
        node: Node,
        execution: WorkflowExecution,
        context: Dict[str, Any],
    ):
        """
        Execute nodes connected to the given node
        
        Args:
            workflow: Workflow containing the nodes
            node: Source node
            execution: Execution record
            context: Execution context
        """
        # Find outgoing edges
        outgoing_edges = [
            edge for edge in workflow.edges 
            if edge.source == node.id and edge.type != "error"
        ]
        
        # Execute connected nodes
        for edge in outgoing_edges:
            target_node = next((n for n in workflow.nodes if n.id == edge.target), None)
            if target_node:
                await self._execute_node(workflow, target_node, execution, context)
    
    async def _execute_error_edges(
        self,
        workflow: Workflow,
        node: Node,
        execution: WorkflowExecution,
        context: Dict[str, Any],
    ):
        """
        Execute nodes connected by error edges
        
        Args:
            workflow: Workflow containing the nodes
            node: Source node
            execution: Execution record
            context: Execution context
        """
        # Find error edges
        error_edges = [
            edge for edge in workflow.edges 
            if edge.source == node.id and edge.type == "error"
        ]
        
        # Execute connected nodes
        for edge in error_edges:
            target_node = next((n for n in workflow.nodes if n.id == edge.target), None)
            if target_node:
                await self._execute_node(workflow, target_node, execution, context)
    
    async def get_execution(self, execution_id: str) -> Optional[WorkflowExecution]:
        """
        Get execution by ID
        
        Args:
            execution_id: Execution ID
            
        Returns:
            Execution record if found, None otherwise
        """
        # In a real implementation, this would fetch from a database
        # For now, we just check active executions
        if execution_id in self.active_executions:
            task = self.active_executions[execution_id]
            if task.done():
                try:
                    return await task
                except Exception:
                    # Task failed, but we still want to return the execution
                    pass
        
        # Not found
        return None
    
    async def cancel_execution(self, execution_id: str) -> bool:
        """
        Cancel an execution
        
        Args:
            execution_id: Execution ID
            
        Returns:
            True if cancelled, False otherwise
        """
        if execution_id in self.active_executions:
            task = self.active_executions[execution_id]
            if not task.done():
                task.cancel()
                return True
        
        return False