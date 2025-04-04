import { 
  OpenHandsConfig, 
  Environment, 
  StorageType, 
  User,
  HttpClient,
  WebSocketClient,
  AuthManager
} from '../types';
import { detectEnvironment, getDefaultStorageType } from '../utils/environment';
import { createHttpClient } from '../adapters/http';
import { createWebSocketClient } from '../adapters/websocket';
import { UniversalAuthManager } from '../auth/auth-manager';
import { ConversationService } from '../api/conversation-service';
import { SessionService } from '../api/session-service';
import { WebSocketManager } from '../websocket/websocket-manager';
import { BotClient } from '../api/bot-client';
import { ExtensionClient } from '../api/extension-client';

/**
 * Main client for the OpenHands Universal SDK
 */
export class OpenHandsClient {
  private config: OpenHandsConfig;
  private environment: Environment;
  private httpClient: HttpClient;
  private wsClient: WebSocketClient;
  private authManager: AuthManager;
  private webSocketManager: WebSocketManager;
  private conversationService: ConversationService;
  private sessionService: SessionService;
  private botClient: BotClient;
  private extensionClient: ExtensionClient;

  constructor(config: OpenHandsConfig) {
    // Detect environment if not specified
    this.environment = config.environment || detectEnvironment();
    
    // Set up configuration
    this.config = {
      apiUrl: config.apiUrl.replace(/\/$/, ''), // Remove trailing slash if present
      wsUrl: config.wsUrl.replace(/\/$/, ''),   // Remove trailing slash if present
      environment: this.environment,
      storage: config.storage || getDefaultStorageType(this.environment),
      debug: config.debug || false,
      customFetch: config.customFetch,
      customWebSocket: config.customWebSocket,
    };
    
    if (this.config.debug) {
      console.log('OpenHands SDK initialized with config:', this.config);
      console.log('Detected environment:', this.environment);
    }
    
    // Create HTTP client
    this.httpClient = createHttpClient(
      this.config.apiUrl,
      this.getAccessToken.bind(this),
      this.refreshToken.bind(this),
      this.config.customFetch
    );
    
    // Create WebSocket client
    this.wsClient = createWebSocketClient(
      this.environment === Environment.CHROME_EXTENSION,
      this.config.customWebSocket
    );
    
    // Create auth manager
    this.authManager = new UniversalAuthManager(this.httpClient, this.config.storage);
    
    // Create WebSocket manager
    this.webSocketManager = new WebSocketManager(
      this.wsClient,
      this.config.wsUrl,
      this.getAccessToken.bind(this)
    );
    
    // Create services
    this.conversationService = new ConversationService(this.httpClient, this.config.apiUrl);
    this.sessionService = new SessionService(this.httpClient);
    
    // Create specialized clients
    this.botClient = new BotClient(this.httpClient, this.conversationService, this.config.apiUrl);
    this.extensionClient = new ExtensionClient(this.conversationService);
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
  onAuthStateChanged(listener: (isAuthenticated: boolean, user: User | null) => void): () => void {
    return this.authManager.onAuthStateChanged(listener);
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
   * Get the bot client
   */
  bot(): BotClient {
    return this.botClient;
  }

  /**
   * Get the extension client
   */
  extension(): ExtensionClient {
    return this.extensionClient;
  }

  /**
   * Get the detected environment
   */
  getEnvironment(): Environment {
    return this.environment;
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