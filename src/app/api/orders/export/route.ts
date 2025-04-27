/**
 * Order Export API Route
 *
 * This file contains API routes for exporting orders.
 * - GET /api/orders/export - Export orders in CSV or JSON format
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@/lib/firebase/orders';
import { auth } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { Order, OrderStatus } from '@/lib/types';

/**
 * Export orders
 * @route GET /api/orders/export
 */
export async function GET(request: NextRequest) {
  try {
    // Unified auth check
  const access = await checkAccess(request);

  if (!access.authenticated) {
    return createErrorResponse(
      access.error || 'Authentication required',
      access.status || 401
    );
  }

  if (!access.isAdmin) {
    return createErrorResponse('Forbidden. Admin access required.', 403);
  }

  console.log('Admin access granted for user:', access.userId);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build filter object
    const filters: any = {};

    if (status) {
      filters.status = status;
    }

    if (dateFrom) {
      try {
        filters.dateFrom = new Date(dateFrom);
        if (isNaN(filters.dateFrom.getTime())) {
          console.error('Export API: Invalid dateFrom parameter:', dateFrom);
          delete filters.dateFrom;
        }
      } catch (dateError) {
        console.error('Export API: Error parsing dateFrom:', dateError);
      }
    }

    if (dateTo) {
      try {
        filters.dateTo = new Date(dateTo);
        if (isNaN(filters.dateTo.getTime())) {
          console.error('Export API: Invalid dateTo parameter:', dateTo);
          delete filters.dateTo;
        }
      } catch (dateError) {
        console.error('Export API: Error parsing dateTo:', dateError);
      }
    }

    // Get all orders (no pagination for export)
    console.log('Export API: Fetching orders with filters:', JSON.stringify(filters, null, 2));
    const result = await getOrders(
      filters,
      { pageSize: 1000 }, // Large page size for export
      true // Use admin DB
    );

    if (!result || !result.orders) {
      return createErrorResponse('No orders found', 404);
    }

    const orders = result.orders;
    console.log(`Export API: Found ${orders.length} orders to export`);

    // Format the orders for export
    if (format === 'json') {
      // Return JSON format
      return new NextResponse(JSON.stringify(orders, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="orders-export.json"'
        }
      });
    } else {
      // Return CSV format
      const csv = convertOrdersToCSV(orders);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="orders-export.csv"'
        }
      });
    }
  } catch (error) {
    console.error('Error exporting orders:', error);
    return createErrorResponse('Failed to export orders', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Convert orders to CSV format
 * @param orders - Array of orders
 * @returns CSV string
 */
function convertOrdersToCSV(orders: Order[]): string {
  // Define CSV headers
  const headers = [
    'Order ID',
    'Order Number',
    'Customer Name',
    'Email',
    'Status',
    'Payment Method',
    'Payment Status',
    'Subtotal',
    'Tax',
    'Shipping',
    'Discount',
    'Total',
    'Created At',
    'Updated At',
    'Shipping Address',
    'Billing Address',
    'Items'
  ];

  // Create CSV rows
  const rows = orders.map(order => {
    // Format shipping address
    const shippingAddress = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}, ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`;

    // Format billing address
    const billingAddress = `${order.billingAddress.firstName} ${order.billingAddress.lastName}, ${order.billingAddress.address}, ${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.postalCode}, ${order.billingAddress.country}`;

    // Format items
    const items = order.items.map(item =>
      `${item.name} (${item.quantity} x $${(item.price / 100).toFixed(2)})`
    ).join('; ');

    return [
      order.id,
      order.orderNumber,
      order.customerName,
      order.email,
      order.status,
      order.payment.method,
      order.payment.status,
      (order.subtotal / 100).toFixed(2),
      (order.tax / 100).toFixed(2),
      (order.shippingCost / 100).toFixed(2),
      (order.discount / 100).toFixed(2),
      (order.total / 100).toFixed(2),
      order.createdAt,
      order.updatedAt,
      shippingAddress,
      billingAddress,
      items
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}