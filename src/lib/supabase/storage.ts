import { supabaseAdmin } from './client';

// Define bucket names
export const BUCKET_UPLOADS = 'uploads';
export const BUCKET_PRODUCTS = 'products';
export const BUCKET_CATEGORIES = 'categories';
export const BUCKET_PROFILE_PICTURES = 'profile-pictures';

// Define error types
export class SupabaseUploadError extends Error {
  public readonly cause?: Error;
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'SupabaseUploadError';
    this.cause = cause;
  }
}

export class SupabaseDeleteError extends Error {
  public readonly cause?: Error;
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'SupabaseDeleteError';
    this.cause = cause;
  }
}

export class SupabaseDownloadError extends Error {
  public readonly cause?: Error;
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'SupabaseDownloadError';
    this.cause = cause;
  }
}

export class SupabaseUrlDownloadError extends Error {
  public readonly cause?: Error;
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'SupabaseUrlDownloadError';
    this.cause = cause;
  }
}

// Define types
export type ProgressCallback = (progress: number) => void;
export interface FileMetadata {
  contentType?: string;
  contentLength?: number;
  originalName?: string;
  size?: number;
  width?: number;
  height?: number;
  format?: string;
  sourceUrl?: string;
  processedAt?: string;
  downloadDate?: string;
  [key: string]: unknown;
}

// Default retry configuration
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // ms

/**
 * Helper function to download a file from a URL
 * @param url The URL to download from
 * @returns The file buffer and content type
 */
