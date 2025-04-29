import { WebSocketClient, WebSocketMessage, WebSocketMessageType } from '../types';

/**
 * Connection states for the WebSocket
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * Manager for WebSocket connections
 */
export class WebSocketManager {
  private wsClient: WebSocketClient;
  private baseUrl: string;
  private tokenProvider: () => Promise<string | null>;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private messageListeners: ((message: WebSocketMessage) => void)[] = [];
  private stateChangeListeners: ((state: ConnectionState) => void)[] = [];
  private currentUrl: string | null = null;

  constructor(wsClient: WebSocketClient, baseUrl: string, tokenProvider: () => Promise<string | null>) {
    this.wsClient = wsClient;
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash if present
    this.tokenProvider = tokenProvider;
    
    // Set up WebSocket event handlers
    this.wsClient.onOpen(this.handleOpen.bind(this));
    this.wsClient.onMessage(this.handleMessage.bind(this));
    this.wsClient.onClose(this.handleClose.bind(this));
    this.wsClient.onError(this.handleError.bind(this));
  }

  /**
   * Connect to a conversation WebSocket
   */
  async connectToConversation(conversationId: string): Promise<void> {
    const url = `${this.baseUrl}/ws/conversations/${conversationId}`;
    await this.connect(url);
  }

  /**
   * Connect to a session WebSocket
   */
  async connectToSession(sessionId: string): Promise<void> {
    const url = `${this.baseUrl}/ws/sessions/${sessionId}`;
    await this.connect(url);
  }

  /**
   * Connect to a WebSocket URL
   */
  private async connect(url: string): Promise<void> {
    // Close any existing connection
    this.disconnect();
    
    // Update state
    this.updateConnectionState(ConnectionState.CONNECTING);
    this.currentUrl = url;
    
    try {
      // Connect to the WebSocket
      await this.wsClient.connect(url);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.updateConnectionState(ConnectionState.ERROR);
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    this.wsClient.disconnect();
    
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
    
    this.currentUrl = null;
  }

  /**
   * Send a message through the WebSocket
   */
  async sendMessage(message: WebSocketMessage): Promise<void> {
    if (!this.wsClient.isConnected()) {
      throw new Error('WebSocket is not connected');
    }
    
    await this.wsClient.send(message);
  }

  /**
   * Send a user message
   */
  async sendUserMessage(content: string): Promise<void> {
    await this.sendMessage({
      type: WebSocketMessageType.USER_MESSAGE,
      content,
    });
  }

  /**
   * Send a chat message (for session side chat)
   */
  async sendChatMessage(content: string, parentId?: string): Promise<void> {
    await this.sendMessage({
      type: WebSocketMessageType.CHAT_MESSAGE,
      content,
      parent_id: parentId,
    });
  }

  /**
   * Send cursor position update
   */
  async sendCursorPosition(position: { x: number; y: number }): Promise<void> {
    await this.sendMessage({
      type: WebSocketMessageType.CURSOR_POSITION,
      position,
    });
  }

  /**
   * Add a message listener
   */
  addMessageListener(listener: (message: WebSocketMessage) => void): () => void {
    this.messageListeners.push(listener);
    
    // Return a function to remove the listener
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== listener);
    };
  }

  /**
   * Add a connection state change listener
   */
  addStateChangeListener(listener: (state: ConnectionState) => void): () => void {
    this.stateChangeListeners.push(listener);
    
    // Return a function to remove the listener
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(l => l !== listener);
    };
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Handle WebSocket open event
   */
  private async handleOpen(): Promise<void> {
    console.log('WebSocket connected');
    this.updateConnectionState(ConnectionState.CONNECTED);
    this.reconnectAttempts = 0;
    
    // Send authentication message
    const token = await this.tokenProvider();
    if (token) {
      await this.sendMessage({
        type: WebSocketMessageType.AUTHENTICATE,
        token,
      });
    }
    
    // Set up ping interval to keep the connection alive
    this.pingInterval = setInterval(async () => {
      if (this.wsClient.isConnected()) {
        await this.sendMessage({ type: WebSocketMessageType.PING });
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(data: any): void {
    // Notify all listeners
    this.messageListeners.forEach(listener => {
      listener(data);
    });
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: any): void {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    
    // Update state
    this.updateConnectionState(ConnectionState.DISCONNECTED);
    
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Attempt to reconnect if the close wasn't intentional
    if (event.code !== 1000) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(error: any): void {
    console.error('WebSocket error:', error);
    this.updateConnectionState(ConnectionState.ERROR);
  }

  /**
   * Attempt to reconnect to the WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.currentUrl) {
      console.log('Max reconnect attempts reached or no URL to reconnect to');
      return;
    }
    
    this.reconnectAttempts++;
    this.updateConnectionState(ConnectionState.RECONNECTING);
    
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(async () => {
      if (this.currentUrl) {
        try {
          await this.connect(this.currentUrl);
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }
    }, delay);
  }

  /**
   * Update the connection state and notify listeners
   */
  private updateConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    
    // Notify all listeners
    this.stateChangeListeners.forEach(listener => {
      listener(state);
    });
  }
}