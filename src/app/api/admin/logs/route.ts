/**
 * Admin Logs API Routes
 *
 * This file contains API routes for managing system logs.
 * - GET /api/admin/logs - Get all system logs
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

// Get system logs
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const level = searchParams.get('level'); // info, warning, error, debug

    // Build query
    let query = db.collection('system_logs').orderBy('timestamp', 'desc');

    if (type) {
      query = query.where('type', '==', type);
    }

    if (level) {
      query = query.where('level', '==', level);
    }

    if (startDate) {
      const startTimestamp = new Date(startDate);
      query = query.where('timestamp', '>=', startTimestamp);
    }

    if (endDate) {
      const endTimestamp = new Date(endDate);
      query = query.where('timestamp', '<=', endTimestamp);
    }

    // Execute query with limit
    const logsSnapshot = await query.limit(limit).get();

    // Format logs
    const logs = logsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp?.toDate(),
        level: data.level,
        type: data.type,
        message: data.message,
        details: data.details,
        source: data.source
      };
    });

    return createApiResponse({ logs });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    return createErrorResponse('Failed to fetch system logs', 500);
  }
}
