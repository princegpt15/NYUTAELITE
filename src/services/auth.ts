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
import { getAccessToken, setTokens, clearTokens, getRefreshToken, clearAllUserCache } from './authStorage';

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
    email: rawUser.email || '',
    phone: rawUser.phone || '',
    gstNumber: rawUser.gstNumber,
    role: rawUser.role || 'CUSTOMER',
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

  /** Register a new account with email / password. */
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

  /** Login or register using Google OAuth ID token credential. */
  async loginWithGoogle(credential: string): Promise<User> {
    const payload = { credential };
    const res = await api.post<any>('/auth/google', payload);
    const data = res?.data ?? res;
    setTokens(data.accessToken, data.refreshToken);
    storeUser(data.user);
    const normalized = normalizeUser(data.user);
    notifyListeners(normalized);
    return normalized;
  },

  /** Request an OTP for a mobile phone number */
  async requestOtp(
    phone: string,
    countryCode = '+91'
  ): Promise<{
    phone: string;
    formatted: string;
    cooldownSeconds: number;
    expiresInSeconds: number;
  }> {
    const res = await api.post<any>('/auth/otp/request', { phone, countryCode });
    return res?.data ?? res;
  },

  /** Verify the submitted 6-digit OTP and authenticate user */
  async verifyOtp(
    phone: string,
    otp: string,
    countryCode = '+91'
  ): Promise<{
    user: User;
    isNewUser: boolean;
  }> {
    const res = await api.post<any>('/auth/otp/verify', { phone, otp, countryCode });
    const data = res?.data ?? res;
    setTokens(data.accessToken, data.refreshToken);
    storeUser(data.user);
    const normalized = normalizeUser(data.user);
    notifyListeners(normalized);
    return {
      user: normalized,
      isNewUser: Boolean(data.isNewUser),
    };
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

  /** Logout – revoke session on the backend then clear all local user data. */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Backend errors are non-fatal — always clear local state regardless
    }
    clearAllUserCache();
    notifyListeners(null);
  },

  /** Restore a session on app start.
   *  - If a valid user is already in memory, return it immediately
   *   without hitting the network (prevents duplicate /auth/me calls
   *   when App, AdminProtectedRoute, and Checkout all call this).
   *  - If an access token exists but no user record, verify via `/auth/me`.
   *  - On 401, attempt a token refresh and retry.
   *  - If everything fails, clear tokens/user.
   */
  async restoreSession(): Promise<User | null> {
    const existing = this.getCurrentUser();
    if (existing) {
      notifyListeners(existing);
      return existing;
    }

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
          clearTokens();
          localStorage.removeItem(AUTH_STORAGE_KEY);
          notifyListeners(null);
          return null;
        }
      } else {
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
