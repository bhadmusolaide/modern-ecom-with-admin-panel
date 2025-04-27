'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Calendar, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { OrderStatus } from '@/lib/types';
import { withAdminPage } from '@/lib/auth/withAdminPage';
import PermissionGuard from '@/components/admin/PermissionGuard';

function OrderExportPage() {
  const { user, isAdmin, getIdToken } = useFirebaseAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Export options
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [fileFormat, setFileFormat] = useState<'csv' | 'json'>('csv');

  // Toggle status selection
  const toggleStatus = (status: OrderStatus) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  // Select all statuses
  const selectAllStatuses = () => {
    if (selectedStatuses.length === Object.values(OrderStatus).length) {
      setSelectedStatuses([]);
    } else {
      setSelectedStatuses(Object.values(OrderStatus));
    }
  };

  // Export orders
  const exportOrders = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (dateFrom) {
        params.append('dateFrom', dateFrom);
      }

      if (dateTo) {
        params.append('dateTo', dateTo);
      }

      if (selectedStatuses.length > 0) {
        selectedStatuses.forEach(status => {
          params.append('status', status);
        });
      }

      params.append('format', fileFormat);

      // Get auth token
      const token = await getIdToken();

      // Fetch orders for export
      const response = await fetch(`/api/orders/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export orders');
      }

      // Get the file from the response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      a.download = `orders-export-${date}.${fileFormat}`;

      // Trigger download
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Orders exported successfully!');
    } catch (err) {
      console.error('Error exporting orders:', err);
      setError('Failed to export orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Set default date range to last 30 days
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);



  return (
    <PermissionGuard permissions={['orders:export']}>
      <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <div className="flex items-center mb-1">
            <Link href="/admin/orders" className="text-neutral-600 hover:text-neutral-900 mr-2">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">Export Orders</h1>
          </div>
          <p className="text-neutral-600">Export order data for reporting and analysis</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-md flex items-start">
            <CheckCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
            <div>{success}</div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md flex items-start">
            <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Date Range</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="dateFrom" className="block text-sm font-medium text-neutral-700 mb-1">
                  From
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="dateFrom"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md pl-10"
                  />
                  <Calendar size={18} className="absolute left-3 top-2.5 text-neutral-400" />
                </div>
              </div>

              <div>
                <label htmlFor="dateTo" className="block text-sm font-medium text-neutral-700 mb-1">
                  To
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="dateTo"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md pl-10"
                  />
                  <Calendar size={18} className="absolute left-3 top-2.5 text-neutral-400" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Order Status</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="selectAll"
                  type="checkbox"
                  checked={selectedStatuses.length === Object.values(OrderStatus).length}
                  onChange={selectAllStatuses}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="selectAll" className="ml-2 block text-sm text-neutral-700">
                  Select All
                </label>
              </div>

              {Object.values(OrderStatus).map((status) => (
                <div key={status} className="flex items-center">
                  <input
                    id={`status-${status}`}
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                  <label htmlFor={`status-${status}`} className="ml-2 block text-sm text-neutral-700">
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">File Format</h2>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                id="format-csv"
                type="radio"
                name="fileFormat"
                value="csv"
                checked={fileFormat === 'csv'}
                onChange={() => setFileFormat('csv')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
              />
              <label htmlFor="format-csv" className="ml-2 block text-sm text-neutral-700">
                CSV
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="format-json"
                type="radio"
                name="fileFormat"
                value="json"
                checked={fileFormat === 'json'}
                onChange={() => setFileFormat('json')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
              />
              <label htmlFor="format-json" className="ml-2 block text-sm text-neutral-700">
                JSON
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={exportOrders}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </span>
            ) : (
              <span className="flex items-center">
                <Download size={16} className="mr-2" />
                Export Orders
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
    </PermissionGuard>
  );
}

export default withAdminPage(OrderExportPage);
