"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';

const collections = [
  {
    id: 1,
    name: 'Summer Collection',
    description: 'Lightweight and breathable pieces perfect for warm weather',
    image: 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg',
    category: 'summer',
  },
  {
    id: 2,
    name: 'Winter Collection',
    description: 'Cozy and warm styles to keep you comfortable in cold weather',
    image: 'https://images.pexels.com/photos/102129/pexels-photo-102129.jpeg',
    category: 'winter',
  },
  {
    id: 3,
    name: 'Formal Wear',
    description: 'Elegant and sophisticated pieces for special occasions',
    image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg',
    category: 'formal',
  },
  {
    id: 4,
    name: 'Casual Collection',
    description: 'Comfortable and stylish everyday wear',
    image: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg',
    category: 'casual',
  },
  {
    id: 5,
    name: 'Accessories',
    description: 'Complete your look with our selection of accessories',
    image: 'https://images.pexels.com/photos/2536965/pexels-photo-2536965.jpeg',
    category: 'accessories',
  },
  {
    id: 6,
    name: 'New Arrivals',
    description: 'Discover our latest styles and trends',
    image: 'https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg',
    category: 'new-arrivals',
  },
];

const CollectionsPage = () => {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our Collections
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our carefully curated collections designed to match your style and needs
          </p>
        </motion.div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={`/shop?category=${collection.category}`}>
                <div className="group relative overflow-hidden rounded-2xl bg-gray-100 h-[400px]">
                  {/* Collection Image */}
                  <div className="absolute inset-0">
                    <Image
                      src={collection.image}
                      alt={collection.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>

                  {/* Collection Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {collection.name}
                    </h2>
                    <p className="text-gray-200 mb-4">
                      {collection.description}
                    </p>
                    <div className="flex items-center text-white group-hover:translate-x-2 transition-transform duration-300">
                      <span className="font-medium">Shop Now</span>
                      <FiArrowRight className="ml-2" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Featured Collection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gray-100 h-[500px]">
            <div className="absolute inset-0">
              <Image
                src="https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg"
                alt="Featured Collection"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            </div>

            <div className="absolute inset-0 flex items-center p-12">
              <div className="max-w-xl">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Featured Collection
                </h2>
                <p className="text-xl text-gray-200 mb-8">
                  Discover our most popular styles and trends this season
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center bg-white text-gray-900 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
                >
                  <span>Explore All Products</span>
                  <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CollectionsPage; 