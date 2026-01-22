/**
 * MSAL Instance Singleton for myGenAssist Studio
 *
 * This module creates and manages a singleton instance of PublicClientApplication.
 * Designed for Electron desktop apps with support for:
 * - Popup-based login (ONLY method used - avoids iframe issues)
 * - Token refresh via acquireTokenSilent (uses cache, not iframes)
 * - Redirect-based login (fallback)
 *
 * CRITICAL: ssoSilent is COMPLETELY REMOVED from this codebase because:
 * 1. It relies on iframes which fail due to CSP restrictions in Electron
 * 2. The redirect URI must match exactly, but ports can vary in dev
 * 3. First-time logins always fail with AADSTS50058: login_required
 * 4. The isElectron() detection is unreliable with contextIsolation enabled
 *
 * ALL login attempts now use popup authentication - no silent auth whatsoever.
 *
 * ELECTRON-NATIVE POPUP HANDLING:
 * In Electron, the standard MSAL popup flow doesn't work properly because:
 * - window.open() creates a new BrowserWindow that loses connection to opener
 * - The redirect to localhost can't be properly intercepted by MSAL
 *
 * Instead, we use Electron's main process to:
 * 1. Create a native BrowserWindow for the auth popup
 * 2. Intercept the redirect URL containing the auth code/hash
 * 3. Send the URL back to the renderer via IPC
 * 4. Manually process the auth response using MSAL's handleRedirectPromise
 *
 * Based on BayChatGPT-Frontend implementation pattern.
 */

import {
  PublicClientApplication,
  BrowserAuthError,
  InteractionRequiredAuthError,
  AccountInfo,
  AuthenticationResult,
} from '@azure/msal-browser';
import { msalConfig, authScopes } from './config';

// NOTE: ElectronAPI types are defined in src/types/electron.d.ts
// The onAuthPopupResponse callback is used for Electron-native SSO popup handling

// NOTE: isElectron() detection removed - we now treat ALL environments the same
// and NEVER use ssoSilent due to unreliable iframe behavior and CSP issues

// Create an instance of PublicClientApplication
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL instance (lazy initialization)
let initPromise: Promise<void> | null = null;

/**
 * Detects if running in Electron environment with the native auth popup handler
 */
function hasElectronAuthPopup(): boolean {
  return typeof window !== 'undefined' &&
         typeof window.electronAPI?.onAuthPopupResponse === 'function';
}

/**
 * Detects if system browser authentication is available (SSO with Company Portal)
 */
function hasSystemBrowserAuth(): boolean {
  return typeof window !== 'undefined' &&
         typeof window.electronAPI?.startSystemBrowserAuth === 'function' &&
         typeof window.electronAPI?.onSystemBrowserAuthResult === 'function';
}

/**
 * Ensures the MSAL instance is initialized.
 * Uses lazy initialization pattern - only initializes once.
 * @returns Promise that resolves when initialization is complete
 */
export const ensureInitialized = async (): Promise<void> => {
  if (!initPromise) {
    initPromise = msalInstance.initialize();
  }
  return initPromise;
};

/**
 * Get all accounts from the MSAL cache
 * @returns Array of cached account info
 */
export const getAllAccounts = (): AccountInfo[] => {
  return msalInstance.getAllAccounts();
};

/**
 * Get the active account
 * @returns The active account or null if none
 */
export const getActiveAccount = (): AccountInfo | null => {
  return msalInstance.getActiveAccount();
};

/**
 * Set the active account
 * @param account The account to set as active
 */
export const setActiveAccount = (account: AccountInfo | null): void => {
  msalInstance.setActiveAccount(account);
};

/**
 * Attempt to login using popup authentication
 *
 * IMPORTANT: ssoSilent is COMPLETELY REMOVED because:
 * 1. It uses iframes which fail due to CSP restrictions in Electron
 * 2. Redirect URI port mismatches cause ERR_CONNECTION_REFUSED
 * 3. First-time logins always fail with AADSTS50058: login_required anyway
 * 4. The isElectron() detection is unreliable with contextIsolation enabled
 *
 * This function now ALWAYS uses popup authentication - no silent attempts.
 *
 * @deprecated Use loginPopup() directly instead. This function exists for backwards compatibility.
 * @returns Promise with authentication result or null if login fails
 */
