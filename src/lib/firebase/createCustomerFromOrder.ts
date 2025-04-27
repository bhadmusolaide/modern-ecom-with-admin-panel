/**
 * Create Customer From Order
 *
 * This utility function creates a customer record from an order,
 * ensuring that guest orders are properly represented in the admin customers page.
 */

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { Order } from '@/lib/types';
import { createOrUpdateCustomerFromOrder } from './services/customerService';

/**
 * Create or update a customer record from an order
 * @param orderId The ID of the order to create a customer from
 * @returns Promise resolving to the customer ID
 */
export const createCustomerFromOrder = async (orderId: string): Promise<string> => {
  try {
    // Get the order
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const order = orderDoc.data() as Order;

    // If order already has a customerId, return it
    if (order.customerId) {
      return order.customerId;
    }

    // Create or update customer from order
    const customerId = await createOrUpdateCustomerFromOrder({
      id: orderId,
      email: order.email,
      customerName: order.customerName,
      shippingAddress: order.shippingAddress,
      total: order.total,
      userId: order.userId,
      createdAt: order.createdAt ? new Date(order.createdAt) : null
    });

    // Update the order with the customer ID
    await updateDoc(orderRef, {
      customerId,
      updatedAt: serverTimestamp()
    });

    return customerId;
  } catch (error) {
    console.error('Error creating customer from order:', error);
    throw error;
  }
};
