import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';




// Validation schema for activity creation
const createActivitySchema = z.object({
  type: z.enum(['product', 'order', 'user', 'setting', 'system']),
  action: z.enum(['create', 'update', 'delete', 'view', 'login', 'logout', 'other']),
  description: z.string().min(1, 'Description is required'),
  targetId: z.string().optional(),
  targetName: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

// Get activity logs
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    let query = db.collection('activity').orderBy('timestamp', 'desc');

    if (type) {
      query = query.where('type', '==', type);
    }

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    if (startDate) {
      const startTimestamp = new Date(startDate);
      query = query.where('timestamp', '>=', startTimestamp);
    }

    if (endDate) {
      const endTimestamp = new Date(endDate);
      endTimestamp.setHours(23, 59, 59, 999);
      query = query.where('timestamp', '<=', endTimestamp);
    }

    // Execute query with limit
    const activitiesSnapshot = await query.limit(limit).get();

    // Format activities
    const activities = activitiesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
      };
    });

    // Return activities
    return createApiResponse({
      activities,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return createErrorResponse('Failed to fetch activities', 500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

// Create activity log
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

    // Get user info
    const userDoc = await db.collection('users').doc(access.userId).get();

    if (!userDoc.exists) {
      return createErrorResponse('User not found', 404);
    }

    const userData = userDoc.data();

    // Parse and validate request body
    const body = await request.json();
    const validation = createActivitySchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const {
      type,
      action,
      description,
      targetId,
      targetName,
      metadata,
      csrfToken
    } = validation.data;

    // Verify CSRF token
    const csrfValid = await verifyCsrfToken(csrfToken);
    if (!csrfValid) {
      return createErrorResponse('Invalid CSRF token', 400);
    }

    // Create activity in Firestore
    const activityData = {
      type,
      action,
      description,
      userId: access.userId,
      userName: userData.name || userData.email,
      userEmail: userData.email,
      targetId: targetId || null,
      targetName: targetName || null,
      metadata: metadata || {},
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    };

    const activityRef = await db.collection('activity').add(activityData);

    // Return created activity
    return createApiResponse({
      activity: {
        id: activityRef.id,
        ...activityData,
        timestamp: activityData.timestamp.toISOString(),
      },
      message: 'Activity logged successfully',
    }, 201);
  } catch (error) {
    console.error('Error logging activity:', error);
    return createErrorResponse('Failed to log activity', 500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
