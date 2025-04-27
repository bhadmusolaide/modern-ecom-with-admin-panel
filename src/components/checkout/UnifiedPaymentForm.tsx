'use client';

import React, { useState } from 'react';
import { Order, PaymentMethod } from '@/lib/types';
import { StripeContextProvider } from '@/lib/context/StripeContext';
import { PayPalContextProvider } from '@/lib/context/PayPalContext';
import PaymentMethodSelector from './PaymentMethodSelector';
import PaymentForm from './PaymentForm';
import PayPalPaymentForm from './PayPalPaymentForm';
import ApplePayButton from './ApplePayButton';
import GooglePayButton from './GooglePayButton';

interface UnifiedPaymentFormProps {
  order: Order;
  clientSecret?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

/**
 * Unified Payment Form Component
 * 
 * This component provides a unified interface for different payment methods.
 */
const UnifiedPaymentForm: React.FC<UnifiedPaymentFormProps> = ({
  order,
  clientSecret,
  onSuccess,
  onError,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CREDIT_CARD);
  
  // Handle payment method change
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };
  
  // Render the appropriate payment form based on the selected method
  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case PaymentMethod.CREDIT_CARD:
        return clientSecret ? (
          <PaymentForm
            clientSecret={clientSecret}
            order={order}
            onSuccess={onSuccess}
            onError={onError}
          />
        ) : (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        );
        
      case PaymentMethod.PAYPAL:
        return (
          <PayPalPaymentForm
            order={order}
            onSuccess={onSuccess}
            onError={onError}
          />
        );
        
      case PaymentMethod.APPLE_PAY:
        return (
          <ApplePayButton
            order={order}
            onSuccess={onSuccess}
            onError={onError}
          />
        );
        
      case PaymentMethod.GOOGLE_PAY:
        return (
          <GooglePayButton
            order={order}
            onSuccess={onSuccess}
            onError={onError}
          />
        );
        
      default:
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700">
              This payment method is not yet implemented. Please choose another method.
            </p>
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Payment method selector */}
      <PaymentMethodSelector
        selectedMethod={selectedMethod}
        onMethodChange={handlePaymentMethodChange}
      />
      
      {/* Payment form */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
        
        {/* Wrap with appropriate context providers */}
        {selectedMethod === PaymentMethod.CREDIT_CARD ? (
          <StripeContextProvider>
            {renderPaymentForm()}
          </StripeContextProvider>
        ) : selectedMethod === PaymentMethod.PAYPAL ? (
          <PayPalContextProvider>
            {renderPaymentForm()}
          </PayPalContextProvider>
        ) : (
          renderPaymentForm()
        )}
      </div>
    </div>
  );
};

export default UnifiedPaymentForm;