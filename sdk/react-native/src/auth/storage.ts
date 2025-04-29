import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

// Storage keys
const ACCESS_TOKEN_KEY = 'openhands_access_token';
const REFRESH_TOKEN_KEY = 'openhands_refresh_token';
const USER_KEY = 'openhands_user';

/**
 * Interface for token storage implementations
 */
export interface TokenStorage {
  saveTokens(accessToken: string, refreshToken: string): Promise<void>;
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  clearTokens(): Promise<void>;
  saveUser(user: any): Promise<void>;
  getUser(): Promise<any | null>;
}

/**
 * Keychain-based token storage (more secure)
 */
export class KeychainStorage implements TokenStorage {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Keychain.setGenericPassword(
      ACCESS_TOKEN_KEY,
      accessToken,
      { service: ACCESS_TOKEN_KEY }
    );
    
    await Keychain.setGenericPassword(
      REFRESH_TOKEN_KEY,
      refreshToken,
      { service: REFRESH_TOKEN_KEY }
    );
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: ACCESS_TOKEN_KEY });
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Error retrieving access token:', error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_KEY });
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  }

  async clearTokens(): Promise<void> {
    await Keychain.resetGenericPassword({ service: ACCESS_TOKEN_KEY });
    await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_KEY });
    await Keychain.resetGenericPassword({ service: USER_KEY });
  }

  async saveUser(user: any): Promise<void> {
    await Keychain.setGenericPassword(
      USER_KEY,
      JSON.stringify(user),
      { service: USER_KEY }
    );
  }

  async getUser(): Promise<any | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: USER_KEY });
      return credentials ? JSON.parse(credentials.password) : null;
    } catch (error) {
      console.error('Error retrieving user:', error);
      return null;
    }
  }
}

/**
 * AsyncStorage-based token storage (less secure, but more compatible)
 */
export class AsyncStorageStorage implements TokenStorage {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  }

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  async clearTokens(): Promise<void> {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  }

  async saveUser(user: any): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  async getUser(): Promise<any | null> {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }
}

/**
 * Factory function to create the appropriate storage implementation
 */
export function createTokenStorage(type: 'keychain' | 'async-storage' = 'keychain'): TokenStorage {
  return type === 'keychain' 
    ? new KeychainStorage() 
    : new AsyncStorageStorage();
}