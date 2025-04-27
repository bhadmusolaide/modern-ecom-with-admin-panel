'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/lib/firebase';
import { useToast } from '@/lib/context/ToastContext';
import { Order } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/utils';
import AccountLayout from '@/components/account/AccountLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';

export default function OrderHistoryPage() {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);

  // Check if user is authenticated
  useEffect(() => {
    console.log('Orders page - auth state:', {
      user: user ? 'authenticated' : 'not authenticated',
      loading: authLoading,
      isDev: process.env.NODE_ENV === 'development'
    });

    if (!authLoading && !user) {
      showToast('Please log in to view your orders', 'error');
      router.push('/auth/login?redirect=/account/orders');
    }
  }, [user, authLoading, router, showToast]);

  // Fetch user's orders
  useEffect(() => {
    const fetchOrders = async () => {
      // In development mode, we can proceed even without a token
      if (!user?.token && process.env.NODE_ENV !== 'development') {
        console.log('No user token available, skipping order fetch');
        return;
      }

      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
          sortBy: 'createdAt',
          sortDirection: 'desc'
        });

        // Prepare headers - in development mode, we don't need a real token
        const headers: HeadersInit = {};
        if (user?.token) {
          headers['Authorization'] = `Bearer ${user.token}`;
        }

        const response = await fetch(`/api/orders?${params.toString()}`, { headers });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        // Get response as text first to avoid JSON parse errors
        const text = await response.text();

        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing orders response:', parseError);
          console.log('Response text:', text.substring(0, 200));
          throw new Error('Failed to parse orders response');
        }

        setOrders(data.orders || []);
        setTotalOrders(data.total || 0);
      } catch (error) {
        console.error('Error fetching orders:', error);
        showToast('Failed to load your orders', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user, currentPage, pageSize, showToast]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (authLoading) {
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

  return (
    <AccountLayout>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-lg leading-6 font-medium text-gray-900">Order History</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            View and track your recent orders
          </p>
        </div>

        {isLoading ? (
          <div className="px-4 py-12 sm:px-6 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="px-4 py-12 sm:px-6 text-center">
            <p className="text-sm text-gray-500">You haven't placed any orders yet.</p>
            <div className="mt-6">
              <Link
                href="/shop"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order #
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">View</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/account/orders/${order.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalOrders > pageSize && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalOrders}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </AccountLayout>
  );
}