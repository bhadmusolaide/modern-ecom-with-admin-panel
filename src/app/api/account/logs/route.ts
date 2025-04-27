import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

// Get user logs
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

    // Get user logs from Firestore
    const logsSnapshot = await db.collection('logs')
      .where('userId', '==', access.userId)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const logs = logsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp?.toDate(),
        type: data.type,
        message: data.message,
        details: data.details
      };
    });

    return createApiResponse({ logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return createErrorResponse('Failed to fetch logs', 500);
  }
}

// Create a new log entry
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

    const body = await request.json();
    const { type, message, details } = body;

    // Create log entry in Firestore
    await db.collection('logs').add({
      userId: access.userId,
      timestamp: new Date(),
      type,
      message,
      details
    });

    return createApiResponse({
      message: 'Log entry created successfully'
    });
  } catch (error) {
    console.error('Error creating log entry:', error);
    return createErrorResponse('Failed to create log entry', 500);
  }
} 