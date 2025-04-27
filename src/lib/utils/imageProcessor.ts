// Only import sharp on the server side
import { Buffer } from 'buffer';

// Dynamic import for sharp to avoid client-side issues
let sharp: any;
if (typeof window === 'undefined') {
  // We're on the server
  import('sharp').then((module) => {
    sharp = module.default;
  }).catch(err => {
    console.error('Error importing sharp:', err);
  });
}

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
  background?: string; // CSS color
  withoutEnlargement?: boolean;
  withoutReduction?: boolean;
}

export interface ProcessedImage {
  data: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Process an image with sharp
 * @param buffer The image buffer to process
 * @param options Processing options
 * @returns Processed image data
 */
export async function processImage(
  buffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  // Check if we're on the client side
  if (typeof window !== 'undefined') {
    console.warn('Image processing is not available on the client side');
    // Return a mock result for client-side
    return {
      data: buffer,
      format: 'unknown',
      width: 0,
      height: 0,
      size: buffer.length,
    };
  }

  try {
    // Make sure sharp is available
    if (!sharp) {
      throw new Error('Sharp is not available');
    }

    // Start with the original image
    let image = sharp(buffer);

    // Get original metadata
    const metadata = await image.metadata();

    // Resize if dimensions are provided
    if (options.width || options.height) {
      image = image.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'cover',
        background: options.background || { r: 255, g: 255, b: 255, alpha: 1 },
        withoutEnlargement: options.withoutEnlargement !== false,
        withoutReduction: options.withoutReduction || false,
      });
    }

    // Convert format if specified
    if (options.format) {
      switch (options.format) {
        case 'jpeg':
          image = image.jpeg({ quality: options.quality || 80 });
          break;
        case 'png':
          image = image.png({ quality: options.quality || 80 });
          break;
        case 'webp':
          image = image.webp({ quality: options.quality || 80 });
          break;
        case 'avif':
          image = image.avif({ quality: options.quality || 80 });
          break;
      }
    }

    // Process the image
    const processedBuffer = await image.toBuffer({ resolveWithObject: true });

    return {
      data: processedBuffer.data,
      format: processedBuffer.info.format,
      width: processedBuffer.info.width,
      height: processedBuffer.info.height,
      size: processedBuffer.info.size,
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert a File or Blob to a Buffer
 * @param file The file to convert
 * @returns Buffer representation of the file
 */
export async function fileToBuffer(file: File | Blob): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Download an image from a URL and convert it to a Buffer
 * @param url The URL to download from
 * @returns Buffer representation of the image
 */
export async function urlToBuffer(url: string): Promise<Buffer> {
  try {
    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      throw new Error(`Invalid URL format: ${url}`);
    }

    // Add custom headers to avoid CORS issues and mimic a browser
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Verify content type is an image
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      throw new Error(`URL does not point to an image. Content-Type: ${contentType}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Downloaded image is empty (0 bytes)');
    }

    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error downloading image from URL:', error);
    throw new Error(`Failed to download image from URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Process an image from a URL
 * @param url The URL of the image to process
 * @param options Processing options
 * @returns Processed image data
 */
export async function processImageFromUrl(
  url: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  try {
    // Download the image
    const buffer = await urlToBuffer(url);

    // Process the image
    return await processImage(buffer, options);
  } catch (error) {
    console.error('Error processing image from URL:', error);
    throw new Error(`Image processing from URL failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate optimized versions of an image
 * @param buffer The original image buffer
 * @returns Object containing different optimized versions
 */
export async function generateImageVariants(buffer: Buffer): Promise<{
  original: ProcessedImage;
  thumbnail: ProcessedImage;
  medium: ProcessedImage;
  large: ProcessedImage;
  webp: ProcessedImage;
  avif?: ProcessedImage;
}> {
  // Check if we're on the client side
  if (typeof window !== 'undefined') {
    console.warn('Image variant generation is not available on the client side');
    // Return mock results for client-side
    const mockImage: ProcessedImage = {
      data: buffer,
      format: 'unknown',
      width: 0,
      height: 0,
      size: buffer.length,
    };
    
    return {
      original: mockImage,
      thumbnail: mockImage,
      medium: mockImage,
      large: mockImage,
      webp: mockImage,
    };
  }

  // Make sure sharp is available
  if (!sharp) {
    throw new Error('Sharp is not available');
  }

  // Get original metadata
  const metadata = await sharp(buffer).metadata();

  // Process original (just to get consistent format)
  const original = await processImage(buffer);

  // Generate thumbnail
  const thumbnail = await processImage(buffer, {
    width: 200,
    height: 200,
    fit: 'cover',
    format: 'webp',
    quality: 80,
  });

  // Generate medium size
  const medium = await processImage(buffer, {
    width: 800,
    height: 800,
    fit: 'inside',
    withoutEnlargement: true,
    format: 'webp',
    quality: 80,
  });

  // Generate large size
  const large = await processImage(buffer, {
    width: 1600,
    height: 1600,
    fit: 'inside',
    withoutEnlargement: true,
    format: 'webp',
    quality: 80,
  });

  // Generate WebP version (same dimensions as original)
  const webp = await processImage(buffer, {
    format: 'webp',
    quality: 80,
  });

  // Generate AVIF version if supported
  let avif: ProcessedImage | undefined;
  try {
    avif = await processImage(buffer, {
      format: 'avif',
      quality: 70,
    });
  } catch (error) {
    console.warn('AVIF conversion not supported:', error);
    // Continue without AVIF
  }

  return {
    original,
    thumbnail,
    medium,
    large,
    webp,
    ...(avif && { avif }),
  };
}
