import { AuthManager, AuthResponse, User, StorageType, CustomStorageAdapter } from '../types';
import { createStorageAdapter } from '../adapters/storage';
import { HttpClient } from '../types';

// Storage keys
const ACCESS_TOKEN_KEY = 'openhands_access_token';
const REFRESH_TOKEN_KEY = 'openhands_refresh_token';
const USER_KEY = 'openhands_user';

/**
 * Universal auth manager implementation
 */
export class UniversalAuthManager implements AuthManager {
  private storage: ReturnType<typeof createStorageAdapter>;
  private httpClient: HttpClient;
  private currentUser: User | null = null;
  private authStateListeners: ((isAuthenticated: boolean, user: User | null) => void)[] = [];

  constructor(
    httpClient: HttpClient,
    storageType: StorageType | CustomStorageAdapter = StorageType.MEMORY
  ) {
    this.httpClient = httpClient;
    this.storage = createStorageAdapter(storageType);
  }

  /**
   * Initialize the auth manager by loading the user from storage
   */
  async initialize(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return false;
      }

      const userJson = await this.storage.getItem(USER_KEY);
      if (userJson) {
        this.currentUser = JSON.parse(userJson);
        this.notifyListeners();
        return true;
      }

      return false;
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
      const response = await this.httpClient.post<AuthResponse>('/auth/signin', {
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
      const response = await this.httpClient.post<AuthResponse>('/auth/signup', {
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
        await this.httpClient.post('/auth/signout', {});
      } catch (e) {
        // Ignore errors from the signout endpoint
      }

      // Clear tokens and user data
      await this.storage.removeItem(ACCESS_TOKEN_KEY);
      await this.storage.removeItem(REFRESH_TOKEN_KEY);
      await this.storage.removeItem(USER_KEY);
      
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
      const refreshToken = await this.storage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        return null;
      }

      const response = await this.httpClient.post<AuthResponse>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      await this.storage.setItem(ACCESS_TOKEN_KEY, response.access_token);
      await this.storage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
      
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
    return this.storage.getItem(ACCESS_TOKEN_KEY);
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
    const token = await this.getAccessToken();
    return !!token;
  }

  /**
   * Add a listener for auth state changes
   */
  onAuthStateChanged(listener: (isAuthenticated: boolean, user: User | null) => void): () => void {
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
    await this.storage.setItem(ACCESS_TOKEN_KEY, response.access_token);
    await this.storage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
    await this.storage.setItem(USER_KEY, JSON.stringify(response.user));
    
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