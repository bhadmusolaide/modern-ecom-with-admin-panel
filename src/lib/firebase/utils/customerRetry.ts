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

        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Customer creation attempt ${attempt} failed:`, lastError.message);

        if (attempt === opts.maxAttempts) {
          throw new Error(`Customer creation failed after ${opts.maxAttempts} attempts. Last error: ${lastError.message}`);
        }

        // Wait before retrying with exponential backoff
        const delay = opts.delayMs! * Math.pow(opts.backoffMultiplier!, attempt - 1);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Schedule customer creation for later if it fails during order creation
   */
  static async scheduleCustomerCreationForLater(orderId: string, reason: string) {
    try {

      // Import here to avoid circular dependencies
      const { db } = await import('../config');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

      if (!db) {
        return;
      }

      // Store the failed job in a background_jobs collection for later processing
      const backgroundJobsRef = collection(db, 'background_jobs');

      await addDoc(backgroundJobsRef, {
        type: 'create_customer_from_order',
        orderId,
        reason,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        retryCount: 0,
        maxRetries: 5,
        priority: 'normal'
      });

    } catch (error) {
      console.error('Failed to schedule customer creation job:', error);
      // Don't throw - we don't want to break the order creation process
    }
  }

  /**
    * Process pending background jobs for customer creation
    */
  static async processPendingCustomerCreationJobs(options: {
    limit?: number;
    dryRun?: boolean;
  } = {}): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: Array<{ jobId: string; orderId: string; error: string }>;
  }> {
    const { limit = 20, dryRun = false } = options; // Increased default limit
    const result = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ jobId: string; orderId: string; error: string }>
    };

    try {

      // Use Admin SDK to avoid client config dependency
      const { getAdminFirestore } = await import('../admin');
      const { createCustomerForSpecificOrder } = await import('../admin/createCustomersForOrders');
      const adminDb = getAdminFirestore();

      let snapshot;
      try {
        snapshot = await adminDb
          .collection('background_jobs')
          .where('status', '==', 'pending')
          .where('type', '==', 'create_customer_from_order')
          .orderBy('createdAt', 'asc')
          .limit(limit)
          .get();
      } catch (indexError) {

        snapshot = await adminDb
          .collection('background_jobs')
          .where('status', '==', 'pending')
          .orderBy('createdAt', 'asc')
          .limit(limit)
          .get();
      }

      if (snapshot.docs.length === 0) {

        return result;
      }

      for (const jobDoc of snapshot.docs) {
        const jobData: any = jobDoc.data();
        result.processed++;

        const jobId = jobDoc.id;
        const orderId = jobData.orderId;

        if (dryRun) {

          result.successful++;
          continue;
        }

        try {
          // Update job status to processing
          await adminDb.collection('background_jobs').doc(jobId).update({
            status: 'processing',
            updatedAt: new Date()
          });

          // Use admin-based creator
          await CustomerCreationRetryHandler.retryCustomerCreation(
            () => createCustomerForSpecificOrder(orderId),
            { maxAttempts: 3, delayMs: 200 }
          );

          // Mark job as completed and delete it
          await adminDb.collection('background_jobs').doc(jobId).delete();

          result.successful++;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`âŒ Failed to process customer creation for order ${orderId}:`, errorMessage);

          // Update job with error and increment retry count
          const newRetryCount = (jobData.retryCount || 0) + 1;

          if (newRetryCount >= (jobData.maxRetries || 5)) {
            // Max retries reached, mark as failed
            await adminDb.collection('background_jobs').doc(jobId).update({
              status: 'failed',
              error: errorMessage,
              retryCount: newRetryCount,
              updatedAt: new Date()
            });
            console.error(`ðŸ’€ Job ${jobId} for order ${orderId} failed permanently after ${newRetryCount} attempts`);
            result.failed++;
            result.errors.push({ jobId, orderId, error: errorMessage });
          } else {
            // Schedule for retry with exponential backoff
            const nextRetryDelay = Math.min(30000, 1000 * Math.pow(2, newRetryCount));
            await adminDb.collection('background_jobs').doc(jobId).update({
              status: 'pending',
              retryCount: newRetryCount,
              nextRetryAt: new Date(Date.now() + nextRetryDelay),
              updatedAt: new Date()
            });

          }
        }
      }

      if (result.errors.length > 0) {
        console.error(`ðŸ’¥ ${result.errors.length} jobs failed permanently:`, result.errors);
      }

      return result;

    } catch (error) {
      console.error('ðŸ’¥ Error processing pending customer creation jobs:', error);
      throw error;
    }
  }
}
