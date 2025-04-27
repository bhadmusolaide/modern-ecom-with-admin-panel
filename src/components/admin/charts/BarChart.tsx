'use client';

import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataPoint[];
  height?: number;
  showValues?: boolean;
  showLabels?: boolean;
  maxValue?: number;
  className?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Simple bar chart component for data visualization
 */
export default function BarChart({
  data,
  height = 200,
  showValues = true,
  showLabels = true,
  maxValue,
  className = '',
  title,
  subtitle
}: BarChartProps) {
  // Calculate the maximum value for scaling
  const calculatedMax = maxValue || Math.max(...data.map(item => item.value)) * 1.1;
  
  // Default colors if not provided
  const defaultColors = [
    'bg-primary-500',
    'bg-secondary-500',
    'bg-accent-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-red-500',
    'bg-purple-500'
  ];

  return (
    <div className={`w-full ${className}`}>
      {/* Chart title and subtitle */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>}
          {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
        </div>
      )}
      
      {/* Chart container */}
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Bars */}
        <div className="flex items-end justify-between h-full">
          {data.map((item, index) => {
            const barHeight = (item.value / calculatedMax) * 100;
            const barColor = item.color || defaultColors[index % defaultColors.length];
            
            return (
              <div 
                key={item.label} 
                className="flex flex-col items-center justify-end flex-1 px-1"
              >
                {/* Value label on top */}
                {showValues && (
                  <div className="text-xs font-medium text-neutral-700 mb-1">
                    {item.value}
                  </div>
                )}
                
                {/* Bar */}
                <div 
                  className={`w-full rounded-t-sm ${barColor} transition-all duration-500 ease-out`}
                  style={{ 
                    height: `${barHeight}%`,
                    minHeight: '4px' // Ensure very small values are still visible
                  }}
                ></div>
                
                {/* X-axis label */}
                {showLabels && (
                  <div className="text-xs text-neutral-500 mt-1 truncate w-full text-center">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className="border-t border-neutral-100 w-full"
              style={{ height: '25%' }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}