/**
 * useAuth Hook
 *
 * React hook for Azure AD authentication in myGenAssist Studio.
 * Provides login, logout, user info, and token acquisition functionality.
 *
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, isLoading, login, logout, getAccessToken } = useAuth();
 *
 * if (isLoading) return <Loading />;
 * if (!isAuthenticated) return <LoginButton onClick={login} />;
 * return <div>Welcome, {user?.name}</div>;
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { AccountInfo } from '@azure/msal-browser';
import {
  initializeAuth,
  loginPopup,
  logout as msalLogout,
  acquireTokenSilent,
  getActiveAccount,
} from '@/lib/msal';
import { useAuthStore } from '@/store/authStore';

/**
 * User info extracted from Azure AD account
 */
export interface AzureUserInfo {
  id: string;
  name: string;
  email: string;
  username: string;
}

/**
 * Auth state returned by the hook
 */
export interface AuthState {
  user: AzureUserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Auth actions returned by the hook
 */
export interface AuthActions {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshAuth: () => Promise<void>;
}

/**
 * Extract user info from MSAL AccountInfo
 */
const extractUserInfo = (account: AccountInfo): AzureUserInfo => {
  return {
    id: account.localAccountId || account.homeAccountId,
    name: account.name || account.username || 'Unknown',
    email: account.username || '',
    username: account.username || '',
  };
};

/**
 * useAuth hook for Azure AD authentication
 */
export const useAuth = (): AuthState & AuthActions => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get auth state from Zustand store
  const {
    token,
    email,
    username,
    user_id,
    setAuth,
    logout: storeLogout,
  } = useAuthStore();

  // Derive user info from store
  const user: AzureUserInfo | null = email
    ? {
        id: user_id?.toString() || '',
        name: username || email,
        email: email,
        username: email,
      }
    : null;

  const isAuthenticated = !!token && !!email;

  /**
   * Initialize auth on mount
   */
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to get existing session from MSAL
        const account = await initializeAuth();

        if (account) {
          // Get access token and update store
          const accessToken = await acquireTokenSilent();
          const userInfo = extractUserInfo(account);

          if (accessToken) {
            setAuth({
              token: accessToken,
              username: userInfo.name,
              email: userInfo.email,
              user_id: parseInt(userInfo.id) || 0,
            });
          }
        }
      } catch (err) {
        console.error('[useAuth] Initialization error:', err);
        setError(err instanceof Error ? err : new Error('Auth initialization failed'));
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [setAuth]);

  /**
   * Login with Azure AD
   * Uses popup authentication directly - NO silent auth attempts
   */
  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use popup directly - no silent auth attempts
      // ssoSilent has been completely removed from the codebase
      const result = await loginPopup();

      if (result?.account) {
        const accessToken = result.accessToken;
        const userInfo = extractUserInfo(result.account);

        setAuth({
          token: accessToken,
          username: userInfo.name,
          email: userInfo.email,
          user_id: parseInt(userInfo.id) || 0,
        });
      }
    } catch (err) {
      console.error('[useAuth] Login error:', err);
      setError(err instanceof Error ? err : new Error('Login failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setAuth]);

  /**
   * Logout from Azure AD
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await msalLogout();

      // Clear store
      storeLogout();
    } catch (err) {
      console.error('[useAuth] Logout error:', err);
      setError(err instanceof Error ? err : new Error('Logout failed'));
    } finally {
      setIsLoading(false);
    }
  }, [storeLogout]);

  /**
   * Get current access token (acquires new one if expired)
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const accessToken = await acquireTokenSilent();

      // Update store with new token if different
      if (accessToken && accessToken !== token) {
        const account = getActiveAccount();
        if (account) {
          const userInfo = extractUserInfo(account);
          setAuth({
            token: accessToken,
            username: userInfo.name,
            email: userInfo.email,
            user_id: parseInt(userInfo.id) || 0,
          });
        }
      }

      return accessToken;
    } catch (err) {
      console.error('[useAuth] Token acquisition error:', err);
      return null;
    }
  }, [token, setAuth]);

  /**
   * Refresh authentication state
   * Useful after token expiry or when returning to the app
   */
  const refreshAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const account = await initializeAuth();

      if (account) {
        const accessToken = await acquireTokenSilent();
        const userInfo = extractUserInfo(account);

        if (accessToken) {
          setAuth({
            token: accessToken,
            username: userInfo.name,
            email: userInfo.email,
            user_id: parseInt(userInfo.id) || 0,
          });
        }
      } else {
        // No valid session, clear store
        storeLogout();
      }
    } catch (err) {
      console.error('[useAuth] Refresh error:', err);
      setError(err instanceof Error ? err : new Error('Auth refresh failed'));
    } finally {
      setIsLoading(false);
    }
  }, [setAuth, storeLogout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    getAccessToken,
    refreshAuth,
  };
};

export default useAuth;
