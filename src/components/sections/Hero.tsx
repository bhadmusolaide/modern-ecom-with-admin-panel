"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { FiArrowRight } from 'react-icons/fi';
import Image from 'next/image';
import { SiteSection } from '@/lib/data/siteSettings';
import Link from 'next/link';

interface HeroProps {
  sectionData?: SiteSection;
}

const Hero: React.FC<HeroProps> = ({ sectionData }) => {
  if (!sectionData) return null;

  return (
    <section
      className="relative h-screen flex items-center overflow-hidden"
      style={{ backgroundColor: sectionData.backgroundColor || 'transparent' }}>

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30 z-10" />
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src={sectionData.imageUrl || "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"}
            alt={sectionData.title || "Fashion collection"}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        </div>
      </div>

      {/* Content */}
      <div className="container relative z-20 text-white">
        <div className="max-w-2xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
            style={{ color: sectionData.textColor || 'white' }}
          >
            {sectionData.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-gray-200 max-w-lg"
            style={{ color: sectionData.textColor ? `${sectionData.textColor}cc` : 'rgba(255, 255, 255, 0.8)' }}
          >
            {sectionData.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            {sectionData.buttonText && (
              <Link href={sectionData.buttonLink || '/shop'}>
                <Button
                  variant="accent"
                  size="lg"
                  icon={<FiArrowRight />}
                  iconPosition="right"
                >
                  {sectionData.buttonText}
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {/* Animated Shapes */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[var(--primary-color)] blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatType: 'reverse',
          delay: 0.5
        }}
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--accent-color)] blur-3xl"
      />
    </section>
  );
};

export default Hero;
