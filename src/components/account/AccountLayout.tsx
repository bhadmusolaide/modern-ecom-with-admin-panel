'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { classNames } from '@/lib/utils';

interface AccountLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { name: 'Dashboard', href: '/account' },
  { name: 'Orders', href: '/account/orders' },
  { name: 'Addresses', href: '/account/addresses' },
  { name: 'Settings', href: '/account/settings' },
  { name: 'Backup', href: '/account/backup' },
  { name: 'Activity Logs', href: '/account/logs' },
];

export default function AccountLayout({ children }: AccountLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <nav className="w-full md:w-64">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Account</h2>
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={classNames(
                      'block px-4 py-2 rounded-md transition-colors',
                      pathname === item.href
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          <div className="bg-white rounded-lg shadow p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}