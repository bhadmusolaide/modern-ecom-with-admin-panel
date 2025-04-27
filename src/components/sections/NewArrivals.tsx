'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SiteSection } from '@/lib/data/siteSettings';
import { Product } from '@/lib/types';
import { getNewArrivals } from '@/lib/firebase/utils/queryOptimizer';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ProxiedImage from '../ui/ProxiedImage';
import { FiShoppingBag, FiCheckCircle } from 'react-icons/fi';
import { useCart } from '@/lib/context/CartContext';

interface NewArrivalsProps {
  sectionData?: SiteSection;
}

const NewArrivals: React.FC<NewArrivalsProps> = ({ sectionData }) => {
  const { addToCart } = useCart();
  // Set background color from section data or use default
  const backgroundColor = sectionData?.backgroundColor || 'white';
  const textColor = sectionData?.textColor || '#1e293b';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  // Empty array for products
  const fallbackProducts: Product[] = [];

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        // Use the optimized query utility
        const newArrivalsProducts = await getNewArrivals(4);

        // If we got products from the database, use them
        // Otherwise, use the fallback products
        if (newArrivalsProducts && newArrivalsProducts.length > 0) {
          setProducts(newArrivalsProducts);
        } else {
          console.log('No new arrivals found in database, using fallback products');
          setProducts(fallbackProducts);
        }
      } catch (error) {
        console.error('Error fetching new arrivals:', error);
        // In case of error, use fallback products
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
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

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading new arrivals...</p>
      </div>
    );
  }

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
            {sectionData?.title || ''}
          </h2>
          <p
            className="mt-4 max-w-2xl mx-auto"
            style={{ color: `${textColor}cc` }}
          >
            {sectionData?.subtitle || ''}
          </p>
        </motion.div>

        {products.length > 0 ? (
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
                        priority
                        showNoImageMessage={true}
                      />
                      <div className="absolute top-2 left-2">
                        <span className="product-tag-new">New</span>
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
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {product.categoryName || product.category}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No new arrivals</h3>
            <p className="text-gray-500 mb-6">There are no new products available at the moment.</p>
            <Link href="/admin/products/new">
              <Button variant="primary">Add Products</Button>
            </Link>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-12"
        >
          <Link href="/shop">
            <Button variant="primary" size="lg">
              View All New Arrivals
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default NewArrivals;