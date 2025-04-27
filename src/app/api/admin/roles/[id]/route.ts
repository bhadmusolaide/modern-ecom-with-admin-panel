import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { db } from '@/lib/firebase/admin';
import { PREDEFINED_ROLES } from '@/lib/rbac/types';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';





// Validation schema for role update
const updateRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  description: z.string().min(2, 'Description must be at least 2 characters').optional(),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

// Get a single role
export async function GET(
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
    const validation = updateRoleSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const { name, description, csrfToken } = validation.data;

    // Verify CSRF token
    const csrfValid = await verifyCsrfToken(csrfToken);
    if (!csrfValid) {
      return createErrorResponse('Invalid CSRF token', 400);
    }

    // Check if this is a predefined role
    const predefinedRole = PREDEFINED_ROLES.find(role => role.id === params.id);
    if (predefinedRole) {
      return createErrorResponse('Cannot update a predefined role', 400);
    }

    // Check if role exists
    const roleDoc = await db.collection('roles').doc(params.id).get();

    if (!roleDoc.exists) {
      return createErrorResponse('Role not found', 404);
    }

    // Check if role with same name already exists (if name is being updated)
    if (name && name !== roleDoc.data()?.name) {
      const existingRolesSnapshot = await db.collection('roles')
        .where('name', '==', name)
        .get();

      if (!existingRolesSnapshot.empty) {
        return createErrorResponse('A role with this name already exists', 400);
      }
    }

    // Update role in Firestore
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (description) updateData.description = description;

    await db.collection('roles').doc(params.id).update(updateData);

    // Get updated role
    const updatedRoleDoc = await db.collection('roles').doc(params.id).get();
    const updatedRole = {
      id: updatedRoleDoc.id,
      ...updatedRoleDoc.data(),
    };

    // Return updated role
    return createApiResponse({
      role: updatedRole,
      message: 'Role updated successfully',
     });
  } catch (error) {
    console.error('Error updating role:', error);
    return createErrorResponse('Failed to update role', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Delete a role
export async function DELETE(
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

    // Parse request body for CSRF token
    const body = await request.json();
    const { csrfToken } = body;

    // Verify CSRF token
    const csrfValid = await verifyCsrfToken(csrfToken);
    if (!csrfValid) {
      return createErrorResponse('Invalid CSRF token', 400);
    }

    // Check if this is a predefined role
    const predefinedRole = PREDEFINED_ROLES.find(role => role.id === params.id);
    if (predefinedRole) {
      return createErrorResponse('Cannot delete a predefined role', 400);
    }

    // Check if role exists
    const roleDoc = await db.collection('roles').doc(params.id).get();

    if (!roleDoc.exists) {
      return createErrorResponse('Role not found', 404);
    }

    // Check if any users have this role
    const usersWithRoleSnapshot = await db.collection('users')
      .where('role', '==', params.id)
      .limit(1)
      .get();

    if (!usersWithRoleSnapshot.empty) {
      return createErrorResponse('Cannot delete a role that is assigned to users', 400);
    }

    // Delete role from Firestore
    await db.collection('roles').doc(params.id).delete();

    // Return success
    return createApiResponse({
      message: 'Role deleted successfully',
     });
  } catch (error) {
    console.error('Error deleting role:', error);
    return createErrorResponse('Failed to delete role', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
