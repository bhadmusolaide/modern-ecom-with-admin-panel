/**
 * API Request Validator Utility
 * 
 * This utility provides standardized request validation for API routes.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { createErrorResponse } from '@/lib/auth/apiResponse';
import { safeParseBody } from './apiErrorHandler';

/**
 * Validates a request body against a Zod schema
 * @param request The NextRequest object
 * @param schema The Zod schema to validate against
 * @param requireCsrf Whether to require and validate a CSRF token
 * @returns An object containing the validation result and any error response
 */
export async function validateRequest<T extends z.ZodType>(
  request: NextRequest,
  schema: T,
  requireCsrf = true
): Promise<{
  success: boolean;
  data?: z.infer<T>;
  errorResponse?: Response;
}> {
  // Parse request body
  const body = await safeParseBody(request);
  
  if (!body) {
    return {
      success: false,
      errorResponse: createErrorResponse('Invalid request body', 400)
    };
  }
  
  // Verify CSRF token if required
  if (requireCsrf) {
    const csrfToken = body.csrfToken;
    
    if (!csrfToken) {
      return {
        success: false,
        errorResponse: createErrorResponse('CSRF token is required', 400)
      };
    }
    
    const csrfValid = await verifyCsrfToken(csrfToken);
    
    if (!csrfValid) {
      return {
        success: false,
        errorResponse: createErrorResponse('Invalid CSRF token', 403)
      };
    }
  }
  
  // Validate request body against schema
  const validation = schema.safeParse(body);
  
  if (!validation.success) {
    const errorMessage = validation.error.errors[0]?.message || 'Invalid request data';
    
    return {
      success: false,
      errorResponse: createErrorResponse(errorMessage, 400)
    };
  }
  
  return {
    success: true,
    data: validation.data
  };
}

/**
 * Creates a schema that includes a CSRF token
 * @param baseSchema The base schema to extend
 * @returns A new schema that includes a CSRF token
 */
export function withCsrf<T extends z.ZodRawShape>(baseSchema: T) {
  return z.object({
    ...baseSchema,
    csrfToken: z.string().min(1, 'CSRF token is required')
  });
}
