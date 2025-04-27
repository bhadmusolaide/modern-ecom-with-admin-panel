'use client';

import React, { useEffect, useState } from 'react';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import DynamicSection from './DynamicSection';
import { SiteSection } from '@/lib/data/siteSettings';

const DynamicHomepage: React.FC = () => {
  const { settings, isLoading, error } = useSiteSettings();
  const [sections, setSections] = useState<SiteSection[]>([]);

  useEffect(() => {
    console.log('Site settings state:', { settings, isLoading, error });
    if (!isLoading && settings) {
      console.log('Full settings object:', settings);

      if (settings.homepageSections && Array.isArray(settings.homepageSections)) {
        console.log('Homepage sections found:', settings.homepageSections);
        // Sort sections by order
        const sortedSections = [...settings.homepageSections].sort((a, b) => a.order - b.order);
        console.log('Sorted sections:', sortedSections);
        setSections(sortedSections);
      } else {
        console.error('Homepage sections missing or not an array:', settings.homepageSections);
        // Use default sections from the DEFAULT_HOMEPAGE_SECTIONS import
        import('@/lib/data/siteSettings').then(({ DEFAULT_HOMEPAGE_SECTIONS }) => {
          console.log('Using default homepage sections');
          setSections(DEFAULT_HOMEPAGE_SECTIONS);
        });
      }
    } else if (error) {
      console.error('Error loading site settings:', error);
      // Use default sections when there's an error
      import('@/lib/data/siteSettings').then(({ DEFAULT_HOMEPAGE_SECTIONS }) => {
        console.log('Using default homepage sections due to error');
        setSections(DEFAULT_HOMEPAGE_SECTIONS);
      });
    }
  }, [settings, isLoading, error]);

  // If there's an error but we have sections from default, continue rendering
  if (error && sections.length === 0) {
    console.error('Error loading site settings:', error);
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Our Store</h2>
        <p className="text-gray-700">
          Discover our latest collections and featured products.
        </p>
      </div>
    );
  }

  // If no sections are found and we're not loading, show default message
  if (!isLoading && (!sections || sections.length === 0)) {
    console.log('No sections found:', { isLoading, sections });
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Our Store</h2>
        <p className="text-gray-700">
          Discover our latest collections and featured products.
        </p>
      </div>
    );
  }

  console.log('Rendering sections:', sections);

  // Filter out only enabled sections
  const enabledSections = sections.filter(section => section.enabled);
  console.log('Enabled sections:', enabledSections);

  if (enabledSections.length === 0) {
    console.log('No enabled sections found');
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Our Store</h2>
        <p className="text-gray-700 mb-8">
          Discover our latest collections and featured products.
        </p>
      </div>
    );
  }

  return (
    <div className="homepage-sections">
      {enabledSections.map((section) => (
        <DynamicSection key={section.id} section={section} />
      ))}
    </div>
  );
};

export default DynamicHomepage;
