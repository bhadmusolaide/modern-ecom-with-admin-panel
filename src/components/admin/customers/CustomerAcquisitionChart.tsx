'use client';

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserRole } from '@/lib/types';

interface CustomerAcquisitionChartProps {
  timeRange: string;
}

interface ChartData {
  date: string;
  count: number;
  cumulativeCount: number;
}

const CustomerAcquisitionChart: React.FC<CustomerAcquisitionChartProps> = ({ timeRange }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Calculate start date based on time range
        const startDate = new Date();
        switch (timeRange) {
          case '7days':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(startDate.getDate() - 90);
            break;
          case 'year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          case 'all':
            // No start date filter for all time
            break;
          default:
            startDate.setDate(startDate.getDate() - 30);
        }
        
        // Query customers
        const customersRef = collection(db, 'users');
        let customersQuery = query(
          customersRef,
          where('role', '==', UserRole.CUSTOMER),
          orderBy('createdAt', 'asc')
        );
        
        // Add date filter if not "all time"
        if (timeRange !== 'all') {
          customersQuery = query(
            customersQuery,
            where('createdAt', '>=', startDate)
          );
        }
        
        const snapshot = await getDocs(customersQuery);
        
        // Group customers by date
        const dateGroups: Record<string, number> = {};
        
        snapshot.docs.forEach(doc => {
          const createdAt = doc.data().createdAt?.toDate();
          if (createdAt) {
            const dateKey = createdAt.toISOString().split('T')[0];
            dateGroups[dateKey] = (dateGroups[dateKey] || 0) + 1;
          }
        });
        
        // Create chart data with cumulative count
        let cumulativeCount = 0;
        const data = Object.entries(dateGroups)
          .map(([date, count]) => {
            cumulativeCount += count;
            return {
              date: new Date(date).toLocaleDateString(),
              count,
              cumulativeCount
            };
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setChartData(data);
      } catch (error) {
        console.error('Error fetching customer acquisition data:', error);
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
        <p className="text-neutral-500">No customer acquisition data available</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Area 
          type="monotone" 
          dataKey="count" 
          stackId="1"
          stroke="#8884d8" 
          fill="#8884d8" 
          name="New Customers" 
        />
        <Area 
          type="monotone" 
          dataKey="cumulativeCount" 
          stackId="2"
          stroke="#82ca9d" 
          fill="#82ca9d" 
          name="Total Customers" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default CustomerAcquisitionChart;
