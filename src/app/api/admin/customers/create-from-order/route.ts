/**
 * API Route to Create Customer from Order
 * 
 * This route creates a customer record in the users collection from order data.
 * It's used to ensure guest orders are properly represented in the admin customers page.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db, auth } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { getOrderById } from '@/lib/firebase/orders';
import { calculateCustomerLifetimeValue } from '@/lib/firebase/customers';

// Validation schema for order-to-customer creation
const createCustomerFromOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  csrfToken: z.string().optional(),
});

/**
 * Create a customer from an order
 * @route POST /api/admin/customers/create-from-order
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validation = createCustomerFromOrderSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const { orderId } = validation.data;

    // Get the order
    const order = await getOrderById(orderId);
    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    // Check if this is a guest order
    if (!order.isGuestOrder) {
      return createErrorResponse('Order is not a guest order', 400);
    }

    // Check if customer with this email already exists
    let existingCustomer;
    try {
      const usersSnapshot = await db.collection('users')
        .where('email', '==', order.email)
        .where('role', '==', 'CUSTOMER')
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        existingCustomer = {
          id: usersSnapshot.docs[0].id,
          ...usersSnapshot.docs[0].data()
        };
      }
    } catch (error) {
      console.error('Error checking for existing customer:', error);
      return createErrorResponse('Error checking for existing customer', 500);
    }

    let customerId;

    if (existingCustomer) {
      // Update existing customer with order information
      customerId = existingCustomer.id;
      
      // Update order with customer ID if not already set
      if (order.userId !== customerId) {
        await db.collection('orders').doc(orderId).update({
          userId: customerId,
          isGuestOrder: false,
          updatedAt: new Date()
        });
      }
      
      // Calculate customer lifetime value to update totalOrders and totalSpent
      await calculateCustomerLifetimeValue(customerId);
      
      return createApiResponse({
        customer: existingCustomer,
        message: 'Order associated with existing customer',
        isNewCustomer: false
      });
    } else {
      // Create a new customer record
      const customerData = {
        email: order.email,
        name: order.customerName || null,
        role: 'CUSTOMER',
        phone: order.shippingAddress?.phone || null,
        address: {
          street: order.shippingAddress?.address || null,
          city: order.shippingAddress?.city || null,
          state: order.shippingAddress?.state || null,
          zip: order.shippingAddress?.postalCode || null,
          country: order.shippingAddress?.country || null,
          phone: order.shippingAddress?.phone || null,
        },
        notes: `Created from order ${order.orderNumber || order.id}`,
        segment: [],
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastOrderDate: order.createdAt ? new Date(order.createdAt) : new Date(),
        totalOrders: 1,
        totalSpent: order.total || 0
      };

      // Create customer document in Firestore with a generated ID
      const customerRef = await db.collection('users').add(customerData);
      customerId = customerRef.id;

      // Update order with customer ID
      await db.collection('orders').doc(orderId).update({
        userId: customerId,
        isGuestOrder: false,
        updatedAt: new Date()
      });

      // Get the created customer
      const createdCustomerDoc = await db.collection('users').doc(customerId).get();
      const createdCustomer = {
        id: createdCustomerDoc.id,
        ...createdCustomerDoc.data(),
        createdAt: createdCustomerDoc.data()?.createdAt.toDate(),
        updatedAt: createdCustomerDoc.data()?.updatedAt.toDate()
      };

      return createApiResponse({
        customer: createdCustomer,
        message: 'Customer created successfully from order',
        isNewCustomer: true
      }, 201);
    }
  } catch (error) {
    console.error('Error creating customer from order:', error);
    return createErrorResponse(
      'Failed to create customer from order',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
