// src/services/api.ts
/**
 * Generic API client for the NYUTA ELITE frontend.
 * Reads the base URL from the VITE_API_URL environment variable or auto-resolves for production domain.
 * Automatically attaches the Authorization bearer token when present.
 * Automatically refreshes expired or missing access tokens using the refresh token.
 * Parses JSON responses safely and throws a typed ApiError for non‑2xx responses.
 */

import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './authStorage';

const AUTH_USER_KEY = 'nyutaelite_user';

// Helper to get base URL without trailing slash
function getBaseUrl(): string {
  // 1. If running in browser on production domain nutyaelite.com, enforce production backend
  if (typeof window !== 'undefined' && window.location.hostname.includes('nutyaelite.com')) {
    const rawEnv = import.meta.env.VITE_API_URL;
    if (rawEnv && typeof rawEnv === 'string' && !rawEnv.includes('localhost') && !rawEnv.includes('127.0.0.1')) {
      return rawEnv.replace(/\/+$/g, '');
    }
    return 'https://api.nutyaelite.com/api';
  }

  // 2. Read from VITE_API_URL environment variable if set
  const raw = import.meta.env.VITE_API_URL;
  if (raw && typeof raw === 'string' && raw.trim() !== '') {
    return raw.replace(/\/+$/g, '');
  }

  // 3. Fallback for local development
  return 'http://localhost:5000/api';
}

export class ApiError extends Error {
  status: number;
  data?: any;
  requestId?: string;
  constructor(message: string, status: number, data?: any, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.requestId = requestId;
  }
}

interface RequestOptions extends RequestInit {
  // Optional flag to indicate JSON body
  json?: boolean;
}

// Single in-flight refresh promise to prevent duplicate concurrent refresh requests
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const baseUrl = getBaseUrl();
      const url = `${baseUrl}/auth/refresh`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearTokens();
        localStorage.removeItem(AUTH_USER_KEY);
        return null;
      }

      const resJson = await response.json();
      const data = resJson?.data ?? resJson;
      const newAccessToken = data?.accessToken;
      if (newAccessToken && typeof newAccessToken === 'string') {
        setTokens(newAccessToken, refreshToken);
        return newAccessToken;
      }

      clearTokens();
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false
): Promise<T> {
  const baseUrl = getBaseUrl();
  const normalizedPath =
    baseUrl.endsWith('/api') && path.startsWith('/api/') ? path.substring(4) : path;
  const url = `${baseUrl}${normalizedPath}`;
  const headers: Record<string, string> = {};

  if (options.headers && typeof options.headers === 'object' && !Array.isArray(options.headers)) {
    Object.entries(options.headers as Record<string, string>).forEach(([k, v]) => {
      if (typeof v === 'string') headers[k] = v;
    });
  }

  const isAuthEndpoint =
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/register') ||
    path.startsWith('/auth/refresh') ||
    path.startsWith('/api/auth/login') ||
    path.startsWith('/api/auth/register') ||
    path.startsWith('/api/auth/refresh');

  let token = getAccessToken();

  // If token is missing but refresh token exists, proactively refresh before sending authenticated request
  if (!token && !isAuthEndpoint && getRefreshToken()) {
    token = await refreshAccessToken();
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.json) {
    headers['Content-Type'] = 'application/json';
    if (options.body && typeof options.body !== 'string') {
      options.body = JSON.stringify(options.body);
    }
  }

  // Safe development diagnostics (only logs boolean flags and path; never logs tokens)
  if (import.meta.env.DEV || (typeof window !== 'undefined' && (window as any).__NYUTA_DEBUG__)) {
    console.debug('[API Request]', {
      targetUrl: url,
      method: options.method || 'GET',
      hasAccessToken: !!token,
      hasRefreshToken: !!getRefreshToken(),
      authorizationAttached: !!headers['Authorization'],
    });
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }

  // If 401 unauthorized returned on protected endpoint, try refreshing token and retrying once
  if (response.status === 401 && !isRetry && !isAuthEndpoint && getRefreshToken()) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return request<T>(path, options, true);
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !isAuthEndpoint) {
      // If we don't have a valid refresh token (or refresh failed), session is truly expired
      if (!getRefreshToken()) {
        clearTokens();
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }

    let message = (data && data.message) || response.statusText || 'API request failed';
    if (data?.error?.details && typeof data.error.details === 'object') {
      const fieldErrors: string[] = [];
      const extractErrors = (obj: any, prefix = '') => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj._errors) && obj._errors.length > 0) {
          fieldErrors.push(`${prefix ? prefix + ': ' : ''}${obj._errors.join(', ')}`);
        }
        Object.keys(obj).forEach((k) => {
          if (k !== '_errors') {
            extractErrors(obj[k], prefix ? `${prefix}.${k}` : k);
          }
        });
      };
      extractErrors(data.error.details);
      if (fieldErrors.length > 0 && !message.includes(':')) {
        message = `${message}: ${fieldErrors.join(' | ')}`;
      }
    }
    const requestId = response.headers.get('x-request-id') || data?.requestId;
    throw new ApiError(message, response.status, data, requestId || undefined);
  }

  return data as T;
}

// Exported helper methods matching typical CRUD patterns
export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: any) => request<T>(path, { method: 'POST', json: true, body }),
  put: <T>(path: string, body: any) => request<T>(path, { method: 'PUT', json: true, body }),
  patch: <T>(path: string, body: any) => request<T>(path, { method: 'PATCH', json: true, body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
