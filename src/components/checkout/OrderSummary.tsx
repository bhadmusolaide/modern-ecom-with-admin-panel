'use client';

import React from 'react';
import Image from 'next/image';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface OrderSummaryProps {
  order: Order;
}

/**
 * Order Summary Component
 * 
 * This component displays a summary of the order during checkout.
 */
const OrderSummary: React.FC<OrderSummaryProps> = ({ order }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
      
      {/* Order items */}
      <div className="space-y-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start">
            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden relative">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="ml-4 flex-1">
              <div className="flex justify-between">
                <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                <p className="text-sm font-medium text-gray-900">{formatPrice(item.subtotal)}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Qty: {item.quantity}
                {item.selectedColor && ` • ${item.selectedColor}`}
                {item.selectedSize && ` • ${item.selectedSize}`}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Divider */}
      <div className="border-t border-gray-200 pt-4">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <p className="text-gray-500">Subtotal</p>
          <p className="text-gray-900 font-medium">{formatPrice(order.subtotal)}</p>
        </div>
        
        {/* Shipping */}
        <div className="flex justify-between text-sm mt-2">
          <p className="text-gray-500">Shipping ({order.shippingMethod.name})</p>
          <p className="text-gray-900 font-medium">{formatPrice(order.shippingCost)}</p>
        </div>
        
        {/* Tax */}
        <div className="flex justify-between text-sm mt-2">
          <p className="text-gray-500">Tax</p>
          <p className="text-gray-900 font-medium">{formatPrice(order.tax)}</p>
        </div>
        
        {/* Discount */}
        {order.discount && order.discount > 0 && (
          <div className="flex justify-between text-sm mt-2">
            <p className="text-gray-500">Discount</p>
            <p className="text-green-600 font-medium">-{formatPrice(order.discount)}</p>
          </div>
        )}
        
        {/* Total */}
        <div className="flex justify-between text-base font-medium mt-4 pt-4 border-t border-gray-200">
          <p className="text-gray-900">Total</p>
          <p className="text-gray-900">{formatPrice(order.total)}</p>
        </div>
      </div>
      
      {/* Order details */}
      <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
        <p className="text-gray-500">
          <span className="font-medium text-gray-900">Order Number:</span> {order.orderNumber}
        </p>
        <p className="text-gray-500">
          <span className="font-medium text-gray-900">Shipping Address:</span>{' '}
          {`${order.shippingAddress.firstName} ${order.shippingAddress.lastName}, ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state || ''} ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`}
        </p>
        <p className="text-gray-500">
          <span className="font-medium text-gray-900">Email:</span> {order.email}
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;