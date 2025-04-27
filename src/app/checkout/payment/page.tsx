'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFirebaseAuth } from '@/lib/firebase';
import { useToast } from '@/lib/context/ToastContext';
import { useCart } from '@/lib/context/CartContext';
import { Order } from '@/lib/types';
import { createPaymentIntent } from '@/lib/payment/stripe';
import UnifiedPaymentForm from '@/components/checkout/UnifiedPaymentForm';
import SavedPaymentMethods from '@/components/checkout/SavedPaymentMethods';
import OrderSummary from '@/components/checkout/OrderSummary';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

/**
 * Payment Page Component
 *
 * This page handles the payment step of the checkout process.
 */
export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useFirebaseAuth();
  const { showToast } = useToast();
  const { clearCart } = useCart();

  // Get the order ID from the URL
  const orderId = searchParams?.get('orderId');

  // State for the order and payment
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<string>('');

  // Fetch the order details
  useEffect(() => {
    if (!orderId) {
      router.push('/checkout');
      return;
    }

    const fetchOrder = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/orders/${orderId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const data = await response.json();
        setOrder(data.order);

        // Create a payment intent for the order
        if (data.order) {
          const { clientSecret, paymentIntentId } = await createPaymentIntent(data.order);
          setClientSecret(clientSecret);
          setPaymentIntentId(paymentIntentId);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        showToast('Failed to load order details', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router, showToast]);

  // Handle saved payment method selection
  const handleSavedMethodSelect = (paymentMethodId: string) => {
    setSelectedSavedMethod(paymentMethodId);
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    showToast('Payment successful!', 'success');
    clearCart(); // Clear the cart after successful payment
    router.push(`/checkout/thank-you?orderId=${orderId}`);
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    showToast(`Payment failed: ${error}`, 'error');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if order not found
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Order Not Found</h1>
            <p className="mt-2 text-gray-600">We couldn't find the order you're looking for.</p>
            <div className="mt-6">
              <Link
                href="/checkout"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Return to Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <Link
              href="/checkout"
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
              <p className="text-gray-600">Complete your purchase</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Saved payment methods (for logged-in users) */}
            {user && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <SavedPaymentMethods
                  onSelect={handleSavedMethodSelect}
                  selectedId={selectedSavedMethod}
                />
              </div>
            )}

            {/* Unified payment form */}
            <UnifiedPaymentForm
              order={order}
              clientSecret={clientSecret}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />

            {/* Security notice */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Secure Payment</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your payment information is encrypted and securely processed. We do not store your credit card details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-6">
              <OrderSummary order={order} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}