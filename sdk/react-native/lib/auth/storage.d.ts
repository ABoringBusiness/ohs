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
export declare class KeychainStorage implements TokenStorage {
    saveTokens(accessToken: string, refreshToken: string): Promise<void>;
    getAccessToken(): Promise<string | null>;
    getRefreshToken(): Promise<string | null>;
    clearTokens(): Promise<void>;
    saveUser(user: any): Promise<void>;
    getUser(): Promise<any | null>;
}
/**
 * AsyncStorage-based token storage (less secure, but more compatible)
 */
export declare class AsyncStorageStorage implements TokenStorage {
    saveTokens(accessToken: string, refreshToken: string): Promise<void>;
    getAccessToken(): Promise<string | null>;
    getRefreshToken(): Promise<string | null>;
    clearTokens(): Promise<void>;
    saveUser(user: any): Promise<void>;
    getUser(): Promise<any | null>;
}
/**
 * Factory function to create the appropriate storage implementation
 */
export declare function createTokenStorage(type?: 'keychain' | 'async-storage'): TokenStorage;
//# sourceMappingURL=storage.d.ts.map