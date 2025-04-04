// Type definitions for Chrome extension API
interface Chrome {
  runtime: {
    id?: string;
    lastError?: {
      message: string;
    };
    onMessage: {
      addListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void) => void;
      removeListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void) => void;
    };
    sendMessage: (message: any, callback?: (response: any) => void) => void;
  };
  storage?: {
    local: {
      get: (key: string | string[] | object) => Promise<any>;
      set: (items: object) => Promise<void>;
      remove: (key: string | string[]) => Promise<void>;
    };
  };
  scripting?: {
    executeScript: (options: {
      target: { tabId: number; frameIds?: number[] };
      func: () => any;
      args?: any[];
    }) => Promise<{ frameId: number; result: any }[]>;
  };
}

declare var chrome: Chrome;

// Self with importScripts for service worker detection
interface ServiceWorkerGlobalScope {
  importScripts: (...urls: string[]) => void;
}

declare var self: ServiceWorkerGlobalScope & typeof globalThis;