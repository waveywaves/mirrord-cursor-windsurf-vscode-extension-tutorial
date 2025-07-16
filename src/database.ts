import { Pool } from 'pg';
import { User, UserPreferences } from './types';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  // This is what AI might generate based on local schema assumptions
  async getUserPreferencesLocal(userId: string): Promise<UserPreferences | null> {
    const query = `
      SELECT preferences, theme, notifications 
      FROM user_settings 
      WHERE user_id = $1 AND active = true
    `;
    
    const result = await this.pool.query(query, [userId]);
    
    if (!result.rows.length) {
      return null;
    }
    
    return {
      preferences: result.rows[0].preferences,
      theme: result.rows[0].theme || 'light',
      notifications: result.rows[0].notifications || true
    };
  }

  // This is what actually works in production (different column names)
  async getUserPreferencesProduction(userId: string): Promise<UserPreferences | null> {
    const query = `
      SELECT user_preferences, display_theme, email_notifications 
      FROM user_settings 
      WHERE user_id = $1 AND active = true
    `;
    
    const result = await this.pool.query(query, [userId]);
    
    if (!result.rows.length) {
      return null;
    }
    
    return {
      preferences: result.rows[0].user_preferences,
      theme: result.rows[0].display_theme || 'light',
      notifications: result.rows[0].email_notifications !== false
    };
  }

  // AI might generate this based on standard assumptions
  async getUserByIdLocal(userId: string): Promise<User | null> {
    const query = `
      SELECT id, username, email, created_at
      FROM users 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [userId]);
    
    if (!result.rows.length) {
      return null;
    }
    
    return result.rows[0];
  }

  // Production might have different constraints and indexes
  async getUserByIdProduction(userId: string): Promise<User | null> {
    // Production uses UUID and has different table structure
    const query = `
      SELECT user_id as id, user_name as username, email_address as email, registration_date as created_at
      FROM user_accounts 
      WHERE user_id = $1 AND status = 'active'
    `;
    
    const result = await this.pool.query(query, [userId]);
    
    if (!result.rows.length) {
      return null;
    }
    
    return {
      id: result.rows[0].id,
      username: result.rows[0].username,
      email: result.rows[0].email,
      created_at: result.rows[0].created_at
    };
  }

  // Method that tries to detect which schema is being used
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      // First try the local/assumed schema
      return await this.getUserPreferencesLocal(userId);
    } catch (error) {
      console.log('Local schema failed, trying production schema:', error);
      try {
        // Fallback to production schema
        return await this.getUserPreferencesProduction(userId);
      } catch (prodError) {
        console.error('Both schemas failed:', prodError);
        throw new Error('Unable to fetch user preferences - schema mismatch');
      }
    }
  }

  async close() {
    await this.pool.end();
  }
} 