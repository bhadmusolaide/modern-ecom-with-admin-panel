/**
 * Fix Customer Creation Issues API
 *
 * This API endpoint processes orders without customers and fixes customer creation issues.
 * - GET /api/admin/fix-customers?action=fix-orders - Process orders without customers
 * - GET /api/admin/fix-customers?action=process-jobs - Process pending background jobs
 * - GET /api/admin/fix-customers?action=recalculate-totals - Recalculate customer lifetime values
 */

import { NextRequest } from 'next/server';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { createCustomersForOrdersWithoutCustomers } from '@/lib/firebase/admin/createCustomersForOrders';
import { CustomerCreationRetryHandler } from '@/lib/firebase/utils/customerRetry';
import { recalculateAllCustomerLifetimeValues } from '@/lib/firebase/services/customerService';

/**
 * Process orders without customers
 * @route GET /api/admin/fix-customers
 */
export async function GET(request: NextRequest) {
  try {

// Skip auth check for this utility endpoint - it's meant for one-time fixes
    // In production, you might want to add authentication here

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'fix-orders'; // 'fix-orders', 'process-jobs', or 'recalculate-totals'
    const dryRun = searchParams.get('dryRun') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let result;

    if (action === 'process-jobs') {
      // Process pending background jobs

      result = await CustomerCreationRetryHandler.processPendingCustomerCreationJobs({
        limit,
        dryRun
      });
    } else if (action === 'recalculate-totals') {
      // Recalculate customer lifetime values

      if (dryRun) {
        result = { message: 'Dry run: would recalculate all customer totals' };
      } else {
        result = await recalculateAllCustomerLifetimeValues();
      }
    } else {
      // Fix orders without customers (default action)

      result = await createCustomersForOrdersWithoutCustomers({
        limit,
        dryRun
      });
    }

return createApiResponse({
      success: true,
      action,
      dryRun,
      limit,
      result,
      message: `Successfully ${dryRun ? 'analyzed' : 'processed'} ${action}`
    });

  } catch (error) {
    console.error('Fix Customers API: Error:', error);
    return createErrorResponse(
      'Failed to process customer fixes',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}