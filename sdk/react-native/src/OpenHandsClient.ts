import { OpenHandsConfig, User } from './models/types';
import { ApiClient } from './api/api-client';
import { AuthManager } from './auth/auth-manager';
import { ConversationService } from './api/conversation-service';
import { SessionService } from './api/session-service';
import { WebSocketManager } from './websocket/websocket-manager';

/**
 * Main client for the OpenHands SDK
 */
export class OpenHandsClient {
  private config: OpenHandsConfig;
  private apiClient: ApiClient;
  private authManager: AuthManager;
  private conversationService: ConversationService;
  private sessionService: SessionService;
  private webSocketManager: WebSocketManager;

  constructor(config: OpenHandsConfig) {
    this.config = {
      apiUrl: config.apiUrl.replace(/\/$/, ''), // Remove trailing slash if present
      wsUrl: config.wsUrl.replace(/\/$/, ''),   // Remove trailing slash if present
      storage: config.storage || 'keychain',
    };

    // Create API client
    this.apiClient = new ApiClient(
      this.config.apiUrl,
      this.getAccessToken.bind(this),
      this.refreshToken.bind(this)
    );

    // Create auth manager
    this.authManager = new AuthManager(this.apiClient, this.config.storage);

    // Create services
    this.conversationService = new ConversationService(this.apiClient);
    this.sessionService = new SessionService(this.apiClient);

    // Create WebSocket manager
    this.webSocketManager = new WebSocketManager(
      this.config.wsUrl,
      this.getAccessToken.bind(this)
    );
  }

  /**
   * Initialize the client
   */
  async initialize(): Promise<boolean> {
    return this.authManager.initialize();
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<User> {
    return this.authManager.signIn(email, password);
  }

  /**
   * Sign up with email, password, and name
   */
  async signUp(email: string, password: string, name: string): Promise<User> {
    return this.authManager.signUp(email, password, name);
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    return this.authManager.signOut();
  }

  /**
   * Get the current user
   */
  getCurrentUser(): User | null {
    return this.authManager.getCurrentUser();
  }

  /**
   * Check if the user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return this.authManager.isAuthenticated();
  }

  /**
   * Add a listener for auth state changes
   */
  addAuthStateListener(listener: (isAuthenticated: boolean, user: User | null) => void): () => void {
    return this.authManager.addAuthStateListener(listener);
  }

  /**
   * Get the conversation service
   */
  conversations(): ConversationService {
    return this.conversationService;
  }

  /**
   * Get the session service
   */
  sessions(): SessionService {
    return this.sessionService;
  }

  /**
   * Get the WebSocket manager
   */
  getWebSocketManager(): WebSocketManager {
    return this.webSocketManager;
  }

  /**
   * Get the access token
   */
  private async getAccessToken(): Promise<string | null> {
    return this.authManager.getAccessToken();
  }

  /**
   * Refresh the access token
   */
  private async refreshToken(): Promise<string | null> {
    return this.authManager.refreshToken();
  }
}