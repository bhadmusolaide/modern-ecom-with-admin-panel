"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { FiMail } from 'react-icons/fi';
import { SiteSection } from '@/lib/data/siteSettings';

interface NewsletterProps {
  sectionData?: SiteSection;
}

const Newsletter: React.FC<NewsletterProps> = ({ sectionData }) => {
  // Set background color from section data or use default
  const backgroundColor = sectionData?.backgroundColor || '#eff6ff';
  const textColor = sectionData?.textColor || '#1e293b';

  return (
    <section className="py-20" style={{ backgroundColor }}>
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ color: textColor }}
            >
              {sectionData?.title || 'Join Our Community'}
            </h2>
            <p
              className="mt-4 max-w-2xl mx-auto"
              style={{ color: `${textColor}cc` }}
            >
              {sectionData?.subtitle || 'Subscribe to our newsletter for exclusive offers, early access to new collections, and style inspiration delivered straight to your inbox.'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <div className="flex-grow">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="input w-full"
                  aria-label="Email address"
                  required
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                icon={<FiMail />}
                iconPosition="left"
              >
                Subscribe
              </Button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 text-center text-sm text-gray-500"
          >
            <p>
              By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            <div>
              <div className="text-primary-600 font-bold text-3xl">10K+</div>
              <div className="text-gray-600 mt-1">Happy Customers</div>
            </div>
            <div>
              <div className="text-primary-600 font-bold text-3xl">200+</div>
              <div className="text-gray-600 mt-1">Products</div>
            </div>
            <div>
              <div className="text-primary-600 font-bold text-3xl">50+</div>
              <div className="text-gray-600 mt-1">Countries</div>
            </div>
            <div>
              <div className="text-primary-600 font-bold text-3xl">4.9</div>
              <div className="text-gray-600 mt-1">Average Rating</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
