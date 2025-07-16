# Testing Guide: AI + mirrord Demo

## 🎉 Environment Ready!

Your demo environment is now running and ready for testing AI-generated code with mirrord!

## 📊 Current Setup

### Cluster Status
```bash
kubectl get pods -n staging
# You should see:
# - ai-mirrord-demo pods: Running (2/2)
# - postgres: Running (1/1) 
# - redis-cluster: Running (1/1)
```

### Application Status
- **Health Check**: `curl http://localhost:8081/health`
- **Environment Info**: `curl http://localhost:8081/api/debug/env`

The environment debug endpoint shows the key difference:
- `redis_host`: `[MISSING]` (what AI assumes)
- `redis_cluster_host`: `redis-cluster.staging.svc.cluster.local` (what actually exists)

## ✅ mirrord CLI Test Results

**Validated!** The mirrord CLI test confirms our setup works perfectly:

**Without mirrord (local):**
```
DATABASE_URL: [MISSING]
REDIS_HOST: [MISSING] 
REDIS_CLUSTER_HOST: [MISSING]
API_KEY: [MISSING]
```

**With mirrord (staging environment):**
```
DATABASE_URL: [CONFIGURED]
REDIS_CLUSTER_HOST: redis-cluster.staging.svc.cluster.local
REDIS_CLUSTER_PORT: 6379
API_KEY: [CONFIGURED]
EXTERNAL_API_URL: https://api.production.example.com
```

This proves that mirrord successfully bridges the gap between AI assumptions and production reality!

## 🚀 Testing with Cursor/Windsurf

### 1. Open in Your AI Editor

1. **Open this project** in Cursor or Windsurf
2. **Install mirrord extension** (if not already installed)
3. **Verify mirrord config** is in `.mirrord/mirrord.json`

### 2. Start mirrord Session

#### In Cursor:
1. Click the **mirrord icon** in activity bar
2. Select **target**: `ai-mirrord-demo` deployment in `staging` namespace
3. Press **F5** to start debugging with mirrord

#### In Windsurf:
1. Click the **mirrord icon** in sidebar
2. Configure **target environment**
3. Start **mirroring session**
4. Run `npm run dev`

### 3. AI Code Testing Scenarios

#### Scenario A: Redis Configuration Discovery

**Ask your AI:**
```
"Create a Redis client for session management. Use standard environment variables like REDIS_HOST and REDIS_PORT."
```

**What happens:**
- AI generates code using `REDIS_HOST=localhost`
- When you run with mirrord, it uses `REDIS_CLUSTER_HOST=redis-cluster.staging.svc.cluster.local`
- Code automatically adapts to production configuration

**Test it:**
```bash
# Your local code will connect to the real Redis in staging
curl http://localhost:3000/api/users/123/session
```

#### Scenario B: Database Schema Differences

**Ask your AI:**
```
"Create a function to fetch user preferences from PostgreSQL using standard column names."
```

**What happens:**
- AI assumes columns like `preferences`, `theme`, `notifications`
- Production might use `user_preferences`, `display_theme`, `email_notifications`
- Our demo code shows fallback logic handling both schemas

**Test it:**
```bash
curl http://localhost:3000/api/users/123/preferences
```

#### Scenario C: Environment Variable Discovery

**Ask your AI:**
```
"Show me the environment configuration for this application."
```

**Test the difference:**
```bash
# Without mirrord (local)
NODE_ENV=development npm run dev
curl http://localhost:3000/api/debug/env

# With mirrord (staging environment)
# Use the debugger in Cursor/Windsurf with mirrord enabled
curl http://localhost:3000/api/debug/env
```

### 4. CLI Testing (Alternative)

You can also test directly with mirrord CLI:

```bash
# Test environment discovery
mirrord exec --config-file .mirrord/mirrord.json --target deployment/ai-mirrord-demo -- node -e "
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'CONFIGURED' : 'MISSING');
console.log('REDIS_CLUSTER_HOST:', process.env.REDIS_CLUSTER_HOST || 'MISSING');
"

# Run your application with mirrord
mirrord exec --config-file .mirrord/mirrord.json --target deployment/ai-mirrord-demo -- npm run dev
```

### 5. Iteration Workflow

1. **Generate code** with AI based on assumptions
2. **Test with mirrord** (via VS Code extension or CLI) → discover environment differences
3. **Share errors with AI**: 
   ```
   "I tested this with mirrord and got this error: [paste error]. 
   The production environment uses REDIS_CLUSTER_HOST instead of REDIS_HOST. 
   Please update the code to handle this."
   ```
4. **AI fixes the code** based on real environment feedback
5. **Test again** → verify it works
6. **Deploy with confidence**

## 🔧 Available Endpoints for Testing

- `GET /health` - Health check
- `GET /api/debug/env` - Environment configuration
- `GET /api/users/:id` - User profile (with Redis caching)
- `GET /api/users/:id/preferences` - User preferences (database schema demo)
- `POST /api/users/:id/session` - Create session (Redis demo)
- `GET /api/users/:id/session` - Get session
- `GET /api/external/users/:id` - External API integration
- `POST /api/notifications/batch` - Batch processing (rate limiting demo)

## 🎯 Key Learning Points

### What AI Typically Generates:
- `REDIS_HOST=localhost`
- Standard column names
- Simple API patterns
- Basic environment assumptions

### What Production Actually Has:
- `REDIS_CLUSTER_HOST=redis-cluster.staging.svc.cluster.local`
- Different schema conventions
- Rate limiting and authentication complexities
- Service mesh networking

### How mirrord Bridges the Gap:
- Exposes real environment variables
- Provides access to actual services
- Reveals production networking
- Enables testing with real data patterns

## 🧹 Cleanup

When done testing:
```bash
# Stop port forwarding
pkill -f "kubectl port-forward"

# Keep the cluster running for future tests
# Or clean up completely:
# kubectl delete namespace staging
```

## 🚀 Next Steps

1. Try generating your own AI code for different scenarios
2. Test database queries, API integrations, caching logic
3. Show the AI real production errors and iterate
4. Experience the confidence of knowing your code works before deployment

**You're now ready to ship AI code with production confidence! 🎉** 