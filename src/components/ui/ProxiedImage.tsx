'use client';

import Image, { ImageProps } from 'next/image';
import { getProxiedImageUrl } from '@/lib/utils/imageUtils';
import { isSupabaseStorageUrl, getSupabaseImageUrl } from '@/lib/utils/supabaseImageUtils';

interface ProxiedImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  showNoImageMessage?: boolean;
}

/**
 * A wrapper around the Next.js Image component that automatically handles Supabase URLs
 * and external images by proxying them through the appropriate API
 */
export default function ProxiedImage({ src, showNoImageMessage = true, ...props }: ProxiedImageProps) {
  if (!src || src === '') {
    if (showNoImageMessage) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
          <span className="text-gray-400 text-sm">No image</span>
        </div>
      );
    }
    return <div className="w-full h-full bg-gray-100 rounded" />;
  }

  // Process the source URL based on its type
  let processedSrc = src;

  if (typeof src === 'string') {
    // Check if it's a Supabase URL first
    if (isSupabaseStorageUrl(src)) {
      processedSrc = getSupabaseImageUrl(src);
    }
    // For external URLs, use the standard proxy
    else if (src.includes('http')) {
      processedSrc = getProxiedImageUrl(src);
    }
  }

  return (
    <Image
      src={processedSrc}
      {...props}
    />
  );
}
