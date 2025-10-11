/**
 * Admin Utility: Create Customers for Orders
 *
 * This utility helps create customer records for orders that failed
 * to create customers during the order creation process.
 */

import { getOrders, getOrderById } from '../orders';
import { createCustomerFromOrder } from '../createCustomerFromOrder';
import { CustomerCreationRetryHandler } from '../utils/customerRetry';

/**
 * Find orders without customer records and create customers for them
 */
export async function createCustomersForOrdersWithoutCustomers(options: {
  limit?: number;
  dryRun?: boolean;
} = {}): Promise<{
  processed: number;
  created: number;
  failed: number;
  errors: Array<{ orderId: string; error: string }>;
}> {
  const { limit = 50, dryRun = false } = options;
  const result = {
    processed: 0,
    created: 0,
    failed: 0,
    errors: [] as Array<{ orderId: string; error: string }>
  };

  try {
    console.log(`Starting to process orders without customers (limit: ${limit}, dryRun: ${dryRun})`);

    // Get recent orders
    const { orders } = await getOrders(
      { sortBy: 'createdAt', sortDirection: 'desc' },
      { pageSize: limit },
      true // Use admin DB
    );

    console.log(`Found ${orders.length} orders to process`);

    for (const order of orders) {
      result.processed++;

      // Check if order already has a customerId
      if (order.customerId) {
        console.log(`Order ${order.id} already has customerId: ${order.customerId}`);
        continue;
      }

      console.log(`Processing order ${order.id} - no customerId found`);

      if (dryRun) {
        console.log(`DRY RUN: Would create customer for order ${order.id}`);
        result.created++;
        continue;
      }

      try {
        // Attempt to create customer with retry logic
        const customerId = await CustomerCreationRetryHandler.retryCustomerCreation(
          () => createCustomerFromOrder(order.id),
          { maxAttempts: 2, delayMs: 500 }
        );

        console.log(`Successfully created customer ${customerId} for order ${order.id}`);
        result.created++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to create customer for order ${order.id}:`, errorMessage);
        result.failed++;
        result.errors.push({ orderId: order.id, error: errorMessage });
      }
    }

    console.log(`Completed processing: ${result.processed} processed, ${result.created} created, ${result.failed} failed`);
    return result;
  } catch (error) {
    console.error('Error in createCustomersForOrdersWithoutCustomers:', error);
    throw error;
  }
}

/**
 * Create customer for a specific order
 */
export async function createCustomerForSpecificOrder(orderId: string): Promise<string> {
  try {
    console.log(`Creating customer for specific order: ${orderId}`);

    // Verify the order exists
    const order = await getOrderById(orderId);
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    if (order.customerId) {
      throw new Error(`Order ${orderId} already has customerId: ${order.customerId}`);
    }

    // Create customer with retry logic
    const customerId = await CustomerCreationRetryHandler.retryCustomerCreation(
      () => createCustomerFromOrder(orderId),
      { maxAttempts: 3, delayMs: 1000 }
    );

    console.log(`Successfully created customer ${customerId} for order ${orderId}`);
    return customerId;
  } catch (error) {
    console.error(`Failed to create customer for order ${orderId}:`, error);
    throw error;
  }
}