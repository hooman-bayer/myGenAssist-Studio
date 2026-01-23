/**
 * Local Eigent Server Authentication
 *
 * This module handles auto-registration and login with the local eigent server.
 * When a user logs in via SSO, we automatically register/login them on the local
 * server to get a local JWT token for eigent API calls.
 *
 * The local server has its own auth system (email/password based) separate from SSO.
 * We use a deterministic password derived from the email to enable seamless auth.
 */

/**
 * Generate a deterministic password from email.
 * The password must be at least 8 chars and contain both letters and numbers.
 */
function generateLocalPassword(email: string): string {
  // Use a deterministic hash-like password that meets the server requirements:
  // - At least 8 characters
  // - Contains both letters and numbers
  // We use a simple but deterministic approach: prefix + email hash
  const prefix = 'EigentSSO1';
  const emailHash = btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
  return `${prefix}${emailHash}`;
}

/**
 * Get the local eigent server base URL
 */
async function getLocalServerUrl(): Promise<string> {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    const proxyUrl = import.meta.env.VITE_PROXY_URL;
    if (proxyUrl) {
      return proxyUrl;
    }
    return 'http://localhost:3001';
  } else {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    if (!baseUrl) {
      throw new Error('VITE_BASE_URL not configured');
    }
    return baseUrl;
  }
}

/**
 * Response from login endpoint
 */
interface LoginResponse {
  token: string;
  email: string;
}

/**
 * Register a new user on the local eigent server.
 * If the user already exists, this will fail - which is expected.
 *
 * @param email User's email from SSO
 * @returns true if registration succeeded, false if user already exists
 */
async function registerLocalUser(email: string): Promise<boolean> {
  const baseUrl = await getLocalServerUrl();
  const password = generateLocalPassword(email);

  try {
    const response = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (response.ok) {
      console.log('[LocalAuth] User registered successfully on local server');
      return true;
    }

    // User already exists is expected and not an error
    const data = await response.json().catch(() => ({}));
    if (data.text?.includes('already registered') || response.status === 400) {
      console.log('[LocalAuth] User already exists on local server');
      return true; // Still return true - user exists, we can login
    }

    console.warn('[LocalAuth] Registration failed:', data);
    return false;
  } catch (error) {
    console.error('[LocalAuth] Registration error:', error);
    return false;
  }
}

/**
 * Login to the local eigent server.
 *
 * @param email User's email from SSO
 * @returns Local JWT token if successful, null otherwise
 */
async function loginLocalUser(email: string): Promise<LoginResponse | null> {
  const baseUrl = await getLocalServerUrl();
  const password = generateLocalPassword(email);

  try {
    const response = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.error('[LocalAuth] Login failed:', response.status, data);
      return null;
    }

    const data: LoginResponse = await response.json();
    console.log('[LocalAuth] Login successful on local server');
    return data;
  } catch (error) {
    console.error('[LocalAuth] Login error:', error);
    return null;
  }
}

/**
 * Auto-register and login to local eigent server.
 * This is the main function to call after SSO login success.
 *
 * Flow:
 * 1. Try to register the user (will fail silently if already exists)
 * 2. Login to get local JWT token
 *
 * @param email User's email from SSO
 * @returns Object with localToken and localEmail, or null if failed
 */
export async function authenticateWithLocalServer(
  email: string
): Promise<{ localToken: string; localEmail: string } | null> {
  console.log('[LocalAuth] Starting local server authentication for:', email);

  // Step 1: Try to register (idempotent - fails silently if exists)
  const registered = await registerLocalUser(email);
  if (!registered) {
    console.error('[LocalAuth] Failed to ensure user exists on local server');
    // Continue anyway - user might exist and we can still login
  }

  // Step 2: Login to get local token
  const loginResult = await loginLocalUser(email);
  if (!loginResult) {
    console.error('[LocalAuth] Failed to login to local server');
    return null;
  }

  console.log('[LocalAuth] Local server authentication complete');
  return {
    localToken: loginResult.token,
    localEmail: loginResult.email,
  };
}

/**
 * Check if we have a valid local token by making a simple API call.
 * This can be used to verify the token is still valid.
 *
 * @param token The local JWT token to verify
 * @returns true if token is valid, false otherwise
 */
export async function verifyLocalToken(token: string): Promise<boolean> {
  const baseUrl = await getLocalServerUrl();

  try {
    const response = await fetch(`${baseUrl}/api/providers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[LocalAuth] Token verification error:', error);
    return false;
  }
}

export { getLocalServerUrl, generateLocalPassword };
