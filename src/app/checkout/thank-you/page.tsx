'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiShoppingBag, FiUser, FiCreditCard } from 'react-icons/fi';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/lib/context/ToastContext';
import { Order, PaymentStatus } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    }>
      <ThankYouPageContent />
    </Suspense>
  );
}

function ThankYouPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  // Get the order ID from the URL
  const orderId = searchParams?.get('orderId');
  const paymentIntentId = searchParams?.get('payment_intent');
  const paymentIntentClientSecret = searchParams?.get('payment_intent_client_secret');

  // State for the order
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the order details
  useEffect(() => {
    // Try to get order from localStorage if no orderId in URL
    if (!orderId) {
      if (typeof window !== 'undefined') {
        const storedOrderId = localStorage.getItem('lastOrderId');
        const storedOrderData = localStorage.getItem('lastOrderData');

        if (storedOrderData) {
          try {
            const parsedOrder = JSON.parse(storedOrderData);
            console.log('Using order data from localStorage:', parsedOrder);
            setOrder(parsedOrder);
            setIsLoading(false);
            return;
          } catch (e) {
            console.error('Error parsing stored order data:', e);
          }
        }

        if (storedOrderId) {
          console.log('No order ID in URL, but found in localStorage:', storedOrderId);
          router.replace(`/checkout/thank-you?orderId=${encodeURIComponent(storedOrderId)}`);
          return;
        }
      }

      console.log('No order ID found, redirecting to home');
      router.push('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        setIsLoading(true);

        console.log('Fetching order with ID:', orderId);
        const response = await fetch(`/api/orders/${orderId}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);

          // Try to get order from localStorage as fallback
          if (typeof window !== 'undefined') {
            const storedOrderData = localStorage.getItem('lastOrderData');
            if (storedOrderData) {
              try {
                const parsedOrder = JSON.parse(storedOrderData);
                console.log('API request failed, using order data from localStorage:', parsedOrder);
                setOrder(parsedOrder);
                setIsLoading(false);
                return;
              } catch (e) {
                console.error('Error parsing stored order data:', e);
              }
            }
          }

          // If we get a 404 Not Found response, show a user-friendly message
          if (response.status === 404) {
            console.log('Order not found, showing error message');
            setOrder(null);
            setIsLoading(false);
            showToast('Order not found. Please check your order ID.', 'error');
            return;
          }

          throw new Error(`Failed to fetch order: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log('Raw API response:', responseText);

        try {
          const data = JSON.parse(responseText);
          console.log('Order data received:', data);
          setOrder(data);

          // Store successful order data in localStorage for future reference
          if (typeof window !== 'undefined') {
            localStorage.setItem('lastOrderData', JSON.stringify(data));
          }
        } catch (parseError) {
          console.error('Error parsing order data:', parseError);
          throw new Error('Failed to parse order data');
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Show error if order not found
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Order Not Found</h1>
          <p className="mt-2 text-gray-600">We couldn't find the order you're looking for.</p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden"
      >
        <div className="p-8 text-center border-b border-gray-200">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-6"
          >
            <FiCheckCircle size={32} />
          </motion.div>
          <h1 className="text-3xl font-bold mb-3">Thank You!</h1>
          <p className="text-gray-600 text-lg mb-4">Your order has been successfully placed.</p>
          <p className="text-gray-500">Order Number: <span className="font-medium">{order?.orderNumber}</span></p>
        </div>

        <div className="p-8">
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              We've sent a confirmation email to <span className="font-medium">{order?.email}</span> with your order details.
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h2 className="text-lg font-medium mb-4">Order Summary</h2>

            <div className="space-y-4 mb-4">
              {order?.items?.slice(0, 3).map((item, index) => (
                <div key={item.id || index} className="flex items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-md overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm font-medium text-gray-900">{formatPrice(item.subtotal)}</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Qty: {item.quantity}
                      {item.selectedColor && ` • ${item.selectedColor}`}
                      {item.selectedSize && ` • ${item.selectedSize}`}
                    </p>
                  </div>
                </div>
              ))}

              {order?.items?.length > 3 && (
                <p className="text-sm text-gray-500 text-center">
                  + {order.items.length - 3} more item(s)
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between text-sm">
                <p className="text-gray-500">Subtotal</p>
                <p className="text-gray-900 font-medium">{formatPrice(order?.subtotal || 0)}</p>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <p className="text-gray-500">Shipping</p>
                <p className="text-gray-900 font-medium">{formatPrice(order?.shippingCost || 0)}</p>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <p className="text-gray-500">Tax</p>
                <p className="text-gray-900 font-medium">{formatPrice(order?.tax || 0)}</p>
              </div>
              {order?.discount && order.discount > 0 && (
                <div className="flex justify-between text-sm mt-2">
                  <p className="text-gray-500">Discount</p>
                  <p className="text-green-600 font-medium">-{formatPrice(order.discount)}</p>
                </div>
              )}
              <div className="flex justify-between text-base font-medium mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-900">Total</p>
                <p className="text-gray-900">{formatPrice(order?.total || 0)}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <div className="flex items-start">
              <FiCreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Payment Information</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {order?.payment?.method?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                  {order?.payment?.cardBrand && order?.payment?.lastFour && ` ending in ${order.payment.lastFour}`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Status: {order?.payment?.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                  {order?.payment?.status === PaymentStatus.COMPLETED && order?.payment?.datePaid && ` on ${formatDate(order.payment.datePaid)}`}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h2 className="text-lg font-medium mb-4">What happens next?</h2>
            <div className="space-y-4">
              <div className="flex">
                <div className="mr-4 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">1</div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Order Processing</h3>
                  <p className="text-gray-600 text-sm">We're preparing your order for shipment. This usually takes 1-2 business days.</p>
                </div>
              </div>
              <div className="flex">
                <div className="mr-4 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">2</div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Order Shipped</h3>
                  <p className="text-gray-600 text-sm">You'll receive a shipping confirmation email with tracking information.</p>
                </div>
              </div>
              <div className="flex">
                <div className="mr-4 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">3</div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Delivery</h3>
                  <p className="text-gray-600 text-sm">Standard shipping takes 3-5 business days within the continental US.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <Link
              href="/shop"
              className="flex-1 py-3 bg-primary-600 text-white text-center font-medium rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center"
            >
              <FiShoppingBag className="mr-2" /> Continue Shopping
            </Link>
            <Link
              href="/account/orders"
              className="flex-1 py-3 bg-gray-200 text-gray-800 text-center font-medium rounded-md hover:bg-gray-300 transition-colors flex items-center justify-center"
            >
              <FiUser className="mr-2" /> View Your Orders
            </Link>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            Need help? <Link href="/contact" className="text-primary-600">Contact our support team</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}