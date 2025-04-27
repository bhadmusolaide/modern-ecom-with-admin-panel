'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { isSupabaseUrl } from '@/lib/supabase/storage';

interface StorageImageProps extends Omit<ImageProps, 'src'> {
  src: string | null;
  fallbackSrc?: string;
  showNoImageMessage?: boolean;
}

/**
 * Component to display images from Supabase storage or external sources
 * with automatic handling of different URL formats
 */
export default function StorageImage({ src, fallbackSrc, alt, showNoImageMessage = true, ...props }: StorageImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(src);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);



  useEffect(() => {
    // Reset state when src changes
    if (src) {
      // Check if it's a Supabase URL
      if (isSupabaseUrl(src)) {
        // Supabase URLs are already public, use directly
        setImageSrc(src);
        setError(false);
      }
      // Check if it's an external URL that might need proxying
      else if (src.includes('http')) {
        useImageProxy();
      }
      // For relative URLs or other formats
      else {
        setImageSrc(src);
        setError(false);
      }
    } else {
      setImageSrc(null);
      setError(false);
    }
  }, [src]);

  // Function to use image proxy for external images if needed
  const useImageProxy = async () => {
    if (!src || error) return;

    try {
      setLoading(true);

      // For external URLs, use the image proxy to avoid CORS issues
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(src)}`;
      setImageSrc(proxyUrl);
      setError(false);
    } catch (err) {
      console.error('Error setting up image proxy:', err);
      setError(true);

      // Use fallback if provided
      if (fallbackSrc) {
        setImageSrc(fallbackSrc);
      } else {
        setImageSrc(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle image load error
  const handleError = () => {
    // If we haven't tried using the image proxy yet and it's not a Supabase URL, try that
    if (src && !loading && imageSrc === src && !isSupabaseUrl(src)) {
      // Use the image proxy for external URLs
      useImageProxy();
    } else if (fallbackSrc && imageSrc !== fallbackSrc) {
      // If we have a fallback and haven't used it yet, use it
      setImageSrc(fallbackSrc);
      setError(true);
    } else {
      // Otherwise, just mark as error
      setImageSrc(null);
      setError(true);
    }
  };

  // If there's no image or there was an error and we want to show a message
  if ((!imageSrc || error) && showNoImageMessage) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${props.className || ''}`}
        style={{ width: props.width || '100%', height: props.height || '100%' }}
      >
        <div className="text-center p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mx-auto mb-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs">No image</span>
        </div>
      </div>
    );
  }

  // If we have an image to display
  if (imageSrc) {
    return (
      <Image
        src={imageSrc}
        alt={alt || 'Image'}
        onError={handleError}
        {...props}
      />
    );
  }

  // Fallback empty div with same dimensions
  return (
    <div
      style={{ width: props.width || '100%', height: props.height || '100%' }}
      className={props.className}
    />
  );
}
