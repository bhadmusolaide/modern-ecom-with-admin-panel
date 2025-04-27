import { createClient } from '@supabase/supabase-js';

// This file should only be imported in server components or API routes
// It provides direct access to the Supabase admin client with service role privileges

// Initialize Supabase admin client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase admin credentials are missing. Server-side operations may not work correctly.');
}

// Create the admin client with service role key
export const supabaseServerAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Helper function to check if a bucket exists and create it if it doesn't
 * @param bucketName The name of the bucket to check/create
 * @param isPublic Whether the bucket should be public
 * @returns True if the bucket exists or was created successfully
 */
export async function ensureBucketExists(bucketName: string, isPublic: boolean = true): Promise<boolean> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabaseServerAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const bucketExists = buckets.some(b => b.name === bucketName);
    
    if (bucketExists) {
      return true;
    }

    // Create the bucket if it doesn't exist
    const { error: createError } = await supabaseServerAdmin.storage.createBucket(bucketName, {
      public: isPublic,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
    });
    
    if (createError) {
      console.error(`Failed to create bucket '${bucketName}':`, createError);
      return false;
    }
    
    console.log(`Created bucket '${bucketName}' successfully`);
    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
}

/**
 * Upload a file to Supabase Storage using the admin client
 * @param bucket The bucket to upload to
 * @param path The path to store the file at
 * @param file The file data to upload
 * @param options Upload options
 * @returns The result of the upload operation
 */
export async function uploadFileAdmin(
  bucket: string,
  path: string,
  file: File | Blob | ArrayBuffer | Buffer,
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }
) {
  // Ensure the bucket exists before uploading
  const bucketExists = await ensureBucketExists(bucket);
  
  if (!bucketExists) {
    throw new Error(`Bucket '${bucket}' does not exist and could not be created`);
  }
  
  // Upload the file
  return supabaseServerAdmin.storage
    .from(bucket)
    .upload(path, file, options);
}

/**
 * Delete a file from Supabase Storage using the admin client
 * @param bucket The bucket to delete from
 * @param paths The paths of the files to delete
 * @returns The result of the delete operation
 */
export async function deleteFileAdmin(bucket: string, paths: string | string[]) {
  const pathsArray = Array.isArray(paths) ? paths : [paths];
  
  return supabaseServerAdmin.storage
    .from(bucket)
    .remove(pathsArray);
}

/**
 * Get a public URL for a file in Supabase Storage
 * @param bucket The bucket the file is in
 * @param path The path of the file
 * @returns The public URL of the file
 */
export function getPublicUrlAdmin(bucket: string, path: string) {
  return supabaseServerAdmin.storage
    .from(bucket)
    .getPublicUrl(path);
}
