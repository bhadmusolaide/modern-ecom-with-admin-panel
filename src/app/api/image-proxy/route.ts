import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseUrl, BUCKET_UPLOADS } from '@/lib/supabase/storage';
import { uploadFileAdmin, getPublicUrlAdmin } from '@/lib/supabase/server';

/**
 * API route to proxy image requests
 * This helps solve CORS issues and provides a consistent interface for images
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query parameters
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    // Check if it's a Supabase URL
    if (isSupabaseUrl(imageUrl)) {
      // Supabase URLs are already public, so just redirect
      return NextResponse.redirect(imageUrl);
    }

    // For external URLs that need to be cached in Supabase
    if (imageUrl.includes('http') && !imageUrl.includes('supabase.co')) {
      try {
        // Extract filename from URL
        const urlObj = new URL(imageUrl);
        const pathSegments = urlObj.pathname.split('/');
        const filename = pathSegments[pathSegments.length - 1] || 'image';

        // Fetch the image
        const response = await fetch(imageUrl);

        if (!response.ok) {
          console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          // If we can't fetch the image, redirect to original URL
          return NextResponse.redirect(imageUrl);
        }

        // Get the image data
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Upload to Supabase
        const path = `uploads/external-${Date.now()}-${filename}`;
        const blob = new Blob([buffer], { type: contentType });

        const { error } = await uploadFileAdmin(
          BUCKET_UPLOADS,
          path,
          blob,
          {
            contentType,
            upsert: true
          }
        );

        if (error) {
          console.error('Error uploading to Supabase:', error);
          // If upload fails, redirect to original URL as fallback
          return NextResponse.redirect(imageUrl);
        }

        // Get the public URL
        const { data: urlData } = getPublicUrlAdmin(BUCKET_UPLOADS, path);

        if (!urlData || !urlData.publicUrl) {
          console.error('Failed to get public URL for uploaded file');
          // If we can't get the URL, redirect to original URL as fallback
          return NextResponse.redirect(imageUrl);
        }

        console.log(`Successfully cached external image to Supabase: ${urlData.publicUrl}`);

        // Redirect to the Supabase URL
        return NextResponse.redirect(urlData.publicUrl);
      } catch (error) {
        console.error('Error caching external image to Supabase:', error);
        // If anything goes wrong, redirect to original URL as fallback
        return NextResponse.redirect(imageUrl);
      }
    }

    // For external URLs, redirect to the original URL
    return NextResponse.redirect(imageUrl);
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}