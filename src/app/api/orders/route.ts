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

    console.log('Order creation request from user:', access.authenticated ? access.userId : 'guest');

    // Parse request body
    const orderData = await request.json();
    console.log('Received order data:', JSON.stringify(orderData, null, 2));

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
        currency: orderData.payment?.currency || 'USD'
      }
    };

    console.log('Debug: access.userId:', access.userId);
    console.log('Debug: orderData.userId:', orderData.userId);
    console.log('Debug: orderToCreate.userId:', orderToCreate.userId);
    console.log('Debug: orderToCreate.isGuestOrder:', orderToCreate.isGuestOrder);

    // Create the order
    console.log('Creating order with data:', JSON.stringify(orderToCreate, null, 2));
    console.log('Saving order to Firestore collection "orders"...');
    let newOrder;
    try {
      newOrder = await createOrder(orderToCreate);
      console.log('Order created successfully with ID:', newOrder.id);
      console.log('Order data:', JSON.stringify(newOrder, null, 2));
    } catch (createError) {
      console.error('Error in createOrder function:', createError);
      throw createError;
    }

    return createApiResponse(newOrder, 201);
  } catch (error) {
    console.error('Error creating order:', error);
    return createErrorResponse('Failed to create order', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Get orders with optional filtering
 * @route GET /api/orders
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Orders API: Processing GET request');
    console.log('Orders API: Request URL:', request.url);
    console.log('Orders API: Request method:', request.method);

    // Extract auth token for debugging
    const authHeader = request.headers.get('authorization');
    console.log('Orders API: Auth header present:', !!authHeader);

    if (authHeader) {
      const token = authHeader.split('Bearer ')[1];
      console.log('Orders API: Token length:', token?.length || 0);
      console.log('Orders API: Token prefix:', token?.substring(0, 10) + '...');
    } else {
      console.warn('Orders API: No authorization header found in request');
    }

    // Unified auth check - always required, even in development mode
    console.log('Orders API: Starting authentication check');
    const access = await checkAccess(request);
    console.log('Orders API: Authentication check completed:', access);

    if (!access.authenticated) {
      console.error('Orders API: Authentication failed');
      console.error('Orders API: Access result:', access);
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    // Get user ID and admin status from auth check
    const userId = access.userId;
    const isAdmin = access.isAdmin || false;

    console.log(`Orders API: User ${userId} (isAdmin: ${isAdmin}) requesting orders`);

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
      console.error('Orders API: Error parsing pagination parameters:', parseError);
      // Continue with default values
    }

    // Build filter object
    const filters: any = {};

    // Get user email from auth data or request
    const userEmail = access.email || searchParams.get('userEmail');
    console.log('Orders API: User email from auth:', userEmail);

    // If not admin, retrieve both user's orders and guest orders with matching email
    if (!access.isAdmin) {
      // For regular users, we'll use a special combined query approach
      // This is handled in the query logic below
      filters.userId = userId;
      
      // Also store email for combined query
      if (userEmail) {
        filters.email = userEmail;
        console.log('Orders API: Will also check for guest orders with email:', userEmail);
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
            console.error('Orders API: Invalid dateFrom parameter:', dateFrom);
            delete filters.dateFrom;
          }
        } catch (dateError) {
          console.error('Orders API: Error parsing dateFrom:', dateError);
        }
      }

      if (dateTo) {
        try {
          filters.dateTo = new Date(dateTo);
          if (isNaN(filters.dateTo.getTime())) {
            console.error('Orders API: Invalid dateTo parameter:', dateTo);
            delete filters.dateTo;
          }
        } catch (dateError) {
          console.error('Orders API: Error parsing dateTo:', dateError);
        }
      }
    }

    // Get orders with filters
    console.log('Orders API: Fetching orders with filters:', JSON.stringify(filters, null, 2));
    console.log('Orders API: Pagination:', { page, pageSize });

    let result;
    try {
      // Always use real database in both development and production
      console.log('Orders API: Fetching orders from database');

      // Add more detailed logging
      console.log('Orders API: Using filters:', JSON.stringify(filters, null, 2));
      console.log('Orders API: Page size:', pageSize);

      try {
        // For non-admin users, always try to get both authenticated user orders and guest orders with matching email
        if (!access.isAdmin) {
          console.log('Orders API: Getting orders for authenticated user');
          console.log('Orders API: User ID:', filters.userId);
          
          // First, get orders by userId (authenticated user orders)
          const userOrdersResult = await getOrders(
            { userId: filters.userId, sortBy: 'createdAt', sortDirection: 'desc' },
            { pageSize: 100 }, // Get more to ensure we have enough after combining
            true // Use admin DB
          );
          
          console.log('Orders API: Found user orders:', userOrdersResult.orders.length);

          let combinedOrders = [...userOrdersResult.orders];
          const orderIds = new Set(combinedOrders.map(order => order.id));
          
          // If we have user email, also get guest orders with that email
          if (filters.email) {
            console.log('Orders API: Also checking for guest orders with email:', filters.email);
            
            // Then, get guest orders by email
            const guestOrdersResult = await getOrders(
              { email: filters.email, sortBy: 'createdAt', sortDirection: 'desc' },
              { pageSize: 100 }, // Get more to ensure we have enough after combining
              true // Use admin DB
            );
            
            console.log('Orders API: Found guest orders:', guestOrdersResult.orders.length);

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
          
          console.log('Orders API: Total combined orders:', combinedOrders.length);

          // Apply pagination to combined results
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedOrders = combinedOrders.slice(startIndex, endIndex);
          
          console.log('Orders API: Returning paginated orders:', paginatedOrders.length);

          // For debugging, log some order details
          if (paginatedOrders.length > 0) {
            console.log('Orders API: First order details:', JSON.stringify(paginatedOrders[0], null, 2));
          }

          result = {
            orders: paginatedOrders,
            total: combinedOrders.length,
            totalPages: Math.ceil(combinedOrders.length / pageSize),
            currentPage: page,
            pageSize: pageSize
          };

          console.log(`Orders API: Combined results - ${userOrdersResult.orders.length} user orders + guest orders = ${combinedOrders.length} total`);
        } else {
          // Standard query for admin users
          console.log('Orders API: Admin user - using standard query with filters');
          result = await getOrders(
            filters,
            { page, pageSize },
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

        console.log('Orders API: getOrders returned successfully');
      } catch (orderError) {
        console.error('Orders API: Error in getOrders function call:', orderError);
        console.error('Orders API: Error details:', orderError instanceof Error ? orderError.message : 'Unknown error');
        console.error('Orders API: Error stack:', orderError instanceof Error ? orderError.stack : 'No stack trace available');

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
        console.error('Orders API: getOrders returned null or undefined');
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
        console.error('Orders API: getOrders returned no orders array');
        result.orders = [];
      }

      // Log the result for debugging
      console.log('Orders API: Query result:', {
        orderCount: result.orders.length,
        filters,
        pagination: result.pagination || { page, pageSize }
      });

      if (result.orders.length > 0) {
        console.log('Orders API: First order sample ID:', result.orders[0].id);
      } else {
        console.log('Orders API: No orders found in the database');
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
      console.error('Orders API: Error in getOrders function:', fetchError);
      return createErrorResponse(
        'Database error while fetching orders',
        500,
        { details: fetchError instanceof Error ? fetchError.message : 'Unknown database error' }
      );
    }
  } catch (error) {
    console.error('Orders API: Unhandled error:', error);
    return createErrorResponse(
      'Failed to get orders',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}