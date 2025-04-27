import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { DEFAULT_HOMEPAGE_SECTIONS } from '@/lib/data/siteSettings';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';









// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return createApiResponse({  }, 200);
}

// GET /api/site-settings/update-sections
export async function GET(request: NextRequest) {
  try {
    const isDevEnvironment = process.env.NODE_ENV === 'development';
    let userId = 'dev-user-id';

    // Auth check
    if (!isDevEnvironment) {
      const authResult = await checkAccess(request);

      if (!authResult.authenticated) {
        return createApiResponse(
          { error: authResult.error || 'Authentication required' },
          authResult.status || 401
        );
      }

      if (!authResult.isAdmin) {
        return createErrorResponse('Forbidden. Admin access required.', 403);
      }

      userId = authResult.userId;
    }

    console.log('Resetting homepage sections for user:', userId);

    // Get the site settings from Firestore
    const settingsRef = db.collection('siteSettings').doc('default');
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      return createErrorResponse('Site settings not found', 404);
    }

    // Update the settings with default homepage sections
    await settingsRef.update({
      homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
      updatedAt: new Date()
    });

    // Get the updated settings
    const updated = await settingsRef.get();
    const updatedData = updated.data();

    return createApiResponse({
      message: 'Homepage sections reset to defaults successfully',
      settings: {
        ...updatedData,
        createdAt: updatedData?.createdAt?.toDate?.(),
        updatedAt: updatedData?.updatedAt?.toDate?.(),
      }
    });
  } catch (error) {
    console.error('Error resetting homepage sections:', error);
    return createApiResponse({
        error: 'Failed to reset homepage sections',
        details: error instanceof Error ? error.message : 'Unknown error'
       }, 500);
  }
}
