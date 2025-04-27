'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/payment/stripe';

interface StripeContextProps {
  children: ReactNode;
}

/**
 * Stripe Provider Component
 * 
 * This component provides the Stripe context to the application.
 * It wraps the application with the Stripe Elements provider.
 */
export const StripeProvider: React.FC<StripeContextProps> = ({ children }) => {
  // Get the Stripe promise
  const stripePromise = getStripe();
  
  // Define appearance options for Stripe Elements
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#6366f1', // Match primary color
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '4px',
    },
  };
  
  // Define options for Stripe Elements
  const options = {
    appearance,
    clientSecret: undefined, // Will be set when creating a payment intent
  };
  
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};

// Create a context for Stripe-specific state if needed
interface StripeContextValue {
  isLoading: boolean;
  setClientSecret: (secret: string) => void;
}

const StripeContext = createContext<StripeContextValue | undefined>(undefined);

/**
 * Custom hook to use the Stripe context
 */
export const useStripeContext = () => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  return context;
};

/**
 * Stripe Context Provider with state
 */
export const StripeContextProvider: React.FC<StripeContextProps> = ({ children }) => {
  const [clientSecret, setClientSecret] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  
  // Get the Stripe promise
  const stripePromise = getStripe();
  
  // Define appearance options for Stripe Elements
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#6366f1', // Match primary color
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '4px',
    },
  };
  
  // Define options for Stripe Elements
  const options = {
    appearance,
    clientSecret: clientSecret || undefined,
  };
  
  const value = {
    isLoading,
    setClientSecret: (secret: string) => {
      setClientSecret(secret);
    },
  };
  
  return (
    <StripeContext.Provider value={value}>
      <Elements stripe={stripePromise} options={options}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
};