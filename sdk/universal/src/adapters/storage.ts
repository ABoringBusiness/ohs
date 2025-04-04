import { StorageAdapter, StorageType, CustomStorageAdapter } from '../types';

/**
 * Memory storage adapter - works in any environment
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private storage: Record<string, string> = {};

  async getItem(key: string): Promise<string | null> {
    return this.storage[key] || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage[key] = value;
  }

  async removeItem(key: string): Promise<void> {
    delete this.storage[key];
  }
}

/**
 * Local storage adapter - works in browser environments
 */
export class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('LocalStorage error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('LocalStorage error:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage error:', error);
    }
  }
}

/**
 * Chrome storage adapter - works in Chrome extension environments
 */
export class ChromeStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(key);
        return result[key] || null;
      }
      throw new Error('Chrome storage not available');
    } catch (error) {
      console.error('Chrome storage error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [key]: value });
      } else {
        throw new Error('Chrome storage not available');
      }
    } catch (error) {
      console.error('Chrome storage error:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove(key);
      } else {
        throw new Error('Chrome storage not available');
      }
    } catch (error) {
      console.error('Chrome storage error:', error);
    }
  }
}

/**
 * Create a storage adapter based on the specified type
 */
export function createStorageAdapter(
  storageType: StorageType | CustomStorageAdapter = StorageType.MEMORY
): StorageAdapter {
  if (typeof storageType === 'object' && storageType.type === StorageType.CUSTOM) {
    return storageType.implementation;
  }

  switch (storageType) {
    case StorageType.LOCAL_STORAGE:
      return new LocalStorageAdapter();
    case StorageType.CHROME_STORAGE:
      return new ChromeStorageAdapter();
    case StorageType.MEMORY:
    default:
      return new MemoryStorageAdapter();
  }
}