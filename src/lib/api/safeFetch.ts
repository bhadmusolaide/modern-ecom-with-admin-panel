import { getAuthToken, refreshTokenIfNeeded } from '@/lib/auth/tokenStorage';
import { auth } from '@/lib/firebase/config';

/**
 * Enhanced safe fetch utility that properly handles API responses and errors
 *
 * This utility wraps the standard fetch API with better error handling:
 * 1. First gets response as text to avoid JSON parse errors
 * 2. Attempts to parse as JSON, but gracefully handles non-JSON responses
 * 3. Properly handles HTTP error status codes
 * 4. Returns typed data or throws a meaningful error
 * 5. Automatically refreshes auth tokens when needed
 * 6. Automatically includes CSRF tokens when needed
 * 7. Provides detailed error information
 */

export interface SafeFetchOptions extends RequestInit {
  /**
   * Whether to include the authorization token in the request
   * @default true
   */
  includeAuth?: boolean;

  /**
   * Whether to retry the request with a fresh token if authentication fails
   * @default true
   */
  retryWithFreshToken?: boolean;

  /**
   * Whether to throw an error if the request fails
   * @default true
   */
  throwOnError?: boolean;

  /**
   * Whether to include a CSRF token in the request
   * @default false for GET requests, true for other methods
   */
  includeCsrf?: boolean;

  /**
   * CSRF token to use (if not provided, will be fetched automatically when needed)
   */
  csrfToken?: string;
}

// Cache for CSRF token to avoid unnecessary requests
let cachedCsrfToken: string | null = null;
let csrfTokenExpiry: number = 0;

/**
 * Fetches a CSRF token from the server
 * @returns The CSRF token
 */
async function fetchCsrfToken(): Promise<string> {
  // If we have a cached token that hasn't expired, use it
  const now = Date.now();
  if (cachedCsrfToken && csrfTokenExpiry > now) {
    console.log('Using cached CSRF token');
    return cachedCsrfToken;
  }

  console.log('Fetching new CSRF token from /api/auth/csrf');

  try {
    // Make the request with explicit no-cache headers
    const response = await fetch('/api/auth/csrf', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      console.error(`CSRF token fetch failed with status: ${response.status}`);
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    // Get response as text first to avoid JSON parse errors
    const text = await response.text();

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing CSRF response as JSON:', parseError);
      console.error('Response text:', text.substring(0, 200));
      throw new Error('Failed to parse CSRF token response');
    }

    if (!data.csrfToken) {
      console.error('CSRF token missing in response:', data);
      throw new Error('CSRF token missing in response');
    }

    console.log(`CSRF token fetched successfully, length: ${data.csrfToken.length}`);

    // Cache the token for 5 minutes (reduced from 10 minutes)
    cachedCsrfToken = data.csrfToken;
    csrfTokenExpiry = now + 5 * 60 * 1000;

    return data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    // Return a fallback token for GET requests to prevent complete failure
    // This is only used for non-critical operations
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using fallback CSRF token in development mode');
      return 'fallback-csrf-token-for-development-only';
    }
    throw new Error('Failed to fetch CSRF token');
  }
}

/**
 * Safely fetch data from an API endpoint with proper error handling
 *
 * @param url The URL to fetch from
 * @param options Fetch options
 * @returns The parsed JSON response data
 * @throws Error with meaningful message if the request fails (unless throwOnError is false)
 */
