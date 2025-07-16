# AI Code + mirrord Demo

This repository demonstrates how to test AI-generated code against real production environments using mirrord with Cursor and Windsurf.

## Overview

AI coding assistants like Cursor and Windsurf excel at generating code, but they can't test that code against your actual production environment. This demo shows common scenarios where AI-generated code works locally but fails in production, and how mirrord bridges that gap.

## What This Demo Shows

### 1. Database Schema Mismatches
- **Local assumption**: `SELECT preferences, theme, notifications FROM user_settings`
- **Production reality**: `SELECT user_preferences, display_theme, email_notifications FROM user_settings`

### 2. Environment Variable Differences
- **AI generates**: `process.env.REDIS_HOST`
- **Production uses**: `process.env.REDIS_CLUSTER_HOST`

### 3. API Integration Challenges
- **AI assumes**: Standard API endpoints with basic authentication
- **Production has**: Rate limits, different headers, API versioning

### 4. Performance Under Load
- **Local**: Simple loops work fine
- **Production**: Requires batching and rate limiting

## Getting Started

### Prerequisites

- Node.js 18+
- Kubernetes cluster access (staging/development)
- kubectl configured
- Cursor or Windsurf installed
- mirrord VS Code extension installed

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-mirrord-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Deploy to your cluster**
   ```bash
   # Build and deploy the application
   npm run build
   docker build -t ai-mirrord-demo:latest .
   # Push to your container registry if needed
   # Update k8s/deployment.yaml with your image
   kubectl apply -f k8s/deployment.yaml
   ```

## Using with mirrord

### Setup mirrord Extension

1. **Install mirrord extension** in Cursor or Windsurf
2. **Configure target environment** in `.mirrord/mirrord.json`
3. **Set up launch configuration** in `.vscode/launch.json` (already configured)
4. **Verify cluster is running**:
   ```bash
   kubectl get pods -n staging
   ```

### Testing Scenarios

#### Scenario 1: Database Schema Detection

1. **Generate code with AI**:
   ```
   Prompt: "Create a function to fetch user preferences from the database"
   ```

2. **Test with mirrord**:
   - Click mirrord icon in editor
   - Select staging deployment
   - Run the application
   - Try endpoint: `GET /api/users/123/preferences`

3. **Observe the difference**:
   - Local: Assumes standard column names
   - Production: Uses different schema
   - Code automatically falls back to production schema

#### Scenario 2: Redis Configuration

1. **Generate Redis code with AI**:
   ```
   Prompt: "Create a Redis client for session management"
   ```

2. **Test with mirrord**:
   - Run with mirrord connected to staging
   - Try endpoint: `POST /api/users/123/session`
   - Check environment: `GET /api/debug/env`

3. **Observe the difference**:
   - Local: Uses `REDIS_HOST=localhost`
   - Production: Uses `REDIS_CLUSTER_HOST=redis-cluster.staging.svc.cluster.local`

#### Scenario 3: External API Integration

1. **Generate API integration code**:
   ```
   Prompt: "Create a function to fetch user profile from external API"
   ```

2. **Test with mirrord**:
   - Run with mirrord connected to staging
   - Try endpoint: `GET /api/external/users/123`

3. **Observe the difference**:
   - Local: Simple API calls
   - Production: Different API version, authentication, response format

#### Scenario 4: Batch Processing

1. **Generate batch processing code**:
   ```
   Prompt: "Create a function to send notifications to multiple users"
   ```

2. **Test with mirrord**:
   - Run with mirrord connected to staging
   - Try endpoint: `POST /api/notifications/batch`

3. **Observe the difference**:
   - Local: Simple loop works
   - Production: Requires batching and rate limiting

## Available Endpoints

- `GET /health` - Health check
- `GET /api/users/:id` - Get user profile (demonstrates caching)
- `GET /api/users/:id/preferences` - Get user preferences (demonstrates schema differences)
- `GET /api/external/users/:id` - Get external user profile (demonstrates API differences)
- `POST /api/notifications/batch` - Send batch notifications (demonstrates rate limiting)
- `POST /api/users/:id/session` - Create user session
- `GET /api/users/:id/session` - Get user session
- `GET /api/debug/env` - Show environment configuration

## AI Prompts for Testing

### Initial Code Generation
```
Generate a user authentication service that connects to PostgreSQL and Redis. Include comprehensive error handling and input validation. I'll be testing this with mirrord against our staging environment, which uses connection pooling and Redis clustering.
```

### After mirrord reveals issues
```
I tested this code with mirrord and encountered [specific error]. The production environment shows [actual configuration/behavior]. Please modify the code to handle this specific production scenario.
```

### For performance optimization
```
This code passes mirrord testing but shows latency issues under production load. Our staging environment has [specific constraints]. Optimize for these real-world conditions.
```

## Common Issues and Solutions

### Connection Issues
```bash
# Check if mirrord can connect
mirrord ls

# Verify target exists
kubectl get pods -n staging
```

### Permission Problems
```bash
# Check RBAC permissions
kubectl auth can-i get pods --namespace staging
kubectl auth can-i create pods --namespace staging
```

### Environment Differences
Check the `/api/debug/env` endpoint to see which environment variables are configured differently between local and production.

## Development Workflow

1. **Start with AI code generation** in Cursor/Windsurf
2. **Test locally** first to catch obvious issues
3. **Use mirrord** to test against staging environment
4. **Iterate with AI** based on real environment feedback
5. **Deploy with confidence** knowing code works in production

## Troubleshooting AI Agents

### Preventing Infinite Loops
Set clear constraints in your prompts:
```
"If this fix doesn't resolve the issue after 3 attempts, let's examine the actual environment configuration using mirrord's diagnostic tools instead of continuing to iterate on assumptions."
```

### Providing Effective Context
Be specific about environment differences:
```
"The production environment uses Redis Cluster at redis-cluster.staging.svc.cluster.local:6379, not localhost:6379. Update the connection configuration to use the actual service discovery endpoint."
```

## Files Structure

```
├── src/
│   ├── index.ts              # Main application
│   ├── database.ts           # Database service with schema fallback
│   ├── redis.ts              # Redis service with configuration fallback
│   ├── external-api.ts       # External API service with version fallback
│   └── types.ts              # TypeScript definitions
├── k8s/
│   └── deployment.yaml       # Kubernetes deployment manifests
├── .vscode/
│   └── launch.json           # VS Code debug configuration
├── mirrord.json              # mirrord configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Next Steps

1. **Deploy to your cluster** using the Kubernetes manifests
2. **Configure mirrord** to connect to your environment
3. **Start generating code** with AI assistants
4. **Test immediately** with mirrord
5. **Iterate based on real feedback**

## Learn More

- [mirrord Documentation](https://mirrord.dev/docs)
- [Cursor Documentation](https://cursor.sh/docs)
- [Windsurf Documentation](https://windsurf.ai/docs)

## Contributing

This demo is designed to be educational. Feel free to:
- Add more scenarios
- Improve error handling
- Add more AI prompts
- Enhance documentation

## License

MIT License - feel free to use this as a starting point for your own AI + mirrord experiments! 