/**
 * API Route Handler Utility
 * 
 * This utility provides standardized route handlers for API routes.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { handleApiError } from './apiErrorHandler';
import { validateRequest } from './requestValidator';

/**
 * Options for creating an API route handler
 */
interface RouteHandlerOptions<T extends z.ZodType | null> {
  /** Whether to require authentication */
  requireAuth?: boolean;
  /** Whether to require admin access */
  requireAdmin?: boolean;
  /** Zod schema for request validation (if applicable) */
  schema?: T;
  /** Whether to require and validate a CSRF token */
  requireCsrf?: boolean;
}

/**
 * Creates a standardized GET route handler
 * @param handler The handler function to execute
 * @param options Options for the route handler
 * @returns A standardized route handler function
 */
export function createGetHandler<T = any>(
  handler: (request: NextRequest, params?: any) => Promise<T>,
  options: RouteHandlerOptions<null> = {}
) {
  const {
    requireAuth = true,
    requireAdmin = true,
  } = options;
  
  return async (request: NextRequest, params?: any) => {
    try {
      // Check authentication if required
      if (requireAuth) {
        const access = await checkAccess(request);
        
        if (!access.authenticated) {
          return createErrorResponse(
            access.error || 'Authentication required',
            access.status || 401
          );
        }
        
        // Check admin access if required
        if (requireAdmin && !access.isAdmin) {
          return createErrorResponse('Forbidden. Admin access required.', 403);
        }
      }
      
      // Execute handler
      const result = await handler(request, params);
      
      // Return response
      return createApiResponse(result);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Creates a standardized POST/PUT/PATCH route handler with request validation
 * @param handler The handler function to execute
 * @param options Options for the route handler
 * @returns A standardized route handler function
 */
export function createDataHandler<T extends z.ZodType>(
  handler: (data: z.infer<T>, request: NextRequest, params?: any) => Promise<any>,
  options: RouteHandlerOptions<T>
) {
  const {
    requireAuth = true,
    requireAdmin = true,
    schema,
    requireCsrf = true,
  } = options;
  
  if (!schema) {
    throw new Error('Schema is required for data handlers');
  }
  
  return async (request: NextRequest, params?: any) => {
    try {
      // Check authentication if required
      if (requireAuth) {
        const access = await checkAccess(request);
        
        if (!access.authenticated) {
          return createErrorResponse(
            access.error || 'Authentication required',
            access.status || 401
          );
        }
        
        // Check admin access if required
        if (requireAdmin && !access.isAdmin) {
          return createErrorResponse('Forbidden. Admin access required.', 403);
        }
      }
      
      // Validate request
      const validation = await validateRequest(request, schema, requireCsrf);
      
      if (!validation.success) {
        return validation.errorResponse;
      }
      
      // Execute handler
      const result = await handler(validation.data!, request, params);
      
      // Return response
      return createApiResponse(result);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
