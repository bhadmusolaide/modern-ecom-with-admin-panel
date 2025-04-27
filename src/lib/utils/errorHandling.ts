/**
 * Error handling utilities for data fetching operations
 */

// Type for retry configuration
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

// Default retry configuration
const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 500, // 500ms
  maxDelay: 5000, // 5 seconds
  backoffFactor: 2, // Exponential backoff factor
};

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param config Retry configuration
 * @returns Promise with the result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  // Merge default config with provided config
  const retryConfig: RetryConfig = {
    ...defaultRetryConfig,
    ...config,
  };

  let lastError: Error = new Error('No error occurred');
  let delay = retryConfig.initialDelay;

  // Try the function up to maxRetries times
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // If this is not the first attempt, log the retry
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} of ${retryConfig.maxRetries}...`);
      }
      
      // Try to execute the function
      return await fn();
    } catch (error) {
      // Store the error for potential later use
      lastError = error as Error;
      
      // Check if it's a permission error
      const isPermissionError = error instanceof Error && 
        (error.message.includes('permission') || 
         error.message.includes('insufficient') ||
         error.message.includes('Missing or insufficient permissions'));
      
      // Log the error with more context
      console.error(`Attempt ${attempt + 1} failed:`, {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
        isPermissionError,
        attempt: attempt + 1,
        maxRetries: retryConfig.maxRetries,
      });
      
      // If it's a permission error, don't retry
      if (isPermissionError) {
        throw new Error(`Permission error: ${error instanceof Error ? error.message : 'Unknown permission error'}`);
      }
      
      // If we've reached the maximum number of retries, throw the error
      if (attempt === retryConfig.maxRetries) {
        break;
      }
      
      // Wait before the next retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase the delay for the next retry (with a maximum limit)
      delay = Math.min(delay * retryConfig.backoffFactor, retryConfig.maxDelay);
    }
  }

  // If we get here, all retries have failed
  throw new Error(`All ${retryConfig.maxRetries} retry attempts failed. Last error: ${lastError?.message}`);
}

/**
 * Format error messages for user display
 * @param error Error object
 * @returns User-friendly error message
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // For standard Error objects
    return error.message;
  } else if (typeof error === 'string') {
    // For string errors
    return error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    // For objects with a message property
    return String((error as { message: unknown }).message);
  } else {
    // Default fallback
    return 'An unexpected error occurred. Please try again later.';
  }
}

/**
 * Log error details for debugging
 * @param error Error object
 * @param context Additional context information
 */
export function logError(error: unknown, context: Record<string, unknown> = {}): void {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    context,
  };
  
  // Enhanced error logging
  if (error instanceof Error) {
    console.error('Error logged:', {
      ...errorDetails,
      errorType: error.constructor.name,
      errorMessage: error.message,
      errorStack: error.stack,
    });
  } else if (typeof error === 'object' && error !== null) {
    console.error('Error logged:', {
      ...errorDetails,
      errorType: 'Object',
      errorString: JSON.stringify(error),
    });
  } else {
    console.error('Error logged:', {
      ...errorDetails,
      errorType: typeof error,
      errorValue: String(error),
    });
  }
  
  // In a production environment, you might want to send this to a logging service
  // Example: sendToLoggingService(errorDetails);
}

/**
 * Wrap a function with error handling
 * @param fn Function to wrap
 * @param errorHandler Function to handle errors
 * @returns Wrapped function
 */
export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  errorHandler?: (error: unknown) => Promise<T> | T
): (...args: Args) => Promise<T> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Log the error
      logError(error, { functionName: fn.name, arguments: args });
      
      // If an error handler is provided, use it
      if (errorHandler) {
        return errorHandler(error);
      }
      
      // Otherwise, rethrow the error
      throw error;
    }
  };
}