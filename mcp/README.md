# MCP Server

Master Control Program (MCP) Server for executing workflows created in the Visual Builder.

## Overview

The MCP Server is a backend service that processes and executes workflows created in the Visual Builder UI. It provides a REST API for managing workflows and executions, and supports various node types for building complex workflows.

## Features

- **Workflow Execution**: Execute workflows with support for various node types
- **Real-time Monitoring**: Track execution progress and results
- **Error Handling**: Robust error handling and recovery
- **Extensible Architecture**: Easy to add new node types and executors
- **API Integration**: RESTful API for integration with other systems

## Node Types

The MCP Server supports the following node types:

- **Trigger**: Start a workflow (webhook, schedule, manual)
- **Action**: Perform actions (HTTP requests, send emails)
- **Condition**: Make decisions (if/else, switch)
- **Transformation**: Transform data (JSON transform, text templates)
- **AI Model**: Use AI models (text generation, image generation)
- **Data Source**: Connect to data sources (database queries, file reading)
- **Output**: Generate outputs (HTTP responses, file writing, webhooks)

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Docker (optional)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/ABoringBusiness/ohs.git
cd ohs/mcp
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the server:

```bash
python server.py
```

### Docker Deployment

1. Build and run with Docker Compose:

```bash
docker-compose up -d
```

## API Documentation

Once the server is running, you can access the API documentation at:

```
http://localhost:8000/docs
```

## Environment Variables

The MCP Server can be configured using the following environment variables:

- `MCP_HOST`: Host to bind the server to (default: 0.0.0.0)
- `MCP_PORT`: Port to bind the server to (default: 8000)
- `MCP_DEBUG`: Enable debug mode (default: false)
- `MCP_DATABASE_URL`: Database connection URL (default: sqlite:///mcp.db)
- `MCP_SECRET_KEY`: Secret key for JWT tokens (default: supersecretkey)
- `MCP_TOKEN_EXPIRE_MINUTES`: JWT token expiration time in minutes (default: 60)
- `OPENHANDS_API_URL`: URL of the OpenHands API (default: http://localhost:3000)
- `OPENHANDS_API_KEY`: API key for the OpenHands API
- `MCP_MAX_CONCURRENT_EXECUTIONS`: Maximum number of concurrent workflow executions (default: 10)
- `MCP_EXECUTION_TIMEOUT_SECONDS`: Timeout for workflow executions in seconds (default: 300)
- `MCP_STORAGE_PATH`: Path for storing files (default: ./storage)

## License

MIT