export const loginSilent = async (): Promise<AuthenticationResult | null> => {
  await ensureInitialized();

  // ALWAYS use popup - NO ssoSilent attempts whatsoever
  // ssoSilent has been completely removed due to persistent iframe issues
  console.log('[MSAL] loginSilent called - using popup directly (ssoSilent removed)');
  try {
    const popupResult = await loginPopup();
    return popupResult;
  } catch (popupError) {
    console.error('[MSAL] Popup login failed:', popupError);
    return null;
  }
};

/**
 * Login using popup window
 *
 * In Electron, this uses a custom native popup flow:
 * 1. MSAL initiates loginPopup() which tries to open a popup
 * 2. Electron's main process intercepts the popup creation
 * 3. Main process creates a native BrowserWindow and loads the auth URL
 * 4. Main process intercepts the redirect back to our app
 * 5. Main process sends the redirect URL via IPC to renderer
 * 6. We manually call handleRedirectPromise() with the hash from the URL
 *
 * In browser, falls back to standard MSAL popup flow.
 * Falls back to redirect authentication if popup is blocked.
 * @returns Promise with authentication result
 */
export const loginPopup = async (): Promise<AuthenticationResult | null> => {
  await ensureInitialized();

  // Check if we're in Electron with native popup support
  if (hasElectronAuthPopup()) {
    console.log('[MSAL] Using Electron-native popup flow');
    return loginPopupElectron();
  }

  // Standard browser popup flow
  try {
    console.log('[MSAL] Attempting standard popup login...');
    const result = await msalInstance.loginPopup({ scopes: authScopes });
    if (result?.account) {
      msalInstance.setActiveAccount(result.account);
      console.log('[MSAL] Popup login successful');
    }
    return result;
  } catch (error: unknown) {
    const browserError = error as BrowserAuthError;
    console.error('[MSAL] Popup login failed:', browserError.errorCode, browserError.message);

    // Check if this is a popup_window_error - fall back to redirect
    if (browserError.errorCode === 'popup_window_error' ||
        browserError.errorCode === 'popup_closed_in_browser' ||
        browserError.errorCode === 'monitor_window_timeout') {
      console.log('[MSAL] Popup blocked or closed, falling back to redirect authentication');
      try {
        await loginRedirect();
        // Note: loginRedirect will redirect the page, so we won't return here
        return null;
      } catch (redirectError) {
        console.error('[MSAL] Redirect login also failed:', redirectError);
        throw redirectError;
      }
    }

    // For other errors, rethrow
    throw error;
  }
};

/**
 * Electron-native popup login flow
 *
 * This function first tries system browser authentication (for Company Portal/SSO support),
 * and falls back to the Electron popup if system browser fails.
 *
 * System Browser Flow (preferred):
 * 1. Start loopback HTTP server
 * 2. Open auth URL in system browser (Safari/Chrome)
 * 3. User authenticates with full SSO support
 * 4. Receive auth code via loopback server
 *
 * Popup Flow (fallback):
 * 1. Build the Azure AD authorization URL ourselves
 * 2. Request Electron main process to open it in a native BrowserWindow via IPC
 * 3. Receive the redirect URL back via IPC
 * 4. Process the auth response using MSAL's handleRedirectPromise
 */
const loginPopupElectron = async (): Promise<AuthenticationResult | null> => {
  // First, try system browser authentication for better SSO support
  if (hasSystemBrowserAuth()) {
    console.log('[MSAL Electron] Trying system browser authentication first...');
    try {
      const result = await loginSystemBrowser();
      if (result) {
        console.log('[MSAL Electron] System browser authentication successful');
        return result;
      }
    } catch (error: any) {
      // Log the error but continue to fallback
      console.log('[MSAL Electron] System browser auth failed:', error.message);
      console.log('[MSAL Electron] Falling back to Electron popup...');
      // Continue to popup fallback
    }
  }

  // Fallback to Electron popup
  return loginPopupElectronInternal();
};

/**
 * Internal Electron popup login implementation
 *
 * This is the original popup flow that uses an Electron BrowserWindow.
 * It's used as a fallback when system browser authentication fails.
 */
