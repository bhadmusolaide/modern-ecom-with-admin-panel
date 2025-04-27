'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Undo2,
  Settings,
  Layout,
  Palette,
  Type,
  Image as ImageIcon,
  Menu,
  Footprints,
  Layers,
  Eye,
  Shield
} from 'lucide-react';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import Link from 'next/link';
import { withAdminPage } from '@/lib/auth/withAdminPage';

function SiteSettingsPage() {
  const router = useRouter();
  const { settings, isLoading } = useSiteSettings();
  const [activeTab, setActiveTab] = useState('general');

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700 mb-4"></div>
          <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-700 rounded mb-3"></div>
          <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <PermissionGuard
        permissions={['settings:edit']}
        fallback={
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 text-center">
            <Settings size={48} className="mx-auto text-neutral-400 dark:text-neutral-600 mb-4" />
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">Access Denied</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              You don't have permission to edit site settings.
            </p>
          </div>
        }
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Site Settings</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Customize your website appearance and content</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <Link
              href="/"
              target="_blank"
              className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center"
            >
              <Eye size={16} className="mr-2" />
              View Site
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="border-b border-neutral-200 dark:border-neutral-700 px-4">
            <nav className="flex overflow-x-auto">
              <button
                className={`py-4 px-4 font-medium border-b-2 ${
                  activeTab === 'general'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                onClick={() => setActiveTab('general')}
              >
                <Settings size={16} className="inline-block mr-2" />
                General
              </button>
              <button
                className={`py-4 px-4 font-medium border-b-2 ${
                  activeTab === 'branding'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                onClick={() => setActiveTab('branding')}
              >
                <Palette size={16} className="inline-block mr-2" />
                Branding
              </button>
              <button
                className={`py-4 px-4 font-medium border-b-2 ${
                  activeTab === 'typography'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                onClick={() => setActiveTab('typography')}
              >
                <Type size={16} className="inline-block mr-2" />
                Typography
              </button>
              <button
                className={`py-4 px-4 font-medium border-b-2 ${
                  activeTab === 'header'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                onClick={() => setActiveTab('header')}
              >
                <Menu size={16} className="inline-block mr-2" />
                Header
              </button>
              <button
                className={`py-4 px-4 font-medium border-b-2 ${
                  activeTab === 'footer'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                onClick={() => setActiveTab('footer')}
              >
                <Footprints size={16} className="inline-block mr-2" />
                Footer
              </button>
              <button
                className={`py-4 px-4 font-medium border-b-2 ${
                  activeTab === 'homepage'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                onClick={() => setActiveTab('homepage')}
              >
                <Layout size={16} className="inline-block mr-2" />
                Homepage
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <div className="text-center py-12">
                <h2 className="text-xl font-medium text-neutral-800 dark:text-white mb-4">Site Settings Overview</h2>
                <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-8">
                  Welcome to the site settings dashboard. Use the tabs above to customize different aspects of your website.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <Link
                    href="/admin/site-settings/branding"
                    className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary dark:hover:border-primary transition-colors group"
                  >
                    <Palette size={32} className="mx-auto mb-4 text-neutral-400 group-hover:text-primary transition-colors" />
                    <h3 className="font-medium text-neutral-800 dark:text-white mb-2">Branding</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Customize your logo, colors, and brand identity
                    </p>
                  </Link>

                  <Link
                    href="/admin/site-settings/theme"
                    className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary dark:hover:border-primary transition-colors group"
                  >
                    <Palette size={32} className="mx-auto mb-4 text-neutral-400 group-hover:text-primary transition-colors" />
                    <h3 className="font-medium text-neutral-800 dark:text-white mb-2">Theme</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Customize colors, fonts, and visual style
                    </p>
                  </Link>

                  <Link
                    href="/admin/site-settings/header"
                    className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary dark:hover:border-primary transition-colors group"
                  >
                    <Menu size={32} className="mx-auto mb-4 text-neutral-400 group-hover:text-primary transition-colors" />
                    <h3 className="font-medium text-neutral-800 dark:text-white mb-2">Header</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Configure your website header and navigation
                    </p>
                  </Link>

                  <Link
                    href="/admin/site-settings/footer"
                    className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary dark:hover:border-primary transition-colors group"
                  >
                    <Footprints size={32} className="mx-auto mb-4 text-neutral-400 group-hover:text-primary transition-colors" />
                    <h3 className="font-medium text-neutral-800 dark:text-white mb-2">Footer</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Customize your website footer and links
                    </p>
                  </Link>

                  <Link
                    href="/admin/site-settings/faq"
                    className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary dark:hover:border-primary transition-colors group"
                  >
                    <Shield size={32} className="mx-auto mb-4 text-neutral-400 group-hover:text-primary transition-colors" />
                    <h3 className="font-medium text-neutral-800 dark:text-white mb-2">FAQ</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Manage frequently asked questions
                    </p>
                  </Link>

                  <Link
                    href="/admin/site-settings/homepage"
                    className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary dark:hover:border-primary transition-colors group"
                  >
                    <Layers size={32} className="mx-auto mb-4 text-neutral-400 group-hover:text-primary transition-colors" />
                    <h3 className="font-medium text-neutral-800 dark:text-white mb-2">Homepage</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Arrange and customize homepage sections
                    </p>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="py-4">
                <Link
                  href="/admin/site-settings/branding"
                  className="text-primary hover:text-primary-dark transition-colors"
                >
                  Go to Branding Settings →
                </Link>
              </div>
            )}

            {activeTab === 'typography' && (
              <div className="py-4">
                <Link
                  href="/admin/site-settings/typography"
                  className="text-primary hover:text-primary-dark transition-colors"
                >
                  Go to Typography Settings →
                </Link>
              </div>
            )}

            {activeTab === 'header' && (
              <div className="py-4">
                <Link
                  href="/admin/site-settings/header"
                  className="text-primary hover:text-primary-dark transition-colors"
                >
                  Go to Header Settings →
                </Link>
              </div>
            )}

            {activeTab === 'footer' && (
              <div className="py-4">
                <Link
                  href="/admin/site-settings/footer"
                  className="text-primary hover:text-primary-dark transition-colors"
                >
                  Go to Footer Settings →
                </Link>
              </div>
            )}

            {activeTab === 'homepage' && (
              <div className="py-4">
                <Link
                  href="/admin/site-settings/homepage"
                  className="text-primary hover:text-primary-dark transition-colors"
                >
                  Go to Homepage Settings →
                </Link>
              </div>
            )}
          </div>
        </div>
      </PermissionGuard>
    </div>
  );
}

export default withAdminPage(SiteSettingsPage);
