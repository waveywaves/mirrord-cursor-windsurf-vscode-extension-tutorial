import axios, { AxiosInstance } from 'axios';
import { ExternalApiUser } from './types';

export class ExternalApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = this.createClientWithFallback();
  }

  private createClientWithFallback(): AxiosInstance {
    // AI might generate this based on documentation
    const baseURL = process.env.EXTERNAL_API_URL || 'https://api.example.com';
    
    return axios.create({
      baseURL,
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // What AI might generate based on API documentation
  async getUserProfileLocal(userId: string): Promise<ExternalApiUser | null> {
    try {
      const response = await this.client.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  }

  // What production API actually requires (different rate limiting, authentication, etc.)
  async getUserProfileProduction(userId: string): Promise<ExternalApiUser | null> {
    try {
      // Production API requires different headers and has rate limiting
      const response = await this.client.get(`/v2/users/${userId}`, {
        headers: {
          'X-API-Key': process.env.API_KEY,
          'X-Client-Version': '2.0',
          'X-Rate-Limit-Tier': 'premium'
        }
      });
      
      // Production API has different response structure
      return {
        id: response.data.user.id,
        name: response.data.user.displayName,
        email: response.data.user.emailAddress,
        profile: {
          avatar_url: response.data.user.avatar.url,
          bio: response.data.user.bio || ''
        }
      };
    } catch (error) {
      console.error('Failed to fetch user profile from production API:', error);
      return null;
    }
  }

  // Batch processing that might hit rate limits in production
  async sendNotificationsBatch(userIds: string[], message: string): Promise<boolean> {
    try {
      // AI might generate this simple loop
      for (const userId of userIds) {
        await this.sendNotification(userId, message);
      }
      return true;
    } catch (error) {
      console.error('Batch notification failed:', error);
      return false;
    }
  }

  // Production-aware batch processing with rate limiting
  async sendNotificationsBatchProduction(userIds: string[], message: string): Promise<boolean> {
    try {
      // Production requires batching and rate limiting
      const batchSize = 10;
      const delay = 1000; // 1 second between batches
      
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        // Send batch request instead of individual requests
        await this.client.post('/notifications/batch', {
          user_ids: batch,
          message,
          type: 'push'
        });
        
        // Wait between batches to respect rate limits
        if (i + batchSize < userIds.length) {
          await this.sleep(delay);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Production batch notification failed:', error);
      return false;
    }
  }

  private async sendNotification(userId: string, message: string): Promise<void> {
    await this.client.post('/notifications', {
      user_id: userId,
      message,
      type: 'push'
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method that tries to detect which API version is being used
  async getUserProfile(userId: string): Promise<ExternalApiUser | null> {
    try {
      // First try the documented API
      return await this.getUserProfileLocal(userId);
    } catch (error) {
      console.log('Standard API failed, trying production API:', error);
      try {
        // Fallback to production API
        return await this.getUserProfileProduction(userId);
      } catch (prodError) {
        console.error('Both API versions failed:', prodError);
        throw new Error('Unable to fetch user profile - API version mismatch');
      }
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
} 