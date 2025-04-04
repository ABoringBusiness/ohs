"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * API Client for making HTTP requests to the OpenHands API
 */
class ApiClient {
    constructor(baseUrl, tokenProvider, tokenRefresher) {
        this.baseUrl = baseUrl;
        this.tokenProvider = tokenProvider;
        this.tokenRefresher = tokenRefresher;
        this.axiosInstance = axios_1.default.create({
            baseURL: `${baseUrl}/api`,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Add request interceptor to add auth token
        this.axiosInstance.interceptors.request.use(async (config) => {
            const token = await this.tokenProvider();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => Promise.reject(error));
        // Add response interceptor to handle token refresh
        this.axiosInstance.interceptors.response.use((response) => response, async (error) => {
            var _a;
            const originalRequest = error.config;
            // If the error is due to an expired token and we haven't already tried to refresh
            if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    // Try to refresh the token
                    const newToken = await this.tokenRefresher();
                    if (newToken) {
                        // Update the authorization header with the new token
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        // Retry the original request
                        return this.axiosInstance(originalRequest);
                    }
                }
                catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                }
            }
            return Promise.reject(error);
        });
    }
    /**
     * Make a GET request
     */
    async get(url, config) {
        const response = await this.axiosInstance.get(url, config);
        return response.data;
    }
    /**
     * Make a POST request
     */
    async post(url, data, config) {
        const response = await this.axiosInstance.post(url, data, config);
        return response.data;
    }
    /**
     * Make a PUT request
     */
    async put(url, data, config) {
        const response = await this.axiosInstance.put(url, data, config);
        return response.data;
    }
    /**
     * Make a DELETE request
     */
    async delete(url, config) {
        const response = await this.axiosInstance.delete(url, config);
        return response.data;
    }
    /**
     * Make a PATCH request
     */
    async patch(url, data, config) {
        const response = await this.axiosInstance.patch(url, data, config);
        return response.data;
    }
    /**
     * Get the base URL
     */
    getBaseUrl() {
        return this.baseUrl;
    }
}
exports.ApiClient = ApiClient;
//# sourceMappingURL=api-client.js.map