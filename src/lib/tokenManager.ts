/**
 * Token Manager for myGenAssist Studio
 *
 * Provides async token retrieval with automatic refresh handling.
 * Features:
 * - Automatic token refresh when expiring soon (< 5 min remaining)
 * - Concurrent refresh request deduplication via promise caching
 * - Integration with authStore for token persistence
 */

import { acquireTokenSilent, getActiveAccount } from '@/lib/msal/authInstance';
import { getAuthStore } from '@/store/authStore';

/** Refresh buffer: refresh token if less than 5 minutes remaining */
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

/** Cached promise for in-flight refresh requests to prevent concurrent refreshes */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Get a valid access token, refreshing if necessary.
 *
 * This function handles:
 * 1. Returning existing valid token if not expiring soon
 * 2. Automatic refresh if token is expiring within 5 minutes
 * 3. Deduplication of concurrent refresh requests
 *
 * @returns Promise resolving to valid access token or null if refresh fails
 */
export async function getValidToken(): Promise<string | null> {
  const { token } = getAuthStore();

  // If refresh already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  // Check if token needs refresh
  if (token && !isTokenExpiringSoon(token)) {
    return token;
  }

  // Refresh the token
  refreshPromise = refreshToken();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Refresh the access token using MSAL's silent token acquisition.
 *
 * Updates the authStore with the fresh token and account info on success.
 *
 * @returns Promise resolving to fresh access token or null if refresh fails
 */
async function refreshToken(): Promise<string | null> {
  console.log('[TokenManager] Refreshing token...');

  const freshToken = await acquireTokenSilent();

  if (freshToken) {
    // Update store with fresh token, preserving existing user_id
    const account = getActiveAccount();
    if (account) {
      const currentState = getAuthStore();
      getAuthStore().setAuth({
        token: freshToken,
        username: account.name || '',
        email: account.username || '',
        // Preserve existing user_id; only use 0 as fallback if none exists
        user_id: currentState.user_id ?? 0,
      });
    }
    console.log('[TokenManager] Token refreshed successfully');
    return freshToken;
  }

  // Token refresh failed - session expired, redirect to login
  console.warn('[TokenManager] Token refresh failed, session expired. Redirecting to login.');
  getAuthStore().logout();
  window.location.href = '#/login';
  return null;
}

/** JWT payload structure for expiration checking */
interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

/**
 * Decode a base64url-encoded string.
 *
 * JWTs use base64url encoding which differs from standard base64:
 * - Uses '-' instead of '+'
 * - Uses '_' instead of '/'
 * - May omit padding '=' characters
 *
 * @param base64url - The base64url-encoded string
 * @returns The decoded string
 */
function decodeBase64Url(base64url: string): string {
  // Replace base64url characters with standard base64
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed (base64 requires length to be multiple of 4)
  const paddingNeeded = (4 - (base64.length % 4)) % 4;
  base64 += '='.repeat(paddingNeeded);

  return atob(base64);
}

/**
 * Check if a JWT token is expiring soon.
 *
 * Decodes the JWT payload and checks if the expiration time (exp claim)
 * is within the refresh buffer window.
 *
 * @param token - JWT access token string
 * @returns true if token is expiring within REFRESH_BUFFER_MS, false otherwise
 */
function isTokenExpiringSoon(token: string): boolean {
  try {
    // Split token and validate structure
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      // Malformed JWT - trigger refresh
      return true;
    }

    // Decode the JWT payload (second segment, base64url encoded)
    const payload: JwtPayload = JSON.parse(decodeBase64Url(parts[1]));

    // Check if exp claim exists and is a number
    if (typeof payload.exp !== 'number') {
      // No valid expiration - trigger refresh to be safe
      return true;
    }

    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    return Date.now() > expiresAt - REFRESH_BUFFER_MS;
  } catch {
    // If we can't decode the token, assume it's expired to trigger refresh
    return true;
  }
}
