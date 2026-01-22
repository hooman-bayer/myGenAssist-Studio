/**
 * MSAL Module Exports
 *
 * Central export point for Azure AD authentication functionality.
 *
 * NOTE: ssoSilent has been COMPLETELY REMOVED from this codebase.
 * All login attempts use popup authentication only.
 */

export { msalConfig, authScopes, loginRequest } from './config';

export {
  ensureInitialized,
  getAllAccounts,
  getActiveAccount,
  setActiveAccount,
  loginSilent, // @deprecated - now just calls loginPopup internally
  loginPopup,
  loginRedirect,
  handleRedirectPromise,
  logout,
  acquireTokenSilent,
  getAuthHeader,
  initializeAuth,
  authInstance,
} from './authInstance';

export type { AccountInfo, AuthenticationResult } from '@azure/msal-browser';
