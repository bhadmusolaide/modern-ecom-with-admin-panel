'use client';

import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: DataPoint[];
  size?: number;
  showLegend?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Simple pie chart component for data visualization
 */
export default function PieChart({
  data,
  size = 200,
  showLegend = true,
  className = '',
  title,
  subtitle
}: PieChartProps) {
  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Default colors if not provided
  const defaultColors = [
    '#7c3aed', // primary-500
    '#059669', // secondary-500
    '#f59e0b', // accent-500
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#f97316', // amber-500
    '#ef4444', // red-500
    '#8b5cf6'  // purple-500
  ];

  // Calculate segments for the pie chart
  let startAngle = 0;
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const degrees = (percentage / 100) * 360;
    const color = item.color || defaultColors[index % defaultColors.length];
    
    // Calculate SVG arc path
    const endAngle = startAngle + degrees;
    const largeArcFlag = degrees > 180 ? 1 : 0;
    
    // Calculate coordinates on the circle
    const startX = Math.cos((startAngle - 90) * (Math.PI / 180)) * 100 + 100;
    const startY = Math.sin((startAngle - 90) * (Math.PI / 180)) * 100 + 100;
    const endX = Math.cos((endAngle - 90) * (Math.PI / 180)) * 100 + 100;
    const endY = Math.sin((endAngle - 90) * (Math.PI / 180)) * 100 + 100;
    
    // Create SVG path
    const path = `M 100 100 L ${startX} ${startY} A 100 100 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
    
    // Store the current end angle as the next start angle
    const currentStartAngle = startAngle;
    startAngle = endAngle;
    
    return {
      path,
      color,
      percentage,
      label: item.label,
      value: item.value,
      startAngle: currentStartAngle
    };
  });

  return (
    <div className={`w-full ${className}`}>
      {/* Chart title and subtitle */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>}
          {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row items-center">
        {/* SVG Pie Chart */}
        <div style={{ width: `${size}px`, height: `${size}px` }}>
          <svg viewBox="0 0 200 200" width={size} height={size}>
            {segments.map((segment, index) => (
              <path
                key={index}
                d={segment.path}
                fill={segment.color}
                stroke="#ffffff"
                strokeWidth="1"
                className="transition-all duration-300 hover:opacity-90"
              />
            ))}
            {/* Optional: Add a circle in the middle for a donut chart */}
            {/* <circle cx="100" cy="100" r="60" fill="white" /> */}
          </svg>
        </div>
        
        {/* Legend */}
        {showLegend && (
          <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-sm mr-2" 
                  style={{ backgroundColor: segment.color }}
                ></div>
                <span className="text-sm text-neutral-700">{segment.label}</span>
                <span className="text-sm text-neutral-500 ml-2">
                  {segment.percentage.toFixed(1)}% ({segment.value})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}