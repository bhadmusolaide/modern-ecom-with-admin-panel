/**
 * Enhanced Token Storage Utility
 *
 * This implementation uses a hybrid approach for maximum compatibility:
 * 1. HttpOnly cookies (set via API) for secure server-side authentication
 * 2. In-memory token storage for client-side operations
 * 3. LocalStorage as a fallback for page refreshes
 *
 * The priority order is:
 * 1. In-memory token (most secure, but lost on page refresh)
 * 2. HttpOnly cookie (secure, but requires server-side access)
 * 3. LocalStorage (less secure, but persists across page refreshes)
 */

// Constants
const TOKEN_KEY = 'firebase_auth_token';
const TOKEN_EXPIRY_KEY = 'firebase_auth_token_expiry';
const SESSION_ENDPOINT = '/api/auth/session';
const LOGOUT_ENDPOINT = '/api/auth/logout';

// In-memory token storage (not vulnerable to XSS)
let inMemoryToken: string | null = null;
let inMemoryTokenExpiry: number | null = null;

/**
 * Parse a JWT token to get its expiration time
 * @param token The JWT token to parse
 * @returns The expiration time in milliseconds, or null if invalid
 */
function getTokenExpiry(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return null;

    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
}

/**
 * Check if a token is expired
 * @param expiry The token expiry time in milliseconds
 * @returns True if the token is expired, false otherwise
 */
function isTokenExpired(expiry: number | null): boolean {
  if (!expiry) return true;
  return Date.now() > expiry;
}

/**
 * Store the user's authentication token securely
 * - Sets an HttpOnly cookie via API call
 * - Keeps a copy in memory for client-side operations
 * - Stores in localStorage as a fallback
 *
 * @param token The token to store
 */
export async function storeAuthToken(token: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Get token expiry
    const expiry = getTokenExpiry(token);

    // Store token in memory
    inMemoryToken = token;
    inMemoryTokenExpiry = expiry;

    // Store token in localStorage as fallback
    localStorage.setItem(TOKEN_KEY, token);
    if (expiry) {
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
    }

    // Set HttpOnly cookie via API
    try {
      const response = await fetch(SESSION_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        console.warn('Failed to store auth token in secure cookie, falling back to localStorage');
      } else {
        console.log('Auth token stored securely in HttpOnly cookie');
      }
    } catch (apiError) {
      console.warn('API error when storing token in cookie, falling back to localStorage:', apiError);
    }
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
}

/**
 * Retrieve the user's authentication token
 * - First tries the in-memory token
 * - Then falls back to localStorage
 * - Checks for token expiration
 *
 * @returns The stored token or null if not found or expired
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  // First try in-memory token
  if (inMemoryToken && !isTokenExpired(inMemoryTokenExpiry)) {
    return inMemoryToken;
  }

  // Then try localStorage
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    const expiry = expiryStr ? parseInt(expiryStr, 10) : null;

    if (token && !isTokenExpired(expiry)) {
      // Restore in-memory token
      inMemoryToken = token;
      inMemoryTokenExpiry = expiry;
      return token;
    }
  } catch (error) {
    console.warn('Error reading token from localStorage:', error);
  }

  return null;
}

/**
 * Remove the user's authentication token
 * - Clears the HttpOnly cookie via API call
 * - Removes the in-memory token
 * - Clears localStorage
 */
export async function removeAuthToken(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Clear in-memory token
  inMemoryToken = null;
  inMemoryTokenExpiry = null;

  // Clear localStorage
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (error) {
    console.warn('Error removing token from localStorage:', error);
  }

  // Clear HttpOnly cookie via API
  try {
    await fetch(LOGOUT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Auth token removed from secure cookie');
  } catch (error) {
    console.error('Error removing auth token from cookie:', error);
  }
}

/**
 * Check if a token exists and is valid
 * @returns True if a valid token exists, false otherwise
 */
export function hasAuthToken(): boolean {
  return getAuthToken() !== null;
}

/**
 * Refresh the token if needed
 * @param user The Firebase user object
 * @returns The refreshed token
 */
export async function refreshTokenIfNeeded(user: any): Promise<string | null> {
  if (!user) return null;

  try {
    // Force token refresh
    const token = await user.getIdToken(true);
    await storeAuthToken(token);
    return token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Check if the session is valid by verifying with the server
 * @returns Promise resolving to true if session is valid, false otherwise
 */
export async function verifySession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const response = await fetch(SESSION_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return false;

    const data = await response.json();
    return data.authenticated === true;
  } catch (error) {
    console.error('Error verifying session:', error);
    return false;
  }
}
