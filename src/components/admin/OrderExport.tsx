'use client';

import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Calendar, Filter } from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { exportOrders } from '@/lib/utils/exportUtils';
import DateRangePicker from '@/components/ui/DateRangePicker';
import FilterDropdown from '@/components/ui/FilterDropdown';

interface OrderExportProps {
  orders: Order[];
  onExport?: () => void;
}

// Status options for filtering
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: OrderStatus.PENDING, label: 'Pending' },
  { value: OrderStatus.PROCESSING, label: 'Processing' },
  { value: OrderStatus.SHIPPED, label: 'Shipped' },
  { value: OrderStatus.DELIVERED, label: 'Delivered' },
  { value: OrderStatus.CANCELLED, label: 'Cancelled' },
  { value: OrderStatus.REFUNDED, label: 'Refunded' },
  { value: OrderStatus.ON_HOLD, label: 'On Hold' },
  { value: OrderStatus.BACKORDERED, label: 'Backordered' },
];

const OrderExport: React.FC<OrderExportProps> = ({ orders, onExport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [fileName, setFileName] = useState('orders-export');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  
  // Filter orders based on selected criteria
  const getFilteredOrders = () => {
    return orders.filter(order => {
      // Filter by status
      if (statusFilter && order.status !== statusFilter) {
        return false;
      }
      
      // Filter by date range
      if (dateRange.from || dateRange.to) {
        const orderDate = new Date(order.createdAt);
        
        if (dateRange.from && orderDate < dateRange.from) {
          return false;
        }
        
        if (dateRange.to) {
          // Set time to end of day for the to date
          const endDate = new Date(dateRange.to);
          endDate.setHours(23, 59, 59, 999);
          
          if (orderDate > endDate) {
            return false;
          }
        }
      }
      
      return true;
    });
  };
  
  // Handle export
  const handleExport = () => {
    const filteredOrders = getFilteredOrders();
    
    if (filteredOrders.length === 0) {
      alert('No orders match the selected filters');
      return;
    }
    
    exportOrders(filteredOrders, exportFormat, fileName);
    setIsOpen(false);
    
    if (onExport) {
      onExport();
    }
  };
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <Download size={16} className="mr-2" />
        Export Orders
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-300 rounded-md shadow-lg z-10">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Orders</h3>
            
            <div className="space-y-4">
              {/* File name */}
              <div>
                <label htmlFor="file-name" className="block text-sm font-medium text-gray-700 mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  id="file-name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="orders-export"
                />
              </div>
              
              {/* Export format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Export Format
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-primary-600"
                      checked={exportFormat === 'xlsx'}
                      onChange={() => setExportFormat('xlsx')}
                    />
                    <span className="ml-2 flex items-center">
                      <FileSpreadsheet size={16} className="mr-1 text-green-600" />
                      Excel (.xlsx)
                    </span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-primary-600"
                      checked={exportFormat === 'csv'}
                      onChange={() => setExportFormat('csv')}
                    />
                    <span className="ml-2 flex items-center">
                      <FileText size={16} className="mr-1 text-blue-600" />
                      CSV (.csv)
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Filters */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Filter size={16} className="mr-1" />
                  Filter Orders
                </h4>
                
                <div className="space-y-3">
                  {/* Status filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Status
                    </label>
                    <FilterDropdown
                      label="Status"
                      options={STATUS_OPTIONS}
                      value={statusFilter}
                      onChange={setStatusFilter}
                    />
                  </div>
                  
                  {/* Date range filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Range
                    </label>
                    <DateRangePicker
                      value={dateRange}
                      onChange={setDateRange}
                    />
                  </div>
                </div>
              </div>
              
              {/* Order count */}
              <div className="text-sm text-gray-600">
                {getFilteredOrders().length} orders match the selected filters
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderExport;