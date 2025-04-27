'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/lib/firebase';
import { useToast } from '@/lib/context/ToastContext';
import { Order, OrderStatus, PaymentStatus, OrderNote } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import AccountLayout from '@/components/account/AccountLayout';
import StatusBadge from '@/components/ui/StatusBadge';

export default function CustomerOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);

  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // State
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      showToast('Please log in to view your order', 'error');
      router.push(`/login?redirect=/account/orders/${id}`);
    }
  }, [user, authLoading, router, showToast, id]);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user?.token) return;

      setIsLoading(true);

      try {
        const response = await fetch(`/api/orders/${id}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            showToast('Order not found', 'error');
            router.push('/account/orders');
            return;
          }
          throw new Error('Failed to fetch order details');
        }

        const orderData = await response.json();
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order details:', error);
        showToast('Failed to load order details', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, user, router, showToast]);

  if (authLoading || isLoading) {
    return (
      <AccountLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </AccountLayout>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (!order) {
    return (
      <AccountLayout>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-lg leading-6 font-medium text-gray-900">Order Not Found</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              The order you are looking for does not exist or you do not have permission to view it.
            </p>
            <div className="mt-6">
              <Link
                href="/account/orders"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </AccountLayout>
    );
  }

  // Filter notes to only show customer-visible ones
  const visibleNotes = order.notes?.filter(note => note.isCustomerVisible) || [];

  return (
    <AccountLayout>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h1 className="text-lg leading-6 font-medium text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Shipping Address</h3>
              <address className="mt-2 not-italic text-sm text-gray-500">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                {order.shippingAddress.address}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                {order.shippingAddress.country}
                {order.shippingAddress.phone && (
                  <>
                    <br />
                    {order.shippingAddress.phone}
                  </>
                )}
              </address>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900">Shipping Method</h3>
              <p className="mt-2 text-sm text-gray-500">
                {order.shippingMethod.name}
                {order.shippingMethod.estimatedDelivery && (
                  <span className="block">{order.shippingMethod.estimatedDelivery}</span>
                )}
              </p>

              <h3 className="text-sm font-medium text-gray-900 mt-4">Payment Method</h3>
              <p className="mt-2 text-sm text-gray-500">
                {order.payment.method}
                <span className="block">
                  Status: <span className={`font-medium ${
                    order.payment.status === PaymentStatus.PAID
                      ? 'text-green-600'
                      : order.payment.status === PaymentStatus.PENDING
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {order.payment.status}
                  </span>
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Tracking Information */}
        {order.tracking && (
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <h3 className="text-sm font-medium text-gray-900">Tracking Information</h3>
            <div className="mt-2 text-sm text-gray-500">
              <p>
                Carrier: {order.tracking.carrier}
              </p>
              <p className="mt-1">
                Tracking Number: {order.tracking.trackingUrl ? (
                  <a
                    href={order.tracking.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-900"
                  >
                    {order.tracking.trackingNumber}
                  </a>
                ) : (
                  order.tracking.trackingNumber
                )}
              </p>
              {order.tracking.shippedDate && (
                <p className="mt-1">
                  Shipped Date: {formatDate(order.tracking.shippedDate)}
                </p>
              )}
              {order.tracking.estimatedDeliveryDate && (
                <p className="mt-1">
                  Estimated Delivery: {formatDate(order.tracking.estimatedDeliveryDate)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="border-t border-gray-200">
          <h3 className="sr-only">Items</h3>
          <ul role="list" className="divide-y divide-gray-200">
            {order.items.map((item) => (
              <li key={item.id} className="p-4 sm:p-6">
                <div className="flex items-center sm:items-start">
                  <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg overflow-hidden sm:w-24 sm:h-24">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-center object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 ml-6 text-sm">
                    <div className="font-medium text-gray-900 sm:flex sm:justify-between">
                      <h4>{item.name}</h4>
                      <p className="mt-2 sm:mt-0">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <div className="mt-2 flex text-gray-500">
                      <p className="mr-4">{formatPrice(item.price)} × {item.quantity}</p>
                      {(item.selectedColor || item.selectedSize) && (
                        <p>
                          {item.selectedColor && `Color: ${item.selectedColor}`}
                          {item.selectedColor && item.selectedSize && ' / '}
                          {item.selectedSize && `Size: ${item.selectedSize}`}
                        </p>
                      )}
                    </div>
                    {item.productId && (
                      <div className="mt-2">
                        <Link
                          href={`/products/${item.productId}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-500"
                        >
                          View Product
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Order Summary */}
        <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
          <div className="flex justify-between text-sm text-gray-600">
            <p>Subtotal</p>
            <p>{formatPrice(order.subtotal)}</p>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <p>Shipping</p>
            <p>{formatPrice(order.shippingCost)}</p>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <p>Tax</p>
            <p>{formatPrice(order.tax)}</p>
          </div>
          <div className="flex justify-between text-base font-medium text-gray-900 mt-4 pt-4 border-t border-gray-200">
            <p>Total</p>
            <p>{formatPrice(order.total)}</p>
          </div>
        </div>

        {/* Order Notes */}
        {visibleNotes.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
            <h3 className="text-sm font-medium text-gray-900">Order Notes</h3>
            <ul role="list" className="mt-2 divide-y divide-gray-200">
              {visibleNotes.map((note: OrderNote) => (
                <li key={note.id} className="py-3">
                  <div className="text-sm text-gray-600">{note.message}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {formatDate(note.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
          <div className="flex justify-between">
            <Link
              href="/account/orders"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Orders
            </Link>

            {/* Add more actions like reorder, cancel, etc. based on order status */}
            {order.status === OrderStatus.DELIVERED && (
              <Link
                href={`/account/orders/${order.id}/review`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Write a Review
              </Link>
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}