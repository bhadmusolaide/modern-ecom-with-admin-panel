import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { updateOrderPaymentStatus } from '@/lib/firebase/orders';
import { OrderStatus, PaymentStatus } from '@/lib/types';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
  appInfo: {
    name: 'OMJ E-commerce',
    version: '1.0.0',
  },
});

/**
 * API route for handling Stripe webhooks
 * @param req The request object
 * @returns The response object
 */
export async function POST(req: NextRequest) {
  try {
    // Get the signature from the headers
    const headersList = await headers();
    const signature = headersList.get('stripe-signature') || '';
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }
    
    // Get the raw body
    const rawBody = await req.text();
    
    // Verify the webhook signature
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
        
      // Add more event handlers as needed
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Return a success response
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred while handling the webhook' },
      { status: 500 }
    );
  }
}

/**
 * Handle a successful payment intent
 * @param paymentIntent The payment intent object
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    
    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }
    
    // Update the order with the payment information
    await updateOrderPaymentStatus(orderId, {
      status: PaymentStatus.COMPLETED,
      transactionId: paymentIntent.id,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      datePaid: new Date().toISOString(),
    });
    
    // Update the order status to processing
    await updateOrderStatus(orderId, OrderStatus.PROCESSING);
    
    console.log(`Payment for order ${orderId} completed successfully`);
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
    throw error;
  }
}

/**
 * Handle a failed payment intent
 * @param paymentIntent The payment intent object
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    
    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }
    
    // Update the order with the failed payment information
    await updateOrderPaymentStatus(orderId, {
      status: PaymentStatus.FAILED,
      transactionId: paymentIntent.id,
      paymentIntentId: paymentIntent.id,
      lastError: paymentIntent.last_payment_error?.message || 'Payment failed',
    });
    
    console.log(`Payment for order ${orderId} failed`);
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
    throw error;
  }
}

/**
 * Handle a refunded charge
 * @param charge The charge object
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    // Get the payment intent ID from the charge
    const paymentIntentId = charge.payment_intent;
    
    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      console.error('No payment intent ID found in charge');
      return;
    }
    
    // Get the payment intent to get the order ID
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const orderId = paymentIntent.metadata.orderId;
    
    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }
    
    // Check if it's a full or partial refund
    const isFullRefund = charge.amount_refunded === charge.amount;
    
    // Update the order with the refund information
    await updateOrderPaymentStatus(orderId, {
      status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
      refundAmount: charge.amount_refunded,
      dateRefunded: new Date().toISOString(),
    });
    
    // If it's a full refund, update the order status
    if (isFullRefund) {
      await updateOrderStatus(orderId, OrderStatus.REFUNDED);
    }
    
    console.log(`Refund for order ${orderId} processed successfully`);
  } catch (error) {
    console.error('Error handling charge refunded:', error);
    throw error;
  }
}

/**
 * Update the status of an order
 * @param orderId The order ID
 * @param status The new status
 */
async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    // This is a placeholder for the actual implementation
    // In a real application, you would update the order status in your database
    console.log(`Updating order ${orderId} status to ${status}`);
    
    // Example implementation:
    // await db.collection('orders').doc(orderId).update({ status });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}