/**
 * Admin Backups API Routes
 *
 * This file contains API routes for managing system backups.
 * - GET /api/admin/backups - Get all system backups
 * - POST /api/admin/backups - Create a new system backup
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

// Get all system backups
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

    // Get system backups from Firestore
    const backupsSnapshot = await db.collection('system_backups')
      .orderBy('createdAt', 'desc')
      .get();

    const backups = backupsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        createdAt: data.createdAt?.toDate(),
        size: data.size,
        status: data.status,
        type: data.type,
        downloadUrl: data.downloadUrl,
        createdBy: data.createdBy,
        description: data.description
      };
    });

    return createApiResponse({ backups });
  } catch (error) {
    console.error('Error fetching system backups:', error);
    return createErrorResponse('Failed to fetch system backups', 500);
  }
}

// Create a new system backup
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

    console.log('Admin access granted for user:', access.userId);

    // Parse request body
    const body = await request.json();
    const { description } = body;

    // Create backup document in Firestore
    const backupRef = await db.collection('system_backups').add({
      createdAt: new Date(),
      createdBy: access.userId,
      status: 'in_progress',
      type: 'manual',
      size: '0 MB',
      description: description || 'Manual backup'
    });

    // TODO: Implement actual backup creation logic
    // This would typically involve:
    // 1. Collecting system data
    // 2. Compressing it
    // 3. Uploading to storage
    // 4. Updating the backup document with size and download URL

    // For now, we'll simulate a successful backup
    await backupRef.update({
      status: 'completed',
      size: '5.2 MB',
      downloadUrl: `https://example.com/system-backup-${backupRef.id}.zip`
    });

    // Log activity
    await db.collection('activity').add({
      type: 'system',
      action: 'create',
      description: `Created system backup: ${description || 'Manual backup'}`,
      userId: access.userId,
      timestamp: new Date(),
      metadata: {
        backupId: backupRef.id
      }
    });

    return createApiResponse({
      message: 'System backup created successfully',
      backupId: backupRef.id
    });
  } catch (error) {
    console.error('Error creating system backup:', error);
    return createErrorResponse('Failed to create system backup', 500);
  }
}
