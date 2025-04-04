/**
 * Utility functions for API requests with authentication.
 */

/**
 * Get the authentication headers for API requests.
 * 
 * @returns Headers object with Authorization header if a token is available
 */
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  
  if (token) {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  }
  
  return {
    "Content-Type": "application/json",
  };
}

/**
 * Make an authenticated API request.
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise with the fetch response
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Make an authenticated GET request.
 * 
 * @param url - The URL to fetch
 * @param options - Additional fetch options
 * @returns Promise with the parsed JSON response
 */
export async function getWithAuth<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: "GET",
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Make an authenticated POST request.
 * 
 * @param url - The URL to fetch
 * @param data - The data to send
 * @param options - Additional fetch options
 * @returns Promise with the parsed JSON response
 */
export async function postWithAuth<T = any>(
  url: string,
  data: any,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: "POST",
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Make an authenticated PUT request.
 * 
 * @param url - The URL to fetch
 * @param data - The data to send
 * @param options - Additional fetch options
 * @returns Promise with the parsed JSON response
 */
export async function putWithAuth<T = any>(
  url: string,
  data: any,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: "PUT",
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Make an authenticated DELETE request.
 * 
 * @param url - The URL to fetch
 * @param options - Additional fetch options
 * @returns Promise with the parsed JSON response
 */
export async function deleteWithAuth<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: "DELETE",
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}