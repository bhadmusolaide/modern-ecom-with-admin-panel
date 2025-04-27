'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import Image from 'next/image';
import Link from 'next/link';
import { SiteSection } from '@/lib/data/siteSettings';

interface BannerProps {
  sectionData?: SiteSection;
}

const Banner: React.FC<BannerProps> = ({ sectionData }) => {
  // Set background color from section data or use default
  const backgroundColor = sectionData?.backgroundColor || '#f0f9ff';
  const textColor = sectionData?.textColor || '#0c4a6e';

  return (
    <section 
      className="py-16 overflow-hidden"
      style={{ backgroundColor }}
    >
      <div className="container">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="flex flex-col md:flex-row items-center">
            {sectionData?.imageUrl && (
              <div className="w-full md:w-1/2 relative h-64 md:h-96">
                <Image
                  src={sectionData.imageUrl}
                  alt={sectionData.title || "Promotional banner"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            <div className={`w-full ${sectionData?.imageUrl ? 'md:w-1/2' : 'md:w-full'} p-8 md:p-12`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-4"
                  style={{ color: textColor }}
                >
                  {sectionData?.title || "Special Promotion"}
                </h2>
                
                {sectionData?.subtitle && (
                  <p 
                    className="text-lg mb-6"
                    style={{ color: `${textColor}cc` }}
                  >
                    {sectionData.subtitle}
                  </p>
                )}
                
                {sectionData?.buttonText && (
                  <Link href={sectionData.buttonLink || '/shop'}>
                    <Button
                      variant="primary"
                      size="lg"
                    >
                      {sectionData.buttonText}
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