export async function downloadFromUrl(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download from URL: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return { buffer, contentType };
  } catch (error) {
    throw new SupabaseUrlDownloadError(
      `Failed to download from URL: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Upload a file to Supabase Storage with progress tracking, metadata, and retry logic
 * @param file The file to upload
 * @param path The path to store the file at (without bucket name)
 * @param bucket The bucket to store the file in
 * @param metadata Optional metadata to store with the file
 * @param onProgress Optional callback for upload progress
 * @param maxRetries Maximum number of retry attempts
 * @returns The URL of the uploaded file
 */
export async function uploadToSupabase(
  file: File | Blob,
  path: string,
  bucket: string = BUCKET_UPLOADS,
  metadata?: FileMetadata,
  onProgress?: ProgressCallback,
  maxRetries: number = DEFAULT_MAX_RETRIES
): Promise<{ url: string }> {
  let retries = 0;
  let lastError: Error | undefined;

  while (retries <= maxRetries) {
    try {
      if (retries > 0) {
        console.log(`Retrying upload (attempt ${retries}/${maxRetries})...`);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, DEFAULT_RETRY_DELAY * retries));
      }

      // Convert File/Blob to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      // Prepare file options
      const options = {
        cacheControl: '3600',
        contentType: file instanceof File ? file.type : 'application/octet-stream',
        upsert: true,
      };

      // Check if bucket exists and create it if it doesn't
      try {
        if (!supabaseAdmin) {
          throw new Error('Supabase admin client is not initialized');
        }
        
        const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();

        if (bucketsError) {
          console.error('Error listing buckets:', bucketsError);
          throw new Error(`Failed to list buckets: ${bucketsError.message}`);
        }

        const bucketExists = buckets.some(b => b.name === bucket);

        if (!bucketExists) {
          console.warn(`Bucket '${bucket}' does not exist. Attempting to create it...`);
          const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
          });

          if (createError) {
            console.error(`Failed to create bucket '${bucket}':`, createError);
            throw new Error(`Failed to create bucket '${bucket}': ${createError.message}`);
          }

          console.log(`Created bucket '${bucket}' successfully`);
        }
      } catch (bucketError) {
        console.error('Error checking/creating bucket:', bucketError);
        // Continue with upload attempt anyway
      }

      // Upload file to Supabase Storage
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client is not initialized');
      }
      
      console.log(`Uploading file to Supabase bucket '${bucket}' at path '${path}'...`);
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, fileBuffer, options);

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Supabase upload error: ${error.message}`);
      }

      if (!data) {
        console.error('Upload succeeded but no data was returned');
        throw new Error('Upload succeeded but no data was returned');
      }

      console.log('File uploaded successfully, getting public URL...');

      // Get public URL
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client is not initialized');
      }
      
      console.log(`Getting public URL for file in bucket '${bucket}' at path '${path}'...`);
      const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

      if (!urlData || !urlData.publicUrl) {
        console.error('Failed to get public URL for uploaded file');
        throw new Error('Failed to get public URL for uploaded file');
      }

      console.log(`Successfully got public URL: ${urlData.publicUrl}`);

      // Store metadata if provided
      if (metadata && Object.keys(metadata).length > 0) {
        try {
          // In Supabase, we can't directly attach metadata to files
          // We could store it in a separate table if needed
          console.log('File metadata:', metadata);
          // This would be implemented with a database table in a real application
        } catch (metadataError) {
          console.error('Failed to store metadata:', metadataError);
          // Continue without failing the upload
        }
      }

      return { url: urlData.publicUrl };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retries++;

      if (retries > maxRetries) {
        console.error('Max retries reached. Upload failed:', lastError);
        break;
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  throw new SupabaseUploadError(
    `Failed to upload file after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
    lastError
  );
}

/**
 * Upload multiple files to Supabase Storage
 * @param files The files to upload
 * @param pathPrefix The prefix for the file paths
 * @param bucket The bucket to store the files in
 * @param metadata Optional metadata to store with the files
 * @param onProgress Optional callback for upload progress
 * @param maxRetries Maximum number of retry attempts
 * @returns The URLs of the uploaded files
 */
export async function uploadMultipleToSupabase(
  files: File[],
  pathPrefix: string = 'uploads/',
  bucket: string = BUCKET_UPLOADS,
  metadata?: FileMetadata,
  onProgress?: ProgressCallback,
  maxRetries: number = DEFAULT_MAX_RETRIES
): Promise<{ urls: string[] }> {
  const uploadPromises = files.map(async (file, index) => {
    // Generate a unique path for each file
    const path = `${pathPrefix}${Date.now()}-${index}-${file.name}`;

    // Upload the file
    const result = await uploadToSupabase(
      file,
      path,
      bucket,
      metadata,
      onProgress ? (progress) => onProgress((progress + index) / files.length) : undefined,
      maxRetries
    );

    return result.url;
  });

  const urls = await Promise.all(uploadPromises);
  return { urls };
}

/**
 * Delete a file from Supabase Storage with retry logic
 * @param path The path of the file to delete
 * @param bucket The bucket the file is stored in
 * @param maxRetries Maximum number of retry attempts
 */
export async function deleteFromSupabase(
  path: string,
  bucket: string = BUCKET_UPLOADS,
  maxRetries: number = DEFAULT_MAX_RETRIES
): Promise<void> {
  let retries = 0;
  let lastError: Error | undefined;

  while (retries <= maxRetries) {
    try {
      if (retries > 0) {
        console.log(`Retrying delete (attempt ${retries}/${maxRetries})...`);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, DEFAULT_RETRY_DELAY * retries));
      }

      // Delete file from Supabase Storage
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client is not initialized');
      }
      
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw new Error(`Supabase delete error: ${error.message}`);
      }

      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retries++;

      if (retries > maxRetries) {
        console.error('Max retries reached. Delete failed:', lastError);
        break;
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  throw new SupabaseDeleteError(
    `Failed to delete file after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
    lastError
  );
}

/**
 * Delete multiple files from Supabase Storage
 * @param paths The paths of the files to delete
 * @param bucket The bucket the files are stored in
 * @param maxRetries Maximum number of retry attempts
 */
