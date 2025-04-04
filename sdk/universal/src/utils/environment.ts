import { Environment, StorageType } from '../types';

/**
 * Detect the current environment
 */
export function detectEnvironment(): Environment {
  // Check for Chrome extension environment
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    return Environment.CHROME_EXTENSION;
  }
  
  // Check for React Native environment
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return Environment.REACT_NATIVE;
  }
  
  // Check for browser environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return Environment.BROWSER;
  }
  
  // Default to Node.js environment
  return Environment.NODE;
}

/**
 * Get the default storage type for the current environment
 */
export function getDefaultStorageType(environment: Environment): StorageType {
  switch (environment) {
    case Environment.CHROME_EXTENSION:
      return StorageType.CHROME_STORAGE;
    case Environment.BROWSER:
      return StorageType.LOCAL_STORAGE;
    case Environment.NODE:
    case Environment.REACT_NATIVE:
    default:
      return StorageType.MEMORY;
  }
}

/**
 * Check if WebSockets are supported in the current environment
 */
export function isWebSocketSupported(): boolean {
  return typeof WebSocket !== 'undefined';
}

/**
 * Check if fetch is supported in the current environment
 */
export function isFetchSupported(): boolean {
  return typeof fetch !== 'undefined';
}

/**
 * Check if we're running in a service worker context
 */
export function isServiceWorker(): boolean {
  try {
    // @ts-ignore - self.importScripts is available in service workers
    return typeof self !== 'undefined' && typeof self.importScripts === 'function';
  } catch (e) {
    return false;
  }
}

/**
 * Check if we're running in a content script context
 */
export function isContentScript(): boolean {
  try {
    return !!(
      typeof chrome !== 'undefined' &&
      chrome.runtime &&
      chrome.runtime.id &&
      typeof document !== 'undefined' &&
      !isServiceWorker()
    );
  } catch (e) {
    return false;
  }
}

/**
 * Check if we're running in a background script context
 */
export function isBackgroundScript(): boolean {
  try {
    return !!(
      typeof chrome !== 'undefined' &&
      chrome.runtime &&
      chrome.runtime.id &&
      isServiceWorker()
    );
  } catch (e) {
    return false;
  }
}