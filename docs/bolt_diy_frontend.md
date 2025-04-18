# Using bolt.diy as an Alternative Frontend for OpenHands

OpenHands now supports [bolt.diy](https://github.com/stackblitz-labs/bolt.diy) as an alternative frontend. bolt.diy is a powerful AI-powered web development environment that allows you to create full-stack web applications using natural language prompts.

## Features

- AI-powered full-stack web development for NodeJS-based applications
- Support for multiple LLMs with an extensible architecture
- Attach images to prompts for better contextual understanding
- Integrated terminal to view output of LLM-run commands
- Revert code to earlier versions for easier debugging
- Download projects as ZIP for easy portability
- Deploy directly to Netlify

## Setup

### Prerequisites

- Node.js (LTS version recommended)
- npm or pnpm
- Git

### Building the bolt.diy Frontend

1. Clone the OpenHands repository:
   ```bash
   git clone https://github.com/All-Hands-AI/OpenHands.git
   cd OpenHands
   ```

2. Build the OpenHands project:
   ```bash
   make build
   ```

3. Build the bolt.diy frontend:
   ```bash
   make build-bolt-diy
   ```

This will clone the bolt.diy repository, patch it to work with OpenHands, and build the frontend.

## Running OpenHands with bolt.diy

To run OpenHands with the bolt.diy frontend:

```bash
make run FRONTEND_TYPE=BOLT_DIY
```

This will start the OpenHands backend and serve the bolt.diy frontend.

## Configuration

You can configure which frontend to use in several ways:

1. Using the `FRONTEND_TYPE` environment variable:
   ```bash
   export FRONTEND_TYPE=BOLT_DIY
   make run
   ```

2. Passing it as a parameter to the `make run` command:
   ```bash
   make run FRONTEND_TYPE=BOLT_DIY
   ```

3. Setting it in your `config.toml` file:
   ```toml
   [core]
   frontend_type = "BOLT_DIY"
   ```

## Switching Between Frontends

You can easily switch between the default OpenHands frontend and bolt.diy:

- For the default frontend:
  ```bash
  make run FRONTEND_TYPE=DEFAULT
  ```

- For the bolt.diy frontend:
  ```bash
  make run FRONTEND_TYPE=BOLT_DIY
  ```

## Troubleshooting

If you encounter issues with the bolt.diy frontend:

1. Make sure you have built the bolt.diy frontend:
   ```bash
   make build-bolt-diy
   ```

2. Check that the patching process completed successfully:
   ```bash
   ./scripts/patch_bolt_diy.sh
   ```

3. If you're still having issues, try rebuilding the bolt.diy frontend:
   ```bash
   rm -rf bolt_diy
   make build-bolt-diy
   ```

## Contributing

If you'd like to improve the bolt.diy integration, please submit a pull request with your changes. Make sure to test your changes with both frontends to ensure compatibility.