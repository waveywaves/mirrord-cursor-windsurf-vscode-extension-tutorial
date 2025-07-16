import { createClient, RedisClientType } from 'redis';

export class RedisService {
  private client: RedisClientType;

  constructor() {
    // Check for production environment variables first (mirrord case)
    if (process.env.REDIS_CLUSTER_HOST) {
      console.log('Using production Redis configuration (REDIS_CLUSTER_HOST found)');
      this.client = createClient(this.getProductionRedisConfig());
    } else {
      // For local development, try fallback logic
      console.log('Using local Redis configuration (REDIS_CLUSTER_HOST not found)');
      this.client = this.createClientWithFallback();
    }
  }

  private createClientWithFallback(): RedisClientType {
    // First try what AI typically generates
    let connectionConfig = this.getLocalRedisConfig();
    
    try {
      return createClient(connectionConfig);
    } catch (error) {
      console.log('Local Redis config failed, trying production config:', error);
      // Fallback to production configuration
      connectionConfig = this.getProductionRedisConfig();
      return createClient(connectionConfig);
    }
  }

  // What AI might generate based on standard Redis setup
  private getLocalRedisConfig() {
    return {
      url: `redis://${process.env.REDIS_PASSWORD ? ':' + process.env.REDIS_PASSWORD + '@' : ''}${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`
    };
  }

  // What production environment actually uses
  private getProductionRedisConfig() {
    return {
      url: `redis://:${process.env.REDIS_CLUSTER_PASSWORD || 'redis-demo-password'}@${process.env.REDIS_CLUSTER_HOST || 'redis-cluster.staging.svc.cluster.local'}:${process.env.REDIS_CLUSTER_PORT || '6379'}`
    };
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Redis connection failed:', error);
      throw error;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error('Redis SET failed:', error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET failed:', error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL failed:', error);
      throw error;
    }
  }

  async setUserSession(userId: string, sessionData: any): Promise<void> {
    const key = `user:${userId}:session`;
    await this.set(key, JSON.stringify(sessionData), 3600); // 1 hour TTL
  }

  async getUserSession(userId: string): Promise<any | null> {
    const key = `user:${userId}:session`;
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
} 