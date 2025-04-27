'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FaqItem } from '@/lib/context/SiteSettingsContext';

interface FaqProps {
  faqItems: FaqItem[];
  className?: string;
}

const Faq: React.FC<FaqProps> = ({ faqItems, className = '' }) => {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const handleToggleExpand = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  if (!faqItems?.length) {
    return null;
  }

  return (
    <div className={`max-w-3xl mx-auto ${className}`}>
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <div 
            key={index} 
            className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-900"
          >
            <button
              className="w-full p-4 flex items-center justify-between text-left font-medium text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              onClick={() => handleToggleExpand(index)}
              aria-expanded={expandedItem === index}
            >
              <span className="flex-grow pr-4">{item.question}</span>
              {expandedItem === index ? (
                <ChevronUp className="flex-shrink-0 text-primary w-5 h-5" />
              ) : (
                <ChevronDown className="flex-shrink-0 text-neutral-500 w-5 h-5" />
              )}
            </button>
            <AnimatePresence>
              {expandedItem === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                    <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                      {item.answer}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Faq; 