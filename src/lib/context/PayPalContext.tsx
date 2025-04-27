'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { PayPalScriptProvider, PayPalScriptOptions } from '@paypal/react-paypal-js';

interface PayPalContextProps {
  children: ReactNode;
}

/**
 * PayPal Provider Component
 *
 * This component provides the PayPal context to the application.
 * It wraps the application with the PayPal script provider.
 */
export const PayPalProvider: React.FC<PayPalContextProps> = ({ children }) => {
  // Define options for PayPal script
  const paypalOptions: PayPalScriptOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    currency: 'USD', // Default to USD, but this should be updated based on site settings
    intent: 'capture',
    components: 'buttons,funding-eligibility',
  };

  // Note: In a production app, you would fetch the currency from site settings
  // and update the PayPal options accordingly

  return (
    <PayPalScriptProvider options={paypalOptions}>
      {children}
    </PayPalScriptProvider>
  );
};

// Create a context for PayPal-specific state if needed
interface PayPalContextValue {
  isLoading: boolean;
}

const PayPalContext = createContext<PayPalContextValue | undefined>(undefined);

/**
 * Custom hook to use the PayPal context
 */
export const usePayPalContext = () => {
  const context = useContext(PayPalContext);
  if (context === undefined) {
    throw new Error('usePayPalContext must be used within a PayPalProvider');
  }
  return context;
};

/**
 * PayPal Context Provider with state
 */
export const PayPalContextProvider: React.FC<PayPalContextProps> = ({ children }) => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // Define options for PayPal script
  const paypalOptions: PayPalScriptOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    currency: 'USD', // Default to USD, but this should be updated based on site settings
    intent: 'capture',
    components: 'buttons,funding-eligibility',
  };

  // Note: In a production app, you would fetch the currency from site settings
  // and update the PayPal options accordingly

  const value = {
    isLoading,
  };

  return (
    <PayPalContext.Provider value={value}>
      <PayPalScriptProvider options={paypalOptions}>
        {children}
      </PayPalScriptProvider>
    </PayPalContext.Provider>
  );
};