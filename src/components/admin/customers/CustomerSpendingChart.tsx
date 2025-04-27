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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { formatCurrency } from '@/lib/utils/format';

interface CustomerSpendingChartProps {
  timeRange: string;
}

interface ChartData {
  range: string;
  customers: number;
}

const CustomerSpendingChart: React.FC<CustomerSpendingChartProps> = ({ timeRange }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Query customers
        const customersRef = collection(db, 'users');
        const customersSnapshot = await getDocs(customersRef);
        
        // Group customers by spending range
        const spendingRanges = [
          { min: 0, max: 50, label: '$0-$50' },
          { min: 50, max: 100, label: '$50-$100' },
          { min: 100, max: 250, label: '$100-$250' },
          { min: 250, max: 500, label: '$250-$500' },
          { min: 500, max: 1000, label: '$500-$1000' },
          { min: 1000, max: Infinity, label: '$1000+' }
        ];
        
        const rangeData: Record<string, number> = {};
        spendingRanges.forEach(range => {
          rangeData[range.label] = 0;
        });
        
        customersSnapshot.docs.forEach(doc => {
          const totalSpent = doc.data().totalSpent || 0;
          
          // Find the appropriate range
          const range = spendingRanges.find(
            range => totalSpent >= range.min && totalSpent < range.max
          );
          
          if (range) {
            rangeData[range.label]++;
          }
        });
        
        // Convert to chart data
        const data = Object.entries(rangeData).map(([range, customers]) => ({
          range,
          customers
        }));
        
        setChartData(data);
      } catch (error) {
        console.error('Error fetching customer spending data:', error);
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
        <p className="text-neutral-500">No customer spending data available</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="range" />
        <YAxis />
        <Tooltip formatter={(value) => [`${value} customers`, 'Count']} />
        <Legend />
        <Bar dataKey="customers" fill="#8884d8" name="Customers" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CustomerSpendingChart;
