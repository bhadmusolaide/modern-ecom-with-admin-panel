'use client';

import React, { useState } from 'react';
import { PaymentMethod } from '@/lib/types';
import { CreditCard, Paypal, AppleIcon, GoogleIcon, BankIcon } from '@/components/icons';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  description: string;
  isAvailable: boolean;
}

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
}

/**
 * Payment Method Selector Component
 * 
 * This component allows users to select a payment method during checkout.
 */
const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
}) => {
  // Define available payment methods
  const paymentMethods: PaymentMethodOption[] = [
    {
      id: PaymentMethod.CREDIT_CARD,
      name: 'Credit Card',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Pay with Visa, Mastercard, American Express, or Discover',
      isAvailable: true,
    },
    {
      id: PaymentMethod.PAYPAL,
      name: 'PayPal',
      icon: <Paypal className="h-6 w-6" />,
      description: 'Pay with your PayPal account',
      isAvailable: true,
    },
    {
      id: PaymentMethod.APPLE_PAY,
      name: 'Apple Pay',
      icon: <AppleIcon className="h-6 w-6" />,
      description: 'Pay with Apple Pay',
      isAvailable: true,
    },
    {
      id: PaymentMethod.GOOGLE_PAY,
      name: 'Google Pay',
      icon: <GoogleIcon className="h-6 w-6" />,
      description: 'Pay with Google Pay',
      isAvailable: true,
    },
    {
      id: PaymentMethod.BANK_TRANSFER,
      name: 'Bank Transfer',
      icon: <BankIcon className="h-6 w-6" />,
      description: 'Pay directly from your bank account',
      isAvailable: false, // Not yet implemented
    },
  ];
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
      
      <div className="grid gap-3">
        {paymentMethods.map((method) => (
          <div key={method.id} className="relative">
            <button
              type="button"
              onClick={() => method.isAvailable && onMethodChange(method.id)}
              className={`w-full flex items-center p-4 border rounded-md ${
                selectedMethod === method.id
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-gray-300'
              } ${
                !method.isAvailable
                  ? 'opacity-50 cursor-not-allowed bg-gray-50'
                  : 'hover:border-primary-300 cursor-pointer'
              }`}
              disabled={!method.isAvailable}
            >
              <div className="flex-shrink-0 mr-3">{method.icon}</div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">{method.name}</p>
                <p className="text-sm text-gray-500">{method.description}</p>
              </div>
              {!method.isAvailable && (
                <span className="text-xs text-gray-500 ml-2">Coming soon</span>
              )}
              {selectedMethod === method.id && (
                <div className="absolute inset-y-0 right-4 flex items-center">
                  <svg
                    className="h-5 w-5 text-primary-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;

// Icon components (simplified for this example)
function CreditCard({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

function Paypal({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="#00457C"
    >
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.58 2.977-2.477 4.532-5.887 4.532h-2.19c-.524 0-.967.382-1.05.9l-1.12 7.106c-.068.435.239.832.68.832h4.606c.564 0 1.041-.408 1.13-.966l.047-.232 1.084-6.87.07-.38c.086-.558.564-.966 1.128-.966h.71c4.298 0 7.664-1.747 8.647-6.797.406-2.085.173-3.824-.879-5.043-.288-.333-.603-.621-.941-.871z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function BankIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
      />
    </svg>
  );
}