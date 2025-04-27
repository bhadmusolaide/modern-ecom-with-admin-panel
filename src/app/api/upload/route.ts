import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';







// Supabase imports
import {
  getPathFromUrl,
  FileMetadata,
  BUCKET_UPLOADS
} from '@/lib/supabase/storage';
// Server-side Supabase admin utilities
import { uploadFileAdmin, deleteFileAdmin, getPublicUrlAdmin } from '@/lib/supabase/server';
import { fileToBuffer, processImage, processImageFromUrl, ImageProcessingOptions, ProcessedImage } from '@/lib/utils/imageProcessor';

// Using Supabase for storage

// Helper function to parse processing options from request
function parseProcessingOptions(request: NextRequest): ImageProcessingOptions | undefined {
  const url = new URL(request.url);
  const width = url.searchParams.get('width');
  const height = url.searchParams.get('height');
  const format = url.searchParams.get('format');
  const quality = url.searchParams.get('quality');
  const fit = url.searchParams.get('fit');

  // Only return options if at least one parameter is provided
  if (width || height || format || quality || fit) {
    return {
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
      format: format as 'jpeg' | 'png' | 'webp' | 'avif' | undefined,
      quality: quality ? parseInt(quality) : undefined,
      fit: fit as 'cover' | 'contain' | 'fill' | 'inside' | 'outside' | undefined,
    };
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    // Check if this is a URL-based upload
    const contentType = request.headers.get('content-type') || '';

    // Handle JSON requests (URL uploads)
    if (contentType.includes('application/json')) {
      return handleUrlUpload(request);
    }

    // Handle form data requests (file uploads)
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];
    const processingOptions = parseProcessingOptions(request);

    // Check if we have any files
    if (!files.length) {
      return createErrorResponse('No files provided', 400);
    }

    // Process and upload files
    const uploadPromises = files.map(async (file) => {
      try {
        const buffer = await fileToBuffer(file);
        const processedResult = processingOptions
          ? await processImage(buffer, processingOptions)
          : buffer;

        const fileName = `${uuidv4()}-${file.name}`;
        // Don't include 'uploads/' in the path as it's already the bucket name
        const path = fileName;
        const metadata: FileMetadata = {
          contentType: file.type,
          contentLength: processedResult instanceof Buffer ? processedResult.length : (processedResult as ProcessedImage).size,
          originalName: file.name,
        };

        const uploadData = processedResult instanceof Buffer
          ? new Blob([processedResult], { type: file.type })
          : new Blob([(processedResult as ProcessedImage).data], { type: `image/${(processedResult as ProcessedImage).format}` });

        let uploadResult;


        // Use server-side admin client for Supabase uploads
        const { error } = await uploadFileAdmin(
          BUCKET_UPLOADS,
          path,
          uploadData,
          {
            contentType: uploadData.type
          }
        );

        if (error) {
          throw new Error(`Supabase upload error: ${error.message}`);
        }
        // Get the public URL
        const { data: urlData } = getPublicUrlAdmin(BUCKET_UPLOADS, path);

        if (!urlData || !urlData.publicUrl) {
          throw new Error('Failed to get public URL for uploaded file');
        }

        uploadResult = { url: urlData.publicUrl };

        // Log metadata for debugging
        console.log('File metadata:', metadata);

        return {
          path,
          url: uploadResult.url,
          metadata
        };
      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err);
        throw err;
      }
    });

    const results = await Promise.all(uploadPromises);

    // If only one file was uploaded, return a simplified response
    if (files.length === 1) {
      console.log('Upload API - Returning single file URL:', results[0].url);
      return createApiResponse({
        success: true,
        url: results[0].url,
        metadata: results[0].metadata
       });
    } else {
      // Multiple files - return array of URLs
      console.log('Upload API - Returning multiple file URLs:', results.map(r => r.url));
      return createApiResponse({
        success: true,
        urls: results.map(r => r.url),
        metadata: results.map(r => r.metadata)
       });
    }
  } catch (error) {
    console.error('Error uploading files:', error);

    // Provide more detailed error information
    let errorMessage = 'Failed to upload files';
    let details = error instanceof Error ? error.message : 'Unknown error';

    // Check for specific Supabase errors
    if (error instanceof Error) {
      if (error.message.includes('bucket') && error.message.includes('not found')) {
        errorMessage = 'Storage bucket not found';
        details = 'The specified storage bucket does not exist. Please run the bucket creation script.';
      } else if (error.message.includes('permission') || error.message.includes('not authorized')) {
        errorMessage = 'Permission denied';
        details = 'You do not have permission to upload to this storage bucket.';
      } else if (error.message.includes('limit exceeded')) {
        errorMessage = 'File size limit exceeded';
        details = 'The file you are trying to upload is too large.';
      }
    }

    return createApiResponse({
        error: errorMessage,
        details: details,
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
       }, 500);
  }
}

/**
 * Handle URL-based image uploads
 */
