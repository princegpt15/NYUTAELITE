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

/**
 * Clears all user-specific cached data so that a second user on the
 * same device cannot see the previous user's wishlist, account summary,
 * or marketing preferences after logout.
 */
export function clearAllUserCache(): void {
  // Auth tokens + user record
  clearTokens();
  localStorage.removeItem('nyutaelite_user');

  // Wipe any other user-scoped keys stored by the app
  // (iterate and remove every key that is user-specific)
  const userScopedPrefixes = ['nyutaelite_wishlist', 'nyutaelite_account', 'nyutaelite_prefs'];
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && userScopedPrefixes.some((p) => key.startsWith(p))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
