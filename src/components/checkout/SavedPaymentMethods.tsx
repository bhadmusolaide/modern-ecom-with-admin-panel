'use client';

import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/lib/firebase';
import { useToast } from '@/lib/context/ToastContext';
import { PaymentMethod, PaymentProvider } from '@/lib/types';
import { CreditCard, Trash2 } from 'lucide-react';

interface SavedPaymentMethod {
  id: string;
  type: PaymentMethod;
  provider: PaymentProvider;
  isDefault: boolean;
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardBrand?: string;
  createdAt: string;
}

interface SavedPaymentMethodsProps {
  onSelect: (paymentMethodId: string) => void;
  selectedId?: string;
}

/**
 * Saved Payment Methods Component
 *
 * This component displays a list of saved payment methods and allows the user to select one.
 */
const SavedPaymentMethods: React.FC<SavedPaymentMethodsProps> = ({
  onSelect,
  selectedId,
}) => {
  const { user } = useFirebaseAuth();
  const { showToast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch saved payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!user) {
        setPaymentMethods([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const response = await fetch('/api/payment/methods');

        if (!response.ok) {
          throw new Error('Failed to fetch payment methods');
        }

        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        showToast('Failed to load saved payment methods', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentMethods();
  }, [user, showToast]);

  // Delete a payment method
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      const response = await fetch(`/api/payment/methods/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }

      // Remove the deleted method from the list
      setPaymentMethods(methods => methods.filter(method => method.id !== id));
      showToast('Payment method deleted', 'success');

      // If the deleted method was selected, clear the selection
      if (selectedId === id) {
        onSelect('');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      showToast('Failed to delete payment method', 'error');
    }
  };

  // Set a payment method as default
  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/payment/methods/${id}/default`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to set default payment method');
      }

      // Update the list to reflect the new default
      setPaymentMethods(methods => methods.map(method => ({
        ...method,
        isDefault: method.id === id,
      })));

      showToast('Default payment method updated', 'success');
    } catch (error) {
      console.error('Error setting default payment method:', error);
      showToast('Failed to update default payment method', 'error');
    }
  };

  // If not logged in, don't show anything
  if (!user) {
    return null;
  }

  // If loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If no saved methods, show a message
  if (paymentMethods.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-sm text-gray-700">
          You don't have any saved payment methods. Your payment method will be saved after your first purchase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-gray-900">Saved Payment Methods</h3>

      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`flex items-center p-3 border rounded-md cursor-pointer ${
              selectedId === method.id
                ? 'border-primary-500 ring-2 ring-primary-200'
                : 'border-gray-300 hover:border-primary-300'
            }`}
            onClick={() => onSelect(method.id)}
          >
            <div className="flex-shrink-0 mr-3">
              {method.type === PaymentMethod.CREDIT_CARD ? (
                <CreditCard className="h-5 w-5 text-gray-400" />
              ) : method.type === PaymentMethod.PAYPAL ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#00457C">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.58 2.977-2.477 4.532-5.887 4.532h-2.19c-.524 0-.967.382-1.05.9l-1.12 7.106c-.068.435.239.832.68.832h4.606c.564 0 1.041-.408 1.13-.966l.047-.232 1.084-6.87.07-.38c.086-.558.564-.966 1.128-.966h.71c4.298 0 7.664-1.747 8.647-6.797.406-2.085.173-3.824-.879-5.043-.288-.333-.603-.621-.941-.871z" />
                </svg>
              ) : (
                <div className="h-5 w-5 bg-gray-200 rounded-full" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center">
                <p className="font-medium text-gray-900">
                  {method.type === PaymentMethod.CREDIT_CARD
                    ? `${method.cardBrand} •••• ${method.lastFour}`
                    : method.type === PaymentMethod.PAYPAL
                    ? 'PayPal'
                    : 'Payment Method'}
                </p>
                {method.isDefault && (
                  <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </div>

              {method.type === PaymentMethod.CREDIT_CARD && method.expiryMonth && method.expiryYear && (
                <p className="text-sm text-gray-500">
                  Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear.toString().slice(-2)}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 ml-4 flex space-x-2">
              {!method.isDefault && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDefault(method.id);
                  }}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  Set as default
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(method.id);
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="save-payment-method"
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="save-payment-method" className="ml-2 block text-sm text-gray-700">
          Save my payment information for future purchases
        </label>
      </div>
    </div>
  );
};

export default SavedPaymentMethods;