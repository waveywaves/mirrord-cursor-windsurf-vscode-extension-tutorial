export interface UserPreferences {
  preferences: any;
  theme: string;
  notifications: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: Date;
  preferences?: UserPreferences;
}

export interface NotificationRequest {
  userId: string;
  message: string;
  type: 'email' | 'push' | 'sms';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ExternalApiUser {
  id: string;
  name: string;
  email: string;
  profile: {
    avatar_url: string;
    bio: string;
  };
} 