const loginPopupElectronInternal = async (): Promise<AuthenticationResult | null> => {
  return new Promise((resolve, reject) => {
    let cleanup: (() => void) | null = null;
    let resolved = false;

    const handleResponse = async (data: {
      success: boolean;
      url?: string;
      error?: string;
      cancelled?: boolean;
    }) => {
      if (resolved) return;
      resolved = true;

      if (cleanup) {
        cleanup();
      }

      console.log('[MSAL Electron] Received auth popup response:', data.success);

      if (!data.success) {
        if (data.cancelled) {
          console.log('[MSAL Electron] User cancelled authentication');
          reject(new Error('user_cancelled'));
        } else {
          console.error('[MSAL Electron] Auth popup error:', data.error);
          reject(new Error(data.error || 'Authentication failed'));
        }
        return;
      }

      if (!data.url) {
        console.error('[MSAL Electron] No URL in auth response');
        reject(new Error('No authentication response URL'));
        return;
      }

      try {
        // Extract the hash or query string from the redirect URL
        const urlObj = new URL(data.url);
        const hash = urlObj.hash;
        const search = urlObj.search;

        console.log('[MSAL Electron] Processing redirect URL');
        console.log('[MSAL Electron] Hash:', hash ? 'present' : 'none');
        console.log('[MSAL Electron] Query:', search ? 'present' : 'none');

        // The auth response can be in hash (implicit/hybrid flow) or query (auth code flow)
        if (hash && hash.length > 1) {
          // Set the hash on current window so MSAL can read it
          const originalHash = window.location.hash;
          window.location.hash = hash;

          try {
            const result = await msalInstance.handleRedirectPromise();
            if (result?.account) {
              msalInstance.setActiveAccount(result.account);
              console.log('[MSAL Electron] Authentication successful');
              resolve(result);
            } else {
              window.location.hash = originalHash;
              const code = urlObj.searchParams.get('code');
              if (code) {
                console.warn('[MSAL Electron] Auth code flow detected in hash, trying query params');
              }
              reject(new Error('No authentication tokens in response'));
            }
          } finally {
            if (window.location.hash === hash) {
              window.location.hash = originalHash;
            }
          }
        } else if (search && search.length > 1) {
          // Auth code flow - the code is in query params
          const code = urlObj.searchParams.get('code');
          const error = urlObj.searchParams.get('error');
          const errorDescription = urlObj.searchParams.get('error_description');

          if (error) {
            console.error('[MSAL Electron] Auth error:', error, errorDescription);
            reject(new Error(`${error}: ${errorDescription}`));
            return;
          }

          if (code) {
            console.log('[MSAL Electron] Auth code received, handling redirect...');

            // For MSAL browser auth code flow, simulate a redirect
            const originalSearch = window.location.search;
            const originalHash = window.location.hash;

            const newUrl = new URL(window.location.href);
            newUrl.search = search;
            newUrl.hash = '';
            history.replaceState(null, '', newUrl.toString());

            try {
              const result = await msalInstance.handleRedirectPromise();
              if (result?.account) {
                msalInstance.setActiveAccount(result.account);
                console.log('[MSAL Electron] Authentication successful via auth code');
                resolve(result);
              } else {
                const restoreUrl = new URL(window.location.href);
                restoreUrl.search = originalSearch;
                restoreUrl.hash = originalHash;
                history.replaceState(null, '', restoreUrl.toString());
                reject(new Error('Failed to process authentication code'));
              }
            } catch (handleError) {
              const restoreUrl = new URL(window.location.href);
              restoreUrl.search = originalSearch;
              restoreUrl.hash = originalHash;
              history.replaceState(null, '', restoreUrl.toString());
              throw handleError;
            }
          } else {
            reject(new Error('No authentication code in response'));
          }
        } else {
          reject(new Error('No authentication data in redirect URL'));
        }
      } catch (error) {
        console.error('[MSAL Electron] Error processing auth response:', error);
        reject(error);
      }
    };

    // Register the IPC listener first
    if (window.electronAPI?.onAuthPopupResponse) {
      cleanup = window.electronAPI.onAuthPopupResponse(handleResponse);
    }

    // Build the Azure AD authorization URL ourselves
    // This avoids using loginPopup which tries window.open and fails
    const authUrl = buildAzureAuthUrl();
    console.log('[MSAL Electron] Built auth URL, requesting Electron to open popup...');

    // Send IPC message to Electron main process to open the auth popup
    if (window.ipcRenderer?.send) {
      window.ipcRenderer.send('open-auth-popup', authUrl);
    } else {
      // Fallback: If IPC for opening popup isn't available, try loginPopup anyway
      console.log('[MSAL Electron] No IPC send available, trying loginPopup fallback...');
      msalInstance.loginPopup({ scopes: authScopes })
        .then((result) => {
          if (resolved) return;
          resolved = true;
          if (cleanup) cleanup();

          if (result?.account) {
            msalInstance.setActiveAccount(result.account);
          }
          resolve(result);
        })
        .catch((error) => {
          console.log('[MSAL Electron] loginPopup threw:', error.message);
          // Wait for IPC response
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              if (cleanup) cleanup();
              reject(error);
            }
          }, 30000);
        });
    }

    // Set a timeout for the whole operation
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (cleanup) cleanup();
        reject(new Error('Authentication timeout - popup may have been closed'));
      }
    }, 120000); // 2 minute timeout
  });
};

