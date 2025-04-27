"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { FiArrowRight } from 'react-icons/fi';
import Image from 'next/image';
import { SiteSection } from '@/lib/data/siteSettings';
import Link from 'next/link';

interface AboutProps {
  sectionData?: SiteSection;
}

const About: React.FC<AboutProps> = ({ sectionData }) => {
  const features = [
    {
      title: 'Sustainable Materials',
      description: 'We use eco-friendly fabrics and sustainable production methods to minimize our environmental impact.',
    },
    {
      title: 'Timeless Design',
      description: 'Our pieces are designed to transcend trends, ensuring they remain stylish and relevant for years to come.',
    },
    {
      title: 'Inclusive Sizing',
      description: 'We offer a wide range of sizes to ensure our clothing is accessible and flattering for all body types.',
    },
    {
      title: 'Ethical Production',
      description: 'We partner with factories that provide fair wages and safe working conditions for all employees.',
    },
  ];

  // Set background color from section data or use default
  const backgroundColor = sectionData?.backgroundColor || 'white';
  const textColor = sectionData?.textColor || '#1e293b';

  return (
    <section className="py-20" style={{ backgroundColor }}>
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
              <Image
                src={sectionData?.imageUrl || "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"}
                alt={sectionData?.title || "Our team working together"}
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ color: textColor }}
            >
              {sectionData?.title || 'Our Story'}
            </h2>
            <p
              className="mt-4"
              style={{ color: `${textColor}cc` }}
            >
              {sectionData?.subtitle || 'Founded in 2023, OMJ was born from a simple idea: create high-quality, versatile clothing that anyone can wear, regardless of gender. We believe that fashion should be inclusive, sustainable, and timeless.'}
            </p>
            <p
              className="mt-4"
              style={{ color: `${textColor}cc` }}
            >
              Our team of designers draws inspiration from minimalist aesthetics, functional design, and the diverse needs of our community. Every piece is thoughtfully crafted to provide comfort, style, and durability.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mt-8"
            >
              {sectionData?.buttonText ? (
                <Link href={sectionData.buttonLink || '/about'}>
                  <Button
                    variant="primary"
                    icon={<FiArrowRight />}
                    iconPosition="right"
                  >
                    {sectionData.buttonText}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="primary"
                  icon={<FiArrowRight />}
                  iconPosition="right"
                >
                  Learn More About Us
                </Button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
