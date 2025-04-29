import { OpenHandsConfig, User } from './models/types';
import { ConversationService } from './api/conversation-service';
import { SessionService } from './api/session-service';
import { WebSocketManager } from './websocket/websocket-manager';
/**
 * Main client for the OpenHands SDK
 */
export declare class OpenHandsClient {
    private config;
    private apiClient;
    private authManager;
    private conversationService;
    private sessionService;
    private webSocketManager;
    constructor(config: OpenHandsConfig);
    /**
     * Initialize the client
     */
    initialize(): Promise<boolean>;
    /**
     * Sign in with email and password
     */
    signIn(email: string, password: string): Promise<User>;
    /**
     * Sign up with email, password, and name
     */
    signUp(email: string, password: string, name: string): Promise<User>;
    /**
     * Sign out the current user
     */
    signOut(): Promise<void>;
    /**
     * Get the current user
     */
    getCurrentUser(): User | null;
    /**
     * Check if the user is authenticated
     */
    isAuthenticated(): Promise<boolean>;
    /**
     * Add a listener for auth state changes
     */
    addAuthStateListener(listener: (isAuthenticated: boolean, user: User | null) => void): () => void;
    /**
     * Get the conversation service
     */
    conversations(): ConversationService;
    /**
     * Get the session service
     */
    sessions(): SessionService;
    /**
     * Get the WebSocket manager
     */
    getWebSocketManager(): WebSocketManager;
    /**
     * Get the access token
     */
    private getAccessToken;
    /**
     * Refresh the access token
     */
    private refreshToken;
}
//# sourceMappingURL=OpenHandsClient.d.ts.map