// src/services/authStorage.ts
/**
 * Centralised token storage for the frontend.
 * Uses localStorage under keys prefixed with "nyutaelite_".
 * No secrets are exposed; only the JWT strings are persisted.
 */
const ACCESS_TOKEN_KEY = 'nyutaelite_access_token';
const REFRESH_TOKEN_KEY = 'nyutaelite_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
