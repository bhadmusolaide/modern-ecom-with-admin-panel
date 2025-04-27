"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiHeart, FiStar } from 'react-icons/fi';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Link href={`/shop/product/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-lg aspect-w-3 aspect-h-4 bg-gray-100">
          {/* Product Image */}
          <motion.img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
          />

          {/* Overlay with quick actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-white text-gray-900 py-2 rounded-md font-medium flex items-center justify-center"
              >
                <FiShoppingBag className="mr-2" /> Quick Add
              </motion.button>
            </div>
          </div>

          {/* Wishlist button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Add to wishlist"
          >
            <FiHeart size={18} />
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
              <div className="text-sm text-gray-500 mb-1">{product.category}</div>
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
                    className={`w-3.5 h-3.5 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                {product.rating} ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-3 flex items-center gap-1">
              {product.colors.slice(0, 3).map((color, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{
                    backgroundColor:
                      color.toLowerCase() === 'white' ? 'white' :
                      color.toLowerCase() === 'black' ? 'black' :
                      color.toLowerCase() === 'gray' ? '#6b7280' :
                      color.toLowerCase() === 'beige' ? '#e8d6c3' :
                      color.toLowerCase() === 'navy' ? '#0f172a' :
                      color.toLowerCase() === 'olive' ? '#4d7c0f' :
                      color.toLowerCase() === 'camel' ? '#d4a76a' :
                      color.toLowerCase() === 'sage' ? '#84a98c' :
                      color.toLowerCase() === 'cream' ? '#f8f5e4' :
                      color.toLowerCase() === 'burgundy' ? '#800020' :
                      color.toLowerCase() === 'khaki' ? '#c3b091' :
                      color.toLowerCase() === 'lavender' ? '#e6e6fa' :
                      color.toLowerCase() === 'blue' ? '#3b82f6' :
                      color.toLowerCase() === 'striped' ? 'repeating-linear-gradient(45deg, #f8f9fa, #f8f9fa 2px, #e9ecef 2px, #e9ecef 4px)' :
                      color.toLowerCase().includes('wash') ? '#a1c4fd' : '#e2e8f0'
                  }}
                  title={color}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-xs text-gray-500">+{product.colors.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
