/**
 * Orders API Routes
 *
 * This file contains API routes for managing orders.
 * - POST /api/orders - Create a new order
 * - GET /api/orders - Get orders (with optional filters)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { createOrder, getOrders } from '@/lib/firebase/orders';
import { processOrderInventory } from '@/lib/firebase/inventory';
import { Order, OrderStatus, PaymentStatus } from '@/lib/types';

// No mock orders - we'll always use real data from the database

/**
 * Create a new order
 * @route POST /api/orders
 */
export async function POST(request: NextRequest) {
  try {

    // Unified auth check
    const access = await checkAccess(request);

    // For order creation, we don't require authentication
    // This allows guest users to create orders
    // We'll track if it's a guest order in the order data

    // Parse request body
    const orderData = await request.json();

    // Validate required fields
    if (!orderData.items || !orderData.items.length) {
      return createErrorResponse('Order must contain at least one item', 400);
    }

    if (!orderData.email) {
      return createErrorResponse('Email is required', 400);
    }

    if (!orderData.shippingAddress) {
      return createErrorResponse('Shipping address is required', 400);
    }

    // Set default values and override with authenticated user info if available
    const orderToCreate = {
      ...orderData,
      userId: access.userId || orderData.userId || 'guest-user',
      email: orderData.email,
      status: OrderStatus.PENDING,
      isGuestOrder: !access.userId,
      payment: {
        ...orderData.payment,
        status: PaymentStatus.PENDING,
        provider: orderData.payment?.provider || 'CREDIT_CARD',
        amount: orderData.total || (orderData.subtotal + (orderData.tax || 0)),
        currency: orderData.payment?.currency || 'NGN'
      }
    };

    console.log(orderToCreate);

    // Create the order
    let newOrder;
    try {
      newOrder = await createOrder(orderToCreate);
    } catch (createError) {
      throw createError;
    }

    // Process inventory changes for the order
    try {
      const inventoryProcessed = await processOrderInventory(
        newOrder.items,
        newOrder.userId || 'guest-user',
        newOrder.id
      );
      
      if (!inventoryProcessed) {
        console.warn(`Inventory processing failed for order ${newOrder.id}`);
        // Note: We don't fail the response if inventory processing fails
        // as the order has already been created and potentially paid for
      }
    } catch (inventoryError) {
      console.error(`Error processing inventory for order ${newOrder.id}:`, inventoryError);
      // Continue without blocking the response
    }

    return createApiResponse(newOrder, 201);
  } catch (error) {
    return createErrorResponse('Failed to create order', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Get orders with optional filtering
 * @route GET /api/orders
 */
export async function GET(request: NextRequest) {
  try {
    // Unified auth check - always required, even in development mode
    const access = await checkAccess(request);

    if (!access.authenticated) {
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    // Get user ID and admin status from auth check
    const userId = access.userId;
    const isAdmin = access.isAdmin || false;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const email = searchParams.get('email');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Validate and parse pagination parameters
    let page = 1;
    let pageSize = 10;

    try {
      const pageParam = searchParams.get('page');
      if (pageParam) {
        const parsedPage = parseInt(pageParam);
        if (!isNaN(parsedPage) && parsedPage > 0) {
          page = parsedPage;
        }
      }

      const pageSizeParam = searchParams.get('pageSize');
      if (pageSizeParam) {
        const parsedPageSize = parseInt(pageSizeParam);
        if (!isNaN(parsedPageSize) && parsedPageSize > 0) {
          pageSize = Math.min(parsedPageSize, 100); // Limit max page size
        }
      }
    } catch (parseError) {
      // Continue with default values
    }

    // Build filter object
    const filters: any = {};

    // Get user email from auth data or request
    const userEmail = searchParams.get('userEmail');

    // If not admin, retrieve both user's orders and guest orders with matching email
    if (!access.isAdmin) {
      // For regular users, we'll use a special combined query approach
      // This is handled in the query logic below
      filters.userId = userId;

      // Also store email for combined query
      if (userEmail) {
        filters.email = userEmail;
      }
    } else {
      // Admin can filter by various criteria
      if (status) {
        filters.status = status;
      }

      if (email) {
        filters.email = email;
      }

      if (search) {
        // Search can match order number, customer name, or email
        filters.search = search;
      }

      if (dateFrom) {
        try {
          filters.dateFrom = new Date(dateFrom);
          if (isNaN(filters.dateFrom.getTime())) {
            delete filters.dateFrom;
          }
        } catch (dateError) {
          // Invalid date, skip
        }
      }

      if (dateTo) {
        try {
          filters.dateTo = new Date(dateTo);
          if (isNaN(filters.dateTo.getTime())) {
            delete filters.dateTo;
          }
        } catch (dateError) {
          // Invalid date, skip
        }
      }

      // Ensure proper sorting for admin users - newest orders first
      filters.sortBy = 'createdAt';
      filters.sortDirection = 'desc';
    }

    // Get orders with filters
    let result;
    try {
      // Always use real database in both development and production
      try {
        // For non-admin users, always try to get both authenticated user orders and guest orders with matching email
        if (!access.isAdmin) {

          // First, get orders by userId (authenticated user orders)
          const userOrdersResult = await getOrders(
            { userId: filters.userId, sortBy: 'createdAt', sortDirection: 'desc' },
            { pageSize: 100 }, // Get more to ensure we have enough after combining
            true // Use admin DB
          );

          let combinedOrders = [...userOrdersResult.orders];
          const orderIds = new Set(combinedOrders.map(order => order.id));

          // If we have user email, also get guest orders with that email
          if (filters.email) {
            // Then, get guest orders by email
            const guestOrdersResult = await getOrders(
              { email: filters.email, sortBy: 'createdAt', sortDirection: 'desc' },
              { pageSize: 100 }, // Get more to ensure we have enough after combining
              true // Use admin DB
            );

            // Add guest orders that aren't already in the results
            guestOrdersResult.orders.forEach(order => {
              if (!orderIds.has(order.id)) {
                combinedOrders.push(order);
                orderIds.add(order.id);
              }
            });
          }

          // Sort combined orders by creation date (newest first)
          combinedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          // Apply pagination to combined results
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedOrders = combinedOrders.slice(startIndex, endIndex);

          result = {
            orders: paginatedOrders,
            total: combinedOrders.length,
            totalPages: Math.ceil(combinedOrders.length / pageSize),
            currentPage: page,
            pageSize: pageSize
          };
        } else {
          // Standard query for admin users
          result = await getOrders(
            filters,
            { pageSize },
            true // Use admin DB
          );

          // Format result for consistency
          result = {
            orders: result.orders || [],
            total: result.pagination?.count || 0,
            totalPages: Math.ceil((result.pagination?.count || 0) / pageSize),
            currentPage: page,
            pageSize: pageSize
          };
        }
      } catch (orderError) {
        // Return empty result instead of throwing
        result = {
          orders: [],
          pagination: {
            firstDoc: null,
            lastDoc: null,
            count: 0,
            isEmpty: true
          }
        };
      }

      if (!result) {
        // Create an empty result instead of throwing
        result = {
          orders: [],
          pagination: {
            firstDoc: null,
            lastDoc: null,
            count: 0,
            isEmpty: true
          }
        };
      }

      if (!result.orders) {
        result.orders = [];
      }

      // Ensure we have valid pagination data
      const total = result.total || result.orders.length;
      const totalPages = result.totalPages || Math.max(1, Math.ceil(total / pageSize));

      return createApiResponse({
        orders: result.orders,
        total,
        totalPages,
        currentPage: result.currentPage || page,
        pageSize: result.pageSize || pageSize
      });
    } catch (fetchError) {
      return createErrorResponse(
        'Database error while fetching orders',
        500,
        { details: fetchError instanceof Error ? fetchError.message : 'Unknown database error' }
      );
    }
  } catch (error) {
    return createErrorResponse(
      'Failed to get orders',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}