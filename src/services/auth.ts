// src/services/auth.ts
/**
 * Frontend authentication service that talks to the backend API.
 * Uses the generic `api` client for HTTP requests and `authStorage`
 * for token persistence. User data is stored in localStorage under
 * the same key as the previous mock implementation to keep UI code
 * unchanged.
 */

import type { User } from '../types';
import { api, ApiError } from './api';
import { getAccessToken, setTokens, clearTokens, getRefreshToken } from './authStorage';

const AUTH_STORAGE_KEY = 'nyutaelite_user';

type AuthListener = (user: User | null) => void;
const listeners = new Set<AuthListener>();

function notifyListeners(user: User | null): void {
  listeners.forEach((listener) => {
    try {
      listener(user);
    } catch (e) {
      console.error('Auth listener error:', e);
    }
  });
}

function normalizeUser(rawUser: any): User {
  if (!rawUser) return rawUser;
  return {
    id: rawUser.id,
    fullName: rawUser.fullName || rawUser.name || '',
    businessName: rawUser.businessName,
    email: rawUser.email,
    phone: rawUser.phone || '',
    gstNumber: rawUser.gstNumber,
    createdAt: rawUser.createdAt || new Date().toISOString(),
  };
}

// Helper to store the authenticated user object.
function storeUser(user: any): void {
  const normalized = normalizeUser(user);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
}

export const authService = {
  /** Subscribe to auth state changes */
  subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Retrieve the current user from localStorage only if valid tokens exist. */
  getCurrentUser(): User | null {
    try {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      // If neither access token nor refresh token is present, user is not authenticated
      if (!accessToken && !refreshToken) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /** Register a new account. */
  async register(userData: {
    fullName: string;
    businessName?: string;
    email: string;
    phone: string;
    gstNumber?: string;
    password: string;
  }): Promise<User> {
    const payload = {
      name: userData.fullName,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
    };
    const res = await api.post<any>('/auth/register', payload);
    const data = res?.data ?? res;
    setTokens(data.accessToken, data.refreshToken);
    storeUser(data.user);
    const normalized = normalizeUser(data.user);
    notifyListeners(normalized);
    return normalized;
  },

  /** Login with email / password. */
  async login(email: string, password: string): Promise<User> {
    const payload = { email, password };
    const res = await api.post<any>('/auth/login', payload);
    const data = res?.data ?? res;
    setTokens(data.accessToken, data.refreshToken);
    storeUser(data.user);
    const normalized = normalizeUser(data.user);
    notifyListeners(normalized);
    return normalized;
  },

  /** Refresh the access token using the stored refresh token. */
  async refresh(): Promise<void> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');
    const res = await api.post<any>('/auth/refresh', { refreshToken });
    const data = res?.data ?? res;
    // Only the access token is refreshed; keep the existing refresh token.
    setTokens(data.accessToken, refreshToken);
  },

  /** Logout – clear tokens and user data. */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // ignore backend errors – we still want to clear local state
    }
    clearTokens();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    notifyListeners(null);
  },

  /** Restore a session on app start.
   *  - If an access token exists, verify it via `/auth/me`.
   *  - On 401, attempt a token refresh and retry.
   *  - If everything fails, clear tokens/user.
   */
  async restoreSession(): Promise<User | null> {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    if (!accessToken && !refreshToken) {
      notifyListeners(null);
      return null;
    }

    try {
      const res = await api.get<any>('/auth/me');
      const me = res?.data ?? res;
      storeUser(me);
      const normalized = normalizeUser(me);
      notifyListeners(normalized);
      return normalized;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        try {
          await this.refresh();
          const res = await api.get<any>('/auth/me');
          const me = res?.data ?? res;
          storeUser(me);
          const normalized = normalizeUser(me);
          notifyListeners(normalized);
          return normalized;
        } catch {
          // Refresh explicitly failed – clear authentication
          clearTokens();
          localStorage.removeItem(AUTH_STORAGE_KEY);
          notifyListeners(null);
          return null;
        }
      } else {
        // Transient network or server error (e.g. 500, 502, 429) - keep local session intact
        const existing = this.getCurrentUser();
        if (existing) {
          notifyListeners(existing);
        }
        return existing;
      }
    }
  },

  /** Simple boolean check – used by UI components. */
  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  },
};
