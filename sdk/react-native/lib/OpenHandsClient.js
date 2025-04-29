"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenHandsClient = void 0;
const api_client_1 = require("./api/api-client");
const auth_manager_1 = require("./auth/auth-manager");
const conversation_service_1 = require("./api/conversation-service");
const session_service_1 = require("./api/session-service");
const websocket_manager_1 = require("./websocket/websocket-manager");
/**
 * Main client for the OpenHands SDK
 */
class OpenHandsClient {
    constructor(config) {
        this.config = {
            apiUrl: config.apiUrl.replace(/\/$/, ''), // Remove trailing slash if present
            wsUrl: config.wsUrl.replace(/\/$/, ''), // Remove trailing slash if present
            storage: config.storage || 'keychain',
        };
        // Create API client
        this.apiClient = new api_client_1.ApiClient(this.config.apiUrl, this.getAccessToken.bind(this), this.refreshToken.bind(this));
        // Create auth manager
        this.authManager = new auth_manager_1.AuthManager(this.apiClient, this.config.storage);
        // Create services
        this.conversationService = new conversation_service_1.ConversationService(this.apiClient);
        this.sessionService = new session_service_1.SessionService(this.apiClient);
        // Create WebSocket manager
        this.webSocketManager = new websocket_manager_1.WebSocketManager(this.config.wsUrl, this.getAccessToken.bind(this));
    }
    /**
     * Initialize the client
     */
    async initialize() {
        return this.authManager.initialize();
    }
    /**
     * Sign in with email and password
     */
    async signIn(email, password) {
        return this.authManager.signIn(email, password);
    }
    /**
     * Sign up with email, password, and name
     */
    async signUp(email, password, name) {
        return this.authManager.signUp(email, password, name);
    }
    /**
     * Sign out the current user
     */
    async signOut() {
        return this.authManager.signOut();
    }
    /**
     * Get the current user
     */
    getCurrentUser() {
        return this.authManager.getCurrentUser();
    }
    /**
     * Check if the user is authenticated
     */
    async isAuthenticated() {
        return this.authManager.isAuthenticated();
    }
    /**
     * Add a listener for auth state changes
     */
    addAuthStateListener(listener) {
        return this.authManager.addAuthStateListener(listener);
    }
    /**
     * Get the conversation service
     */
    conversations() {
        return this.conversationService;
    }
    /**
     * Get the session service
     */
    sessions() {
        return this.sessionService;
    }
    /**
     * Get the WebSocket manager
     */
    getWebSocketManager() {
        return this.webSocketManager;
    }
    /**
     * Get the access token
     */
    async getAccessToken() {
        return this.authManager.getAccessToken();
    }
    /**
     * Refresh the access token
     */
    async refreshToken() {
        return this.authManager.refreshToken();
    }
}
exports.OpenHandsClient = OpenHandsClient;
//# sourceMappingURL=OpenHandsClient.js.map