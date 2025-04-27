'use client';

import React from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date | null;
  errorMessage?: string | null;
  className?: string;
}

const FormStatusIndicator: React.FC<FormStatusIndicatorProps> = ({
  status,
  lastSaved,
  errorMessage,
  className = '',
}) => {
  // Format the last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    } else {
      return lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };
  
  // Status-specific content
  const renderStatusContent = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center text-blue-600">
            <Loader2 size={16} className="mr-2 animate-spin" />
            <span>Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center text-green-600">
            <Check size={16} className="mr-2" />
            <span>Saved {lastSaved ? formatLastSaved() : ''}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-red-600">
            <AlertCircle size={16} className="mr-2" />
            <span>{errorMessage || 'Error saving'}</span>
          </div>
        );
      default:
        return lastSaved ? (
          <div className="flex items-center text-gray-500">
            <span>Last saved {formatLastSaved()}</span>
          </div>
        ) : null;
    }
  };
  
  return (
    <div className={`text-sm ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {renderStatusContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FormStatusIndicator;
