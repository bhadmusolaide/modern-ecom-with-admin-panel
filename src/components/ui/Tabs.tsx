'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'text-xs py-1.5 px-2',
    md: 'text-sm py-2 px-3',
    lg: 'text-base py-2.5 px-4',
  };

  // Variant classes
  const getVariantClasses = (isActive: boolean) => {
    switch (variant) {
      case 'pills':
        return isActive
          ? 'bg-primary-600 text-white rounded-md shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md';
      case 'underline':
        return isActive
          ? 'text-primary-600 border-b-2 border-primary-600'
          : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300';
      default:
        return isActive
          ? 'text-primary-600 border-b-2 border-primary-600'
          : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent';
    }
  };

  return (
    <div className={`${className}`}>
      <div className={`flex ${variant === 'underline' ? 'border-b border-gray-200' : ''} ${fullWidth ? 'w-full' : ''}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={`
              relative flex items-center ${sizeClasses[size]} font-medium transition-colors
              ${getVariantClasses(activeTab === tab.id)}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${fullWidth ? 'flex-1 justify-center' : 'mr-2'}
            `}
            disabled={tab.disabled}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
            
            {variant === 'default' && activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