/**
 * Build Azure AD authorization URL manually
 * This is used in Electron to avoid MSAL's popup mechanism which doesn't work
 */
function buildAzureAuthUrl(): string {
  const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || '';
  const authority = import.meta.env.VITE_AZURE_AUTHORITY || '';
  const redirectUri = encodeURIComponent(window.location.origin);
  const scopes = encodeURIComponent(authScopes.join(' '));

  // Generate a random state and nonce for security
  const state = generateRandomString(32);
  const nonce = generateRandomString(32);

  // Store state for validation on callback
  sessionStorage.setItem('msal.state', state);
  sessionStorage.setItem('msal.nonce', nonce);

  // Build authorization URL
  // Using response_type=code for auth code flow (more secure than implicit)
  // Note: We avoid prompt=login as it can trigger Windows Hello which doesn't work in Electron
  // Instead we use prompt=select_account and let the user choose their auth method
  const authUrl = `${authority}/oauth2/v2.0/authorize?` +
    `client_id=${clientId}` +
    `&response_type=code` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scopes}` +
    `&state=${state}` +
    `&nonce=${nonce}` +
    `&prompt=select_account` +
    `&login_hint=` +  // Empty login_hint allows user to choose account
    `&domain_hint=organizations`;  // Hint to use organizational account

  return authUrl;
}

/**
 * Generate a random string for state/nonce
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Build Azure AD authorization URL with a custom redirect URI
 * Used for system browser authentication where we need to redirect to a loopback server
 */
function buildAzureAuthUrlWithRedirect(redirectUri: string): string {
  const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || '';
  const authority = import.meta.env.VITE_AZURE_AUTHORITY || '';
  const scopes = encodeURIComponent(authScopes.join(' '));

  // Generate a random state and nonce for security
  const state = generateRandomString(32);
  const nonce = generateRandomString(32);

  // Store state for validation on callback
  sessionStorage.setItem('msal.state.system_browser', state);
  sessionStorage.setItem('msal.nonce.system_browser', nonce);

  // Build authorization URL with the custom redirect URI
  const authUrl = `${authority}/oauth2/v2.0/authorize?` +
    `client_id=${clientId}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scopes}` +
    `&state=${state}` +
    `&nonce=${nonce}` +
    `&prompt=select_account` +
    `&login_hint=` +
    `&domain_hint=organizations`;

  return authUrl;
}

/**
 * Exchange auth code for tokens directly with Azure AD token endpoint.
 *
 * This is needed because msal-browser cannot exchange auth codes from redirect URIs
 * that don't match its configuration. For system browser auth, we use a loopback
 * redirect URI, so we must exchange the code manually.
 *
 * @param code The authorization code from Azure AD
 * @param redirectUri The redirect URI that was used (loopback server)
 * @returns Promise with token response
 */
async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}> {
  const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || '';
  const authority = import.meta.env.VITE_AZURE_AUTHORITY || '';
  const tokenEndpoint = `${authority}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    scope: authScopes.join(' '),
  });

  console.log('[MSAL System Browser] Exchanging auth code for tokens at:', tokenEndpoint);

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[MSAL System Browser] Token exchange failed:', errorData);
    throw new Error(errorData.error_description || errorData.error || 'Token exchange failed');
  }

  const tokenData = await response.json();
  console.log('[MSAL System Browser] Token exchange successful');
  return tokenData;
}

/**
 * Parse a JWT token and extract its claims.
 * @param token The JWT token string
 * @returns The decoded payload
 */
