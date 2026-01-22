/**
 * MSAL Configuration for myGenAssist Studio
 *
 * Azure AD SSO configuration for Bayer authentication.
 * Supports both development (localhost) and production (custom protocol) environments.
 *
 * Azure AD App Registration Requirements:
 * For the app to work, redirect URIs must be registered as "Single-Page Application (SPA)" platform:
 * - Development: http://localhost:5173 (Vite default) AND http://localhost:7777 (VSCode debug)
 * - Production: mygenassist-studio://auth/callback
 *
 * NOTE: The redirect URI is now determined dynamically at runtime based on window.location.origin
 * in Electron dev mode to handle port variations (5173 vs 7777).
 */

import { LogLevel } from '@azure/msal-browser';

/**
 * Detects if running in Electron environment
 */
function isElectron(): boolean {
  return typeof window !== 'undefined' &&
         typeof window.process === 'object' &&
         (window.process as NodeJS.Process)?.type === 'renderer';
}

/**
 * Dynamically determines the redirect URI based on the current environment.
 * For Electron apps, this handles both localhost development and custom protocol production.
 *
 * IMPORTANT: In Electron dev mode, we must use the actual Vite dev server URL
 * (window.location.origin) rather than a hardcoded port, because the port may vary
 * (e.g., 5173 default vs 7777 for VSCode debugging).
 *
 * @returns The appropriate redirect URI for the current environment
 */
function getRedirectUri(): string {
  // Server-side rendering check
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_AZURE_REDIRECT_URI || '';
  }

  // In Electron development mode, use the actual window origin
  // This ensures the redirect URI matches the actual Vite dev server port
  if (isElectron() && import.meta.env.DEV) {
    // window.location.origin will be the actual Vite dev server URL (e.g., http://localhost:5173 or http://127.0.0.1:7777)
    return window.location.origin;
  }

  // In Electron production, use custom protocol if configured
  if (isElectron() && !import.meta.env.DEV) {
    // Production Electron apps typically use a custom protocol
    return import.meta.env.VITE_AZURE_REDIRECT_URI || 'mygenassist-studio://auth/callback';
  }

  // For web or explicit env var override
  if (import.meta.env.VITE_AZURE_REDIRECT_URI) {
    return import.meta.env.VITE_AZURE_REDIRECT_URI;
  }

  // Fallback to current origin
  return window.location.origin;
}

/**
 * MSAL configuration object
 *
 * Uses Vite environment variables for Azure AD settings.
 * The redirect URI is computed at runtime to support different deployment scenarios.
 */
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
    authority: import.meta.env.VITE_AZURE_AUTHORITY || '',
    redirectUri: getRedirectUri(),
    postLogoutRedirectUri: getRedirectUri(),
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (
        level: LogLevel,
        message: string,
        containsPii: boolean,
      ): void => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error('[MSAL]', message);
            return;
          case LogLevel.Info:
            // console.info('[MSAL]', message);
            return;
          case LogLevel.Verbose:
            // console.debug('[MSAL]', message);
            return;
          case LogLevel.Warning:
            console.warn('[MSAL]', message);
            return;
        }
      },
    },
    iframeHashTimeout: 12000,
  },
};

/**
 * Scopes for authentication
 * Uses VITE_AZURE_AUDIENCE from environment variables to construct the API scope.
 * Includes standard OpenID Connect scopes for user profile information.
 */
export const authScopes = [
  `${import.meta.env.VITE_AZURE_AUDIENCE}/.default`,
  'openid',
  'profile',
  'email',
];

/**
 * Login request configuration
 * Wraps authScopes in the expected { scopes } format for MSAL login methods.
 */
export const loginRequest = {
  scopes: authScopes,
};
