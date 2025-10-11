/**
 * Customer Creation Retry Utility
 *
 * This utility provides retry mechanisms for customer creation operations
 * that may fail due to temporary Firebase issues.
 */

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

export class CustomerCreationRetryHandler {
  private static defaultOptions: RetryOptions = {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2
  };

  /**
   * Retry customer creation with exponential backoff
   */
  static async retryCustomerCreation<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error;

    for (let attempt = 1; attempt <= opts.maxAttempts!; attempt++) {
      try {
        console.log(`Customer creation attempt ${attempt}/${opts.maxAttempts}`);
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Customer creation attempt ${attempt} failed:`, lastError.message);

        if (attempt === opts.maxAttempts) {
          throw new Error(`Customer creation failed after ${opts.maxAttempts} attempts. Last error: ${lastError.message}`);
        }

        // Wait before retrying with exponential backoff
        const delay = opts.delayMs! * Math.pow(opts.backoffMultiplier!, attempt - 1);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Schedule customer creation for later if it fails during order creation
   */
  static scheduleCustomerCreationForLater(orderId: string, reason: string) {
    console.warn(`Scheduling customer creation for later: Order ${orderId}, Reason: ${reason}`);

    // In a production environment, you might want to:
    // 1. Add to a queue (Redis, Firebase Functions, etc.)
    // 2. Store in a database table for retry jobs
    // 3. Send to a background job processor

    // For now, just log the issue
    console.log('TODO: Implement background job queue for failed customer creation', {
      orderId,
      reason,
      timestamp: new Date().toISOString()
    });
  }
}