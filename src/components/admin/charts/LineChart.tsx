'use client';

import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  showPoints?: boolean;
  showLabels?: boolean;
  showGrid?: boolean;
  maxValue?: number;
  className?: string;
  title?: string;
  subtitle?: string;
  color?: string;
  comparisonData?: DataPoint[];
  comparisonColor?: string;
}

/**
 * Simple line chart component for data visualization
 */
export default function LineChart({
  data,
  height = 200,
  showPoints = true,
  showLabels = true,
  showGrid = true,
  maxValue,
  className = '',
  title,
  subtitle,
  color = '#7c3aed', // primary-500
  comparisonData,
  comparisonColor = '#059669' // secondary-500
}: LineChartProps) {
  // Calculate the maximum value for scaling
  const allValues = [...data.map(item => item.value)];
  if (comparisonData) {
    allValues.push(...comparisonData.map(item => item.value));
  }
  const calculatedMax = maxValue || Math.max(...allValues) * 1.1;
  
  // Generate SVG path for the line
  const generatePath = (chartData: DataPoint[]) => {
    if (chartData.length === 0) return '';
    
    const width = 100 / (chartData.length - 1);
    
    return chartData.map((point, index) => {
      const x = index * width;
      const y = 100 - ((point.value / calculatedMax) * 100);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Generate points for the chart
  const generatePoints = (chartData: DataPoint[]) => {
    if (!showPoints) return null;
    
    const width = 100 / (chartData.length - 1);
    
    return chartData.map((point, index) => {
      const x = index * width;
      const y = 100 - ((point.value / calculatedMax) * 100);
      
      return (
        <circle
          key={index}
          cx={`${x}%`}
          cy={`${y}%`}
          r="4"
          className="transition-all duration-300 hover:r-6"
        />
      );
    });
  };

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
        {/* SVG Chart */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Optional grid lines */}
          {showGrid && (
            <>
              <line x1="0" y1="0" x2="100" y2="0" stroke="#f3f4f6" strokeWidth="0.5" />
              <line x1="0" y1="25" x2="100" y2="25" stroke="#f3f4f6" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#f3f4f6" strokeWidth="0.5" />
              <line x1="0" y1="75" x2="100" y2="75" stroke="#f3f4f6" strokeWidth="0.5" />
              <line x1="0" y1="100" x2="100" y2="100" stroke="#f3f4f6" strokeWidth="0.5" />
            </>
          )}
          
          {/* Comparison data line if provided */}
          {comparisonData && (
            <>
              <path
                d={generatePath(comparisonData)}
                fill="none"
                stroke={comparisonColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="5,5"
                className="transition-all duration-500"
              />
              <g fill={comparisonColor}>
                {generatePoints(comparisonData)}
              </g>
            </>
          )}
          
          {/* Main data line */}
          <path
            d={generatePath(data)}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />
          
          {/* Data points */}
          <g fill={color}>
            {generatePoints(data)}
          </g>
        </svg>
        
        {/* X-axis labels */}
        {showLabels && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-between mt-2">
            {data.map((item, index) => (
              <div 
                key={index} 
                className="text-xs text-neutral-500 text-center"
                style={{ 
                  width: `${100 / data.length}%`,
                  transform: index === 0 ? 'translateX(50%)' : 
                            index === data.length - 1 ? 'translateX(-50%)' : 'translateX(0)'
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Legend if comparison data is provided */}
      {comparisonData && (
        <div className="flex items-center justify-center mt-4 space-x-6">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></div>
            <span className="text-xs text-neutral-700">Current Period</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: comparisonColor }}></div>
            <span className="text-xs text-neutral-700">Previous Period</span>
          </div>
        </div>
      )}
    </div>
  );
}