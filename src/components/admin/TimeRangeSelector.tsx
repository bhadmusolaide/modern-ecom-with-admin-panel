'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { TimeRange } from '@/lib/context/DashboardContext';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  className?: string;
  size?: 'sm' | 'md';
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ 
  value, 
  onChange, 
  className = '',
  size = 'md'
}) => {
  const options: { value: TimeRange; label: string }[] = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-1.5 px-3'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <Clock size={size === 'sm' ? 14 : 16} className="mr-1.5 text-neutral-500" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TimeRange)}
        className={`border rounded-md ${sizeClasses[size]} pr-8 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-neutral-700`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TimeRangeSelector;