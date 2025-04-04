import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { HttpClient } from '../types';
import 'cross-fetch/polyfill';

/**
 * Axios-based HTTP client
 */
export class AxiosHttpClient implements HttpClient {
  private axiosInstance: AxiosInstance;

  constructor(
    baseUrl: string,
    tokenProvider: () => Promise<string | null>,
    tokenRefresher: () => Promise<string | null>
  ) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await tokenProvider();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If the error is due to an expired token and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            const newToken = await tokenRefresher();
            
            if (newToken) {
              // Update the authorization header with the new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              // Retry the original request
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }
}

/**
 * Fetch-based HTTP client
 */
export class FetchHttpClient implements HttpClient {
  private baseUrl: string;
  private tokenProvider: () => Promise<string | null>;
  private tokenRefresher: () => Promise<string | null>;
  private customFetch: typeof fetch;

  constructor(
    baseUrl: string,
    tokenProvider: () => Promise<string | null>,
    tokenRefresher: () => Promise<string | null>,
    customFetch?: typeof fetch
  ) {
    this.baseUrl = baseUrl;
    this.tokenProvider = tokenProvider;
    this.tokenRefresher = tokenRefresher;
    this.customFetch = customFetch || fetch;
  }

  private async fetchWithAuth(
    url: string,
    options: RequestInit = {},
    retry = false
  ): Promise<Response> {
    const token = await this.tokenProvider();
    const headers = new Headers(options.headers || {});
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    
    const response = await this.customFetch(`${this.baseUrl}${url}`, {
      ...options,
      headers,
    });
    
    // Handle 401 Unauthorized
    if (response.status === 401 && !retry) {
      const newToken = await this.tokenRefresher();
      
      if (newToken) {
        // Retry the request with the new token
        return this.fetchWithAuth(url, options, true);
      }
    }
    
    return response;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    
    // Check if the response is empty
    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    
    // Parse the response as JSON
    try {
      return JSON.parse(text) as T;
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Invalid JSON response');
    }
  }

  async get<T = any>(url: string, config?: RequestInit): Promise<T> {
    const response = await this.fetchWithAuth(url, {
      method: 'GET',
      ...config,
    });
    return this.handleResponse<T>(response);
  }

  async post<T = any>(url: string, data?: any, config?: RequestInit): Promise<T> {
    const response = await this.fetchWithAuth(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
    return this.handleResponse<T>(response);
  }

  async put<T = any>(url: string, data?: any, config?: RequestInit): Promise<T> {
    const response = await this.fetchWithAuth(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T = any>(url: string, config?: RequestInit): Promise<T> {
    const response = await this.fetchWithAuth(url, {
      method: 'DELETE',
      ...config,
    });
    return this.handleResponse<T>(response);
  }

  async patch<T = any>(url: string, data?: any, config?: RequestInit): Promise<T> {
    const response = await this.fetchWithAuth(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
    return this.handleResponse<T>(response);
  }
}

/**
 * Create an HTTP client based on the environment
 */
export function createHttpClient(
  baseUrl: string,
  tokenProvider: () => Promise<string | null>,
  tokenRefresher: () => Promise<string | null>,
  customFetch?: typeof fetch
): HttpClient {
  // Use Axios by default, but fall back to fetch if needed
  try {
    return new AxiosHttpClient(baseUrl, tokenProvider, tokenRefresher);
  } catch (error) {
    console.warn('Axios not available, falling back to fetch:', error);
    return new FetchHttpClient(baseUrl, tokenProvider, tokenRefresher, customFetch);
  }
}