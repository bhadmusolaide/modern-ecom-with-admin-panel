/**
 * Utility functions for handling images with Supabase
 */
import { isSupabaseUrl } from '@/lib/supabase/storage';

/**
 * Checks if a URL is a Supabase URL
 * @param url The URL to check
 * @returns True if the URL is a Supabase URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return isSupabaseUrl(url);
}

/**
 * Gets a direct URL for a Supabase Storage image
 * @param url The image URL
 * @returns The direct URL for the image
 */
export function getSupabaseImageUrl(url: string): string {
  if (!url) return '';
  
  // Supabase Storage URLs are already public and don't need proxying
  return url;
}

/**
 * Gets a proxied URL for any image
 * @param url The image URL
 * @returns The proxied URL for the image
 */
export function getProxiedImageUrl(url: string): string {
  if (!url) return '';
  
  // If it's an S3 URL, use the image proxy
  if (url.includes('.s3.') || url.includes('amazonaws.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  
  // Otherwise, return the original URL
  return url;
}
