'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { User, Order } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/format';

interface CustomerLifetimeValueChartProps {
  customer: User;
  orders: Order[];
}

interface ChartData {
  date: string;
  value: number;
  cumulativeValue: number;
}

const CustomerLifetimeValueChart: React.FC<CustomerLifetimeValueChartProps> = ({ customer, orders }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  
  useEffect(() => {
    // Process orders into chart data
    const processOrders = () => {
      if (orders.length === 0) return;
      
      // Sort orders by date
      const sortedOrders = [...orders].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      // Create chart data with cumulative value
      let cumulativeValue = 0;
      const data = sortedOrders.map(order => {
        cumulativeValue += order.total;
        return {
          date: new Date(order.createdAt).toLocaleDateString(),
          value: order.total,
          cumulativeValue
        };
      });
      
      setChartData(data);
    };
    
    processOrders();
  }, [orders]);
  
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-neutral-500 mb-2">No order data available</p>
        <p className="text-sm text-neutral-400">Customer lifetime value will appear here once orders are placed</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-neutral-900">Total Lifetime Value</h3>
          <p className="text-2xl font-bold text-primary-600">{formatCurrency(customer.totalSpent || 0)}</p>
        </div>
        <div>
          <h3 className="text-lg font-medium text-neutral-900">Average Order Value</h3>
          <p className="text-2xl font-bold text-primary-600">
            {formatCurrency(customer.totalOrders ? (customer.totalSpent || 0) / customer.totalOrders : 0)}
          </p>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [formatCurrency(value as number), 'Value']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8884d8" 
              name="Order Value" 
              dot={{ r: 4 }} 
            />
            <Line 
              type="monotone" 
              dataKey="cumulativeValue" 
              stroke="#82ca9d" 
              name="Cumulative Value" 
              dot={{ r: 4 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CustomerLifetimeValueChart;
