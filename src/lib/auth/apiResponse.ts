import { NextResponse } from 'next/server';

/**
 * Creates a standardized API response with proper headers
 * 
 * @param data - The data to return in the response
 * @param status - The HTTP status code (default: 200)
 * @returns NextResponse with JSON data and appropriate headers
 */
export function createApiResponse(data: any, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

/**
 * Creates a standardized error response
 * 
 * @param message - The error message
 * @param status - The HTTP status code (default: 400)
 * @param details - Optional additional error details
 * @returns NextResponse with error data and appropriate status code
 */
export function createErrorResponse(
  message: string, 
  status = 400, 
  details?: any
): NextResponse {
  return createApiResponse(
    { 
      error: message,
      ...(details && { details })
    }, 
    status
  );
}

/**
 * Creates a standardized unauthorized response
 * 
 * @param message - The error message (default: "Authentication required")
 * @returns NextResponse with 401 status code
 */
export function createUnauthorizedResponse(
  message = 'Authentication required'
): NextResponse {
  return createErrorResponse(message, 401);
}

/**
 * Creates a standardized forbidden response
 * 
 * @param message - The error message (default: "Access denied")
 * @returns NextResponse with 403 status code
 */
export function createForbiddenResponse(
  message = 'Access denied'
): NextResponse {
  return createErrorResponse(message, 403);
}