function parseJwt(token: string): Record<string, unknown> {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

/**
 * Create a synthetic AuthenticationResult from token response.
 * This allows us to integrate manually-obtained tokens with MSAL's account management.
 *
 * @param tokenResponse The token response from Azure AD
 * @returns AuthenticationResult compatible object
 */
function createAuthResultFromTokens(tokenResponse: {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}): AuthenticationResult {
  const idTokenClaims = parseJwt(tokenResponse.id_token) as Record<string, unknown>;

  // Build account info from ID token claims
  const account: AccountInfo = {
    homeAccountId: `${idTokenClaims.oid as string}.${idTokenClaims.tid as string}`,
    environment: 'login.microsoftonline.com',
    tenantId: idTokenClaims.tid as string,
    username: (idTokenClaims.preferred_username as string) || (idTokenClaims.email as string) || '',
    localAccountId: idTokenClaims.oid as string,
    name: idTokenClaims.name as string,
    idTokenClaims: idTokenClaims,
  };

  const expiresOn = new Date(Date.now() + tokenResponse.expires_in * 1000);

  return {
    authority: import.meta.env.VITE_AZURE_AUTHORITY || '',
    uniqueId: idTokenClaims.oid as string,
    tenantId: idTokenClaims.tid as string,
    scopes: tokenResponse.scope.split(' '),
    account: account,
    idToken: tokenResponse.id_token,
    idTokenClaims: idTokenClaims,
    accessToken: tokenResponse.access_token,
    fromCache: false,
    expiresOn: expiresOn,
    tokenType: tokenResponse.token_type,
    correlationId: '',
  };
}

/**
 * System browser login flow for Enterprise SSO with Company Portal
 *
 * This uses the system browser (Safari/Chrome) instead of an Electron BrowserWindow.
 * The system browser has access to SSO cookies and can properly integrate with
 * device management solutions like Microsoft Intune and Company Portal.
 *
 * Flow:
 * 1. Request Electron to start a loopback HTTP server
 * 2. Build auth URL with the loopback redirect URI
 * 3. Request Electron to open auth URL in system browser
 * 4. User authenticates (with full Company Portal/SSO support)
 * 5. Azure redirects to loopback server
 * 6. Server captures auth code and sends it back via IPC
 * 7. Exchange auth code directly with Azure AD token endpoint (NOT via MSAL)
 * 8. Create synthetic AuthenticationResult and set active account
 *
 * @returns Promise with authentication result or null
 */
const loginSystemBrowser = async (): Promise<AuthenticationResult | null> => {
  // Store the redirect URI so we can use it for token exchange
  let loopbackRedirectUri: string | null = null;

  return new Promise((resolve, reject) => {
    let cleanup: (() => void) | null = null;
    let resolved = false;

    console.log('[MSAL] Starting system browser authentication flow');

    const handleResult = async (data: {
      success: boolean;
      code?: string;
      state?: string;
      fullUrl?: string;
      error?: string;
      errorDescription?: string;
    }) => {
      if (resolved) return;
      resolved = true;

      if (cleanup) {
        cleanup();
      }

      console.log('[MSAL System Browser] Received auth result:', data.success);

      if (!data.success) {
        console.error('[MSAL System Browser] Auth error:', data.error, data.errorDescription);
        reject(new Error(data.errorDescription || data.error || 'Authentication failed'));
        return;
      }

      if (!data.code) {
        console.error('[MSAL System Browser] No auth code in response');
        reject(new Error('No authentication code received'));
        return;
      }

      // Validate state if we stored one
      const storedState = sessionStorage.getItem('msal.state.system_browser');
      if (storedState && data.state && storedState !== data.state) {
        console.error('[MSAL System Browser] State mismatch - possible CSRF attack');
        reject(new Error('State validation failed'));
        return;
      }

      try {
        console.log('[MSAL System Browser] Auth code received, exchanging for tokens...');

        if (!loopbackRedirectUri) {
          throw new Error('Loopback redirect URI not available');
        }

        // Exchange the auth code directly with Azure AD token endpoint
        // This bypasses MSAL's redirect_uri validation which would fail
        const tokenResponse = await exchangeCodeForTokens(data.code, loopbackRedirectUri);

        // Create an AuthenticationResult from the token response
        const authResult = createAuthResultFromTokens(tokenResponse);

        // Set the account as active in MSAL
        // Note: This won't persist the tokens in MSAL's cache, but the account will be recognized
        msalInstance.setActiveAccount(authResult.account);

        console.log('[MSAL System Browser] Authentication successful via direct token exchange');
        console.log('[MSAL System Browser] Account:', authResult.account.username);

        resolve(authResult);
      } catch (error) {
        console.error('[MSAL System Browser] Error exchanging auth code for tokens:', error);
        reject(error);
      }

      // Clean up stored state
      sessionStorage.removeItem('msal.state.system_browser');
      sessionStorage.removeItem('msal.nonce.system_browser');
    };

    // Register the result listener first
    if (window.electronAPI?.onSystemBrowserAuthResult) {
      cleanup = window.electronAPI.onSystemBrowserAuthResult(handleResult);
    } else {
      reject(new Error('System browser auth not available'));
      return;
    }

    // Start the auth flow
    const startAuth = async () => {
      try {
        // Step 1: Start the loopback server and get the redirect URI
        console.log('[MSAL System Browser] Creating loopback server...');
        const serverResult = await window.electronAPI?.startSystemBrowserAuth();

        if (!serverResult?.success || !serverResult?.redirectUri) {
          throw new Error(serverResult?.error || 'Failed to start loopback server');
        }

        // Store the redirect URI for token exchange
        loopbackRedirectUri = serverResult.redirectUri;
        console.log('[MSAL System Browser] Loopback server ready at:', serverResult.redirectUri);

        // Step 2: Build the auth URL with the loopback redirect URI
        const authUrl = buildAzureAuthUrlWithRedirect(serverResult.redirectUri);
        console.log('[MSAL System Browser] Auth URL built');

        // Step 3: Open the auth URL in the system browser
        console.log('[MSAL System Browser] Opening system browser...');
        const openResult = await window.electronAPI?.openUrlInSystemBrowser(authUrl);

        if (!openResult?.success) {
          throw new Error(openResult?.error || 'Failed to open system browser');
        }

        console.log('[MSAL System Browser] System browser opened, waiting for auth response...');
        // Now we wait for the handleResult callback to be triggered

      } catch (error) {
        if (cleanup) cleanup();
        sessionStorage.removeItem('msal.state.system_browser');
        sessionStorage.removeItem('msal.nonce.system_browser');
        reject(error);
      }
    };

    startAuth();

    // Set a timeout for the whole operation
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (cleanup) cleanup();
        sessionStorage.removeItem('msal.state.system_browser');
        sessionStorage.removeItem('msal.nonce.system_browser');
        reject(new Error('Authentication timeout'));
      }
    }, 300000); // 5 minute timeout to match server timeout
  });
};

