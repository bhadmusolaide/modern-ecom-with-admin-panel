import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';


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

    // Get only admin users from Firestore (not customers)
    const usersSnapshot = await db.collection('users')
      .where('role', '!=', 'CUSTOMER')
      .get();

    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role || 'ADMIN', // Default to ADMIN for non-customer users
        emailVerified: data.emailVerified || false,
        isActive: data.isActive !== false, // Default to true if not set
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        lastLoginAt: data.lastLoginAt ? data.lastLoginAt.toDate() : null,
      };
    });

    // No longer adding mock admin user - using real data only

    // Sort by createdAt in descending order
    users.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return createApiResponse({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return createErrorResponse(
      'Failed to fetch users',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
