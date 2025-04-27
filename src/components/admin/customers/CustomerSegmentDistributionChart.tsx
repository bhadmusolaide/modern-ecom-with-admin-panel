'use client';

import React, { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CustomerSegment } from '@/lib/types';

interface ChartData {
  name: string;
  value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const CustomerSegmentDistributionChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch segments
        const segmentsRef = collection(db, 'customer-segments');
        const segmentsSnapshot = await getDocs(segmentsRef);
        
        const segments = segmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as CustomerSegment));
        
        // Create chart data
        const data = segments.map(segment => ({
          name: segment.name,
          value: segment.customerCount || 0
        }));
        
        // Add "No Segment" category
        // This would require counting customers with no segments, which is complex
        // For simplicity, we'll just use the segments we have
        
        setChartData(data);
      } catch (error) {
        console.error('Error fetching segment distribution data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
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
        <p className="text-neutral-500">No segment data available</p>
        <p className="text-sm text-neutral-400 mt-2">Create customer segments to see distribution</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} customers`, 'Count']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CustomerSegmentDistributionChart;
