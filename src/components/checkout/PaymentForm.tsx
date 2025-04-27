'use client';

import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  AddressElement,
} from '@stripe/react-stripe-js';
import { useToast } from '@/lib/context/ToastContext';
import { Order } from '@/lib/types';
import { handleSuccessfulPayment, handleFailedPayment } from '@/lib/payment/stripe';

interface PaymentFormProps {
  clientSecret: string;
  order: Order;
  onSuccess: () => void;
  onError: (error: string) => void;
}

/**
 * Payment Form Component
 * 
 * This component renders a Stripe payment form and handles the payment submission.
 */
const PaymentForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  order,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { showToast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    if (!stripe || !clientSecret) {
      return;
    }
    
    // Check for payment intent status on component mount
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) return;
      
      switch (paymentIntent.status) {
        case 'succeeded':
          showToast('Payment succeeded!', 'success');
          handleSuccessfulPayment(order, paymentIntent)
            .then(() => onSuccess())
            .catch((error) => {
              console.error('Error handling successful payment:', error);
              onError('Payment was successful, but there was an error updating your order.');
            });
          break;
        case 'processing':
          showToast('Your payment is processing.', 'info');
          break;
        case 'requires_payment_method':
          // The payment attempt failed, allow customer to try again
          setErrorMessage('Your previous payment attempt was unsuccessful. Please try again.');
          break;
        default:
          setErrorMessage('Something went wrong with your payment. Please try again.');
          break;
      }
    });
  }, [stripe, clientSecret, order, onSuccess, onError, showToast]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/thank-you?order_id=${order.id}`,
        },
        redirect: 'if_required',
      });
      
      if (error) {
        // Show error to customer
        setErrorMessage(error.message || 'An unexpected error occurred.');
        await handleFailedPayment(order, error);
        onError(error.message || 'Payment failed. Please try again.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        showToast('Payment successful!', 'success');
        await handleSuccessfulPayment(order, paymentIntent);
        onSuccess();
      } else if (paymentIntent) {
        // Handle other payment intent statuses
        switch (paymentIntent.status) {
          case 'processing':
            showToast('Your payment is processing.', 'info');
            break;
          case 'requires_payment_method':
            setErrorMessage('Your payment was not successful. Please try again.');
            await handleFailedPayment(order, { message: 'Payment requires another method' });
            onError('Payment failed. Please try again with a different payment method.');
            break;
          default:
            setErrorMessage(`Payment status: ${paymentIntent.status}. Please contact support.`);
            break;
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      onError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="p-4 border border-gray-200 rounded-md bg-white">
        <PaymentElement />
      </div>
      
      {/* Billing Address */}
      <div className="p-4 border border-gray-200 rounded-md bg-white">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Billing Address</h3>
        <AddressElement options={{ mode: 'billing' }} />
      </div>
      
      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}
      
      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !elements || isLoading}
        className="w-full py-3 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.total / 100)}`
        )}
      </button>
      
      {/* Secure Payment Notice */}
      <p className="text-xs text-gray-500 text-center">
        Your payment information is processed securely. We do not store your credit card details.
      </p>
    </form>
  );
};

export default PaymentForm;