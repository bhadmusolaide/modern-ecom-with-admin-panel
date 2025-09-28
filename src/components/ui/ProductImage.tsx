'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getSafeImageUrl, isValidImageUrl } from '@/lib/utils/imageUrlHelper';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * A component for displaying product images with fallback and error handling
 */
export default function ProductImage({
  src,
  alt,
  className = '',
  width,
  height,
  fallbackSrc = '/placeholder-product.png',
  onLoad,
  onError
}: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(getSafeImageUrl(src, fallbackSrc));
  const [error, setError] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  // Update image source when src prop changes
  useEffect(() => {
    setImageSrc(getSafeImageUrl(src, fallbackSrc));
    setError(false);
    setLoaded(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    console.error('Image failed to load:', src);
    setError(true);
    setImageSrc(fallbackSrc);
    onError?.();
  };

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  // Check if we should use fill mode (when className contains absolute positioning)
  const shouldUseFill = className?.includes('absolute') || className?.includes('inset-0');

  return (
    <div className={`relative overflow-hidden ${shouldUseFill ? '' : 'w-full h-full'}`} style={{ width, height }}>
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse w-12 h-12 rounded-full bg-gray-200"></div>
        </div>
      )}

      {shouldUseFill ? (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className={`${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, 50vw"
          onError={handleError}
          onLoad={handleLoad}
          priority={false}
        />
      ) : (
        <Image
          src={imageSrc}
          alt={alt}
          width={width || 400}
          height={height || 400}
          className={`w-full h-full ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, 50vw"
          onError={handleError}
          onLoad={handleLoad}
          priority={false}
        />
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 mb-2"
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
          <span className="text-sm">Image not available</span>
        </div>
      )}
    </div>
  );
}