async function handleUrlUpload(request: NextRequest) {
  try {
    const data = await request.json();
    let urls: string[] = [];

    // Handle both single URL and array of URLs
    if (data.url) {
      // Single URL case
      urls = [data.url];

      // Basic URL validation
      try {
        new URL(data.url);
      } catch (e) {
        return createErrorResponse(`Invalid URL format: ${data.url}`, 400);
      }
    } else if (Array.isArray(data.urls) && data.urls.length > 0) {
      // Array of URLs case
      urls = data.urls;

      // Validate all URLs
      for (const url of urls) {
        try {
          new URL(url);
        } catch (e) {
          return createErrorResponse(`Invalid URL format in array: ${url}`, 400);
        }
      }
    } else {
      return createErrorResponse('No valid URL provided', 400);
    }

    const processingOptions = parseProcessingOptions(request);
    const uploadPromises = urls.map(async (url) => {
      try {
        // Log the URL being processed
        console.log(`Processing image from URL: ${url}`);

        // Try to process the image from the URL
        const processedResult = await processImageFromUrl(url, processingOptions);

        // Generate a filename from the URL or use a default
        const filename = url.split('/').pop() || 'image.jpg';
        // Don't include 'uploads/' in the path as it's already the bucket name
        const path = `${uuidv4()}-${filename}`;

        // Create metadata for the file
        const metadata: FileMetadata = {
          contentType: `image/${processedResult.format || 'jpeg'}`,
          contentLength: processedResult.size,
          originalName: filename,
          sourceUrl: url,
          processedAt: new Date().toISOString(),
        };

        // Create a blob from the processed image data
        const uploadData = new Blob([processedResult.data], { type: `image/${processedResult.format}` });

        // Upload the processed image to Supabase
        let uploadResult;

        // Use server-side admin client for Supabase uploads
        const { error } = await uploadFileAdmin(
          BUCKET_UPLOADS,
          path,
          uploadData,
          {
    contentType: `image/${processedResult.format}`,

      upsert: true
          }
        );

        if (error) {
          throw new Error(`Supabase upload error: ${error.message}`);
        }

        // Get the public URL
        const { data: urlData } = getPublicUrlAdmin(BUCKET_UPLOADS, path);

        if (!urlData || !urlData.publicUrl) {
          throw new Error('Failed to get public URL for uploaded file');
        }

        uploadResult = { url: urlData.publicUrl };

        // Log metadata for debugging
        console.log('File metadata:', metadata);

        console.log(`Successfully processed and uploaded image from URL: ${url}`);

        return {
          path,
          url: uploadResult.url,
          metadata
        };
      } catch (err) {
        console.error(`Error processing URL ${url}:`, err);

        // Provide more detailed error information
        const errorMessage = err instanceof Error ? err.message : String(err);

        // Log detailed error information
        console.error('Image processing error details:', {
          url,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });

        // Rethrow with more context
        throw new Error(`Failed to process image from URL (${url}): ${errorMessage}`);
      }
    });

    const results = await Promise.all(uploadPromises);

    // Return appropriate response based on whether it was a single URL or multiple URLs
    if (data.url) {
      // Single URL case - return the first result directly
      console.log('URL Upload API - Returning single URL result:', results[0].url);
      return createApiResponse({
        success: true,
        url: results[0].url,
        metadata: results[0].metadata
       });
    } else {
      // Multiple URLs case - return array of URLs
      console.log('URL Upload API - Returning multiple URL results:', results.map(r => r.url));
      return createApiResponse({
        success: true,
        urls: results.map(r => r.url),
        metadata: results.map(r => r.metadata)
       });
    }
  } catch (error) {
    console.error('Error uploading from URLs:', error);

    // Provide more specific error messages based on the error type
    let errorMessage = 'Failed to upload from URLs';
    let statusCode = 500;

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('Invalid URL format')) {
        errorMessage = error.message;
        statusCode = 400; // Bad request
      } else if (error.message.includes('Failed to fetch image: 404')) {
        errorMessage = 'Image not found: The URL may be invalid or the image no longer exists';
        statusCode = 404; // Not found
      } else if (error.message.includes('URL does not point to an image')) {
        errorMessage = 'Invalid image: The URL does not point to a valid image file';
        statusCode = 400; // Bad request
      } else if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        errorMessage = 'Access blocked: The image cannot be accessed due to security restrictions';
        statusCode = 403; // Forbidden
      } else {
        errorMessage = `Upload failed: ${error.message}`;
      }
    }

    return createErrorResponse(errorMessage, statusCode, {
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();

    // Handle both path/key and url parameters
    let path = data.path || data.key;
    let bucket = data.bucket || BUCKET_UPLOADS;

    // If URL is provided instead of path, extract the path
    if (!path && data.url) {
      const extractedPath = getPathFromUrl(data.url);
      if (extractedPath) {
        path = extractedPath;
      } else {
        return createErrorResponse('Could not extract path from URL', 400);
      }
    }

    if (!path) {
      return createErrorResponse('No file path/key or URL provided', 400);
    }

    // Ensure the path is properly formatted
    if (!path.startsWith('uploads/') && !path.includes('/')) {
      path = `uploads/${path}`;
    }

    try {
      // Use server-side admin client for Supabase deletions
      const { error } = await deleteFileAdmin(bucket, path);

      if (error) {
        throw new Error(`Supabase delete error: ${error.message}`);
      }

      return createApiResponse({
        success: true,
        message: `File ${path} deleted successfully`
      });
    } catch (error) {
      // Log the error but don't fail the request
      console.error(`Error deleting file ${path}:`, error);
     // Check if the error is because the file doesn't exist
      if (error instanceof Error &&
          (error.message.includes('NoSuchKey') || error.message.includes('not found'))) {
        return createApiResponse({
          success: true,
          message: `File ${path} does not exist or was already deleted`
        });
      }

      throw error; // Re-throw for the outer catch block
    }
  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return createApiResponse({
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
       }, 500);
  }
}
