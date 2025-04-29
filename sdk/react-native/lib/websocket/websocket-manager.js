"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketManager = exports.ConnectionState = void 0;
const types_1 = require("../models/types");
/**
 * WebSocket connection states
 */
var ConnectionState;
(function (ConnectionState) {
    ConnectionState["DISCONNECTED"] = "disconnected";
    ConnectionState["CONNECTING"] = "connecting";
    ConnectionState["CONNECTED"] = "connected";
    ConnectionState["RECONNECTING"] = "reconnecting";
    ConnectionState["ERROR"] = "error";
})(ConnectionState || (exports.ConnectionState = ConnectionState = {}));
/**
 * WebSocket manager for real-time communication
 */
class WebSocketManager {
    constructor(url, tokenProvider) {
        this.ws = null;
        this.connectionState = ConnectionState.DISCONNECTED;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        this.pingInterval = null;
        this.messageListeners = [];
        this.stateChangeListeners = [];
        this.url = url;
        this.tokenProvider = tokenProvider;
    }
    /**
     * Connect to a conversation WebSocket
     */
    async connectToConversation(conversationId) {
        await this.connect(`${this.url}/ws/conversations/${conversationId}`);
    }
    /**
     * Connect to a session WebSocket
     */
    async connectToSession(sessionId) {
        await this.connect(`${this.url}/ws/sessions/${sessionId}`);
    }
    /**
     * Connect to a WebSocket URL
     */
    async connect(url) {
        // Close any existing connection
        this.disconnect();
        // Update state
        this.updateConnectionState(ConnectionState.CONNECTING);
        try {
            // Create a new WebSocket connection
            this.ws = new WebSocket(url);
            // Set up event handlers
            this.ws.onopen = this.handleOpen.bind(this);
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onclose = this.handleClose.bind(this);
            this.ws.onerror = this.handleError.bind(this);
        }
        catch (error) {
            console.error('WebSocket connection error:', error);
            this.updateConnectionState(ConnectionState.ERROR);
            this.attemptReconnect();
        }
    }
    /**
     * Disconnect from the WebSocket
     */
    disconnect() {
        if (this.ws) {
            // Remove event handlers
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onclose = null;
            this.ws.onerror = null;
            // Close the connection
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close();
            }
            this.ws = null;
        }
        // Clear intervals and timeouts
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        // Update state if not already disconnected
        if (this.connectionState !== ConnectionState.DISCONNECTED) {
            this.updateConnectionState(ConnectionState.DISCONNECTED);
        }
    }
    /**
     * Send a message through the WebSocket
     */
    async sendMessage(message) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }
        this.ws.send(JSON.stringify(message));
    }
    /**
     * Send a user message
     */
    async sendUserMessage(content) {
        await this.sendMessage({
            type: types_1.WebSocketMessageType.USER_MESSAGE,
            content,
        });
    }
    /**
     * Send a chat message (for session side chat)
     */
    async sendChatMessage(content, parentId) {
        await this.sendMessage({
            type: types_1.WebSocketMessageType.CHAT_MESSAGE,
            content,
            parent_id: parentId,
        });
    }
    /**
     * Send cursor position update
     */
    async sendCursorPosition(position) {
        await this.sendMessage({
            type: types_1.WebSocketMessageType.CURSOR_POSITION,
            position,
        });
    }
    /**
     * Add a message listener
     */
    addMessageListener(listener) {
        this.messageListeners.push(listener);
        // Return a function to remove the listener
        return () => {
            this.messageListeners = this.messageListeners.filter(l => l !== listener);
        };
    }
    /**
     * Add a connection state change listener
     */
    addStateChangeListener(listener) {
        this.stateChangeListeners.push(listener);
        // Return a function to remove the listener
        return () => {
            this.stateChangeListeners = this.stateChangeListeners.filter(l => l !== listener);
        };
    }
    /**
     * Get the current connection state
     */
    getConnectionState() {
        return this.connectionState;
    }
    /**
     * Handle WebSocket open event
     */
    async handleOpen() {
        console.log('WebSocket connected');
        this.updateConnectionState(ConnectionState.CONNECTED);
        this.reconnectAttempts = 0;
        // Send authentication message
        const token = await this.tokenProvider();
        if (token) {
            await this.sendMessage({
                type: types_1.WebSocketMessageType.AUTHENTICATE,
                token,
            });
        }
        // Set up ping interval to keep the connection alive
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.sendMessage({ type: types_1.WebSocketMessageType.PING });
            }
        }, 30000); // Send ping every 30 seconds
    }
    /**
     * Handle WebSocket message event
     */
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            // Notify all listeners
            this.messageListeners.forEach(listener => {
                listener(data);
            });
        }
        catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }
    /**
     * Handle WebSocket close event
     */
    handleClose(event) {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
        // Update state
        this.updateConnectionState(ConnectionState.DISCONNECTED);
        // Attempt to reconnect if the close wasn't intentional
        if (event.code !== 1000) {
            this.attemptReconnect();
        }
    }
    /**
     * Handle WebSocket error event
     */
    handleError(error) {
        console.error('WebSocket error:', error);
        this.updateConnectionState(ConnectionState.ERROR);
    }
    /**
     * Attempt to reconnect to the WebSocket
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnect attempts reached');
            return;
        }
        this.reconnectAttempts++;
        this.updateConnectionState(ConnectionState.RECONNECTING);
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
        this.reconnectTimeout = setTimeout(() => {
            if (this.ws && this.ws.url) {
                this.connect(this.ws.url);
            }
        }, delay);
    }
    /**
     * Update the connection state and notify listeners
     */
    updateConnectionState(state) {
        this.connectionState = state;
        // Notify all listeners
        this.stateChangeListeners.forEach(listener => {
            listener(state);
        });
    }
}
exports.WebSocketManager = WebSocketManager;
//# sourceMappingURL=websocket-manager.js.map