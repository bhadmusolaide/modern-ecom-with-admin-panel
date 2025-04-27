import Tokens from 'csrf';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const tokens = new Tokens();

// Use a consistent secret for the entire application
// This MUST be set in environment variables
const CSRF_SECRET = process.env.CSRF_SECRET;

/**
 * Generate a CSRF secret if one doesn't exist
 * This secret is stored in an HttpOnly cookie and used to generate tokens
 */
export function getCsrfSecret(): string {
  try {
    // Use the consistent secret from environment variables
    if (!CSRF_SECRET) {
      console.warn('CSRF_SECRET environment variable is not set. Using a temporary secret. This is NOT secure for production!');
      // Generate a temporary secret for development only
      return tokens.secretSync();
    }
    return CSRF_SECRET;
  } catch (error) {
    console.error('Error generating CSRF secret:', error);
    // Fallback to a temporary secret if there's an error
    return tokens.secretSync();
  }
}

/**
 * Generate a CSRF token
 * Returns the token to be included in forms
 */
export function generateCsrfToken(): string {
  const secret = getCsrfSecret();
  return tokens.create(secret);
}

/**
 * Verify a CSRF token
 */
export function verifyCsrfToken(formToken: string): boolean {
  try {
    if (!formToken) {
      console.error('CSRF token verification failed: Token is empty or undefined');
      return false;
    }

    console.log(`Verifying CSRF token: ${formToken.substring(0, 10)}...`);
    const secret = getCsrfSecret();
    const isValid = tokens.verify(secret, formToken);

    if (!isValid) {
      console.error('CSRF token verification failed: Invalid token');
    } else {
      console.log('CSRF token verification successful');
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying CSRF token:', error);
    return false;
  }
}

/**
 * Middleware to verify CSRF token in API requests
 * Use this in API routes that modify data
 */
export function csrfProtection(request: Request): boolean {
  // Skip CSRF check for GET, HEAD, OPTIONS requests
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  if (safeMethod) {
    return true;
  }

  try {
    // Get token from request header or body
    const csrfToken = request.headers.get('X-CSRF-Token');

    if (!csrfToken) {
      console.warn('CSRF protection failed: No CSRF token in request header');
      return false;
    }

    // Verify the token
    return verifyCsrfToken(csrfToken);
  } catch (error) {
    console.error('Error in CSRF protection middleware:', error);
    return false;
  }
}

/**
 * API route handler for generating CSRF tokens
 */
export async function handleCsrfToken() {
  const token = generateCsrfToken();

  return NextResponse.json({ token }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    }
  });
}
