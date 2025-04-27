/**
 * API Error Handler Utility
 * 
 * This utility provides standardized error handling for API routes.
 */

import { NextRequest } from 'next/server';
import { createErrorResponse } from '@/lib/auth/apiResponse';

/**
 * Safely parses JSON from a request body with error handling
 * @param request The NextRequest object
 * @returns The parsed JSON body or null if parsing fails
 */
export async function safeParseBody<T>(request: NextRequest): Promise<T | null> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    console.error('Error parsing request body:', error);
    return null;
  }
}

/**
 * Handles common API errors and returns appropriate error responses
 * @param error The error object
 * @param defaultMessage Default error message if none is provided
 * @returns A standardized error response
 */
export function handleApiError(error: unknown, defaultMessage = 'An unexpected error occurred') {
  console.error('API Error:', error);
  
  // Handle Firebase Auth errors
  if (error && typeof error === 'object' && 'code' in error) {
    const errorCode = error.code as string;
    
    if (errorCode.startsWith('auth/')) {
      const errorMap: Record<string, { message: string, status: number }> = {
        'auth/email-already-exists': { 
          message: 'Email address is already in use', 
          status: 400 
        },
        'auth/invalid-email': { 
          message: 'Invalid email address', 
          status: 400 
        },
        'auth/user-not-found': { 
          message: 'User not found', 
          status: 404 
        },
        'auth/wrong-password': { 
          message: 'Invalid credentials', 
          status: 401 
        },
        'auth/id-token-expired': { 
          message: 'Authentication token expired', 
          status: 401 
        },
        'auth/id-token-revoked': { 
          message: 'Authentication token revoked', 
          status: 401 
        },
        'auth/invalid-id-token': { 
          message: 'Invalid authentication token', 
          status: 401 
        },
      };
      
      const errorInfo = errorMap[errorCode] || { 
        message: `Authentication error: ${errorCode}`, 
        status: 400 
      };
      
      return createErrorResponse(errorInfo.message, errorInfo.status);
    }
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return createErrorResponse(error.message || defaultMessage, 500);
  }
  
  // Handle unknown errors
  return createErrorResponse(defaultMessage, 500);
}

/**
 * Wraps an API handler function with standardized error handling
 * @param handler The API handler function to wrap
 * @returns A wrapped handler function with error handling
 */
export function withErrorHandling<T>(
  handler: (request: NextRequest, ...args: any[]) => Promise<T>
) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
