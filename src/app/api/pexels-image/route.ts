import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to extract the direct image URL from a Pexels page
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query parameters
    const url = new URL(request.url);
    const pexelsUrl = url.searchParams.get('url');
    
    if (!pexelsUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }
    
    // Check if it's a Pexels URL
    if (!pexelsUrl.includes('pexels.com/photo/')) {
      return NextResponse.json(
        { error: 'Not a valid Pexels photo URL' },
        { status: 400 }
      );
    }
    
    // Extract the photo ID from the URL
    const match = pexelsUrl.match(/\/photo\/[^\/]+?-(\d+)\/?$/);
    if (!match || !match[1]) {
      return NextResponse.json(
        { error: 'Could not extract photo ID from URL' },
        { status: 400 }
      );
    }
    
    const photoId = match[1];
    
    // Try to fetch the Pexels page to extract the actual image URL
    try {
      const response = await fetch(pexelsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      
      if (!response.ok) {
        // If we can't fetch the page, use the CDN URL format
        const directUrl = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg`;
        return NextResponse.json({ url: directUrl });
      }
      
      const html = await response.text();
      
      // Try to extract the image URL from the HTML
      const srcMatch = html.match(/<img[^>]+src="([^"]+)"[^>]+data-big-src="([^"]+)"/);
      if (srcMatch && srcMatch[2]) {
        return NextResponse.json({ url: srcMatch[2] });
      }
      
      const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/);
      if (ogImageMatch && ogImageMatch[1]) {
        return NextResponse.json({ url: ogImageMatch[1] });
      }
      
      // If we can't extract the URL from the HTML, use the CDN URL format
      const directUrl = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg`;
      return NextResponse.json({ url: directUrl });
    } catch (error) {
      // If there's an error fetching the page, use the CDN URL format
      const directUrl = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg`;
      return NextResponse.json({ url: directUrl });
    }
  } catch (error) {
    console.error('Error extracting Pexels image URL:', error);
    return NextResponse.json(
      { error: 'Failed to extract image URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
