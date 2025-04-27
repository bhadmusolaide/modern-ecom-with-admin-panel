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
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserRole } from '@/lib/types';

interface CustomerRetentionChartProps {
  timeRange: string;
}

interface ChartData {
  month: string;
  newCustomers: number;
  returningCustomers: number;
  retentionRate: number;
}

const CustomerRetentionChart: React.FC<CustomerRetentionChartProps> = ({ timeRange }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Calculate start date based on time range
        const startDate = new Date();
        let monthsToShow = 6;

        switch (timeRange) {
          case '7days':
          case '30days':
            monthsToShow = 6;
            break;
          case '90days':
            monthsToShow = 6;
            break;
          case 'year':
            monthsToShow = 12;
            break;
          case 'all':
            monthsToShow = 24;
            break;
          default:
            monthsToShow = 6;
        }

        startDate.setMonth(startDate.getMonth() - monthsToShow);

        // Query the database for actual retention data
        const usersRef = collection(db, 'users');
        const ordersRef = collection(db, 'orders');

        // Get all users
        const usersSnapshot = await getDocs(usersRef);
        const users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Get orders within the time range
        const ordersQuery = query(
          ordersRef,
          where('createdAt', '>=', startDate)
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Prepare data structure for months
        const data: ChartData[] = [];
        const today = new Date();

        // Create month entries
        for (let i = 0; i < monthsToShow; i++) {
          const date = new Date(today);
          date.setMonth(today.getMonth() - i);
          const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });

          data.unshift({
            month: monthName,
            newCustomers: 0,
            returningCustomers: 0,
            retentionRate: 0
          });
        }

        // Track customer first purchase and subsequent purchases
        const customerPurchases = {};

        // Process orders to identify new vs returning customers
        orders.forEach(order => {
          if (!order.userId || !order.createdAt) return;

          const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
          const monthIndex = monthsToShow - 1 - Math.floor((today.getTime() - orderDate.getTime()) / (30 * 24 * 60 * 60 * 1000));

          if (monthIndex < 0 || monthIndex >= monthsToShow) return; // Skip if outside our range

          if (!customerPurchases[order.userId]) {
            // First purchase - new customer
            customerPurchases[order.userId] = {
              firstPurchaseDate: orderDate,
              purchases: [orderDate]
            };
            data[monthIndex].newCustomers++;
          } else {
            // Returning customer
            customerPurchases[order.userId].purchases.push(orderDate);
            data[monthIndex].returningCustomers++;
          }
        });

        // Calculate retention rates
        data.forEach(month => {
          const totalCustomers = month.newCustomers + month.returningCustomers;
          month.retentionRate = totalCustomers > 0
            ? (month.returningCustomers / totalCustomers) * 100
            : 0;
        });

        setChartData(data);
      } catch (error) {
        console.error('Error fetching customer retention data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-neutral-500">No customer retention data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'retentionRate') {
              return [`${value.toFixed(1)}%`, 'Retention Rate'];
            }
            return [value, name === 'newCustomers' ? 'New Customers' : 'Returning Customers'];
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="newCustomers"
          stroke="#8884d8"
          name="New Customers"
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="returningCustomers"
          stroke="#82ca9d"
          name="Returning Customers"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="retentionRate"
          stroke="#ff7300"
          name="Retention Rate (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CustomerRetentionChart;
