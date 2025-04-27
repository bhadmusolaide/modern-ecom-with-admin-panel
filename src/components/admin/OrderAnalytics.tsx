'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Order, OrderStatus } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

// Custom colors for charts
const COLORS = ['#7c3aed', '#059669', '#d97706', '#ef4444', '#3b82f6', '#ec4899'];

interface OrderAnalyticsProps {
  orders: Order[];
  dateRange: { from?: Date; to?: Date };
}

interface OrderMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  statusDistribution: Record<string, number>;
  revenueByDay: { date: string; revenue: number }[];
  ordersByDay: { date: string; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

const OrderAnalytics: React.FC<OrderAnalyticsProps> = ({ orders, dateRange }) => {
  const [metrics, setMetrics] = useState<OrderMetrics>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    statusDistribution: {},
    revenueByDay: [],
    ordersByDay: [],
    topProducts: []
  });

  // Calculate metrics when orders or date range changes
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    // Calculate total orders and revenue
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalRevenue / totalOrders;

    // Calculate status distribution
    const statusDistribution: Record<string, number> = {};
    orders.forEach(order => {
      statusDistribution[order.status] = (statusDistribution[order.status] || 0) + 1;
    });

    // Group orders by day for revenue and order count
    const ordersByDate: Record<string, { revenue: number; count: number }> = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!ordersByDate[date]) {
        ordersByDate[date] = { revenue: 0, count: 0 };
      }
      ordersByDate[date].revenue += order.total;
      ordersByDate[date].count += 1;
    });

    // Convert to arrays for charts
    const revenueByDay = Object.entries(ordersByDate)
      .map(([date, data]) => ({ date, revenue: data.revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const ordersByDay = Object.entries(ordersByDate)
      .map(([date, data]) => ({ date, orders: data.count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate top products
    const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productMap[item.productId]) {
          productMap[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productMap[item.productId].quantity += item.quantity;
        productMap[item.productId].revenue += item.subtotal;
      });
    });

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setMetrics({
      totalOrders,
      totalRevenue,
      averageOrderValue,
      statusDistribution,
      revenueByDay,
      ordersByDay,
      topProducts
    });
  }, [orders]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Custom tooltip for revenue chart
  const RevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-primary-600">
            Revenue: {formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for order status chart
  const StatusTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium capitalize">{payload[0].name}</p>
          <p className="text-primary-600">
            Orders: {payload[0].value} ({((payload[0].value / metrics.totalOrders) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Status labels for better display
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      [OrderStatus.PENDING]: 'Pending',
      [OrderStatus.PROCESSING]: 'Processing',
      [OrderStatus.SHIPPED]: 'Shipped',
      [OrderStatus.DELIVERED]: 'Delivered',
      [OrderStatus.CANCELLED]: 'Cancelled',
      [OrderStatus.REFUNDED]: 'Refunded',
      [OrderStatus.ON_HOLD]: 'On Hold',
      [OrderStatus.BACKORDERED]: 'Backordered'
    };
    return labels[status] || status;
  };

  // Prepare data for status pie chart
  const statusData = Object.entries(metrics.statusDistribution).map(([status, count]) => ({
    name: status,
    value: count,
    label: getStatusLabel(status)
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Order Analytics</h2>
      
      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
          <h3 className="text-sm font-medium text-primary-600 mb-1">Total Orders</h3>
          <p className="text-2xl font-bold text-primary-900">{metrics.totalOrders}</p>
        </div>
        
        <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-100">
          <h3 className="text-sm font-medium text-secondary-600 mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-secondary-900">{formatPrice(metrics.totalRevenue)}</p>
        </div>
        
        <div className="bg-accent-50 rounded-lg p-4 border border-accent-100">
          <h3 className="text-sm font-medium text-accent-600 mb-1">Average Order Value</h3>
          <p className="text-2xl font-bold text-accent-900">{formatPrice(metrics.averageOrderValue)}</p>
        </div>
      </div>
      
      {/* Revenue over time chart */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Revenue Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={metrics.revenueByDay}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `$${value}`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#7c3aed" 
                fill="#7c3aed" 
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Order status distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-medium mb-4">Order Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="label"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<StatusTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Orders Per Day</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.ordersByDay}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Top products */}
      <div>
        <h3 className="text-lg font-medium mb-4">Top Products by Revenue</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics.topProducts}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${value}`} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                width={150}
              />
              <Tooltip 
                formatter={(value) => [`$${value}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OrderAnalytics;