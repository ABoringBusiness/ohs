import { User } from '../models/types';
import { ApiClient } from '../api/api-client';
/**
 * Manages authentication state and operations
 */
export declare class AuthManager {
    private storage;
    private apiClient;
    private currentUser;
    private authStateListeners;
    constructor(apiClient: ApiClient, storageType?: 'keychain' | 'async-storage');
    /**
     * Initialize the auth manager by loading the user from storage
     */
    initialize(): Promise<boolean>;
    /**
     * Sign in with email and password
     */
    signIn(email: string, password: string): Promise<User>;
    /**
     * Sign up with email, password, and name
     */
    signUp(email: string, password: string, name: string): Promise<User>;
    /**
     * Sign out the current user
     */
    signOut(): Promise<void>;
    /**
     * Refresh the access token using the refresh token
     */
    refreshToken(): Promise<string | null>;
    /**
     * Get the current access token
     */
    getAccessToken(): Promise<string | null>;
    /**
     * Get the current user
     */
    getCurrentUser(): User | null;
    /**
     * Check if the user is authenticated
     */
    isAuthenticated(): Promise<boolean>;
    /**
     * Add a listener for auth state changes
     */
    addAuthStateListener(listener: (isAuthenticated: boolean, user: User | null) => void): () => void;
    /**
     * Handle the authentication response
     */
    private handleAuthResponse;
    /**
     * Notify all listeners of auth state changes
     */
    private notifyListeners;
}
//# sourceMappingURL=auth-manager.d.ts.map