export async function deleteMultipleFromSupabase(
  paths: string[],
  bucket: string = BUCKET_UPLOADS,
  maxRetries: number = DEFAULT_MAX_RETRIES
): Promise<void> {
  if (paths.length === 0) {
    return;
  }

  let retries = 0;
  let lastError: Error | undefined;

  while (retries <= maxRetries) {
    try {
      if (retries > 0) {
        console.log(`Retrying delete (attempt ${retries}/${maxRetries})...`);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, DEFAULT_RETRY_DELAY * retries));
      }

      // Delete files from Supabase Storage
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client is not initialized');
      }
      
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .remove(paths);

      if (error) {
        throw new Error(`Supabase delete error: ${error.message}`);
      }

      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retries++;

      if (retries > maxRetries) {
        console.error('Max retries reached. Delete failed:', lastError);
        break;
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  throw new SupabaseDeleteError(
    `Failed to delete files after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
    lastError
  );
}

/**
 * Upload an image from a URL to Supabase Storage
 * @param url The URL of the image to upload
 * @param path The path to store the file at
 * @param bucket The bucket to store the file in
 * @param metadata Optional metadata to store with the file
 * @param onProgress Optional callback for upload progress
 * @param maxRetries Maximum number of retry attempts
 * @returns The URL of the uploaded file
 */
export async function uploadFromUrlToSupabase(
  url: string,
  path: string,
  bucket: string = BUCKET_UPLOADS,
  metadata?: FileMetadata,
  onProgress?: ProgressCallback,
  maxRetries: number = DEFAULT_MAX_RETRIES
): Promise<string> {
  try {
    // Download the image from the URL
    const { buffer, contentType } = await downloadFromUrl(url);

    // Create a File-like object from the buffer
    const blob = new Blob([buffer], { type: contentType });

    // Extract filename from URL for metadata
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    const filename = pathSegments[pathSegments.length - 1] || 'image';

    // Prepare metadata
    const combinedMetadata: FileMetadata = {
      ...metadata,
      originalName: filename,
      contentType,
      size: buffer.length,
      sourceUrl: url,
      downloadDate: new Date().toISOString(),
    };

    // Upload to Supabase
    const result = await uploadToSupabase(blob, path, bucket, combinedMetadata, onProgress, maxRetries);
    return result.url;
  } catch (error) {
    if (error instanceof SupabaseUrlDownloadError) {
      throw error; // Re-throw download errors
    }
    throw new SupabaseUploadError(
      `Failed to upload from URL: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Extract the path from a Supabase Storage URL
 * @param url The Supabase Storage URL
 * @returns The path of the file
 */
export function getPathFromUrl(url: string): string | null {
  try {
    // Check if it's a valid URL
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Check if it's a Supabase URL
    const isSupabaseUrl = url.includes('supabase.co/storage/v1/object/public/') || 
                          (process.env.NEXT_PUBLIC_SUPABASE_URL && url.includes(process.env.NEXT_PUBLIC_SUPABASE_URL));
    
    if (!isSupabaseUrl) {
      return null;
    }

    // Parse the URL
    const urlObj = new URL(url);

    // Extract the path from the URL
    // The format is typically: https://<supabase-url>/storage/v1/object/public/<bucket>/<path>
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/);

    if (!pathMatch || pathMatch.length < 3) {
      return null;
    }

    // Get the path (bucket is at index 1, path at index 2)
    const path = pathMatch[2];

    // Decode URI components to handle special characters
    return decodeURIComponent(path);
  } catch (error) {
    console.error('Error extracting path from URL:', error);
    return null;
  }
}

/**
 * Extract the bucket from a Supabase Storage URL
 * @param url The Supabase Storage URL
 * @returns The bucket name or null if not a valid Supabase URL
 */
export function getBucketFromUrl(url: string): string | null {
  try {
    // Check if it's a valid URL
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Check if it's a Supabase URL
    const isSupabaseUrl = url.includes('supabase.co/storage/v1/object/public/') || 
                          (process.env.NEXT_PUBLIC_SUPABASE_URL && url.includes(process.env.NEXT_PUBLIC_SUPABASE_URL));
    
    if (!isSupabaseUrl) {
      return null;
    }

    // Parse the URL
    const urlObj = new URL(url);

    // Extract the bucket from the URL
    // The format is typically: https://<supabase-url>/storage/v1/object/public/<bucket>/<path>
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/([^\/]+)/);

    if (!pathMatch || pathMatch.length < 2) {
      return null;
    }

    // Return the bucket name
    return pathMatch[1];
  } catch (error) {
    console.error('Error extracting bucket from URL:', error);
    return null;
  }
}

/**
 * Check if a URL is a Supabase Storage URL
 * @param url The URL to check
 * @returns True if the URL is a Supabase Storage URL
 */
export function isSupabaseUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Check for the standard Supabase storage URL pattern
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    return true;
  }
  
  // Check against the project's Supabase URL if available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && url.includes(supabaseUrl) && url.includes('/storage/v1/object/public/')) {
    return true;
  }
  
  return false;
}

/**
 * Generate a Supabase Storage URL for a file
 * @param bucket The bucket name
 * @param path The file path within the bucket
 * @returns The public URL for the file
 */
export function generateSupabaseUrl(bucket: string, path: string): string {
  if (!bucket || !path) {
    throw new Error('Bucket and path are required to generate a Supabase URL');
  }
  
  // Clean the path (remove leading slash if present)
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Get the Supabase URL from environment variable
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables');
  }
  
  // Construct the URL
  // Format: https://<supabase-url>/storage/v1/object/public/<bucket>/<path>
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(cleanPath)}`;
}

// The getBucketFromUrl function is already defined above (lines 469-501)
