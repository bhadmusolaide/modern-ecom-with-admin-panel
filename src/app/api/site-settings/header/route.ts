import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';


// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return createApiResponse({}, 200);
}

// GET /api/site-settings/header
export async function GET() {
  try {
    // Get existing settings from Firestore
    const settingsRef = db.collection('siteSettings').doc('default');
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      return createErrorResponse('Settings not found', 404);
    }

    const settings = settingsDoc.data();
    const headerSettings = settings?.header || {
      transparent: true,
      menuItems: [
        { text: 'Home', url: '/' },
        { text: 'Shop', url: '/shop' },
        { text: 'Collections', url: '/collections' },
        { text: 'About', url: '/about' },
        { text: 'Contact', url: '/contact' }
      ]
    };

    return createApiResponse(headerSettings);
  } catch (error) {
    console.error('Error fetching header settings:', error);
    return createErrorResponse(
      'Failed to fetch header settings',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

// PUT /api/site-settings/header
export async function PUT(request: NextRequest) {
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

    const userId = access.userId || 'unknown-user';

    // Get incoming data
    const headerData = await request.json();
    console.log('Updating header settings from user:', userId);
    console.log('headerData:', headerData);

    // Validate data
    if (
      typeof headerData.transparent !== 'boolean' ||
      !Array.isArray(headerData.menuItems)
    ) {
      return createErrorResponse('Invalid header data format', 400);
    }

    const settingsRef = db.collection('siteSettings').doc('default');
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      console.warn('Settings doc not found. Creating default.');
      await settingsRef.set({
        header: headerData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      await settingsRef.update({
        header: headerData,
        updatedAt: new Date()
      });
    }

    // Return updated data
    const updated = await settingsRef.get();
    const updatedData = updated.data();

    return createApiResponse({
      ...updatedData,
      createdAt: updatedData?.createdAt?.toDate?.(),
      updatedAt: updatedData?.updatedAt?.toDate?.(),
    });
  } catch (error) {
    console.error('Error updating header settings:', error);
    return createErrorResponse(
      'Failed to update header settings',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
