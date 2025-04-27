/**
 * Stripe Payment Integration
 * 
 * This module provides functions for integrating with the Stripe payment gateway.
 * It handles payment intents, payment methods, and other Stripe-related functionality.
 */

import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js';
import { PaymentIntent } from '@stripe/stripe-js';
import { Order, PaymentStatus, PaymentMethod, PaymentProvider } from '@/lib/types';

// Initialize Stripe with the publishable key
// This is safe to expose in client-side code
let stripePromise: Promise<StripeJS | null>;

/**
 * Get the Stripe instance
 * @returns Promise resolving to the Stripe instance
 */
export const getStripe = () => {
  if (!stripePromise) {
    // Get the publishable key from environment variables
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!key) {
      console.error('Stripe publishable key is not defined');
      throw new Error('Stripe publishable key is not defined');
    }
    
    stripePromise = loadStripe(key);
  }
  
  return stripePromise;
};

/**
 * Create a payment intent for an order
 * @param order The order to create a payment intent for
 * @returns Promise resolving to the client secret
 */
export const createPaymentIntent = async (order: Order): Promise<{ clientSecret: string; paymentIntentId: string }> => {
  try {
    const response = await fetch('/api/payment/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: order.total,
        currency: 'usd', // Default to USD, can be made dynamic
        orderId: order.id,
        customerEmail: order.email,
        customerName: order.customerName,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create payment intent');
    }
    
    const data = await response.json();
    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Process a payment with Stripe
 * @param clientSecret The client secret from the payment intent
 * @param paymentMethod The payment method to use
 * @param order The order being paid for
 * @returns Promise resolving to the payment result
 */
export const processPayment = async (
  clientSecret: string,
  paymentMethodId: string,
  order: Order
): Promise<PaymentIntent> => {
  try {
    const stripe = await getStripe();
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }
    
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId,
    });
    
    if (error) {
      console.error('Payment error:', error);
      throw error;
    }
    
    if (!paymentIntent) {
      throw new Error('No payment intent returned from Stripe');
    }
    
    return paymentIntent;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

/**
 * Update order with payment information
 * @param order The order to update
 * @param paymentIntent The payment intent from Stripe
 * @returns Promise resolving to the updated order
 */
export const updateOrderWithPayment = async (
  order: Order,
  paymentIntent: PaymentIntent
): Promise<Order> => {
  try {
    // Map Stripe payment status to our PaymentStatus enum
    let paymentStatus: PaymentStatus;
    switch (paymentIntent.status) {
      case 'succeeded':
        paymentStatus = PaymentStatus.COMPLETED;
        break;
      case 'processing':
        paymentStatus = PaymentStatus.PENDING;
        break;
      case 'requires_payment_method':
        paymentStatus = PaymentStatus.FAILED;
        break;
      default:
        paymentStatus = PaymentStatus.PENDING;
    }
    
    // Get payment method details if available
    let lastFour: string | undefined;
    let cardBrand: string | undefined;
    
    if (paymentIntent.payment_method && typeof paymentIntent.payment_method !== 'string') {
      const card = paymentIntent.payment_method.card;
      if (card) {
        lastFour = card.last4;
        cardBrand = card.brand;
      }
    }
    
    // Update the order's payment information
    const updatedOrder: Order = {
      ...order,
      payment: {
        ...order.payment,
        provider: PaymentProvider.STRIPE,
        method: PaymentMethod.CREDIT_CARD, // Default to credit card, can be updated based on actual method
        status: paymentStatus,
        transactionId: paymentIntent.id,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        datePaid: paymentStatus === PaymentStatus.COMPLETED ? new Date().toISOString() : undefined,
        lastFour,
        cardBrand,
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
      throw new Error(errorData.message || 'Failed to update order with payment information');
    }
    
    const data = await response.json();
    return data.order;
  } catch (error) {
    console.error('Error updating order with payment:', error);
    throw error;
  }
};

/**
 * Handle a successful payment
 * @param order The order that was paid for
 * @param paymentIntent The payment intent from Stripe
 * @returns Promise resolving when the payment is handled
 */
export const handleSuccessfulPayment = async (
  order: Order,
  paymentIntent: PaymentIntent
): Promise<void> => {
  try {
    // Update the order with payment information
    await updateOrderWithPayment(order, paymentIntent);
    
    // Additional actions after successful payment
    // e.g., send confirmation email, update inventory, etc.
    
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
};

/**
 * Handle a failed payment
 * @param order The order that failed payment
 * @param error The error from Stripe
 * @returns Promise resolving when the payment failure is handled
 */
export const handleFailedPayment = async (
  order: Order,
  error: any
): Promise<void> => {
  try {
    // Update the order with failed payment status
    const updatedOrder: Order = {
      ...order,
      payment: {
        ...order.payment,
        status: PaymentStatus.FAILED,
        lastError: error.message || 'Payment failed',
      },
      updatedAt: new Date().toISOString(),
    };
    
    // Save the updated order to the database
    await fetch(`/api/orders/${order.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedOrder),
    });
    
    // Additional actions after failed payment
    // e.g., notify customer, retry options, etc.
    
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
};