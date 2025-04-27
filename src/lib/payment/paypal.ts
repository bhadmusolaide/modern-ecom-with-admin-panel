/**
 * PayPal Payment Integration
 * 
 * This module provides functions for integrating with the PayPal payment gateway.
 * It handles payment creation, capture, and other PayPal-related functionality.
 */

import { Order, PaymentStatus, PaymentMethod, PaymentProvider } from '@/lib/types';

/**
 * Create a PayPal order for checkout
 * @param order The order to create a PayPal order for
 * @returns Promise resolving to the PayPal order ID
 */
export const createPayPalOrder = async (order: Order): Promise<string> => {
  try {
    const response = await fetch('/api/payment/paypal/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: order.id,
        amount: order.total,
        currency: 'USD', // Default to USD, can be made dynamic
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit_amount: {
            currency_code: 'USD',
            value: (item.price / 100).toFixed(2), // Convert cents to dollars
          },
        })),
        shipping: {
          name: {
            full_name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          },
          address: {
            address_line_1: order.shippingAddress.address,
            admin_area_2: order.shippingAddress.city,
            admin_area_1: order.shippingAddress.state,
            postal_code: order.shippingAddress.postalCode,
            country_code: order.shippingAddress.country,
          },
        },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create PayPal order');
    }
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    throw error;
  }
};

/**
 * Capture a PayPal payment after approval
 * @param paypalOrderId The PayPal order ID to capture
 * @param order The order being paid for
 * @returns Promise resolving to the capture result
 */
export const capturePayPalPayment = async (
  paypalOrderId: string,
  order: Order
): Promise<any> => {
  try {
    const response = await fetch('/api/payment/paypal/capture-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paypalOrderId,
        orderId: order.id,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to capture PayPal payment');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    throw error;
  }
};

/**
 * Update order with PayPal payment information
 * @param order The order to update
 * @param paypalResult The result from PayPal capture
 * @returns Promise resolving to the updated order
 */
export const updateOrderWithPayPalPayment = async (
  order: Order,
  paypalResult: any
): Promise<Order> => {
  try {
    // Map PayPal payment status to our PaymentStatus enum
    let paymentStatus: PaymentStatus;
    switch (paypalResult.status) {
      case 'COMPLETED':
        paymentStatus = PaymentStatus.COMPLETED;
        break;
      case 'APPROVED':
        paymentStatus = PaymentStatus.PENDING;
        break;
      case 'VOIDED':
      case 'DECLINED':
        paymentStatus = PaymentStatus.FAILED;
        break;
      default:
        paymentStatus = PaymentStatus.PENDING;
    }
    
    // Update the order's payment information
    const updatedOrder: Order = {
      ...order,
      payment: {
        ...order.payment,
        provider: PaymentProvider.PAYPAL,
        method: PaymentMethod.PAYPAL,
        status: paymentStatus,
        transactionId: paypalResult.id,
        amount: order.total,
        currency: 'USD', // Default to USD, can be made dynamic
        datePaid: paymentStatus === PaymentStatus.COMPLETED ? new Date().toISOString() : undefined,
      },
      updatedAt: new Date().toISOString(),
    };
    
    // Save the updated order to the database
    const response = await fetch(`/api/orders/${order.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedOrder),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update order with PayPal payment information');
    }
    
    const data = await response.json();
    return data.order;
  } catch (error) {
    console.error('Error updating order with PayPal payment:', error);
    throw error;
  }
};

/**
 * Handle a successful PayPal payment
 * @param order The order that was paid for
 * @param paypalResult The result from PayPal
 * @returns Promise resolving when the payment is handled
 */
export const handleSuccessfulPayPalPayment = async (
  order: Order,
  paypalResult: any
): Promise<void> => {
  try {
    // Update the order with payment information
    await updateOrderWithPayPalPayment(order, paypalResult);
    
    // Additional actions after successful payment
    // e.g., send confirmation email, update inventory, etc.
    
  } catch (error) {
    console.error('Error handling successful PayPal payment:', error);
    throw error;
  }
};