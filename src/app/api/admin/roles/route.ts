import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { db } from '@/lib/firebase/admin';
import { PREDEFINED_ROLES } from '@/lib/rbac/types';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';






// Validation schema for role creation
const createRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  permissions: z.array(z.string()).optional(),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

// Get all roles
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

    // Get roles from Firestore
    const rolesSnapshot = await db.collection('roles').get();
    let roles = rolesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Add predefined roles if they don't exist in the database
    const existingRoleIds = roles.map(role => role.id);
    const missingPredefinedRoles = PREDEFINED_ROLES.filter(
      role => !existingRoleIds.includes(role.id)
    );

    // Return roles
    return createApiResponse({
      roles: [...roles, ...missingPredefinedRoles],
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return createErrorResponse(
      'Failed to fetch roles',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

// Create a new role
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = createRoleSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const { name, description, permissions = [], csrfToken } = validation.data;

    // Verify CSRF token
    const csrfValid = await verifyCsrfToken(csrfToken);
    if (!csrfValid) {
      return createErrorResponse('Invalid CSRF token', 400);
    }

    // Check if role with same name already exists
    const existingRolesSnapshot = await db.collection('roles')
      .where('name', '==', name)
      .get();

    if (!existingRolesSnapshot.empty) {
      return createErrorResponse('A role with this name already exists', 400);
    }

    // Create role in Firestore
    const roleData = {
      name,
      description,
      permissions,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const roleRef = await db.collection('roles').add(roleData);
    const role = {
      id: roleRef.id,
      ...roleData,
    };

    // Return created role
    return createApiResponse({
      role,
      message: 'Role created successfully',
    }, 201);
  } catch (error) {
    console.error('Error creating role:', error);
    return createErrorResponse(
      'Failed to create role',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
