"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { FiShoppingBag, FiHeart, FiCheckCircle } from 'react-icons/fi';
import { SiteSection } from '@/lib/data/siteSettings';
import { Product } from '@/lib/types';
import { getFeaturedProducts } from '@/lib/firebase/utils/queryOptimizer';
import ProxiedImage from '../ui/ProxiedImage';
import { useCart } from '@/lib/context/CartContext';

interface FeaturedProductsProps {
  sectionData?: SiteSection;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ sectionData }) => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the optimized query utility
        const featuredProducts = await getFeaturedProducts(8);

        // Set the products from the database
        setProducts(featuredProducts || []);

        // If no products were found, we'll handle this in the UI
        if (!featuredProducts || featuredProducts.length === 0) {
          console.log('No featured products found in database');
        }
      } catch (err) {
        console.error('Error fetching featured products:', err);
        setError('Failed to load featured products. Please try again later.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
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

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    setAddingProductId(product.id);

    // Add product to cart with default quantity of 1
    addToCart(product, 1);

    // Reset the button after a short delay
    setTimeout(() => {
      setAddingProductId(null);
    }, 1500);
  };

  // Set background color from section data or use default
  const backgroundColor = sectionData?.backgroundColor || '#f8fafc';
  const textColor = sectionData?.textColor || '#1e293b';

  // Loading state
  if (loading) {
    return (
      <div className="py-12 text-center" style={{ backgroundColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: textColor }}>
            {sectionData?.title || ''}
          </h2>
          <div className="mt-16 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
          <p className="mt-4 text-gray-500">Loading featured products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-12 text-center" style={{ backgroundColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: textColor }}>
            {sectionData?.title || ''}
          </h2>
          <div className="mt-8 p-4 bg-red-50 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="py-12 text-center" style={{ backgroundColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: textColor }}>
            {sectionData?.title || ''}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {sectionData?.subtitle || ''}
          </p>
          <div className="mt-12 p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No featured products available at the moment.</p>
            <Link href="/shop" className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              Browse All Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12" style={{ backgroundColor, color: textColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {sectionData?.title || ''}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {sectionData?.subtitle || ''}
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <Link href={`/shop/product/${product.id}`}>
                <Card className="overflow-hidden h-full group">
                  <div className="relative aspect-w-3 aspect-h-4 bg-gray-100">
                    <ProxiedImage
                      src={product.image}
                      alt={product.name || 'Product image'}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      priority={products.indexOf(product) < 4}
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-2">
                      {product.isNew && (
                        <div className="flex">
                          <span className="product-tag-new">New</span>
                        </div>
                      )}
                      {product.isSale && (
                        <div className="flex">
                          <span className="product-tag-sale">Sale</span>
                        </div>
                      )}
                    </div>

                    {/* Overlay with quick add button */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`w-full py-2 rounded-md font-medium flex items-center justify-center ${
                            addingProductId === product.id
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-900'
                          }`}
                          onClick={(e) => handleQuickAdd(e, product)}
                          disabled={addingProductId === product.id}
                        >
                          {addingProductId === product.id ? (
                            <>
                              <FiCheckCircle className="mr-2" /> Added
                            </>
                          ) : (
                            <>
                              <FiShoppingBag className="mr-2" /> Add to Cart
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">{product.categoryName || product.category}</div>
                        <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                          {product.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        {product.isSale && product.salePrice ? (
                          <div>
                            <span className="text-accent-600 font-medium">{formatPrice(product.salePrice)}</span>
                            <span className="ml-2 text-gray-500 line-through text-sm">{formatPrice(product.price)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-900 font-medium">{formatPrice(product.price)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default FeaturedProducts;
