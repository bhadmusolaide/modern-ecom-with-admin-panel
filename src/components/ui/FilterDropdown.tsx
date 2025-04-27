import React from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function FilterDropdown({
  label,
  options,
  value,
  onChange
}: FilterDropdownProps) {
  return (
    <div>
      <label htmlFor={`filter-${label.toLowerCase()}`} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={`filter-${label.toLowerCase()}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}