/**
 * Login using redirect
 * Fallback method if popup doesn't work
 */
export const loginRedirect = async (): Promise<void> => {
  await ensureInitialized();

  const validScopes = Array.isArray(authScopes)
    ? authScopes.filter(Boolean)
    : [];

  if (validScopes.length > 0) {
    await msalInstance.loginRedirect({ scopes: validScopes });
  }
};

/**
 * Handle redirect response after login
 * Should be called on app initialization to handle the redirect response
 * @returns Promise with authentication result or null
 */
export const handleRedirectPromise = async (): Promise<AuthenticationResult | null> => {
  await ensureInitialized();
  return msalInstance.handleRedirectPromise();
};

/**
 * Logout the current user
 * Uses popup logout, falls back to redirect if popup is blocked.
 * @param postLogoutRedirectUri Optional URI to redirect after logout
 */
export const logout = async (postLogoutRedirectUri?: string): Promise<void> => {
  await ensureInitialized();

  const activeAccount = msalInstance.getActiveAccount();
  const redirectUri = postLogoutRedirectUri || window.location.origin;

  try {
    console.log('[MSAL] Attempting popup logout...');
    await msalInstance.logoutPopup({
      account: activeAccount,
      postLogoutRedirectUri: redirectUri,
    });
    console.log('[MSAL] Popup logout successful');
  } catch (error: unknown) {
    const browserError = error as BrowserAuthError;
    console.error('[MSAL] Popup logout failed:', browserError.errorCode, browserError.message);

    // If popup fails, fall back to redirect logout
    if (browserError.errorCode === 'popup_window_error' ||
        browserError.errorCode === 'popup_closed_in_browser' ||
        browserError.errorCode === 'monitor_window_timeout') {
      console.log('[MSAL] Popup failed, falling back to redirect logout');
      await msalInstance.logoutRedirect({
        account: activeAccount,
        postLogoutRedirectUri: redirectUri,
      });
    } else {
      throw error;
    }
  }
};

