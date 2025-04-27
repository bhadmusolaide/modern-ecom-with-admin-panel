/**
 * Utility functions for handling images
 */

/**
 * Checks if a URL is a legacy URL that needs migration
 * @param url The URL to check
 * @returns True if the URL is a legacy URL
 */
export function isLegacyUrl(url: string): boolean {
  // This function previously checked for S3 URLs
  // Now it's a placeholder for any future legacy URL detection
  return false;
}

/**
 * Converts a URL to a proxied URL if needed
 * @param url The URL to check
 * @returns The proxied URL if needed, otherwise the original URL
 */
export function getProxiedImageUrl(url: string): string {
  if (!url) return '';

  // For external URLs that might need proxying
  if (url.includes('http') && !url.includes('supabase.co')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

  // Otherwise, return the original URL
  return url;
}
