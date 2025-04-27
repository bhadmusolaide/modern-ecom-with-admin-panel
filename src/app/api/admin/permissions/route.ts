import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { ALL_PERMISSIONS } from '@/lib/rbac/permissions';


// Get all permissions
export async function GET(request: NextRequest) {
  try {
    // Unified auth check
  const access = await checkAccess(request);

  if (!access.authenticated) {
    return createErrorResponse(
      access.error || 'Authentication required',
      access.status || 401
    );
  }

  if (!access.isAdmin) {
    return createErrorResponse('Forbidden. Admin access required.', 403);
  }

  console.log('Admin access granted for user:', access.userId);

    // Return permissions
    return createApiResponse({ 
      permissions: ALL_PERMISSIONS,
     });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return createErrorResponse('Failed to fetch permissions', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
