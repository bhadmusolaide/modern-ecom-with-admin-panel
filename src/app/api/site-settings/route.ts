import { NextRequest } from 'next/server';
import { getSiteSettings, updateSiteSettings, createDefaultSiteSettings } from '@/lib/firebase/services/siteSettingsService';
import { SiteSettings } from '@/types/site-settings';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';


// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return createApiResponse({}, 200);
}

// GET /api/site-settings
export async function GET() {
  try {
    console.log('GET /api/site-settings: Fetching site settings');
    const settings = await getSiteSettings();

    if (!settings) {
      console.log('GET /api/site-settings: No settings found, creating defaults');
      const defaultSettings = await createDefaultSiteSettings();

      // Log the response we're about to send
      console.log('GET /api/site-settings: Returning default settings with keys:', Object.keys(defaultSettings));

      // Create the response
      const response = createApiResponse(defaultSettings);

      // Log the response status
      console.log('GET /api/site-settings: Response status:', response.status);

      return response;
    }

    // Log the response we're about to send
    console.log('GET /api/site-settings: Returning settings with keys:', Object.keys(settings));

    // Create the response
    const response = createApiResponse(settings);

    // Log the response status
    console.log('GET /api/site-settings: Response status:', response.status);

    return response;
  } catch (error) {
    console.error('Error fetching site settings:', error);

    // Create a more detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);

    return createErrorResponse('Failed to fetch site settings', 500, {
      details: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

// PUT /api/site-settings
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

    console.log('Processing site settings update from user:', access.userId);

    // Get incoming data
    const body = await request.json();

    // Validate data
    if (!body || typeof body !== 'object') {
      return createErrorResponse('Invalid settings data format', 400);
    }

    // Process the update
    const success = await updateSiteSettings(body);

    if (!success) {
      return createErrorResponse(
        'Failed to update site settings',
        500,
        { details: 'Database operation failed' }
      );
    }

    // Return updated settings
    const updatedSettings = await getSiteSettings();
    return createApiResponse(updatedSettings);
  } catch (error) {
    console.error('Error updating site settings:', error);
    return createErrorResponse(
      'Failed to update site settings',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
