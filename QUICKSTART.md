# Quick Start Guide: AI + mirrord Demo

Get up and running with AI-generated code testing using mirrord in 5 minutes.

## 1. Prerequisites Check

Before starting, ensure you have:
- ✅ Cursor or Windsurf installed
- ✅ Node.js 18+ installed
- ✅ kubectl configured for your cluster
- ✅ Access to a Kubernetes staging environment

## 2. Install Dependencies

```bash
# Clone and setup
git clone <repository-url>
cd ai-mirrord-demo
npm install

# Install mirrord extension in your editor
# Cursor: Extensions → Search "mirrord" → Install
# Windsurf: Extensions → Search "mirrord" → Install
```

## 3. Deploy to Staging (Optional)

If you want to test against a real environment:

```bash
# Deploy the application to your staging cluster
kubectl apply -f k8s/deployment.yaml

# Verify deployment
kubectl get pods -n staging
kubectl get svc -n staging
```

## 4. First mirrord Test

### Using Cursor

1. **Open the project** in Cursor
2. **Click the mirrord icon** in the activity bar
3. **Select target**: Choose `ai-mirrord-demo` deployment in `staging` namespace
4. **Start debugging**: Press F5 or click "Debug with mirrord"
5. **Test endpoints**:
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/api/debug/env
   ```

### Using Windsurf

1. **Open the project** in Windsurf
2. **Click the mirrord icon** in the sidebar
3. **Configure target**: Select staging environment
4. **Start session**: Click "Start mirroring"
5. **Run application**: `npm run dev`
6. **Test endpoints** (same as above)

## 5. AI Testing Scenarios

### Scenario A: Database Schema Mismatch

1. **Ask your AI**:
   ```
   "Create a function to fetch user preferences from PostgreSQL. 
   Use standard column names like 'preferences', 'theme', 'notifications'."
   ```

2. **Test locally**: Code works fine
3. **Test with mirrord**: 
   ```bash
   curl http://localhost:3000/api/users/123/preferences
   ```
4. **Observe**: Code falls back to production schema automatically

### Scenario B: Redis Configuration

1. **Ask your AI**:
   ```
   "Create a Redis client for session management using standard environment variables."
   ```

2. **Test with mirrord**:
   ```bash
   curl -X POST http://localhost:3000/api/users/123/session \
     -H "Content-Type: application/json" \
     -d '{"theme": "dark", "notifications": true}'
   ```

3. **Check environment**:
   ```bash
   curl http://localhost:3000/api/debug/env
   ```

4. **Observe**: Different Redis configuration in production

### Scenario C: External API Integration

1. **Ask your AI**:
   ```
   "Create a function to fetch user profile from an external API with standard REST patterns."
   ```

2. **Test with mirrord**:
   ```bash
   curl http://localhost:3000/api/external/users/123
   ```

3. **Observe**: Different API version, authentication, response format

## 6. Common Issues

### mirrord Connection Failed
```bash
# Check if target exists
kubectl get pods -n staging

# Verify permissions
kubectl auth can-i get pods --namespace staging
```

### Environment Variables Missing
```bash
# Check what's configured vs what's missing
curl http://localhost:3000/api/debug/env
```

### AI Agent Stuck in Loop
Set clear constraints:
```
"If this doesn't work after 3 attempts, let's examine the actual environment configuration instead of guessing."
```

## 7. Next Steps

1. **Try your own AI prompts** - Generate code for your specific use cases
2. **Test different scenarios** - Database queries, API calls, caching
3. **Iterate with real feedback** - Show AI the actual errors from production
4. **Deploy confidently** - Your code now works in real environments

## 8. Advanced Usage

### Custom mirrord Configuration

Edit `mirrord.json` to customize:
- Environment variables to include/exclude
- File system access patterns
- Network mirroring behavior

### Multiple Environments

Create environment-specific configurations:
```bash
# Test against different environments
mirrord.staging.json
mirrord.production.json
```

### Team Collaboration

Share configurations and best practices:
- Document environment-specific patterns
- Create AI prompt libraries
- Set up team mirrord policies

## Need Help?

- 📖 [Full README](README.md)
- 🔧 [mirrord Documentation](https://mirrord.dev/docs)
- 💬 [Discord Community](https://discord.gg/mirrord)

Happy testing! 🚀 