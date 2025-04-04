import { WebSocketMessage } from '../models/types';
/**
 * WebSocket connection states
 */
export declare enum ConnectionState {
    DISCONNECTED = "disconnected",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    RECONNECTING = "reconnecting",
    ERROR = "error"
}
/**
 * WebSocket manager for real-time communication
 */
export declare class WebSocketManager {
    private ws;
    private url;
    private tokenProvider;
    private connectionState;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectTimeout;
    private pingInterval;
    private messageListeners;
    private stateChangeListeners;
    constructor(url: string, tokenProvider: () => Promise<string | null>);
    /**
     * Connect to a conversation WebSocket
     */
    connectToConversation(conversationId: string): Promise<void>;
    /**
     * Connect to a session WebSocket
     */
    connectToSession(sessionId: string): Promise<void>;
    /**
     * Connect to a WebSocket URL
     */
    private connect;
    /**
     * Disconnect from the WebSocket
     */
    disconnect(): void;
    /**
     * Send a message through the WebSocket
     */
    sendMessage(message: WebSocketMessage): Promise<void>;
    /**
     * Send a user message
     */
    sendUserMessage(content: string): Promise<void>;
    /**
     * Send a chat message (for session side chat)
     */
    sendChatMessage(content: string, parentId?: string): Promise<void>;
    /**
     * Send cursor position update
     */
    sendCursorPosition(position: {
        x: number;
        y: number;
    }): Promise<void>;
    /**
     * Add a message listener
     */
    addMessageListener(listener: (message: WebSocketMessage) => void): () => void;
    /**
     * Add a connection state change listener
     */
    addStateChangeListener(listener: (state: ConnectionState) => void): () => void;
    /**
     * Get the current connection state
     */
    getConnectionState(): ConnectionState;
    /**
     * Handle WebSocket open event
     */
    private handleOpen;
    /**
     * Handle WebSocket message event
     */
    private handleMessage;
    /**
     * Handle WebSocket close event
     */
    private handleClose;
    /**
     * Handle WebSocket error event
     */
    private handleError;
    /**
     * Attempt to reconnect to the WebSocket
     */
    private attemptReconnect;
    /**
     * Update the connection state and notify listeners
     */
    private updateConnectionState;
}
//# sourceMappingURL=websocket-manager.d.ts.map