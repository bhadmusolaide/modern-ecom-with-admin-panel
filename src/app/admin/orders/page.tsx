'use client';

// Force dynamic rendering and disable static optimization
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  TruckIcon,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Order, OrderStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/format';
import { withAdminPage } from '@/lib/auth/withAdminPage';
import { safeFetch } from '@/lib/api/safeFetch';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { useFirebaseAuth } from '@/lib/firebase';

function OrdersPage() {
  const { user, getIdToken } = useFirebaseAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const pageSize = 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Status color mapping
  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.SHIPPED:
        return 'bg-indigo-100 text-indigo-800';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case OrderStatus.REFUNDED:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.ON_HOLD:
        return 'bg-gray-100 text-gray-800';
      case OrderStatus.BACKORDERED:
        return 'bg-orange-100 text-orange-800';
      case OrderStatus.PARTIALLY_SHIPPED:
        return 'bg-teal-100 text-teal-800';
      case OrderStatus.AWAITING_STOCK:
        return 'bg-amber-100 text-amber-800';
      case OrderStatus.READY_FOR_PICKUP:
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Status icon mapping
  const getStatusIcon = (status: OrderStatus): React.ReactNode => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Clock size={16} />;
      case OrderStatus.PROCESSING:
        return <RefreshCw size={16} />;
      case OrderStatus.SHIPPED:
        return <TruckIcon size={16} />;
      case OrderStatus.DELIVERED:
        return <CheckCircle size={16} />;
      case OrderStatus.CANCELLED:
        return <XCircle size={16} />;
      case OrderStatus.REFUNDED:
        return <AlertCircle size={16} />;
      case OrderStatus.ON_HOLD:
        return <AlertCircle size={16} />;
      case OrderStatus.BACKORDERED:
        return <Package size={16} />;
      case OrderStatus.PARTIALLY_SHIPPED:
        return <TruckIcon size={16} />;
      case OrderStatus.AWAITING_STOCK:
        return <Package size={16} />;
      case OrderStatus.READY_FOR_PICKUP:
        return <Package size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (dateFrom) {
        params.append('dateFrom', dateFrom);
      }

      if (dateTo) {
        params.append('dateTo', dateTo);
      }

      console.log(`Admin orders page: Fetching orders from /api/orders?${params.toString()}`);

      // Get a fresh token directly from Firebase
      const token = await getIdToken();
      console.log('Admin orders page: Got fresh token:', token ? 'Yes (token available)' : 'No (token not available)');

      try {
        // First try using the API
        const data = await safeFetch(`/api/orders?${params.toString()}`, {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : undefined
        });

        console.log('Admin orders page: Received orders count from API:', data.orders?.length || 0);

        if (data.orders && data.orders.length > 0) {
          setOrders(data.orders);
          setTotalPages(data.totalPages || 1);
          setTotalOrders(data.total || 0);
          return;
        } else {
          console.log('Admin orders page: No orders returned from API, trying direct Firestore access');
        }
      } catch (apiError) {
        console.error('Error fetching orders from API:', apiError);
        console.log('Admin orders page: Falling back to direct Firestore access');
      }

      // If API fails or returns no orders, try direct Firestore access
      try {
        // Import Firebase modules dynamically to avoid SSR issues
        const { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');

        console.log('Admin orders page: Fetching orders directly from Firestore');

        // Create a query to get orders
        const ordersCollection = collection(db, 'orders');
        const ordersQuery = query(
          ordersCollection,
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );

        // Execute the query
        const querySnapshot = await getDocs(ordersQuery);

        // Convert the query snapshot to an array of orders
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log('Admin orders page: Received orders count from Firestore:', ordersData.length);

        // Update state with the fetched orders
        setOrders(ordersData);
        setTotalPages(1); // Simplified pagination for direct access
        setTotalOrders(ordersData.length);
      } catch (firestoreError) {
        console.error('Error fetching orders directly from Firestore:', firestoreError);
        throw firestoreError; // Re-throw to be caught by outer catch
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchQuery, dateFrom, dateTo, getIdToken]);

  // Apply filters
  const applyFilters = () => {
    setPage(1); // Reset to first page when filters change
    fetchOrders();
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // Handle pagination
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Fetch orders when user, page, or filters change
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, page, statusFilter, searchQuery, dateFrom, dateTo, fetchOrders]);

  // Log authentication state for debugging
  console.log('Orders page - auth state:', {
    user: user ? 'authenticated' : 'not authenticated'
  });

  return (
    <PermissionGuard permissions={['orders:view']}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Order Management</h1>
            <p className="text-neutral-600">Manage and process customer orders</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link
              href="/admin/orders/analytics"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View Analytics
            </Link>
            <Link
              href="/admin/orders/export"
              className="inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors"
            >
              <Download size={18} className="mr-2" />
              Export
            </Link>
          </div>
        </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-neutral-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Search by order #, customer name, or email"
                className="w-full px-4 py-2 border border-neutral-300 rounded-md pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={18} className="absolute left-3 top-2.5 text-neutral-400" />
            </div>
          </div>

          <div className="w-full md:w-48">
            <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
              Status
            </label>
            <select
              id="status"
              className="w-full px-4 py-2 border border-neutral-300 rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
            >
              <option value="">All Statuses</option>
              {Object.values(OrderStatus).map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-48">
            <label htmlFor="dateFrom" className="block text-sm font-medium text-neutral-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              id="dateFrom"
              className="w-full px-4 py-2 border border-neutral-300 rounded-md"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="w-full md:w-48">
            <label htmlFor="dateTo" className="block text-sm font-medium text-neutral-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              id="dateTo"
              className="w-full px-4 py-2 border border-neutral-300 rounded-md"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Filter size={18} className="mr-2 inline" />
              Filter
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-neutral-200 mb-4"></div>
              <div className="h-4 w-48 bg-neutral-200 rounded mb-3"></div>
              <div className="h-3 w-32 bg-neutral-200 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-500 mb-2">{error}</div>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={48} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-1">No Orders Found</h3>
            <p className="text-neutral-600 mb-4">
              {statusFilter || searchQuery || dateFrom || dateTo
                ? 'No orders match your filter criteria.'
                : 'There are no orders in the system yet.'}
            </p>
            {(statusFilter || searchQuery || dateFrom || dateTo) && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        <div>{order.customerName}</div>
                        <div className="text-xs text-neutral-500">{order.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          <span className="mr-1">{getStatusIcon(order.status)}</span>
                          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
              <div className="text-sm text-neutral-700">
                Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * pageSize, totalOrders)}
                </span>{' '}
                of <span className="font-medium">{totalOrders}</span> orders
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className={`inline-flex items-center px-3 py-1 border border-neutral-300 rounded-md ${
                    page === 1
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : 'bg-white text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className={`inline-flex items-center px-3 py-1 border border-neutral-300 rounded-md ${
                    page === totalPages
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : 'bg-white text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </PermissionGuard>
  );
}

export default withAdminPage(OrdersPage);
