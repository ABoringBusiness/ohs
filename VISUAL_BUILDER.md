# OpenHands Visual Builder & MCP Server

The Visual Builder and Master Control Program (MCP) Server are powerful additions to the OpenHands platform that enable no-code/low-code AI workflow creation and execution.

![Visual Builder Screenshot](./docs/static/img/visual-builder-screenshot.png)

## 🌟 Features

### Visual Builder
- **Drag-and-Drop Interface**: Create AI workflows without writing code
- **Template Gallery**: Start with pre-built templates for common use cases
- **Node Library**: Extensive library of pre-built nodes for various functions
- **Real-time Testing**: Test your workflows directly in the UI

### MCP Server
- **Workflow Execution Engine**: Powerful backend for executing Visual Builder workflows
- **Node Executors**: Support for triggers, actions, conditions, transformations, AI models, data sources, and outputs
- **REST API**: Comprehensive API for managing workflows and executions
- **Docker Support**: Easy deployment with Docker and docker-compose

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Docker (optional)

### Installation

#### Visual Builder
The Visual Builder is integrated into the main OpenHands frontend. To use it:

1. Start OpenHands as usual
2. Navigate to the Visual Builder section from the sidebar
3. Start creating workflows!

#### MCP Server
```bash
# Navigate to the MCP directory
cd ohs/mcp

# Install dependencies
pip install -r requirements.txt

# Start the server
python server.py
```

#### Docker Deployment for MCP Server
```bash
# Navigate to the MCP directory
cd ohs/mcp

# Build and run with Docker Compose
docker-compose up -d
```

## 🧩 Components

### Visual Builder

The Visual Builder allows you to create AI workflows using a drag-and-drop interface. It supports various node types:

- **Triggers**: Start workflows (webhooks, schedules, manual triggers)
- **Actions**: Perform operations (HTTP requests, email sending)
- **Conditions**: Add logic (if/else, switch statements)
- **Transformations**: Modify data (JSON transforms, text templates)
- **AI Models**: Use AI capabilities (text generation, image creation)
- **Data Sources**: Connect to data (databases, files, APIs)
- **Outputs**: Generate results (HTTP responses, file writing)

### MCP Server

The Master Control Program (MCP) Server executes workflows created in the Visual Builder:

- **Workflow Engine**: Orchestrates the execution of nodes
- **Node Executors**: Specialized handlers for each node type
- **API**: RESTful interface for managing workflows and executions
- **Monitoring**: Track execution status and performance

## 📚 Documentation

### Visual Builder

#### Creating a Workflow

1. **Start a new workflow**: Click the "New Workflow" button
2. **Add nodes**: Drag nodes from the Node Library on the left
3. **Connect nodes**: Click and drag from one node's output to another node's input
4. **Configure nodes**: Select a node and edit its properties in the right panel
5. **Test your workflow**: Click the "Execute" button to test your workflow
6. **Save your workflow**: Click the "Save" button to save your progress

#### Using Templates

1. **Open the Template Gallery**: Click the "Templates" button
2. **Browse templates**: Explore templates by category or search
3. **Use a template**: Click "Use Template" to create a workflow from the template
4. **Customize**: Modify the template to suit your needs

### MCP Server

#### API Endpoints

- `GET /health`: Health check endpoint
- `POST /api/workflows`: Create a new workflow
- `GET /api/workflows/{workflow_id}`: Get a workflow by ID
- `POST /api/workflows/{workflow_id}/execute`: Execute a workflow
- `GET /api/executions/{execution_id}`: Get execution status
- `POST /api/executions/{execution_id}/cancel`: Cancel an execution

#### Configuration

The MCP Server can be configured using environment variables:

- `MCP_HOST`: Host to bind the server to (default: 0.0.0.0)
- `MCP_PORT`: Port to bind the server to (default: 8000)
- `MCP_DEBUG`: Enable debug mode (default: false)
- `OPENHANDS_API_URL`: URL of the OpenHands API
- `OPENHANDS_API_KEY`: API key for the OpenHands API

## 📅 Roadmap

### Short-term (1-3 months)
- Enhanced Visual Builder with more node types
- Improved workflow debugging capabilities
- Workflow persistence with versioning
- Expanded template gallery

### Medium-term (3-6 months)
- AI-assisted workflow creation
- Advanced scheduling and trigger options
- Team collaboration features
- Workflow marketplace

### Long-term (6+ months)
- Enterprise features (RBAC, audit logging)
- Advanced analytics and monitoring
- High availability and scaling
- Industry-specific solution templates

## 🛠️ Development

### Project Structure

```
openhands/
├── frontend/
│   └── src/
│       └── features/
│           └── visual-builder/   # Visual Builder UI components
├── mcp/                          # MCP Server
│   ├── api/                      # API endpoints
│   ├── core/                     # Core execution engine
│   ├── executors/                # Node executors
│   ├── models/                   # Data models
│   └── utils/                    # Utilities
```

### Contributing

We welcome contributions to the Visual Builder and MCP Server! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [React Flow](https://reactflow.dev/) for workflow visualization
- [FastAPI](https://fastapi.tiangolo.com/) for the MCP Server API
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [Tailwind CSS](https://tailwindcss.com/) for styling

---

<p align="center">
  <a href="https://all-hands.dev">Website</a> •
  <a href="https://docs.all-hands.dev">Documentation</a> •
  <a href="https://github.com/All-Hands-AI/OpenHands/issues">Issues</a>
</p>