import { AuthResponse, User } from '../models/types';
import { createTokenStorage, TokenStorage } from './storage';
import { ApiClient } from '../api/api-client';

/**
 * Manages authentication state and operations
 */
export class AuthManager {
  private storage: TokenStorage;
  private apiClient: ApiClient;
  private currentUser: User | null = null;
  private authStateListeners: ((isAuthenticated: boolean, user: User | null) => void)[] = [];

  constructor(
    apiClient: ApiClient,
    storageType: 'keychain' | 'async-storage' = 'keychain'
  ) {
    this.apiClient = apiClient;
    this.storage = createTokenStorage(storageType);
  }

  /**
   * Initialize the auth manager by loading the user from storage
   */
  async initialize(): Promise<boolean> {
    try {
      const accessToken = await this.storage.getAccessToken();
      if (!accessToken) {
        return false;
      }

      this.currentUser = await this.storage.getUser();
      this.notifyListeners();
      return !!this.currentUser;
    } catch (error) {
      console.error('Error initializing auth manager:', error);
      return false;
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<User> {
    try {
      const response = await this.apiClient.post<AuthResponse>('/auth/signin', {
        email,
        password,
      });

      await this.handleAuthResponse(response);
      return response.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign up with email, password, and name
   */
  async signUp(email: string, password: string, name: string): Promise<User> {
    try {
      const response = await this.apiClient.post<AuthResponse>('/auth/signup', {
        email,
        password,
        name,
      });

      await this.handleAuthResponse(response);
      return response.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      // Call the sign out endpoint if available
      try {
        await this.apiClient.post('/auth/signout', {});
      } catch (e) {
        // Ignore errors from the signout endpoint
      }

      // Clear tokens and user data
      await this.storage.clearTokens();
      this.currentUser = null;
      this.notifyListeners();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await this.storage.getRefreshToken();
      if (!refreshToken) {
        return null;
      }

      const response = await this.apiClient.post<AuthResponse>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      await this.storage.saveTokens(response.access_token, response.refresh_token);
      return response.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Get the current access token
   */
  async getAccessToken(): Promise<string | null> {
    return this.storage.getAccessToken();
  }

  /**
   * Get the current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if the user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.storage.getAccessToken();
    return !!token;
  }

  /**
   * Add a listener for auth state changes
   */
  addAuthStateListener(listener: (isAuthenticated: boolean, user: User | null) => void): () => void {
    this.authStateListeners.push(listener);
    
    // Return a function to remove the listener
    return () => {
      this.authStateListeners = this.authStateListeners.filter(l => l !== listener);
    };
  }

  /**
   * Handle the authentication response
   */
  private async handleAuthResponse(response: AuthResponse): Promise<void> {
    await this.storage.saveTokens(response.access_token, response.refresh_token);
    await this.storage.saveUser(response.user);
    this.currentUser = response.user;
    this.notifyListeners();
  }

  /**
   * Notify all listeners of auth state changes
   */
  private notifyListeners(): void {
    const isAuthenticated = !!this.currentUser;
    this.authStateListeners.forEach(listener => {
      listener(isAuthenticated, this.currentUser);
    });
  }
}