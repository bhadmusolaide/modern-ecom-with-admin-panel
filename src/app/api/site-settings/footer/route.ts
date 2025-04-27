import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { FooterSettings } from '@/lib/context/SiteSettingsContext';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';









// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return createApiResponse({  }, 200);
}

export async function PUT(request: NextRequest) {
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

    // Get incoming data
    const footerSettings = await request.json();
    console.log('Updating footer settings from user:', userId);

    // Validate data
    if (!footerSettings || typeof footerSettings !== 'object') {
      return createErrorResponse('Invalid footer settings format', 400);
    }

    // Required footer properties validation
    if (
      typeof footerSettings.companyDescription !== 'string' ||
      typeof footerSettings.copyrightText !== 'string' ||
      typeof footerSettings.showSocialLinks !== 'boolean' ||
      !Array.isArray(footerSettings.footerLinks)
    ) {
      return createErrorResponse('Missing required footer properties', 400);
    }

    const settingsRef = db.collection('siteSettings').doc('default');
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      console.warn('Settings doc not found. Creating default.');
      await settingsRef.set({
        footer: footerSettings,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      await settingsRef.update({
        footer: footerSettings,
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
    console.error('Error updating footer settings:', error);
    return createApiResponse({
        error: 'Failed to update footer settings',
        details: error instanceof Error ? error.message : 'Unknown error'
       }, 500);
  }
}