'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import DynamicHomepage from '@/components/sections/DynamicHomepage';
import Hero from '@/components/sections/Hero';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import Categories from '@/components/sections/Categories';
import About from '@/components/sections/About';
import Testimonials from '@/components/sections/Testimonials';
import Newsletter from '@/components/sections/Newsletter';

export default function HomePage() {
  const { settings, isLoading, error, refreshSettings } = useSiteSettings();

  useEffect(() => {
    // Force refresh settings on page load
    refreshSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      console.log('Homepage Settings:', settings);
      console.log('Homepage Sections:', settings?.homepageSections);
    }
    if (error) {
      console.error('Error loading settings:', error);
    }
  }, [settings, error]);

  // Even if settings failed to load, we'll show the homepage with fallback content
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // This function is no longer needed as it requires admin authentication
  const handleResetHomepage = async () => {
    console.log('Reset homepage functionality requires admin authentication');
    refreshSettings();
  };

  return (
    <div className="min-h-screen">
      {/* Reset button removed as it requires admin authentication */}
      <Suspense fallback={<HomepageFallback />}>
        <DynamicHomepage />
      </Suspense>
    </div>
  );
}

// Fallback component to show while loading
function HomepageFallback() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <Categories />
      <About />
      <Testimonials />
      <Newsletter />
    </>
  );
}
