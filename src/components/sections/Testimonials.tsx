"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';
import Image from 'next/image';
import { SiteSection } from '@/lib/data/siteSettings';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

interface TestimonialsProps {
  sectionData?: SiteSection;
}

const Testimonials: React.FC<TestimonialsProps> = ({ sectionData }) => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Alex Johnson',
      role: 'Fashion Blogger',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      content: 'OMJ has completely transformed my wardrobe. The quality of their pieces is exceptional, and I love how versatile everything is. I can mix and match their items for countless outfit combinations.',
      rating: 5,
    },
    {
      id: 2,
      name: 'Jordan Smith',
      role: 'Photographer',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      content: 'As someone who values sustainability, I appreciate OMJ&apos;s commitment to eco-friendly materials and ethical production. Their clothes not only look good but also align with my values.',
      rating: 5,
    },
    {
      id: 3,
      name: 'Taylor Reed',
      role: 'Graphic Designer',
      avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      content: 'The attention to detail in OMJ&apos;s designs is remarkable. From the stitching to the fabric selection, everything feels intentional and well-crafted. I&apos;ve received countless compliments on their pieces.',
      rating: 4,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const nextTestimonial = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevTestimonial = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !autoplay) return;

    const interval = setInterval(() => {
      nextTestimonial();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, autoplay, isClient, nextTestimonial]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 200 : -200,
      opacity: 0,
    }),
  };

  // Set background color from section data or use default
  const backgroundColor = sectionData?.backgroundColor || '#f8fafc';
  const textColor = sectionData?.textColor || '#1e293b';

  return (
    <section className="py-20" style={{ backgroundColor }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ color: textColor }}
          >
            {sectionData?.title || 'What Our Customers Say'}
          </h2>
          <p
            className="mt-4 max-w-2xl mx-auto"
            style={{ color: `${textColor}cc` }}
          >
            {sectionData?.subtitle || 'Don\'t just take our word for it. Here\'s what our community has to say about their OMJ experience.'}
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div
            className="relative bg-white rounded-xl shadow-lg p-6 sm:p-10 overflow-hidden"
            onMouseEnter={() => setAutoplay(false)}
            onMouseLeave={() => setAutoplay(true)}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-500" />

            <AnimatePresence custom={direction} initial={false} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="flex flex-col md:flex-row gap-8 items-center"
              >
                <div className="flex-shrink-0">
                  <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden">
                    <Image
                      src={testimonials[currentIndex].avatar}
                      alt={testimonials[currentIndex].name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex-grow text-center md:text-left">
                  <div className="flex justify-center md:justify-start mb-2">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`${
                          i < testimonials[currentIndex].rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        } w-5 h-5`}
                      />
                    ))}
                  </div>

                  <blockquote className="text-lg md:text-xl text-gray-700 italic">
                    &ldquo;{testimonials[currentIndex].content}&rdquo;
                  </blockquote>

                  <div className="mt-4">
                    <p className="font-semibold text-gray-900">{testimonials[currentIndex].name}</p>
                    <p className="text-gray-500">{testimonials[currentIndex].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="absolute top-1/2 -translate-y-1/2 left-2 sm:-left-4">
              <button
                onClick={prevTestimonial}
                className="bg-white rounded-full p-2 shadow-md text-gray-700 hover:text-primary-600 transition-colors"
                aria-label="Previous testimonial"
              >
                <FiChevronLeft size={24} />
              </button>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 right-2 sm:-right-4">
              <button
                onClick={nextTestimonial}
                className="bg-white rounded-full p-2 shadow-md text-gray-700 hover:text-primary-600 transition-colors"
                aria-label="Next testimonial"
              >
                <FiChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-center space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`w-2.5 h-2.5 rounded-full ${
                  index === currentIndex ? 'bg-primary-600' : 'bg-gray-300'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
