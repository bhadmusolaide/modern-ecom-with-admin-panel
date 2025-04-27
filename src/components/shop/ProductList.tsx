"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import ProxiedImage from '@/components/ui/ProxiedImage';
import Link from 'next/link';
import { FiShoppingBag, FiHeart, FiStar, FiCheckCircle } from 'react-icons/fi';
import { formatPrice } from '@/lib/utils';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/context/CartContext';

interface ProductListProps {
  products: Product[];
  view?: 'grid' | 'list';
}

const ProductList: React.FC<ProductListProps> = ({ products, view = 'grid' }) => {
  const { addToCart } = useCart();
  const [addingProductId, setAddingProductId] = useState<number | null>(null);

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

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block p-6 rounded-full bg-gray-100 mb-4">
          <FiShoppingBag className="h-10 w-10 text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
        <p className="mt-2 text-gray-500">Try adjusting your filters or search criteria.</p>
      </div>
    );
  }

  // Grid view
  if (view === 'grid') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {products.map((product) => (
          <motion.div
            key={product.id}
            variants={itemVariants}
            className="group"
          >
            <Link href={`/shop/product/${product.id}`} className="block" prefetch={false}>
              <div className="relative overflow-hidden rounded-lg aspect-w-3 aspect-h-4 bg-gray-100">
                {product.image ? (
                  <ProxiedImage
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}

                {/* Overlay with quick actions */}
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
                          <FiShoppingBag className="mr-2" /> Quick Add
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Wishlist button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-2 right-2 bg-white w-7 h-7 flex items-center justify-center rounded-full shadow-md text-gray-700 hover:text-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  aria-label="Add to wishlist"
                  onClick={(e) => {
                    e.preventDefault();
                    // Add wishlist functionality here
                  }}
                >
                  <FiHeart className="w-4 h-4" />
                </motion.button>

                {/* Tags */}
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
              </div>

              {/* Product Info */}
              <div className="mt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">{product.categoryName || 'Uncategorized'}</div>
                    <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    {product.isSale ? (
                      <div>
                        <span className="text-accent-600 font-medium">{formatPrice(product.salePrice || 0)}</span>
                        <span className="ml-2 text-gray-500 line-through text-sm">{formatPrice(product.price)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-900 font-medium">{formatPrice(product.price)}</span>
                    )}
                  </div>
                </div>

                {/* Rating */}
                {product.rating && (
                  <div className="mt-2 flex items-center">
                    <div className="flex mr-1">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {product.rating} ({product.reviewCount} reviews)
                    </span>
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // List view
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {products.map((product) => (
        <motion.div
          key={product.id}
          variants={itemVariants}
          className="group border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col md:flex-row">
            {/* Product Image */}
            <div className="md:w-1/4 relative">
              <div className="aspect-w-3 aspect-h-2 md:aspect-h-3">
                {product.image ? (
                  <ProxiedImage
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>

              {/* Tags */}
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
            </div>

            {/* Product Info */}
            <div className="md:w-3/4 p-4 md:p-6 flex flex-col">
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">{product.categoryName || 'Uncategorized'}</div>
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                      <Link href={`/shop/product/${product.id}`} prefetch={false}>
                        {product.name}
                      </Link>
                    </h3>
                  </div>
                  <div className="text-right">
                    {product.isSale ? (
                      <div>
                        <span className="text-accent-600 font-medium">{formatPrice(product.salePrice || 0)}</span>
                        <span className="ml-2 text-gray-500 line-through text-sm">{formatPrice(product.price)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-900 font-medium">{formatPrice(product.price)}</span>
                    )}
                  </div>
                </div>

                {/* Rating */}
                {product.rating && (
                  <div className="mt-2 flex items-center">
                    <div className="flex mr-1">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {product.rating} ({product.reviewCount} reviews)
                    </span>
                  </div>
                )}

                {/* Description */}
                <p className="mt-3 text-gray-600 text-sm line-clamp-2">
                  {product.description}
                </p>

                {/* Colors */}
                  {product.colors && product.colors.length > 0 && (
                  <div className="mt-4 flex items-center">
                      <span className="text-sm text-gray-700 mr-2">Colors:</span>
                      <div className="flex items-center gap-1">
                        {product.colors.map((color, index) => (
                          <div
                            key={index}
                            className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center space-x-4">
                <button
                  className={`flex-1 px-4 py-2 rounded-md font-medium flex items-center justify-center ${
                    addingProductId === product.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-primary-600 text-white hover:bg-primary-700 transition-colors'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleQuickAdd(e, product);
                  }}
                  disabled={addingProductId === product.id}
                >
                  {addingProductId === product.id ? (
                    <>
                      <FiCheckCircle className="mr-2" /> Added to Cart
                    </>
                  ) : (
                    <>
                      <FiShoppingBag className="mr-2" /> Add to Cart
                    </>
                  )}
                </button>
                <button
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 hover:border-primary-600 hover:text-primary-600 transition-colors"
                  aria-label="Add to wishlist"
                  onClick={(e) => {
                    e.preventDefault();
                    // Add wishlist functionality here
                  }}
                >
                  <FiHeart className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ProductList;
