'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, ExternalLink, Smartphone, Monitor, Tablet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreviewPanelProps {
  children: React.ReactNode;
  title?: string;
  defaultOpen?: boolean;
  defaultDevice?: 'desktop' | 'tablet' | 'mobile';
}

export default function PreviewPanel({
  children,
  title = 'Preview',
  defaultOpen = false,
  defaultDevice = 'desktop'
}: PreviewPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>(defaultDevice);

  const deviceWidths = {
    desktop: 'w-full',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]'
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
        <h3 className="font-medium text-neutral-800 dark:text-white flex items-center">
          {title}
        </h3>
        <div className="flex items-center space-x-2">
          {isOpen && (
            <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-md overflow-hidden">
              <button
                onClick={() => setDevice('mobile')}
                className={`p-2 ${
                  device === 'mobile'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-primary'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
                aria-label="Mobile preview"
              >
                <Smartphone size={16} />
              </button>
              <button
                onClick={() => setDevice('tablet')}
                className={`p-2 ${
                  device === 'tablet'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-primary'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
                aria-label="Tablet preview"
              >
                <Tablet size={16} />
              </button>
              <button
                onClick={() => setDevice('desktop')}
                className={`p-2 ${
                  device === 'desktop'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-primary'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
                aria-label="Desktop preview"
              >
                <Monitor size={16} />
              </button>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            aria-label={isOpen ? 'Hide preview' : 'Show preview'}
          >
            {isOpen ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 overflow-x-auto">
              <div className={`mx-auto ${deviceWidths[device]} transition-all duration-300`}>
                <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md overflow-hidden">
                  {children}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
