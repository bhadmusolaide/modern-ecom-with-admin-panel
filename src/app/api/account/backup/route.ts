import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

// Get user backups
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

    // Get user backups from Firestore
    const backupsSnapshot = await db.collection('backups')
      .where('userId', '==', access.userId)
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
        downloadUrl: data.downloadUrl
      };
    });

    return createApiResponse({ backups });
  } catch (error) {
    console.error('Error fetching backups:', error);
    return createErrorResponse('Failed to fetch backups', 500);
  }
}

// Create a new backup
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

    // Create backup document in Firestore
    const backupRef = await db.collection('backups').add({
      userId: access.userId,
      createdAt: new Date(),
      status: 'in_progress',
      type: 'manual',
      size: '0 MB'
    });

    // TODO: Implement actual backup creation logic
    // This would typically involve:
    // 1. Collecting user data
    // 2. Compressing it
    // 3. Uploading to storage
    // 4. Updating the backup document with size and download URL

    // For now, we'll simulate a successful backup
    await backupRef.update({
      status: 'completed',
      size: '2.5 MB',
      downloadUrl: 'https://example.com/backup.zip'
    });

    return createApiResponse({
      message: 'Backup created successfully',
      backupId: backupRef.id
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return createErrorResponse('Failed to create backup', 500);
  }
} 