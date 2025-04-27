'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Order } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/format';

interface PurchaseHistoryChartProps {
  orders: Order[];
}

interface ChartData {
  month: string;
  orders: number;
  amount: number;
}

const PurchaseHistoryChart: React.FC<PurchaseHistoryChartProps> = ({ orders }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  
  useEffect(() => {
    // Process orders into chart data
    const processOrders = () => {
      // Group orders by month
      const monthlyData: Record<string, { orders: number; amount: number }> = {};
      
      // Get the last 12 months
      const today = new Date();
      for (let i = 0; i < 12; i++) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        
        monthlyData[monthKey] = {
          orders: 0,
          amount: 0
        };
      }
      
      // Add order data
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Only include orders from the last 12 months
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].orders += 1;
          monthlyData[monthKey].amount += order.total;
        }
      });
      
      // Convert to array and sort by date
      const chartData = Object.entries(monthlyData)
        .map(([key, data]) => {
          const [year, month] = key.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, 1);
          const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });
          
          return {
            month: monthName,
            monthKey: key,
            orders: data.orders,
            amount: data.amount
          };
        })
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
      
      setChartData(chartData);
    };
    
    processOrders();
  }, [orders]);
  
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-neutral-500 mb-2">No order data available</p>
        <p className="text-sm text-neutral-400">Purchase history will appear here once orders are placed</p>
      </div>
    );
  }
  
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'amount') {
                return [formatCurrency(value as number), 'Amount'];
              }
              return [value, name === 'orders' ? 'Orders' : name];
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="orders" fill="#8884d8" name="Orders" />
          <Bar yAxisId="right" dataKey="amount" fill="#82ca9d" name="Amount" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PurchaseHistoryChart;
