'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRangePickerProps {
  onChange: (range: { from?: Date; to?: Date }) => void;
  value: { from?: Date; to?: Date };
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onChange, value }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fromDate, setFromDate] = useState<string>(value.from ? formatDateForInput(value.from) : '');
  const [toDate, setToDate] = useState<string>(value.to ? formatDateForInput(value.to) : '');

  // Format date for input field (YYYY-MM-DD)
  function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Format date for display
  function formatDateForDisplay(dateStr?: Date): string {
    if (!dateStr) return 'Any date';
    return dateStr.toLocaleDateString();
  }

  // Handle from date change
  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setFromDate(newDate);
    
    if (newDate) {
      onChange({
        from: new Date(newDate),
        to: value.to
      });
    } else {
      onChange({
        from: undefined,
        to: value.to
      });
    }
  };

  // Handle to date change
  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setToDate(newDate);
    
    if (newDate) {
      onChange({
        from: value.from,
        to: new Date(newDate)
      });
    } else {
      onChange({
        from: value.from,
        to: undefined
      });
    }
  };

  // Clear date range
  const handleClear = () => {
    setFromDate('');
    setToDate('');
    onChange({ from: undefined, to: undefined });
    setIsOpen(false);
  };

  // Apply date range
  const handleApply = () => {
    setIsOpen(false);
  };

  // Get display text
  const getDisplayText = () => {
    if (value.from && value.to) {
      return `${formatDateForDisplay(value.from)} - ${formatDateForDisplay(value.to)}`;
    } else if (value.from) {
      return `From ${formatDateForDisplay(value.from)}`;
    } else if (value.to) {
      return `Until ${formatDateForDisplay(value.to)}`;
    }
    return 'Select date range';
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <Calendar size={16} className="mr-2 text-gray-500" />
          <span>{getDisplayText()}</span>
        </div>
        <ChevronDown size={16} className="ml-2 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="from-date" className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <input
                type="date"
                id="from-date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={fromDate}
                onChange={handleFromDateChange}
                max={toDate || undefined}
              />
            </div>
            
            <div>
              <label htmlFor="to-date" className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="date"
                id="to-date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={toDate}
                onChange={handleToDateChange}
                min={fromDate || undefined}
              />
            </div>
            
            <div className="flex justify-between pt-2">
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-900"
                onClick={handleClear}
              >
                Clear
              </button>
              
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={handleApply}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;