/**
 * Acquire access token silently
 * Falls back to popup if silent acquisition fails due to iframe issues or interaction required.
 * Falls back to redirect if popup also fails.
 * @returns Promise with access token or null
 */
export const acquireTokenSilent = async (): Promise<string | null> => {
  await ensureInitialized();

  const activeAccount = msalInstance.getActiveAccount();
  if (!activeAccount) {
    console.log('[MSAL] No active account for token acquisition');
    return null;
  }

  try {
    const result = await msalInstance.acquireTokenSilent({
      scopes: authScopes,
      account: activeAccount,
    });
    return result.accessToken;
  } catch (error) {
    console.log('[MSAL] Silent token acquisition failed:', (error as Error).message);

    // Check if we should try popup (iframe issues or interaction required)
    const shouldTryPopup =
      (error instanceof BrowserAuthError &&
        (error.errorCode === 'block_iframe_reload' ||
          error.errorCode === 'monitor_window_timeout' ||
          error.errorCode === 'hash_empty_error')) ||
      error instanceof InteractionRequiredAuthError;

    if (shouldTryPopup) {
      console.log('[MSAL] Attempting popup for token acquisition');
      try {
        const result = await msalInstance.acquireTokenPopup({
          scopes: authScopes,
          account: activeAccount,
        });
        return result.accessToken;
      } catch (popupError: unknown) {
        const browserError = popupError as BrowserAuthError;
        console.error('[MSAL] Popup token acquisition failed:', browserError.errorCode, browserError.message);

        // If popup also fails, try redirect
        if (browserError.errorCode === 'popup_window_error' ||
            browserError.errorCode === 'popup_closed_in_browser' ||
            browserError.errorCode === 'monitor_window_timeout') {
          console.log('[MSAL] Popup failed, attempting redirect for token acquisition');
          try {
            await msalInstance.acquireTokenRedirect({
              scopes: authScopes,
              account: activeAccount,
            });
            // Redirect will navigate away, return null
            return null;
          } catch (redirectError) {
            console.error('[MSAL] Redirect token acquisition failed:', redirectError);
            return null;
          }
        }
        return null;
      }
    }

    // For other errors, also try popup as a fallback
    try {
      const result = await msalInstance.acquireTokenPopup({
        scopes: authScopes,
        account: activeAccount,
      });
      return result.accessToken;
    } catch (interactiveError: unknown) {
      const browserError = interactiveError as BrowserAuthError;
      console.error('[MSAL] Interactive token acquisition failed:', browserError.errorCode, browserError.message);

      // If popup fails, try redirect
      if (browserError.errorCode === 'popup_window_error' ||
          browserError.errorCode === 'popup_closed_in_browser' ||
          browserError.errorCode === 'monitor_window_timeout') {
        console.log('[MSAL] Popup failed, attempting redirect for token acquisition');
        try {
          await msalInstance.acquireTokenRedirect({
            scopes: authScopes,
            account: activeAccount,
          });
          return null;
        } catch (redirectError) {
          console.error('[MSAL] Redirect token acquisition failed:', redirectError);
          return null;
        }
      }
      return null;
    }
  }
};

/**
 * Get authorization header for API calls
 * @returns Promise with Authorization header object
 */
export const getAuthHeader = async (): Promise<{ Authorization: string } | null> => {
  const token = await acquireTokenSilent();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return null;
};

/**
 * Initialize authentication on app startup
 * Handles redirect response and checks for cached accounts
 * NOTE: Does NOT attempt ssoSilent - only checks existing cached sessions
 * @returns Promise with the authenticated account or null
 */
export const initializeAuth = async (): Promise<AccountInfo | null> => {
  await ensureInitialized();

  // Handle redirect response if returning from login
  const response = await msalInstance.handleRedirectPromise();
  if (response?.account) {
    msalInstance.setActiveAccount(response.account);
    return response.account;
  }

  // Check for existing accounts in cache
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
    return accounts[0];
  }

  // No existing session
  return null;
};

// Export the raw instance for advanced use cases
export const authInstance = msalInstance;

export default authInstance;
