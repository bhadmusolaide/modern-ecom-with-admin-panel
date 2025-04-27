'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { SiteSection } from '@/lib/data/siteSettings';
import { Category as CategoryType } from '@/lib/types';
import { getCategoriesWithProductCounts } from '@/lib/firebase/utils/queryOptimizer';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';
import EmptyState from '../ui/EmptyState';

interface CategoriesProps {
  sectionData?: SiteSection;
}

// Helper function to determine grid columns based on category count
const getGridColumns = (count: number) => {
  if (count === 1) return 'lg:grid-cols-1';
  if (count === 2) return 'lg:grid-cols-2';
  if (count === 3) return 'lg:grid-cols-3';
  if (count === 5) return 'lg:grid-cols-5';
  return 'lg:grid-cols-4'; // Default for 4 or more than 5 categories
};

// Helper function to determine container class based on category count
const getCategoryContainerClass = (count: number) => {
  if (count <= 2) return 'max-w-4xl mx-auto';
  if (count === 3) return 'max-w-5xl mx-auto';
  return ''; // Default full width for 4 or more categories
};

const Categories: React.FC<CategoriesProps> = ({ sectionData }) => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await getCategoriesWithProductCounts(false); // Force refresh from server
        console.log('Fetched categories:', categoriesData);

        // Filter out categories with no image
        const validCategories = categoriesData.filter(cat => cat.image && cat.isActive !== false);
        console.log('Valid categories:', validCategories);

        setCategories(validCategories);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

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

  // Set background color from section data or use default
  const backgroundColor = sectionData?.backgroundColor || 'white';
  const textColor = sectionData?.textColor || '#1e293b';

  // Loading state
  if (loading) {
    return (
      <section className="py-20" style={{ backgroundColor }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: textColor }}>
              {sectionData?.title || ''}
            </h2>
          </div>
          <LoadingState
            type="spinner"
            size="large"
            text="Loading categories..."
          />
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-20" style={{ backgroundColor }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: textColor }}>
              {sectionData?.title || ''}
            </h2>
          </div>
          <div className="max-w-lg mx-auto">
            <ErrorState
              message={error}
              retryAction={() => window.location.reload()}
              variant="full"
            />
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <section className="py-20" style={{ backgroundColor }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: textColor }}>
              {sectionData?.title || ''}
            </h2>
          </div>
          <EmptyState
            title="No Categories Available"
            message="There are no product categories available at the moment."
            actionText="Browse All Products"
            actionLink="/shop"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20" style={{ backgroundColor }}>
      <div className={`container ${getCategoryContainerClass(categories.length)}`}>
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
            {sectionData?.title || ''}
          </h2>
          <p
            className="mt-4 max-w-2xl mx-auto"
            style={{ color: `${textColor}cc` }}
          >
            {sectionData?.subtitle || ''}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className={`grid grid-cols-1 md:grid-cols-2 ${getGridColumns(categories.length)} gap-6`}
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={itemVariants}>
              <Link href={`/collections/${category.slug || category.id}`} className="block group">
                <div className="relative w-full h-64 rounded-lg overflow-hidden group">
                  <Image
                    src={category.image || '/placeholder-category.jpg'}
                    alt={category.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-lg font-medium">{category.name}</h3>
                    <p className="text-sm opacity-90">{category.count} products</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Categories;
