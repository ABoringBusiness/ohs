"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncStorageStorage = exports.KeychainStorage = void 0;
exports.createTokenStorage = createTokenStorage;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const Keychain = __importStar(require("react-native-keychain"));
// Storage keys
const ACCESS_TOKEN_KEY = 'openhands_access_token';
const REFRESH_TOKEN_KEY = 'openhands_refresh_token';
const USER_KEY = 'openhands_user';
/**
 * Keychain-based token storage (more secure)
 */
class KeychainStorage {
    async saveTokens(accessToken, refreshToken) {
        await Keychain.setGenericPassword(ACCESS_TOKEN_KEY, accessToken, { service: ACCESS_TOKEN_KEY });
        await Keychain.setGenericPassword(REFRESH_TOKEN_KEY, refreshToken, { service: REFRESH_TOKEN_KEY });
    }
    async getAccessToken() {
        try {
            const credentials = await Keychain.getGenericPassword({ service: ACCESS_TOKEN_KEY });
            return credentials ? credentials.password : null;
        }
        catch (error) {
            console.error('Error retrieving access token:', error);
            return null;
        }
    }
    async getRefreshToken() {
        try {
            const credentials = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_KEY });
            return credentials ? credentials.password : null;
        }
        catch (error) {
            console.error('Error retrieving refresh token:', error);
            return null;
        }
    }
    async clearTokens() {
        await Keychain.resetGenericPassword({ service: ACCESS_TOKEN_KEY });
        await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_KEY });
        await Keychain.resetGenericPassword({ service: USER_KEY });
    }
    async saveUser(user) {
        await Keychain.setGenericPassword(USER_KEY, JSON.stringify(user), { service: USER_KEY });
    }
    async getUser() {
        try {
            const credentials = await Keychain.getGenericPassword({ service: USER_KEY });
            return credentials ? JSON.parse(credentials.password) : null;
        }
        catch (error) {
            console.error('Error retrieving user:', error);
            return null;
        }
    }
}
exports.KeychainStorage = KeychainStorage;
/**
 * AsyncStorage-based token storage (less secure, but more compatible)
 */
class AsyncStorageStorage {
    async saveTokens(accessToken, refreshToken) {
        await async_storage_1.default.setItem(ACCESS_TOKEN_KEY, accessToken);
        await async_storage_1.default.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    async getAccessToken() {
        return async_storage_1.default.getItem(ACCESS_TOKEN_KEY);
    }
    async getRefreshToken() {
        return async_storage_1.default.getItem(REFRESH_TOKEN_KEY);
    }
    async clearTokens() {
        await async_storage_1.default.removeItem(ACCESS_TOKEN_KEY);
        await async_storage_1.default.removeItem(REFRESH_TOKEN_KEY);
        await async_storage_1.default.removeItem(USER_KEY);
    }
    async saveUser(user) {
        await async_storage_1.default.setItem(USER_KEY, JSON.stringify(user));
    }
    async getUser() {
        const userJson = await async_storage_1.default.getItem(USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    }
}
exports.AsyncStorageStorage = AsyncStorageStorage;
/**
 * Factory function to create the appropriate storage implementation
 */
function createTokenStorage(type = 'keychain') {
    return type === 'keychain'
        ? new KeychainStorage()
        : new AsyncStorageStorage();
}
//# sourceMappingURL=storage.js.map