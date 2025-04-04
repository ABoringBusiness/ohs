# OpenHands Deployment

This directory contains deployment configurations for the OpenHands application.

## Overview

The deployment is organized into the following components:

- **Helm Chart**: Kubernetes manifests for deploying the application
- **Argo CD**: Configuration for continuous deployment
- **Waypoint**: Configuration for HashiCorp Waypoint deployment

## Helm Chart

The Helm chart is located in the `helm/openhands` directory and includes:

- Deployment configuration
- Service definition
- Ingress rules
- Secret management
- Horizontal Pod Autoscaler
- Dependencies on PostgreSQL and Redis

### Usage

To install the Helm chart manually:

```bash
# Add the required Helm repositories
helm repo add bitnami https://charts.bitnami.com/bitnami

# Install the chart
helm install openhands ./helm/openhands \
  --namespace openhands \
  --create-namespace \
  --set config.secrets.SUPABASE_URL=<your-supabase-url> \
  --set config.secrets.SUPABASE_KEY=<your-supabase-key> \
  --set config.secrets.SUPABASE_JWT_SECRET=<your-jwt-secret> \
  --set config.secrets.OPENAI_API_KEY=<your-openai-api-key>
```

### Configuration

The main configuration options are defined in `values.yaml`. You can override these values using:

- A custom values file: `helm install -f my-values.yaml ...`
- Command-line overrides: `helm install --set key=value ...`

## Argo CD

The Argo CD configuration is located in the `argo` directory and includes:

- Application definition
- Project configuration

### Usage

To apply the Argo CD configuration:

```bash
# Create the project
kubectl apply -f deploy/argo/project.yaml

# Create the application
kubectl apply -f deploy/argo/application.yaml
```

## Waypoint

The Waypoint configuration is located in the root directory (`waypoint.hcl`) and the `waypoint` directory, which contains environment-specific configurations.

### Usage

To deploy using Waypoint:

```bash
# Initialize Waypoint
waypoint init

# Deploy to development
waypoint deploy -workspace=dev -var-file=deploy/waypoint/development.hcl

# Deploy to staging
waypoint deploy -workspace=staging -var-file=deploy/waypoint/staging.hcl

# Deploy to production
waypoint deploy -workspace=prod -var-file=deploy/waypoint/production.hcl
```

## CI/CD Pipeline

The CI/CD pipeline is defined in `.github/workflows/ci-cd.yaml` and includes:

- Testing
- Building and pushing Docker images
- Deploying to staging on pushes to the `develop` branch
- Deploying to production on tag releases

## Environment Variables

The following environment variables are required for deployment:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | URL of the Supabase instance |
| `SUPABASE_KEY` | API key for Supabase |
| `SUPABASE_JWT_SECRET` | JWT secret for Supabase authentication |
| `OPENAI_API_KEY` | API key for OpenAI |
| `REDIS_URL` | URL for Redis (optional if using the Redis dependency) |
| `DATABASE_URL` | URL for PostgreSQL (optional if using the PostgreSQL dependency) |

## Monitoring and Logging

The deployment includes:

- Liveness and readiness probes for health checking
- Resource requests and limits for proper scheduling
- Horizontal Pod Autoscaler for scaling based on CPU/memory usage

For monitoring, we recommend:

- Prometheus for metrics collection
- Grafana for visualization
- Loki for log aggregation

## Security Considerations

- All sensitive data is stored in Kubernetes Secrets
- TLS is enabled for ingress (requires cert-manager)
- Service accounts with minimal permissions
- Network policies to restrict traffic (not included in the chart)