/**
 * Centralized API client with resilient network retries, timeout handling,
 * and graceful fallback for dev environments and container wakeups.
 */

const DEFAULT_TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Execute a resilient fetch with retry and backoff
 */
export async function apiRequest(endpoint, options = {}, retries = 2, delay = 400) {
  const url = endpoint.startsWith('http') ? endpoint : endpoint;
  
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('medwaste_auth_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errData = null;
        try {
          errData = await response.json();
        } catch {
          errData = { message: response.statusText };
        }
        throw new ApiError(errData.message || `HTTP error ${response.status}`, response.status, errData);
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);

      const isLastAttempt = attempt === retries;
      if (isLastAttempt) {
        if (err.name === 'AbortError') {
          throw new ApiError('Request timed out while waiting for server response.', 408);
        }
        throw err;
      }

      // Exponential backoff delay
      await new Promise((resolve) => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
}

export default {
  get: (endpoint, options = {}) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { method: 'DELETE', ...options }),
};
