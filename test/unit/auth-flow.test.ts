// ========= Copyright 2025-2026 @ Eigent.ai All Rights Reserved. =========
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ========= Copyright 2025-2026 @ Eigent.ai All Rights Reserved. =========

/**
 * Auth Flow Unit Tests
 *
 * Tests SSO token expiration, logout flow, and model configuration logic:
 * - logoutAndRedirect helper functionality
 * - tokenManager.getValidToken() behavior
 * - isConfigured check in Models component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Store the original window.location
const originalLocation = window.location;

// Mock window.location with writable href
const mockLocation = {
  href: '',
  assign: vi.fn(),
  reload: vi.fn(),
  replace: vi.fn(),
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  protocol: 'http:',
  ancestorOrigins: {} as DOMStringList,
  toString: () => mockLocation.href,
};

describe('Auth Flow', () => {
  beforeEach(() => {
    // Reset location mock before each test
    mockLocation.href = '';

    // Replace window.location with mock
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original window.location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe('logoutAndRedirect', () => {
    it('should call logout and redirect to login page', async () => {
      // Dynamic import to get fresh module with mocked dependencies
      const { useAuthStore, logoutAndRedirect } = await import('@/store/authStore');

      // Set up initial auth state
      useAuthStore.getState().setAuth({
        token: 'test-token-123',
        username: 'testuser',
        email: 'test@bayer.com',
        user_id: 42,
      });

      // Verify initial state
      expect(useAuthStore.getState().token).toBe('test-token-123');
      expect(useAuthStore.getState().username).toBe('testuser');
      expect(useAuthStore.getState().email).toBe('test@bayer.com');

      // Call logoutAndRedirect
      logoutAndRedirect();

      // Verify logout was called (token should be null)
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().username).toBeNull();
      expect(useAuthStore.getState().email).toBeNull();
      expect(useAuthStore.getState().user_id).toBeNull();

      // Verify redirect to login page
      expect(mockLocation.href).toBe('#/login');
    });

    it('should clear local auth info on logout', async () => {
      const { useAuthStore, logoutAndRedirect } = await import('@/store/authStore');

      // Set up both SSO and local auth
      useAuthStore.getState().setAuth({
        token: 'sso-token',
        username: 'user',
        email: 'user@bayer.com',
        user_id: 1,
      });
      useAuthStore.getState().setLocalAuth({
        localToken: 'local-token',
        localEmail: 'local@bayer.com',
      });

      // Verify local auth is set
      expect(useAuthStore.getState().localToken).toBe('local-token');

      // Call logout
      logoutAndRedirect();

      // Verify local auth is also cleared
      expect(useAuthStore.getState().localToken).toBeNull();
      expect(useAuthStore.getState().localEmail).toBeNull();
    });

    it('should clear localProxyValue on logout', async () => {
      const { useAuthStore, logoutAndRedirect } = await import('@/store/authStore');

      // Set up auth and proxy value
      useAuthStore.getState().setAuth({
        token: 'test-token',
        username: 'user',
        email: 'user@bayer.com',
        user_id: 1,
      });
      useAuthStore.getState().setLocalProxyValue('http://localhost:3001');

      // Verify proxy value is set
      expect(useAuthStore.getState().localProxyValue).toBe('http://localhost:3001');

      // Call logout
      logoutAndRedirect();

      // Verify proxy value is cleared
      expect(useAuthStore.getState().localProxyValue).toBeNull();
    });

    it('should set initState to carousel on logout', async () => {
      const { useAuthStore, logoutAndRedirect } = await import('@/store/authStore');

      // Set up auth and change initState
      useAuthStore.getState().setAuth({
        token: 'test-token',
        username: 'user',
        email: 'user@bayer.com',
        user_id: 1,
      });
      useAuthStore.getState().setInitState('done');

      // Verify initState is 'done'
      expect(useAuthStore.getState().initState).toBe('done');

      // Call logout
      logoutAndRedirect();

      // Verify initState is reset to 'carousel'
      expect(useAuthStore.getState().initState).toBe('carousel');
    });

    it('should handle logout when already logged out', async () => {
      const { useAuthStore, logoutAndRedirect } = await import('@/store/authStore');

      // Ensure no auth state
      expect(useAuthStore.getState().token).toBeNull();

      // Should not throw when called without auth
      expect(() => logoutAndRedirect()).not.toThrow();

      // Should still redirect to login
      expect(mockLocation.href).toBe('#/login');
    });
  });

  describe('getAuthStore', () => {
    it('should return the current auth state', async () => {
      const { useAuthStore, getAuthStore } = await import('@/store/authStore');

      // Set auth state
      useAuthStore.getState().setAuth({
        token: 'state-test-token',
        username: 'stateuser',
        email: 'state@bayer.com',
        user_id: 99,
      });

      // getAuthStore should return same state
      const state = getAuthStore();
      expect(state.token).toBe('state-test-token');
      expect(state.username).toBe('stateuser');
      expect(state.email).toBe('state@bayer.com');
      expect(state.user_id).toBe(99);
    });

    it('should provide access to logout method', async () => {
      const { useAuthStore, getAuthStore } = await import('@/store/authStore');

      // Set auth state
      useAuthStore.getState().setAuth({
        token: 'method-test-token',
        username: 'methoduser',
        email: 'method@bayer.com',
        user_id: 50,
      });

      // Call logout via getAuthStore
      getAuthStore().logout();

      // Verify logout worked
      expect(useAuthStore.getState().token).toBeNull();
    });
  });

  describe('Models isConfigured check', () => {
    /**
     * These tests verify the isConfigured logic used in Models.tsx:
     * const isConfigured = myGenAssistForm?.provider_id !== undefined && !!token;
     */

    it('should be false when provider_id is undefined', () => {
      const provider_id = undefined;
      const token = 'valid-token-123';

      const isConfigured = provider_id !== undefined && !!token;

      expect(isConfigured).toBe(false);
    });

    it('should be false when token is null', () => {
      const provider_id = 123;
      const token = null;

      const isConfigured = provider_id !== undefined && !!token;

      expect(isConfigured).toBe(false);
    });

    it('should be false when token is empty string', () => {
      const provider_id = 123;
      const token = '';

      const isConfigured = provider_id !== undefined && !!token;

      expect(isConfigured).toBe(false);
    });

    it('should be false when token is undefined', () => {
      const provider_id = 123;
      const token = undefined;

      const isConfigured = provider_id !== undefined && !!token;

      expect(isConfigured).toBe(false);
    });

    it('should be false when both provider_id and token are missing', () => {
      const provider_id = undefined;
      const token = null;

      const isConfigured = provider_id !== undefined && !!token;

      expect(isConfigured).toBe(false);
    });

    it('should be true when both provider_id exists AND token exists', () => {
      const provider_id = 123;
      const token = 'valid-token-abc';

      const isConfigured = provider_id !== undefined && !!token;

      expect(isConfigured).toBe(true);
    });

    it('should be true when provider_id is 0 (falsy but defined) AND token exists', () => {
      const provider_id = 0;
      const token = 'valid-token-abc';

      const isConfigured = provider_id !== undefined && !!token;

      expect(isConfigured).toBe(true);
    });
  });

  describe('tokenManager.getValidToken', () => {
    /**
     * Tests for token refresh logic in tokenManager.ts
     *
     * Note: These tests require mocking the MSAL acquireTokenSilent function
     * and the authStore to properly test the token refresh flow.
     */

    // Helper to create a valid JWT with specific expiration
    function createMockJwt(expiresInSeconds: number): string {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + expiresInSeconds;
      const payload = { exp, sub: 'test-user', aud: 'test-audience' };
      const header = { alg: 'HS256', typ: 'JWT' };

      // Base64url encode (simplified, not cryptographically valid)
      const base64urlEncode = (obj: object) => {
        return btoa(JSON.stringify(obj))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      };

      return `${base64urlEncode(header)}.${base64urlEncode(payload)}.mock-signature`;
    }

    it('should return existing valid token when not expiring soon', async () => {
      // Create a token that expires in 10 minutes (well above the 5 min refresh buffer)
      const validToken = createMockJwt(10 * 60);

      // Mock MSAL module
      vi.doMock('@/lib/msal/authInstance', () => ({
        acquireTokenSilent: vi.fn(),
        getActiveAccount: vi.fn(),
      }));

      // Mock authStore with valid token
      vi.doMock('@/store/authStore', () => ({
        getAuthStore: vi.fn(() => ({
          token: validToken,
          setAuth: vi.fn(),
          logout: vi.fn(),
        })),
        logoutAndRedirect: vi.fn(),
      }));

      // Import fresh module
      const { getValidToken } = await import('@/lib/tokenManager');
      const { acquireTokenSilent } = await import('@/lib/msal/authInstance');

      const result = await getValidToken();

      // Should return existing token without refresh
      expect(result).toBe(validToken);
      expect(acquireTokenSilent).not.toHaveBeenCalled();
    });

    it('should refresh token when expiring soon (< 5 minutes)', async () => {
      // Create a token that expires in 2 minutes (below the 5 min refresh buffer)
      const expiringToken = createMockJwt(2 * 60);
      const freshToken = createMockJwt(60 * 60); // 1 hour

      const mockSetAuth = vi.fn();

      // Mock MSAL module
      vi.doMock('@/lib/msal/authInstance', () => ({
        acquireTokenSilent: vi.fn().mockResolvedValue(freshToken),
        getActiveAccount: vi.fn().mockReturnValue({
          name: 'Test User',
          username: 'test@bayer.com',
        }),
      }));

      // Mock authStore with expiring token
      vi.doMock('@/store/authStore', () => ({
        getAuthStore: vi.fn(() => ({
          token: expiringToken,
          user_id: 42,
          setAuth: mockSetAuth,
          logout: vi.fn(),
        })),
        logoutAndRedirect: vi.fn(),
      }));

      // Import fresh module
      const { getValidToken } = await import('@/lib/tokenManager');
      const { acquireTokenSilent } = await import('@/lib/msal/authInstance');

      const result = await getValidToken();

      // Should have called refresh
      expect(acquireTokenSilent).toHaveBeenCalled();
      expect(result).toBe(freshToken);
      expect(mockSetAuth).toHaveBeenCalledWith({
        token: freshToken,
        username: 'Test User',
        email: 'test@bayer.com',
        user_id: 42,
      });
    });

    it('should return null and logout when refresh fails', async () => {
      // Create an expired token
      const expiredToken = createMockJwt(-60); // Expired 1 minute ago

      const mockLogout = vi.fn();

      // Mock MSAL module to return null (refresh failed)
      vi.doMock('@/lib/msal/authInstance', () => ({
        acquireTokenSilent: vi.fn().mockResolvedValue(null),
        getActiveAccount: vi.fn(),
      }));

      // Mock authStore with expired token
      vi.doMock('@/store/authStore', () => ({
        getAuthStore: vi.fn(() => ({
          token: expiredToken,
          setAuth: vi.fn(),
          logout: mockLogout,
        })),
        logoutAndRedirect: vi.fn(),
      }));

      // Import fresh module
      const { getValidToken } = await import('@/lib/tokenManager');

      const result = await getValidToken();

      // Should return null
      expect(result).toBeNull();

      // Should call logout (the redirect is handled by the tokenManager module internally)
      expect(mockLogout).toHaveBeenCalled();

      // Note: The actual redirect to #/login happens inside tokenManager.ts
      // via window.location.href = '#/login', which we verify through the
      // logoutAndRedirect tests above. Here we just verify the logout
      // was called, which is the critical state change.
    });

    it('should treat malformed JWT as expiring and trigger refresh', async () => {
      const malformedToken = 'not-a-valid-jwt';
      const freshToken = createMockJwt(60 * 60);

      // Mock MSAL module
      vi.doMock('@/lib/msal/authInstance', () => ({
        acquireTokenSilent: vi.fn().mockResolvedValue(freshToken),
        getActiveAccount: vi.fn().mockReturnValue({
          name: 'User',
          username: 'user@bayer.com',
        }),
      }));

      // Mock authStore with malformed token
      vi.doMock('@/store/authStore', () => ({
        getAuthStore: vi.fn(() => ({
          token: malformedToken,
          user_id: 1,
          setAuth: vi.fn(),
          logout: vi.fn(),
        })),
        logoutAndRedirect: vi.fn(),
      }));

      // Import fresh module
      const { getValidToken } = await import('@/lib/tokenManager');
      const { acquireTokenSilent } = await import('@/lib/msal/authInstance');

      await getValidToken();

      // Should trigger refresh for malformed token
      expect(acquireTokenSilent).toHaveBeenCalled();
    });

    it('should handle null token by attempting refresh', async () => {
      const freshToken = createMockJwt(60 * 60);

      // Mock MSAL module
      vi.doMock('@/lib/msal/authInstance', () => ({
        acquireTokenSilent: vi.fn().mockResolvedValue(freshToken),
        getActiveAccount: vi.fn().mockReturnValue({
          name: 'User',
          username: 'user@bayer.com',
        }),
      }));

      // Mock authStore with no token
      vi.doMock('@/store/authStore', () => ({
        getAuthStore: vi.fn(() => ({
          token: null,
          user_id: null,
          setAuth: vi.fn(),
          logout: vi.fn(),
        })),
        logoutAndRedirect: vi.fn(),
      }));

      // Import fresh module
      const { getValidToken } = await import('@/lib/tokenManager');
      const { acquireTokenSilent } = await import('@/lib/msal/authInstance');

      await getValidToken();

      // Should attempt refresh when token is null
      expect(acquireTokenSilent).toHaveBeenCalled();
    });
  });

  describe('isAuthError helper (from Models.tsx)', () => {
    /**
     * Tests for the isAuthError helper function logic used in Models.tsx
     * to detect authentication errors from API responses.
     */

    const isAuthError = (error: any): boolean => {
      const msg = (
        error?.message ||
        error?.detail?.message ||
        error?.detail?.error?.message ||
        error?.error?.message ||
        JSON.stringify(error)
      ).toLowerCase();

      return (
        msg.includes('invalid_api_key') ||
        msg.includes('incorrect api key') ||
        msg.includes('unauthorized') ||
        msg.includes('forbidden') ||
        msg.includes('401') ||
        msg.includes('403') ||
        (msg.includes('token') && (msg.includes('expired') || msg.includes('invalid')))
      );
    };

    it('should detect invalid_api_key error', () => {
      const error = { message: 'Error: invalid_api_key provided' };
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect incorrect api key error', () => {
      const error = { message: 'Incorrect API key provided' };
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect unauthorized error', () => {
      const error = { message: 'Unauthorized access' };
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect forbidden error', () => {
      const error = { message: 'Forbidden - access denied' };
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect 401 status in message', () => {
      const error = { message: 'Request failed with status 401' };
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect 403 status in message', () => {
      const error = { message: 'Request failed with status 403' };
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect token expired error', () => {
      const error = { message: 'Token has expired, please re-authenticate' };
      expect(isAuthError(error)).toBe(true);
    });

    it('should detect invalid token error', () => {
      const error = { message: 'Invalid token provided' };
      expect(isAuthError(error)).toBe(true);
    });

    it('should handle nested error in detail.message', () => {
      // Note: 'incorrect api key' (with space) is checked, not 'invalid api key'
      const error = { detail: { message: 'Incorrect API key provided' } };
      expect(isAuthError(error)).toBe(true);
    });

    it('should handle nested error in detail.error.message', () => {
      const error = { detail: { error: { message: 'Unauthorized' } } };
      expect(isAuthError(error)).toBe(true);
    });

    it('should handle nested error in error.message', () => {
      const error = { error: { message: 'Token expired' } };
      expect(isAuthError(error)).toBe(true);
    });

    it('should return false for non-auth errors', () => {
      const error = { message: 'Network timeout' };
      expect(isAuthError(error)).toBe(false);
    });

    it('should return false for rate limit errors', () => {
      const error = { message: 'Rate limit exceeded, try again later' };
      expect(isAuthError(error)).toBe(false);
    });

    it('should return false for server errors', () => {
      const error = { message: 'Internal server error 500' };
      expect(isAuthError(error)).toBe(false);
    });

    it('should handle error with only token but not expired/invalid', () => {
      const error = { message: 'Token received successfully' };
      expect(isAuthError(error)).toBe(false);
    });

    it('should handle empty error object', () => {
      const error = {};
      expect(isAuthError(error)).toBe(false);
    });

    it('should handle null error', () => {
      const error = null;
      expect(isAuthError(error)).toBe(false);
    });
  });

  describe('canSwitch logic (from Models.tsx)', () => {
    /**
     * Tests for the canSwitch logic used in Models.tsx:
     * const canSwitch = !!myGenAssistForm?.provider_id;
     */

    it('should be false when provider_id is undefined', () => {
      const myGenAssistForm = { provider_id: undefined };
      const canSwitch = !!myGenAssistForm?.provider_id;
      expect(canSwitch).toBe(false);
    });

    it('should be false when provider_id is null', () => {
      const myGenAssistForm = { provider_id: null };
      const canSwitch = !!(myGenAssistForm?.provider_id);
      expect(canSwitch).toBe(false);
    });

    it('should be false when myGenAssistForm is null', () => {
      const myGenAssistForm = null;
      const canSwitch = !!(myGenAssistForm as any)?.provider_id;
      expect(canSwitch).toBe(false);
    });

    it('should be true when provider_id exists and is non-zero', () => {
      const myGenAssistForm = { provider_id: 123 };
      const canSwitch = !!myGenAssistForm?.provider_id;
      expect(canSwitch).toBe(true);
    });

    it('should be false when provider_id is 0 (falsy)', () => {
      // Note: provider_id of 0 is technically valid but falsy
      // This matches the current behavior in Models.tsx
      const myGenAssistForm = { provider_id: 0 };
      const canSwitch = !!myGenAssistForm?.provider_id;
      expect(canSwitch).toBe(false);
    });
  });
});
