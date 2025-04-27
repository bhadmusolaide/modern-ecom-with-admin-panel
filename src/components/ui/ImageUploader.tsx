'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { convertToDirectImageUrl, isLikelyImageUrl } from '@/lib/utils/imageSourceHelpers';

interface ImageUploaderProps {
  initialImage?: string | null;
  onImageChange: (imageUrl: string | null, metadata?: Record<string, unknown>) => void;
  className?: string;
  label?: string;
  maxSizeMB?: number;
  aspectRatio?: string;
  previewSize?: 'sm' | 'md' | 'lg';
  processImage?: boolean;
  width?: number;
  height?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  multiple?: boolean;
  onMultipleUpload?: (urls: string[]) => void;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
  onUploadError?: (error: string) => void;
}

export default function ImageUploader({
  initialImage = null,
  onImageChange,
  className = '',
  label = 'Upload Image',
  maxSizeMB = 5,
  aspectRatio = '1:1',
  previewSize = 'md',
  processImage = false,
  width,
  height,
  format,
  quality,
  fit,
  multiple = false,
  onMultipleUpload,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: ImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage);

  // Update imageUrl when initialImage changes
  useEffect(() => {
    if (initialImage && initialImage !== imageUrl) {
      console.log('ImageUploader - initialImage changed:', initialImage);
      setImageUrl(initialImage);
    }
  }, [initialImage, imageUrl]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [imageMetadata, setImageMetadata] = useState<Record<string, unknown> | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For tracking upload progress
  const uploadController = useRef<AbortController | null>(null);

  const previewSizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-60 h-60',
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Handle multiple file upload if enabled
    if (multiple && files.length > 1) {
      await handleMultipleFiles(files);
      return;
    }

    // Single file upload
    const file = files[0];

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      const errorMsg = `File size exceeds ${maxSizeMB}MB limit`;
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = `Invalid file type. Allowed types: JPG, PNG, WebP, GIF, SVG`;
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Notify upload start
    if (onUploadStart) onUploadStart();

    try {
      // Create a new abort controller for this upload
      uploadController.current = new AbortController();

      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);

      // Add image processing parameters if enabled
      let url = '/api/upload';
      if (processImage) {
        const params = new URLSearchParams();
        if (width) params.append('width', width.toString());
        if (height) params.append('height', height.toString());
        if (format) params.append('format', format);
        if (quality) params.append('quality', quality.toString());
        if (fit) params.append('fit', fit);

        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }

      // Set up progress tracking
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);

            // Check if we have a URL in the response
            if (data.url) {
              console.log('ImageUploader - Received URL from API:', data.url);
              setImageUrl(data.url);
              setImageMetadata(data.metadata);
              console.log('ImageUploader - Calling onImageChange with URL:', data.url);
              onImageChange(data.url, data.metadata);
            } else if (data.success && data.url) {
              // Alternative response format
              console.log('ImageUploader - Received success URL from API:', data.url);
              setImageUrl(data.url);
              setImageMetadata(data.metadata);
              console.log('ImageUploader - Calling onImageChange with success URL:', data.url);
              onImageChange(data.url, data.metadata);
            }
            // Check if we have a files array in the response (legacy format)
            else if (data.files && data.files.length > 0) {
              // Get the URL from the response
              let fileUrl;

              // Check if the response includes a path or URL
              if (data.files[0].path) {
                // Direct URL from Supabase path
                fileUrl = data.files[0].path;
              } else if (data.files[0].url) {
                // Direct URL from Supabase
                fileUrl = data.files[0].url;
              } else {
                throw new Error('Invalid response format: No path or URL found in file data');
              }

              setImageUrl(fileUrl);
              setImageMetadata(data.files[0].metadata);
              onImageChange(fileUrl, data.files[0].metadata);
            } else {
              throw new Error('Invalid response format: No URL or files found in response');
            }

            setIsUploading(false);
            setUploadProgress(100);

            // Notify upload complete
            if (onUploadComplete) onUploadComplete();
          } catch (err) {
            console.error('Error parsing upload response:', err, xhr.responseText);
            const errorMsg = `Failed to process upload response: ${err instanceof Error ? err.message : 'Unknown error'}`;
            setError(errorMsg);
            setIsUploading(false);
            if (onUploadError) onUploadError(errorMsg);
          }
        } else {
          try {
            // Try to parse the error response
            const errorData = JSON.parse(xhr.responseText);
            const errorMsg = errorData.error || `Upload failed with status ${xhr.status}`;
            const errorDetails = errorData.details || 'No additional details provided';

            console.error('Upload failed:', errorMsg, errorDetails);
            setError(`${errorMsg}: ${errorDetails}`);
            setIsUploading(false);
            if (onUploadError) onUploadError(`${errorMsg}: ${errorDetails}`);
          } catch (parseErr) {
            // If we can't parse the response, use a generic error message
            const errorMsg = `Upload failed with status ${xhr.status}`;
            setError(errorMsg);
            setIsUploading(false);
            if (onUploadError) onUploadError(errorMsg);
          }
        }
      };

      xhr.onerror = () => {
        const errorMsg = 'Network error during upload';
        console.error(errorMsg);
        setError(errorMsg);
        setIsUploading(false);
        if (onUploadError) onUploadError(errorMsg);
      };

      xhr.onabort = () => {
        const errorMsg = 'Upload cancelled';
        setError(errorMsg);
        setIsUploading(false);
        if (onUploadError) onUploadError(errorMsg);
      };

      // Send the request
      xhr.send(formData);

      // Store the XHR object for potential cancellation
      uploadController.current.signal.addEventListener('abort', () => {
        xhr.abort();
      });
    } catch (err) {
      console.error('Error uploading image:', err);

      let errorMsg = '';

      // Provide more specific error messages based on the error type
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('connection')) {
          errorMsg = 'Network error: Please check your internet connection and try again.';
        } else if (err.message.includes('timeout')) {
          errorMsg = 'Upload timed out: The server took too long to respond. Please try again.';
        } else if (err.message.includes('403') || err.message.includes('permission')) {
          errorMsg = 'Permission denied: You may not have access to upload files.';
        } else if (err.message.includes('413') || err.message.includes('too large')) {
          errorMsg = `File too large: Maximum size is ${maxSizeMB}MB.`;
        } else {
          errorMsg = `Upload failed: ${err.message}`;
        }
      } else {
        errorMsg = 'Failed to upload image. Please try again.';
      }

      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);

      setIsUploading(false);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMultipleFiles = async (files: File[]) => {
    // Validate all files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

    const oversizedFiles = files.filter(file => file.size > maxSizeMB * 1024 * 1024);
    const invalidTypeFiles = files.filter(file => !allowedTypes.includes(file.type));

    if (oversizedFiles.length > 0) {
      const errorMsg = `${oversizedFiles.length} file(s) exceeded the ${maxSizeMB}MB size limit`;
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (invalidTypeFiles.length > 0) {
      const errorMsg = `${invalidTypeFiles.length} file(s) have invalid types. Allowed: JPG, PNG, WebP, GIF, SVG`;
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Notify upload start
    if (onUploadStart) onUploadStart();

    try {
      // Create a new abort controller for this upload
      uploadController.current = new AbortController();

      // Create form data with all files
      const formData = new FormData();
      files.forEach(file => {
        formData.append('file', file);
      });

      // Set up progress tracking
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);

            // Handle different response formats
            if (data.urls && data.urls.length > 0) {
              // New format with direct URLs
              setImageUrl(data.urls[0]);
              onImageChange(data.urls[0], data.metadata?.[0]);

              // Call the multiple upload callback if provided
              if (onMultipleUpload) {
                console.log('ImageUploader - Calling onMultipleUpload with URLs:', data.urls);
                onMultipleUpload(data.urls);
              }
            }
            else if (data.files && data.files.length > 0) {
              // Handle Supabase formats
              const urls = data.files.map((file: { url?: string; path?: string; metadata?: Record<string, unknown> }) => {
                // Check if it's a Supabase URL or path
                if (file.url) {
                  // Direct URL from Supabase
                  return file.url;
                } else if (file.path) {
                  // Supabase URL or path a URL but fallback to path
                  return file.url || file.path;
                } else {
                  console.error('Invalid file data:', file);
                  return '';
                }
              }).filter((url: string) => url); // Filter out any empty URLs

              setImageUrl(urls[0]);
              onImageChange(urls[0], data.files[0].metadata);

              // Call the multiple upload callback if provided
              if (onMultipleUpload) {
                console.log('ImageUploader (Supabase format) - Calling onMultipleUpload with URLs:', urls);
                onMultipleUpload(urls);
              }
            }
            else if (data.url) {
              // Single URL response (should not happen for multiple files, but handle it anyway)
              setImageUrl(data.url);
              onImageChange(data.url, data.metadata);

              if (onMultipleUpload) {
                console.log('ImageUploader (Single URL format) - Calling onMultipleUpload with URL:', [data.url]);
                onMultipleUpload([data.url]);
              }
            }
            else {
              throw new Error('Invalid response format: No URLs or files found in response');
            }

            setIsUploading(false);
            setUploadProgress(100);

            // Notify upload complete
            if (onUploadComplete) onUploadComplete();
          } catch (err) {
            console.error('Error parsing multiple upload response:', err, xhr.responseText);
            const errorMsg = `Failed to process upload response: ${err instanceof Error ? err.message : 'Unknown error'}`;
            setError(errorMsg);
            setIsUploading(false);
            if (onUploadError) onUploadError(errorMsg);
          }
        } else {
          try {
            // Try to parse the error response
            const errorData = JSON.parse(xhr.responseText);
            const errorMsg = errorData.error || `Upload failed with status ${xhr.status}`;
            const errorDetails = errorData.details || 'No additional details provided';

            console.error('Upload failed:', errorMsg, errorDetails);
            setError(`${errorMsg}: ${errorDetails}`);
            setIsUploading(false);
            if (onUploadError) onUploadError(`${errorMsg}: ${errorDetails}`);
          } catch (parseErr) {
            // If we can't parse the response, use a generic error message
            const errorMsg = `Upload failed with status ${xhr.status}`;
            setError(errorMsg);
            setIsUploading(false);
            if (onUploadError) onUploadError(errorMsg);
          }
        }
      };

      xhr.onerror = () => {
        const errorMsg = 'Network error during upload';
        console.error(errorMsg);
        setError(errorMsg);
        setIsUploading(false);
        if (onUploadError) onUploadError(errorMsg);
      };

      xhr.onabort = () => {
        const errorMsg = 'Upload cancelled';
        setError(errorMsg);
        setIsUploading(false);
        if (onUploadError) onUploadError(errorMsg);
      };

      // Send the request
      xhr.send(formData);

      // Store the XHR object for potential cancellation
      uploadController.current.signal.addEventListener('abort', () => {
        xhr.abort();
      });
    } catch (err) {
      console.error('Error uploading multiple images:', err);

      let errorMsg = '';

      // Provide more specific error messages based on the error type
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('connection')) {
          errorMsg = 'Network error: Please check your internet connection and try again.';
        } else if (err.message.includes('timeout')) {
          errorMsg = 'Upload timed out: The server took too long to respond. Please try again.';
        } else if (err.message.includes('403') || err.message.includes('permission')) {
          errorMsg = 'Permission denied: You may not have access to upload files.';
        } else if (err.message.includes('413') || err.message.includes('too large')) {
          errorMsg = `Files too large: Maximum size per file is ${maxSizeMB}MB.`;
        } else {
          errorMsg = `Upload failed: ${err.message}`;
        }
      } else {
        errorMsg = 'Failed to upload images. Please try again.';
      }

      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);

      setIsUploading(false);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImageMetadata(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelUpload = () => {
    if (uploadController.current) {
      uploadController.current.abort();
      uploadController.current = null;
    }
  };

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
  };

  const toggleUrlInput = () => {
    setShowUrlInput(!showUrlInput);
    setError(null);
  };

  const handleUrlUpload = async () => {
    // Validate URL
    if (!urlInput.trim()) {
      const errorMsg = 'Please enter an image URL';
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch (_) {
      const errorMsg = 'Please enter a valid URL';
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
      return;
    }

    // Check if it's a Pexels URL
    let directImageUrl = urlInput;

    if (urlInput.includes('pexels.com/photo/')) {
      try {
        setIsUploading(true);
        setUploadProgress(10);
        const response = await fetch(`/api/pexels-image?url=${encodeURIComponent(urlInput)}`);

        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            directImageUrl = data.url;
            console.log(`Converted Pexels URL: ${urlInput} → ${directImageUrl}`);
            setUploadProgress(20);
          }
        }
      } catch (error) {
        console.error('Error converting Pexels URL:', error);
        // Continue with the original URL if conversion fails
      }
    }

    // Check if URL points to an image
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
    const hasImageExtension = imageExtensions.some(ext => directImageUrl.toLowerCase().endsWith(ext));

    if (!hasImageExtension) {
      // If no image extension, warn the user but don't block the upload
      console.warn('URL does not end with a common image extension. Upload may fail if not an image.');
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Notify upload start
    if (onUploadStart) onUploadStart();

    try {
      // Create a new abort controller for this upload
      uploadController.current = new AbortController();

      // Prepare processing parameters if enabled
      let url = '/api/upload';
      if (processImage) {
        const params = new URLSearchParams();
        if (width) params.append('width', width.toString());
        if (height) params.append('height', height.toString());
        if (format) params.append('format', format);
        if (quality) params.append('quality', quality.toString());
        if (fit) params.append('fit', fit);

        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }

      // Upload from URL (using the direct image URL if available)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: directImageUrl,
          originalUrl: directImageUrl !== urlInput ? urlInput : undefined
        }),
        signal: uploadController.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('URL upload response data:', data);

      if (data.url) {
        console.log('URL upload - Setting image URL:', data.url);
        setImageUrl(data.url);
        setImageMetadata(data.metadata);
        console.log('URL upload - Calling onImageChange with URL:', data.url);
        onImageChange(data.url, data.metadata);
      } else if (data.success && data.url) {
        // Alternative response format
        console.log('URL upload - Setting success image URL:', data.url);
        setImageUrl(data.url);
        setImageMetadata(data.metadata);
        console.log('URL upload - Calling onImageChange with success URL:', data.url);
        onImageChange(data.url, data.metadata);
      } else {
        console.error('URL upload - No URL found in response:', data);
        setError('No image URL found in response');
      }

      setIsUploading(false);
      setUploadProgress(100);
      setShowUrlInput(false);
      setUrlInput('');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Upload cancelled');
      } else {
        console.error('Error uploading image from URL:', error);

        // Provide more specific error messages based on the error type
        if (error instanceof Error) {
          if (error.message.includes('network') || error.message.includes('connection')) {
            setError('Network error: Please check your internet connection and try again.');
          } else if (error.message.includes('timeout')) {
            setError('Upload timed out: The server took too long to respond. Please try again.');
          } else if (error.message.includes('403') || error.message.includes('permission')) {
            setError('Permission denied: You may not have access to upload files.');
          } else if (error.message.includes('404') || error.message.includes('not found')) {
            setError('Image not found: The URL may be invalid or the image no longer exists.');
          } else if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
            setError('Access blocked: The image cannot be accessed due to security restrictions.');
          } else if (error.message.includes('Content-Type') || error.message.includes('not an image')) {
            setError('Invalid image: The URL does not point to a valid image file.');
          } else if (error.message.includes('empty') || error.message.includes('0 bytes')) {
            setError('Empty image: The downloaded file is empty.');
          } else {
            setError(`Upload failed: ${error.message}`);
          }
        } else {
          setError('Failed to upload image from URL. Please try again.');
        }
      }
      setIsUploading(false);
      setUrlInput('');
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`${previewSizeClasses[previewSize]} border border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-900 overflow-hidden relative`}>
        {isUploading ? (
          <div className="flex flex-col items-center justify-center w-full">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <div className="mt-2 w-full px-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center block">
                Uploading... {uploadProgress}%
              </span>
              <button
                onClick={cancelUpload}
                className="mt-2 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt="Uploaded image"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md text-gray-500 hover:text-red-500"
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <ImageIcon size={24} />
            <span className="mt-2 text-sm text-center">No image</span>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          <label htmlFor="image-upload" className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <Upload size={16} className="mr-2" />
            {label}
            <input
              id="image-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
              disabled={isUploading}
              multiple={multiple}
            />
          </label>

          <button
            type="button"
            onClick={toggleUrlInput}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium ${showUrlInput ? 'text-primary-600 border-primary-500' : 'text-gray-700 dark:text-gray-300'} bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700`}
            disabled={isUploading}
          >
            <LinkIcon size={16} className="mr-2" />
            From URL
          </button>
        </div>

        {showUrlInput && (
          <div className="mt-3">
            <div className="flex">
              <input
                type="url"
                value={urlInput}
                onChange={handleUrlInputChange}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-200"
                disabled={isUploading}
              />
              <button
                type="button"
                onClick={handleUrlUpload}
                disabled={isUploading}
                className="px-4 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Upload
              </button>
            </div>
          </div>
        )}

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Recommended aspect ratio: {aspectRatio}. Maximum size: {maxSizeMB}MB
        </p>
      </div>
    </div>
  );
}
