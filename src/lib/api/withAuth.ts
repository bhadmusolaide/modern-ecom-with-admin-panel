import { NextRequest, NextResponse } from 'next/server';
import { checkAccess, AuthResult } from '@/lib/auth/checkAccess';

/**
 * API route handler with authentication
 */
type AuthenticatedHandler = (
  request: NextRequest, 
  authResult: AuthResult
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function that wraps API route handlers with authentication
 * 
 * @param handler - The API route handler function
 * @param requireAdmin - Whether admin privileges are required
 * @returns A new handler function with authentication checks
 */
export function withAuth(
  handler: AuthenticatedHandler, 
  requireAdmin: boolean = false
) {
  return async (request: NextRequest) => {
    // Skip authentication for OPTIONS requests (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    // Check authentication
    const authResult = await checkAccess(request);
    
    // If not authenticated, return 401 Unauthorized
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: authResult.status || 401 }
      );
    }
    
    // If admin required but user is not admin, return 403 Forbidden
    if (requireAdmin && !authResult.isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    try {
      // Call the handler with the authenticated request and auth result
      return await handler(request, authResult);
    } catch (error) {
      console.error('Error in API route handler:', error);
      
      // Return appropriate error response
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function that wraps API route handlers with admin-only authentication
 * 
 * @param handler - The API route handler function
 * @returns A new handler function with admin authentication checks
 */
export function withAdminAuth(handler: AuthenticatedHandler) {
  return withAuth(handler, true);
}