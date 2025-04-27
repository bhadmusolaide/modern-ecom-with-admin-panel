import React from 'react';

export const metadata = {
  title: 'Shop | Modern Unisex Fashion',
  description: 'Discover our collection of timeless, sustainable pieces designed for everyone. Quality craftsmanship meets contemporary style.',
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      {children}
    </main>
  );
}
