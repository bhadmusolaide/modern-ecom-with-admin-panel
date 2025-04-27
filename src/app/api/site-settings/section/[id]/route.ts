import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';








// Using any for section types to avoid TypeScript errors with Firestore data

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return createApiResponse({  }, 200);
}

// PUT /api/site-settings/section/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isDevEnvironment = process.env.NODE_ENV === 'development';
    let userId = 'dev-user-id';
    const sectionId = params.id;

    // Auth check
    if (!isDevEnvironment) {
      const authResult = await checkAccess(request as NextRequest);

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
    const sectionData = await request.json();
    console.log('Updating section from user:', userId, { sectionId });

    // Validate that we have the required section ID
    if (!sectionId) {
      return createErrorResponse('Section ID is required', 400);
    }

    // Validate section data
    if (!sectionData || typeof sectionData !== 'object') {
      return createErrorResponse('Invalid section data format', 400);
    }

    // Get existing settings from Firestore
    const settingsRef = db.collection('siteSettings').doc('default');
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      return createErrorResponse('Settings not found', 404);
    }

    const existingSettings = settingsDoc.data() || {};
    const existingSections = existingSettings.homepageSections || [];

    // Find the section to update
    const sectionIndex = existingSections.findIndex((section: any) => section.id === sectionId);

    if (sectionIndex === -1) {
      return createApiResponse(
        { error: `Section with ID ${sectionId} not found` },
        404
      );
    }

    // Create a deep copy of the sections array
    const updatedSections = JSON.parse(JSON.stringify(existingSections));

    // Update the specific section while preserving required fields
    const originalSection = updatedSections[sectionIndex];
    updatedSections[sectionIndex] = {
      ...originalSection,
      ...sectionData,
      // Ensure required fields are preserved
      id: originalSection.id,
      name: originalSection.name,
      type: originalSection.type,
      order: originalSection.order
    };

    // Update the settings with the new sections in Firestore
    await settingsRef.update({
      homepageSections: updatedSections,
      updatedAt: new Date()
    });

    // Get the updated settings
    const updated = await settingsRef.get();
    const updatedData = updated.data();

    // Verify the update was successful
    const verifiedSections = updatedData?.homepageSections || [];
    const verifiedSection = verifiedSections.find((s: any) => s.id === sectionId);

    if (!verifiedSection) {
      console.error('Section update verification failed - section not found in updated settings');
      return createErrorResponse('Section update verification failed', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
    }

    return createApiResponse({
      ...updatedData,
      createdAt: updatedData?.createdAt?.toDate?.(),
      updatedAt: updatedData?.updatedAt?.toDate?.(),
     });
  } catch (error) {
    console.error('Error updating section:', error);
    return createApiResponse({
        error: 'Failed to update section',
        details: error instanceof Error ? error.message : 'Unknown error'
       }, 500);
  }
}