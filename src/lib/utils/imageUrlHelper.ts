/**
 * Utility functions for handling image URLs
 */

/**
 * Safely process an image URL to ensure it's valid for display
 * This handles various edge cases like undefined URLs, relative paths, etc.
 *
 * @param url The image URL to process
 * @param fallback Optional fallback URL if the provided URL is invalid
 * @returns A valid image URL or the fallback URL
 */
export function getSafeImageUrl(url: string | null | undefined, fallback: string = '/placeholder-product.png'): string {
  // If URL is null, undefined, or empty string, return fallback
  if (!url) {
    console.log('Image URL is empty, using fallback');
    return fallback;
  }

  // Trim the URL to remove any whitespace
  const trimmedUrl = url.trim();

  if (trimmedUrl === '') {
    console.log('Image URL is empty after trimming, using fallback');
    return fallback;
  }

  // If URL is a data URL, return as is
  if (trimmedUrl.startsWith('data:')) {
    return trimmedUrl;
  }

  // Handle Firebase Storage URLs
  if (trimmedUrl.includes('firebasestorage.googleapis.com')) {
    // Check if the URL is properly formatted
    try {
      new URL(trimmedUrl);
      return trimmedUrl;
    } catch (e) {
      console.error('Invalid Firebase Storage URL:', trimmedUrl, e);
      return fallback;
    }
  }

  // Handle Supabase URLs
  if (trimmedUrl.includes('supabase.co/storage/v1/object/public/')) {
    // Check if the URL is properly formatted
    try {
      new URL(trimmedUrl);
      return trimmedUrl;
    } catch (e) {
      console.error('Invalid Supabase URL:', trimmedUrl, e);
      return fallback;
    }
  }

  // Handle relative paths
  if (!trimmedUrl.startsWith('http') && !trimmedUrl.startsWith('/')) {
    return `/${trimmedUrl}`;
  }

  // Handle absolute URLs
  if (trimmedUrl.startsWith('http')) {
    try {
      new URL(trimmedUrl);
      return trimmedUrl;
    } catch (e) {
      console.error('Invalid absolute URL:', trimmedUrl, e);
      return fallback;
    }
  }

  // For all other cases, return the URL as is
  return trimmedUrl;
}

/**
 * Check if an image URL is valid
 *
 * @param url The image URL to check
 * @returns True if the URL is valid, false otherwise
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  // Trim the URL to remove any whitespace
  const trimmedUrl = url.trim();

  if (trimmedUrl === '') {
    return false;
  }

  // Data URLs are always valid
  if (trimmedUrl.startsWith('data:')) {
    return true;
  }

  // Check if the URL is a valid URL
  try {
    // For absolute URLs, try to create a URL object
    if (trimmedUrl.startsWith('http')) {
      new URL(trimmedUrl);
    }
  } catch (e) {
    console.error('Invalid URL format:', trimmedUrl, e);
    return false;
  }

  // Check for common image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
  const hasImageExtension = imageExtensions.some(ext => trimmedUrl.toLowerCase().endsWith(ext));

  // Check for URLs that contain image-related paths
  const imagePathIndicators = ['/images/', '/img/', '/photos/', '/thumbnails/', '/avatars/'];
  const hasImagePath = imagePathIndicators.some(path => trimmedUrl.includes(path));

  // Check for common image hosting domains
  const imageHostingDomains = [
    'pexels.com',
    'pixabay.com',
    'unsplash.com',
    'firebasestorage.googleapis.com',
    'storage.googleapis.com',
    'supabase.co/storage'
  ];
  const isImageHostingDomain = imageHostingDomains.some(domain => trimmedUrl.includes(domain));

  // Check for placeholder images
  if (trimmedUrl.includes('placeholder') || trimmedUrl.includes('no-image')) {
    return true;
  }

  return hasImageExtension || hasImagePath || isImageHostingDomain;
}
