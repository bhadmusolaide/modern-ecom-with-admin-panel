'use client';

import React, { useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useToast } from '@/lib/context/ToastContext';
import { Order } from '@/lib/types';
import { createPayPalOrder, capturePayPalPayment, handleSuccessfulPayPalPayment } from '@/lib/payment/paypal';

interface PayPalPaymentFormProps {
  order: Order;
  onSuccess: () => void;
  onError: (error: string) => void;
}

/**
 * PayPal Payment Form Component
 * 
 * This component renders a PayPal payment button and handles the payment flow.
 */
const PayPalPaymentForm: React.FC<PayPalPaymentFormProps> = ({
  order,
  onSuccess,
  onError,
}) => {
  const { showToast } = useToast();
  const [{ isPending }] = usePayPalScriptReducer();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Create order handler for PayPal
  const createOrder = async () => {
    try {
      setIsProcessing(true);
      // Create a PayPal order
      const orderId = await createPayPalOrder(order);
      return orderId;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      onError('Failed to create PayPal order. Please try again.');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Approve order handler for PayPal
  const onApprove = async (data: any) => {
    try {
      setIsProcessing(true);
      
      // Capture the funds from the transaction
      const captureResult = await capturePayPalPayment(data.orderID, order);
      
      // Handle successful payment
      await handleSuccessfulPayPalPayment(order, captureResult);
      
      showToast('Payment successful!', 'success');
      onSuccess();
      
      return captureResult;
    } catch (error) {
      console.error('Error processing PayPal payment:', error);
      onError('Failed to process payment. Please try again.');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Error handler for PayPal
  const onPayPalError = (err: Record<string, unknown>) => {
    console.error('PayPal error:', err);
    onError('An error occurred with PayPal. Please try again or use a different payment method.');
  };
  
  // Cancel handler for PayPal
  const onCancel = () => {
    showToast('Payment cancelled', 'info');
  };
  
  return (
    <div className="space-y-6">
      {/* PayPal Buttons */}
      <div className={`${isPending || isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'pay',
          }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onPayPalError}
          onCancel={onCancel}
          disabled={isPending || isProcessing}
        />
      </div>
      
      {/* Loading State */}
      {(isPending || isProcessing) && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      )}
      
      {/* Secure Payment Notice */}
      <p className="text-xs text-gray-500 text-center">
        Your payment information is processed securely through PayPal. We do not store your PayPal credentials.
      </p>
    </div>
  );
};

export default PayPalPaymentForm;