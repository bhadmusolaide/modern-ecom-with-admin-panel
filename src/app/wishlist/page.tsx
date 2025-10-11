'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWishlist } from '@/lib/context/WishlistContext';
import { getProductById } from '@/lib/firebase/utils/queryOptimizer';
import { Product } from '@/lib/types';
import ProductCard from '@/components/shop/ProductCard';

export default function WishlistPage() {
  const { items, isLoading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const results = await Promise.all(
          items.map(async (id) => {
            const p = await getProductById(id);
            return p as Product | null;
          })
        );
        if (!cancelled) {
          setProducts(results.filter(Boolean) as Product[]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (items.length > 0) run();
    else {
      setProducts([]);
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [items]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your Wishlist</h1>
        <Link className="text-primary-600 hover:underline" href="/shop">Continue shopping</Link>
      </div>

      {loading || wishlistLoading ? (
        <div className="py-12 text-center text-gray-500">Loading wishlist…</div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-600 mb-4">Your wishlist is empty.</p>
          <Link href="/shop" className="text-primary-600 hover:underline">Browse products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-cy="wishlist-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

