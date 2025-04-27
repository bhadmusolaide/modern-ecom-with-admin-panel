import React from 'react';
import { OrderStatus, PaymentStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  let bgColor = '';
  let textColor = '';
  
  // Determine colors based on status
  switch (status) {
    case OrderStatus.PENDING:
    case PaymentStatus.PENDING:
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
    case OrderStatus.PROCESSING:
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
    case OrderStatus.SHIPPED:
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      break;
    case OrderStatus.DELIVERED:
    case PaymentStatus.PAID:
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case OrderStatus.CANCELLED:
    case PaymentStatus.FAILED:
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    case OrderStatus.REFUNDED:
    case PaymentStatus.REFUNDED:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {status}
    </span>
  );
}