/**
 * Utility functions for handling image sources from various platforms
 */

/**
 * Converts a Pexels webpage URL to a direct image URL
 * @param url The Pexels webpage URL
 * @returns The direct image URL or null if not a valid Pexels URL
 */
export function convertPexelsUrl(url: string): string | null {
  try {
    // Check if it's a Pexels URL
    if (!url.includes('pexels.com/photo/')) {
      return null;
    }

    // Extract the photo ID from the URL
    const match = url.match(/\/photo\/[^\/]+?-(\d+)\/?$/);
    if (!match || !match[1]) {
      return null;
    }

    const photoId = match[1];
    
    // Construct a direct image URL using the Pexels CDN format
    // This is a common format for Pexels images, but it might change
    return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg`;
  } catch (error) {
    console.error('Error converting Pexels URL:', error);
    return null;
  }
}

/**
 * Converts a Pixabay webpage URL to a direct image URL
 * @param url The Pixabay webpage URL
 * @returns The direct image URL or null if not a valid Pixabay URL
 */
export function convertPixabayUrl(url: string): string | null {
  try {
    // Check if it's a Pixabay URL
    if (!url.includes('pixabay.com/')) {
      return null;
    }

    // Extract the photo ID from the URL
    const match = url.match(/\/(\d+)(?:\/|$)/);
    if (!match || !match[1]) {
      return null;
    }

    const photoId = match[1];
    
    // Construct a direct image URL using the Pixabay CDN format
    return `https://pixabay.com/get/${photoId}/`;
  } catch (error) {
    console.error('Error converting Pixabay URL:', error);
    return null;
  }
}

/**
 * Checks if a URL is a Supabase storage URL
 * @param url The URL to check
 * @returns True if the URL is a Supabase storage URL
 */
export function isSupabaseUrl(url: string): boolean {
  return url.includes('supabase.co/storage/v1/object/public/');
}

/**
 * Extracts the bucket and path from a Supabase URL
 * @param url The Supabase URL
 * @returns An object with bucket and path, or null if not a valid Supabase URL
 */
export function parseSupabaseUrl(url: string): { bucket: string, path: string } | null {
  try {
    if (!isSupabaseUrl(url)) {
      return null;
    }

    // Extract the bucket and path from the URL
    const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
    if (!match || !match[1] || !match[2]) {
      return null;
    }

    return {
      bucket: match[1],
      path: match[2]
    };
  } catch (error) {
    console.error('Error parsing Supabase URL:', error);
    return null;
  }
}

/**
 * Converts a webpage URL to a direct image URL for supported platforms
 * @param url The webpage URL
 * @returns The direct image URL or the original URL if not supported
 */
export function convertToDirectImageUrl(url: string): string {
  // Try Pexels
  const pexelsUrl = convertPexelsUrl(url);
  if (pexelsUrl) {
    return pexelsUrl;
  }
  
  // Try Pixabay
  const pixabayUrl = convertPixabayUrl(url);
  if (pixabayUrl) {
    return pixabayUrl;
  }
  
  // Return the original URL if no conversion was possible
  return url;
}

/**
 * Checks if a URL is likely to be a direct image URL
 * @param url The URL to check
 * @returns True if the URL is likely an image URL
 */
export function isLikelyImageUrl(url: string): boolean {
  // Check for common image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
  const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
  
  // Check for image-specific query parameters
  const hasImageParams = url.includes('format=jpg') || 
                         url.includes('format=png') || 
                         url.includes('type=image');
  
  // Check for common image CDN patterns
  const isImageCdn = url.includes('images.') || 
                     url.includes('cdn.') || 
                     url.includes('/image/') ||
                     url.includes('/images/') ||
                     url.includes('storage.googleapis.com') ||
                     url.includes('supabase.co/storage/v1/object/public/');
  
  return hasImageExtension || hasImageParams || isImageCdn;
}
