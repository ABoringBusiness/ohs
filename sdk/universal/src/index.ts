// Core client
export { OpenHandsClient } from './core/client';

// Types
export * from './types';

// WebSocket
export { ConnectionState } from './websocket/websocket-manager';

// Environment utilities
export { 
  detectEnvironment,
  getDefaultStorageType,
  isWebSocketSupported,
  isFetchSupported,
  isServiceWorker,
  isContentScript,
  isBackgroundScript
} from './utils/environment';

// Storage adapters
export {
  MemoryStorageAdapter,
  LocalStorageAdapter,
  ChromeStorageAdapter,
  createStorageAdapter
} from './adapters/storage';

// HTTP adapters
export {
  AxiosHttpClient,
  FetchHttpClient,
  createHttpClient
} from './adapters/http';

// WebSocket adapters
export {
  StandardWebSocketClient,
  ChromeExtensionWebSocketClient,
  createWebSocketClient
} from './adapters/websocket';

// Version
export const VERSION = '0.1.0';