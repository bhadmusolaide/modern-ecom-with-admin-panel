import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { db } from '@/lib/firebase/admin';
import { PREDEFINED_ROLES } from '@/lib/rbac/types';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';





// Validation schema for permissions update
const updatePermissionsSchema = z.object({
  permissions: z.array(z.string()),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

// Update role permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from cookies
    // Unified auth check
  const access = await checkAccess(request);

  if (!access.authenticated) {
    return createErrorResponse(
      access.error || 'Authentication required',
      access.status || 401
    );
  }

    // Check if user is admin
  if (!access.isAdmin) {
    return createErrorResponse('Forbidden. Admin access required.', 403);
  }

  console.log('Admin access granted for user:', access.userId);

    // Parse and validate request body
    const body = await request.json();
    const validation = updatePermissionsSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const { permissions, csrfToken } = validation.data;

    // Verify CSRF token
    const csrfValid = await verifyCsrfToken(csrfToken);
    if (!csrfValid) {
      return createErrorResponse('Invalid CSRF token', 400);
    }

    // Check if this is a predefined role
    const predefinedRole = PREDEFINED_ROLES.find(role => role.id === params.id);
    if (predefinedRole) {
      return createErrorResponse('Cannot update permissions for a predefined role', 400);
    }

    // Check if role exists
    const roleDoc = await db.collection('roles').doc(params.id).get();

    if (!roleDoc.exists) {
      return createErrorResponse('Role not found', 404);
    }

    // Update role permissions in Firestore
    await db.collection('roles').doc(params.id).update({
      permissions,
      updatedAt: new Date(),
    });

    // Get updated role
    const updatedRoleDoc = await db.collection('roles').doc(params.id).get();
    const updatedRole = {
      id: updatedRoleDoc.id,
      ...updatedRoleDoc.data(),
    };

    // Return updated role
    return createApiResponse({
      role: updatedRole,
      message: 'Role permissions updated successfully',
     });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return createErrorResponse('Failed to update role permissions', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
