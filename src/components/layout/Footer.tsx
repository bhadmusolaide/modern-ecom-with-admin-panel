"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiInstagram, FiTwitter, FiFacebook, FiYoutube, FiMail, FiLinkedin } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';

// Create the wrapper component to conditionally render the Footer
export const FooterWrapper: React.FC = () => {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isAuthPage = pathname?.startsWith('/auth');
  
  // Don't render the footer on admin or auth pages
  if (isAdminPage || isAuthPage) {
    return null;
  }
  
  return <Footer />;
};

const Footer: React.FC = () => {
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const { settings } = useSiteSettings();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  // Get social links from settings if available
  const showSocialLinks = settings?.footer?.showSocialLinks ?? true;
  const socialLinks = settings?.footer?.socialLinks || [
    { platform: 'instagram', url: 'https://instagram.com' },
    { platform: 'twitter', url: 'https://twitter.com' },
    { platform: 'facebook', url: 'https://facebook.com' },
    { platform: 'youtube', url: 'https://youtube.com' },
  ];

  // Get company description from settings
  const companyDescription = settings?.footer?.companyDescription || 'Modern, sustainable fashion for everyone. Our unisex boutique offers timeless pieces designed with quality and style in mind.';

  // Get copyright text from settings
  const copyrightText = settings?.footer?.copyrightText || `© {year} OMJ. All rights reserved.`;

  // Ensure Support section has FAQ link
  const footerLinkGroups = settings?.footer?.footerLinks?.map(group => {
    if (group.title === 'Support') {
      const hasFaqLink = group.links.some(link => link.text === 'FAQs');
      if (!hasFaqLink) {
        return {
          ...group,
          links: [...group.links, { text: 'FAQs', url: '/faqs' }]
        };
      }
    }
    return group;
  }) || [
    {
      title: 'Shop',
      links: [
        { text: 'All Products', url: '/shop' },
        { text: 'New Arrivals', url: '/shop/new-arrivals' },
        { text: 'Best Sellers', url: '/shop/best-sellers' },
        { text: 'Sale', url: '/shop/sale' },
      ]
    },
    {
      title: 'Company',
      links: [
        { text: 'About Us', url: '/about' },
        { text: 'Careers', url: '/careers' },
        { text: 'Store Locations', url: '/stores' },
        { text: 'Sustainability', url: '/sustainability' },
      ]
    },
    {
      title: 'Support',
      links: [
        { text: 'Contact Us', url: '/contact' },
        { text: 'FAQs', url: '/faqs' },
        { text: 'Shipping & Returns', url: '/shipping-returns' },
        { text: 'Size Guide', url: '/size-guide' },
      ]
    }
  ];

  // Function to render social icon based on platform
  const renderSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <FiInstagram size={20} />;
      case 'twitter':
        return <FiTwitter size={20} />;
      case 'facebook':
        return <FiFacebook size={20} />;
      case 'youtube':
        return <FiYoutube size={20} />;
      case 'linkedin':
        return <FiLinkedin size={20} />;
      default:
        return <FiInstagram size={20} />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <footer className="bg-gray-50 pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <motion.div
            className="lg:col-span-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <Link href="/" className="text-2xl font-bold text-primary-600">
                {settings?.logoUrl ? (
                  <img 
                    src={settings.logoUrl} 
                    alt={settings?.siteName || 'OMJ'} 
                    className="h-10 w-auto object-contain" 
                  />
                ) : (
                  <>{settings?.siteName || 'OMJ'}<span className="text-accent-500">.</span></>
                )}
              </Link>
            </motion.div>
            <motion.p variants={itemVariants} className="mt-4 text-gray-600 max-w-md">
              {companyDescription}
            </motion.p>
            {showSocialLinks && (
              <motion.div variants={itemVariants} className="mt-6 flex space-x-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-primary-600 transition-colors"
                    aria-label={link.platform}
                  >
                    {renderSocialIcon(link.platform)}
                  </a>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Links Columns */}
          {footerLinkGroups.map((group, index) => (
            <motion.div
              key={group.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
            >
              <motion.h3 variants={itemVariants} className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                {group.title}
              </motion.h3>
              <motion.ul variants={containerVariants} className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <motion.li key={link.text} variants={itemVariants}>
                    <Link href={link.url} className="text-gray-600 hover:text-primary-600 transition-colors">
                      {link.text}
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter */}
        <motion.div
          className="mt-12 pt-8 border-t border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="max-w-md mx-auto lg:mx-0">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Subscribe to our newsletter
            </h3>
            <p className="mt-2 text-gray-600">
              Get the latest updates, sales, and special offers straight to your inbox.
            </p>
            <div className="mt-4 flex">
              <input
                type="email"
                placeholder="Your email address"
                className="input flex-grow"
                aria-label="Email address"
              />
              <button
                type="button"
                className="ml-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
              >
                <FiMail size={20} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            {copyrightText.replace('{year}', currentYear.toString())}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterWrapper;
