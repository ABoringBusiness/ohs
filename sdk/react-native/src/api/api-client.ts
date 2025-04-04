import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * API Client for making HTTP requests to the OpenHands API
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;
  private tokenProvider: () => Promise<string | null>;
  private tokenRefresher: () => Promise<string | null>;

  constructor(
    baseUrl: string,
    tokenProvider: () => Promise<string | null>,
    tokenRefresher: () => Promise<string | null>
  ) {
    this.baseUrl = baseUrl;
    this.tokenProvider = tokenProvider;
    this.tokenRefresher = tokenRefresher;

    this.axiosInstance = axios.create({
      baseURL: `${baseUrl}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.tokenProvider();
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
            const newToken = await this.tokenRefresher();
            
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

  /**
   * Make a GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}