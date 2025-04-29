import { AxiosRequestConfig } from 'axios';
/**
 * API Client for making HTTP requests to the OpenHands API
 */
export declare class ApiClient {
    private axiosInstance;
    private baseUrl;
    private tokenProvider;
    private tokenRefresher;
    constructor(baseUrl: string, tokenProvider: () => Promise<string | null>, tokenRefresher: () => Promise<string | null>);
    /**
     * Make a GET request
     */
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a POST request
     */
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a PUT request
     */
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a DELETE request
     */
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a PATCH request
     */
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Get the base URL
     */
    getBaseUrl(): string;
}
//# sourceMappingURL=api-client.d.ts.map