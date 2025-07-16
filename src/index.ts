import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { DatabaseService } from './database';
import { RedisService } from './redis';
import { ExternalApiService } from './external-api';
import { ApiResponse, User, UserPreferences } from './types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const dbService = new DatabaseService();
const redisService = new RedisService();
const externalApiService = new ExternalApiService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const isExternalApiHealthy = await externalApiService.checkHealth();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        external_api: isExternalApiHealthy ? 'healthy' : 'unhealthy'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user preferences - demonstrates database schema mismatch issues
app.get('/api/users/:id/preferences', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    
    // This will try local schema first, then fall back to production schema
    const preferences = await dbService.getUserPreferences(userId);
    
    if (!preferences) {
      return res.status(404).json({
        success: false,
        error: 'User preferences not found'
      });
    }
    
    const response: ApiResponse<UserPreferences> = {
      success: true,
      data: preferences
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch preferences'
    });
  }
});

// Get user profile with caching - demonstrates Redis configuration issues
app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    
    // Check cache first
    const cachedUser = await redisService.get(`user:${userId}`);
    if (cachedUser) {
      return res.json({
        success: true,
        data: JSON.parse(cachedUser),
        cached: true
      });
    }
    
    // Get from database (this will try both local and production schemas)
    const user = await dbService.getUserByIdProduction(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Cache the result
    await redisService.set(`user:${userId}`, JSON.stringify(user), 300); // 5 minutes
    
    const response: ApiResponse<User> = {
      success: true,
      data: user
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user'
    });
  }
});

// Get external user profile - demonstrates API integration challenges
app.get('/api/external/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    
    // This will try documented API first, then fall back to production API
    const userProfile = await externalApiService.getUserProfile(userId);
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'External user profile not found'
      });
    }
    
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Error fetching external user profile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch external profile'
    });
  }
});

// Batch notifications - demonstrates rate limiting issues
app.post('/api/notifications/batch', async (req: Request, res: Response) => {
  try {
    const { user_ids, message } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids) || !message) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: user_ids (array) and message are required'
      });
    }
    
    // This will try simple batch first, then fall back to production-aware batching
    const success = await externalApiService.sendNotificationsBatchProduction(user_ids, message);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notifications sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send notifications'
      });
    }
  } catch (error) {
    console.error('Error sending batch notifications:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notifications'
    });
  }
});

// Session management - demonstrates Redis session handling
app.post('/api/users/:id/session', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const sessionData = req.body;
    
    await redisService.setUserSession(userId, sessionData);
    
    res.json({
      success: true,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session'
    });
  }
});

app.get('/api/users/:id/session', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    
    const sessionData = await redisService.getUserSession(userId);
    
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch session'
    });
  }
});

// Environment info endpoint - shows configuration differences
app.get('/api/debug/env', async (req: Request, res: Response) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    database_url: process.env.DATABASE_URL ? '[CONFIGURED]' : '[MISSING]',
    redis_host: process.env.REDIS_HOST || '[MISSING]',
    redis_cluster_host: process.env.REDIS_CLUSTER_HOST || '[MISSING]',
    api_key: process.env.API_KEY ? '[CONFIGURED]' : '[MISSING]',
    external_api_url: process.env.EXTERNAL_API_URL || '[MISSING]'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  
  await Promise.all([
    dbService.close(),
    redisService.close()
  ]);
  
  process.exit(0);
});

// Initialize services and start server
async function startServer() {
  try {
    // Connect to Redis
    await redisService.connect();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('Ready to test with mirrord!');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 