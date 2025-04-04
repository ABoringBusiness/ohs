import { WebSocketClient } from '../types';
import 'websocket-polyfill';

/**
 * Standard WebSocket client
 */
export class StandardWebSocketClient implements WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string = '';
  private messageListeners: ((message: any) => void)[] = [];
  private openListeners: (() => void)[] = [];
  private closeListeners: ((event: any) => void)[] = [];
  private errorListeners: ((error: any) => void)[] = [];
  private customWebSocketClass?: typeof WebSocket;

  constructor(customWebSocketClass?: typeof WebSocket) {
    this.customWebSocketClass = customWebSocketClass;
  }

  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.disconnect();
        this.url = url;
        
        const WebSocketClass = this.customWebSocketClass || WebSocket;
        this.ws = new WebSocketClass(url);
        
        this.ws.onopen = (event) => {
          this.openListeners.forEach(listener => listener());
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.messageListeners.forEach(listener => listener(data));
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.ws.onclose = (event) => {
          this.closeListeners.forEach(listener => listener(event));
        };
        
        this.ws.onerror = (error) => {
          this.errorListeners.forEach(listener => listener(error));
          reject(error);
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  async send(message: any): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    this.ws.send(messageString);
  }

  onMessage(callback: (message: any) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(listener => listener !== callback);
    };
  }

  onOpen(callback: () => void): () => void {
    this.openListeners.push(callback);
    return () => {
      this.openListeners = this.openListeners.filter(listener => listener !== callback);
    };
  }

  onClose(callback: (event: any) => void): () => void {
    this.closeListeners.push(callback);
    return () => {
      this.closeListeners = this.closeListeners.filter(listener => listener !== callback);
    };
  }

  onError(callback: (error: any) => void): () => void {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter(listener => listener !== callback);
    };
  }

  isConnected(): boolean {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Chrome extension message-based WebSocket client
 * This is a special implementation for Chrome extensions that can't directly use WebSockets
 * in content scripts, so it relays messages through the background script
 */
export class ChromeExtensionWebSocketClient implements WebSocketClient {
  private connected: boolean = false;
  private url: string = '';
  private messageListeners: ((message: any) => void)[] = [];
  private openListeners: (() => void)[] = [];
  private closeListeners: ((event: any) => void)[] = [];
  private errorListeners: ((error: any) => void)[] = [];
  private messageHandler: ((message: any, sender: any, sendResponse: any) => void) | null = null;

  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.disconnect();
        this.url = url;
        
        // Set up message listener
        this.messageHandler = (message, sender, sendResponse) => {
          if (message.type === 'OPENHANDS_WEBSOCKET_MESSAGE' && message.url === this.url) {
            if (message.event === 'open') {
              this.connected = true;
              this.openListeners.forEach(listener => listener());
              resolve();
            } else if (message.event === 'message') {
              this.messageListeners.forEach(listener => listener(message.data));
            } else if (message.event === 'close') {
              this.connected = false;
              this.closeListeners.forEach(listener => listener(message.data));
            } else if (message.event === 'error') {
              this.errorListeners.forEach(listener => listener(message.data));
              reject(message.data);
            }
          }
        };
        
        // Register the message listener
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.onMessage.addListener(this.messageHandler);
          
          // Send connect message to background script
          chrome.runtime.sendMessage({
            type: 'OPENHANDS_WEBSOCKET_CONNECT',
            url: this.url
          });
        } else {
          throw new Error('Chrome runtime not available');
        }
      } catch (error) {
        console.error('Error connecting to WebSocket via Chrome extension:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.connected && typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'OPENHANDS_WEBSOCKET_DISCONNECT',
        url: this.url
      });
    }
    
    // Remove the message listener
    if (this.messageHandler && typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.removeListener(this.messageHandler);
      this.messageHandler = null;
    }
    
    this.connected = false;
  }

  async send(message: any): Promise<void> {
    if (!this.connected) {
      throw new Error('WebSocket is not connected');
    }
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'OPENHANDS_WEBSOCKET_SEND',
        url: this.url,
        data: message
      });
    } else {
      throw new Error('Chrome runtime not available');
    }
  }

  onMessage(callback: (message: any) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(listener => listener !== callback);
    };
  }

  onOpen(callback: () => void): () => void {
    this.openListeners.push(callback);
    return () => {
      this.openListeners = this.openListeners.filter(listener => listener !== callback);
    };
  }

  onClose(callback: (event: any) => void): () => void {
    this.closeListeners.push(callback);
    return () => {
      this.closeListeners = this.closeListeners.filter(listener => listener !== callback);
    };
  }

  onError(callback: (error: any) => void): () => void {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter(listener => listener !== callback);
    };
  }

  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Create a WebSocket client based on the environment
 */
export function createWebSocketClient(
  isChromeExtension: boolean = false,
  customWebSocketClass?: typeof WebSocket
): WebSocketClient {
  if (isChromeExtension && typeof chrome !== 'undefined' && chrome.runtime) {
    return new ChromeExtensionWebSocketClient();
  }
  
  return new StandardWebSocketClient(customWebSocketClass);
}