import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Order, OrderStatus, PaymentStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';

/**
 * Formats an order for export
 * @param order Order object
 * @returns Flattened order object for export
 */
export const formatOrderForExport = (order: Order) => {
  // Format shipping address
  const shippingAddress = order.shippingAddress;
  const formattedShippingAddress = `${shippingAddress.firstName} ${shippingAddress.lastName}, ${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state || ''} ${shippingAddress.postalCode}, ${shippingAddress.country}`;
  
  // Format billing address if different
  let formattedBillingAddress = '';
  if (order.billingAddress) {
    const billingAddress = order.billingAddress;
    formattedBillingAddress = `${billingAddress.firstName} ${billingAddress.lastName}, ${billingAddress.address}, ${billingAddress.city}, ${billingAddress.state || ''} ${billingAddress.postalCode}, ${billingAddress.country}`;
  } else {
    formattedBillingAddress = formattedShippingAddress;
  }
  
  // Format items
  const itemsList = order.items.map(item => 
    `${item.name} (${item.quantity} x ${(item.price / 100).toFixed(2)})`
  ).join('; ');
  
  // Format tracking info
  const trackingInfo = order.trackingInfo 
    ? `${order.trackingInfo.carrier}: ${order.trackingInfo.trackingNumber}` 
    : 'Not available';
  
  // Format payment info
  const paymentInfo = `${order.payment.method} - ${order.payment.status}`;
  
  // Format status with proper capitalization
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };
  
  // Return formatted order
  return {
    'Order Number': order.orderNumber,
    'Date': formatDate(order.createdAt),
    'Status': formatStatus(order.status),
    'Customer Name': order.customerName,
    'Email': order.email,
    'Items': itemsList,
    'Subtotal': (order.subtotal / 100).toFixed(2),
    'Shipping': (order.shippingCost / 100).toFixed(2),
    'Tax': (order.tax / 100).toFixed(2),
    'Discount': order.discount ? (order.discount / 100).toFixed(2) : '0.00',
    'Total': (order.total / 100).toFixed(2),
    'Payment Method': paymentInfo,
    'Shipping Method': order.shippingMethod.name,
    'Shipping Address': formattedShippingAddress,
    'Billing Address': formattedBillingAddress,
    'Tracking Information': trackingInfo,
    'Notes': order.notes ? order.notes.map(note => note.message).join('; ') : '',
    'Created At': new Date(order.createdAt).toLocaleString(),
    'Updated At': new Date(order.updatedAt).toLocaleString()
  };
};

/**
 * Exports orders to Excel file
 * @param orders Array of orders to export
 * @param fileName Name of the export file
 */
export const exportOrdersToExcel = (orders: Order[], fileName: string = 'orders-export') => {
  // Format orders for export
  const formattedOrders = orders.map(formatOrderForExport);
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(formattedOrders);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Save file
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(data, `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Exports orders to CSV file
 * @param orders Array of orders to export
 * @param fileName Name of the export file
 */
export const exportOrdersToCSV = (orders: Order[], fileName: string = 'orders-export') => {
  // Format orders for export
  const formattedOrders = orders.map(formatOrderForExport);
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(formattedOrders);
  
  // Generate CSV content
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  
  // Save file
  const data = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(data, `${fileName}-${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Exports orders to specified format
 * @param orders Array of orders to export
 * @param format Export format ('xlsx' or 'csv')
 * @param fileName Name of the export file
 */
export const exportOrders = (orders: Order[], format: 'xlsx' | 'csv' = 'xlsx', fileName: string = 'orders-export') => {
  if (format === 'xlsx') {
    exportOrdersToExcel(orders, fileName);
  } else {
    exportOrdersToCSV(orders, fileName);
  }
};