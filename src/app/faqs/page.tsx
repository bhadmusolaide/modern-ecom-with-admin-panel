'use client';

import React from 'react';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import Faq from '@/components/sections/Faq';
import { HelpCircle } from 'lucide-react';

export default function FaqPage() {
  const { settings, isLoading } = useSiteSettings();
  const faqItems = settings?.faq?.items || [];
  const faqEnabled = settings?.faq?.enabled ?? false;

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700 mb-4"></div>
          <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-700 rounded mb-3"></div>
          <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!faqEnabled) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <HelpCircle size={48} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">FAQ section is currently disabled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-neutral-900 dark:text-white">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          Find answers to common questions about our products and services
        </p>
      </div>

      {faqItems.length === 0 ? (
        <div className="text-center py-12">
          <HelpCircle size={48} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">No FAQ items available at the moment</p>
        </div>
      ) : (
        <Faq faqItems={faqItems} className="mb-12" />
      )}
    </div>
  );
} 