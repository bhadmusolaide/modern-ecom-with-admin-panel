'use client';

import React from 'react';
import { SiteSection } from '@/lib/data/siteSettings';
import Hero from './Hero';
import FeaturedProducts from './FeaturedProducts';
import Categories from './Categories';
import About from './About';
import Testimonials from './Testimonials';
import Newsletter from './Newsletter';
import Banner from './Banner';
import Values from './Values';
import NewArrivals from './NewArrivals';

interface DynamicSectionProps {
  section: SiteSection;
}

const DynamicSection: React.FC<DynamicSectionProps> = ({ section }) => {
  console.log(`Rendering section: ${section.type} (${section.id})`, section);

  // Don't render disabled sections
  if (!section.enabled) {
    console.log(`Section ${section.type} (${section.id}) is disabled, not rendering`);
    return null;
  }

  // Handle loading states for data-dependent sections
  const renderSection = () => {
    switch (section.type) {
      case 'hero':
        return <Hero sectionData={section} />;
      case 'featured':
        return <FeaturedProducts sectionData={section} />;
      case 'categories':
        return <Categories sectionData={section} />;
      case 'about':
        return <About sectionData={section} />;
      case 'testimonials':
        return <Testimonials sectionData={section} />;
      case 'newsletter':
        return <Newsletter sectionData={section} />;
      case 'banner':
        return <Banner sectionData={section} />;
      case 'values':
        return <Values sectionData={section} />;
      case 'new-arrivals':
        return <NewArrivals sectionData={section} />;
      default:
        console.warn(`Unknown section type: ${section.type}`);
        return null;
    }
  };
  
  // Add error boundary for each section to prevent entire page from crashing
  try {
    return renderSection();
  } catch (error) {
    console.error(`Error rendering section ${section.type} (${section.id}):`, error);
    
    // Return a minimal error state that doesn't break the page
    return (
      <div className="py-8 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">
            This section could not be displayed. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
};

export default DynamicSection;