export async function safeFetch<T = any>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<T> {
  try {
    // Get the current user token if available
    let token = getAuthToken();

    // Try to get a fresh token directly from Firebase if available
    if (auth.currentUser) {
      try {
        console.log('Getting fresh token directly from Firebase');
        token = await auth.currentUser.getIdToken(true);
        console.log('Successfully got fresh token from Firebase');
      } catch (tokenError) {
        console.error('Error getting fresh token from Firebase:', tokenError);
        // Fall back to the stored token
      }
    }

    // Set up headers with auth token if requested
    const headers: HeadersInit = {
      ...options.headers,
    };

    // Include auth token if requested and available
    if (options.includeAuth !== false && token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Added Authorization header with token');
    }

    // Set up the request body
    let requestBody = options.body;

    // Determine if we need to include a CSRF token
    const method = options.method?.toUpperCase() || 'GET';
    const shouldIncludeCsrf = options.includeCsrf ?? (method !== 'GET');

    console.log(`Request to ${url}, method: ${method}, shouldIncludeCsrf: ${shouldIncludeCsrf}`);

    // If we need to include a CSRF token and the request has a JSON body
    if (shouldIncludeCsrf) {
      // Set content type to JSON if not already set
      if (!options.headers || !('Content-Type' in (options.headers as any))) {
        headers['Content-Type'] = 'application/json';
        console.log('Setting Content-Type to application/json');
      }

      try {
        // Get the CSRF token
        const csrfToken = options.csrfToken || await fetchCsrfToken();
        console.log(`Using CSRF token: ${csrfToken.substring(0, 10)}...`);

        // Also add the token to headers for additional security
        headers['X-CSRF-Token'] = csrfToken;

        // If the body is a string, parse it as JSON
        let bodyObj = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;

        // If the body is a FormData, convert it to an object
        if (bodyObj instanceof FormData) {
          const formObj: Record<string, any> = {};
          bodyObj.forEach((value, key) => {
            formObj[key] = value;
          });
          bodyObj = formObj;
        }

        // Add the CSRF token to the body
        bodyObj = {
          ...(bodyObj || {}),
          csrfToken
        };

        // Stringify the body
        requestBody = JSON.stringify(bodyObj);
        console.log('CSRF token added to request body');
      } catch (csrfError) {
        console.error('Error handling CSRF token:', csrfError);
        // Continue with the request without CSRF token in development
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Continuing without CSRF token in development mode');
        } else {
          throw csrfError;
        }
      }
    }

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
      body: requestBody as BodyInit,
    });

    // If authentication failed and retryWithFreshToken is enabled, try to refresh the token and retry
    if (response.status === 401 && options.retryWithFreshToken !== false && auth.currentUser) {
      console.log('Authentication failed, refreshing token and retrying...');

      // Refresh the token
      const freshToken = await refreshTokenIfNeeded(auth.currentUser);

      if (freshToken) {
        // Update the headers with the fresh token
        headers['Authorization'] = `Bearer ${freshToken}`;

        // Retry the request
        const retryResponse = await fetch(url, {
          ...options,
          headers,
          body: requestBody as BodyInit,
        });

        // If the retry succeeded, use the retry response
        if (retryResponse.ok) {
          console.log('Retry with fresh token succeeded');
          const retryText = await retryResponse.text();

          try {
            return JSON.parse(retryText) as T;
          } catch (parseError) {
            console.warn('Error parsing retry response as JSON:', parseError);
            return retryText as unknown as T;
          }
        }
      }
    }

    // Get response as text first to avoid JSON parse errors
    const text = await response.text();

    // Try to parse as JSON
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.warn('Error parsing response as JSON:', parseError);
      console.log('Response text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));

      // If response is not JSON and status is not OK, throw error with status
      if (!response.ok && options.throwOnError !== false) {
        throw new Error(`API request failed with status ${response.status}: ${text.substring(0, 100)}`);
      }

      // If response is not JSON but status is OK, return text as data
      return text as unknown as T;
    }

    // Handle API error responses
    if (!response.ok && options.throwOnError !== false) {
      const errorMessage = data?.error || data?.message || `API request failed with status ${response.status}`;
      console.error('API error response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        errorMessage,
        data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
      });

      // Create an error with more details
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).statusText = response.statusText;
      (error as any).url = url;
      (error as any).data = data;

      throw error;
    }

    // Return the parsed data
    return data as T;
  } catch (error) {
    // Log the error
    console.error('API request failed:', error);

    // Rethrow if throwOnError is not explicitly set to false
    if (options.throwOnError !== false) {
      throw error;
    }

    // Return null if throwOnError is false
    return null as unknown as T;
  }
}
