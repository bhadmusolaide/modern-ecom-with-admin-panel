'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Undo2,
  ArrowLeft,
  Settings,
  Image as ImageIcon
} from 'lucide-react';
import ImageUploader from '@/components/ui/ImageUploader';
import PreviewPanel from '@/components/admin/PreviewPanel';
import PermissionGuard from '@/components/admin/PermissionGuard';
import SettingsAlert from '@/components/admin/SettingsAlert';
import ActionButtons from '@/components/admin/ActionButtons';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import Link from 'next/link';
import { useToast } from '@/lib/context/ToastContext';

// Define extended branding interface to include custom UI fields
interface ExtendedBranding {
  siteName: string;
  siteTagline: string;
  logoUrl: string;
  faviconUrl: string;
  metaTitle: string;
  metaDescription: string;
  socialImage?: string;
}

export default function BrandingSettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, isLoading } = useSiteSettings();
  const { showToast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize with empty strings to prevent uncontrolled to controlled warnings
  const [formData, setFormData] = useState<ExtendedBranding>({
    siteName: '',
    siteTagline: '',
    logoUrl: '',
    faviconUrl: '',
    metaTitle: '',
    metaDescription: '',
    socialImage: ''
  });

  useEffect(() => {
    if (!isLoading && settings) {
      setFormData({
        siteName: settings.siteName || '',
        siteTagline: settings.siteTagline || '',
        logoUrl: settings.logoUrl || '',
        faviconUrl: settings.faviconUrl || '',
        metaTitle: settings.metaTitle || '',
        metaDescription: settings.metaDescription || '',
        socialImage: ''
      });
      setHasChanges(false);
    }
  }, [settings, isLoading]);

  // Effect to detect changes
  useEffect(() => {
    if (!isLoading && settings) {
      const hasFieldChanges =
        formData.siteName !== (settings.siteName || '') ||
        formData.siteTagline !== (settings.siteTagline || '') ||
        formData.logoUrl !== (settings.logoUrl || '') ||
        formData.faviconUrl !== (settings.faviconUrl || '') ||
        formData.metaTitle !== (settings.metaTitle || '') ||
        formData.metaDescription !== (settings.metaDescription || '');

      setHasChanges(hasFieldChanges);
    }
  }, [formData, settings, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      await updateSettings({
        siteName: formData.siteName,
        siteTagline: formData.siteTagline,
        logoUrl: formData.logoUrl,
        faviconUrl: formData.faviconUrl,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription
      });
      showToast('Branding settings saved successfully', 'success');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving branding settings:', error);
      // Show a more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to save branding settings';
      showToast(errorMessage, 'error');

      // If it's an authentication error, redirect to login
      if (errorMessage.includes('Authentication required')) {
        showToast('You need to log in as an admin to save settings', 'error');
        // Optional: Redirect to login page
        // router.push('/auth/login?from=/admin/site-settings/branding');
      }
    }
  };

  const handleDiscardChanges = () => {
    if (settings) {
      setFormData({
        siteName: settings.siteName || '',
        siteTagline: settings.siteTagline || '',
        logoUrl: settings.logoUrl || '',
        faviconUrl: settings.faviconUrl || '',
        metaTitle: settings.metaTitle || '',
        metaDescription: settings.metaDescription || '',
        socialImage: ''
      });
    }
    showToast('Changes discarded', 'info');
    setHasChanges(false);
  };

  const handleImageUploaded = (field: string, url: string | null) => {
    setFormData({
      ...formData,
      [field]: url || ''
    });
    setHasChanges(true);
  };

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
    <div className="container mx-auto pb-20">
      <ActionButtons
        hasChanges={hasChanges}
        onSave={handleSaveChanges}
        onDiscard={handleDiscardChanges}
      />
      <PermissionGuard
        permissions={['settings:edit']}
        fallback={
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 text-center">
            <Settings size={48} className="mx-auto text-neutral-400 dark:text-neutral-600 mb-4" />
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">Access Denied</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              You don't have permission to edit branding settings.
            </p>
          </div>
        }
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center">
            <Link
              href="/admin/site-settings"
              className="mr-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft size={20} className="text-neutral-500 dark:text-neutral-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Branding Settings</h1>
              <p className="text-neutral-600 dark:text-neutral-400">Customize your brand identity and appearance</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-medium text-neutral-800 dark:text-white">Brand Identity</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Configure your store name, logo, and brand identity
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Store Name
                </label>
                <input
                  type="text"
                  name="siteName"
                  value={formData.siteName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                  placeholder="e.g. OMJ Ecommerce"
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  This is the name of your store that appears in the browser tab and various places on your site
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  name="siteTagline"
                  value={formData.siteTagline}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                  placeholder="e.g. Modern Unisex Boutique"
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  A short phrase that describes your business
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Logo
                </label>
                <div className="flex items-center mt-2">
                  <ImageUploader
                    initialImage={formData.logoUrl}
                    onImageChange={(url) => handleImageUploaded('logoUrl', url || '')}
                    aspectRatio="1:1"
                    label="Upload Logo"
                    className="w-full max-w-xs"
                    previewSize="md"
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  Recommended size: 200x200px, PNG or SVG with transparent background
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Favicon
                </label>
                <div className="flex items-center mt-2">
                  <ImageUploader
                    initialImage={formData.faviconUrl}
                    onImageChange={(url) => handleImageUploaded('faviconUrl', url || '')}
                    aspectRatio="1:1"
                    label="Upload Favicon"
                    className="w-full max-w-xs"
                    previewSize="md"
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  A small icon that appears in browser tabs (recommended size: 32x32px)
                </p>
              </div>
            </div>
          </div>
        </div>

        <PreviewPanel title="Brand Preview" defaultOpen={true}>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              {formData.logoUrl && (
                <div className="mb-4 w-32 h-32 relative">
                  <img
                    src={formData.logoUrl}
                    alt={formData.siteName}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              <h1 className="text-2xl font-bold mb-2">{formData.siteName || 'Your Store Name'}</h1>
              {formData.siteTagline && (
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">{formData.siteTagline}</p>
              )}
              <div className="mt-4 flex space-x-4 justify-center">
                <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                  Shop Now
                </button>
                <button className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </PreviewPanel>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-medium text-neutral-800 dark:text-white">SEO Settings</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Configure search engine optimization settings
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Meta Title
              </label>
              <input
                type="text"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                placeholder="e.g. OMJ - Modern Unisex Boutique"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                The title that appears in search engine results (recommended: 50-60 characters)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Meta Description
              </label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                placeholder="Describe your store for search engines..."
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                A brief description of your store that appears in search results (recommended: 150-160 characters)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Social Media Image
              </label>
              <div className="flex items-center mt-2">
                <ImageUploader
                  initialImage={formData.socialImage || null}
                  onImageChange={(url) => handleImageUploaded('socialImage', url || '')}
                  aspectRatio="16:9"
                  label="Upload Social Image"
                  className="w-full max-w-md"
                  previewSize="lg"
                />
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                The image that appears when your site is shared on social media (recommended size: 1200x630px)
              </p>
            </div>
          </div>
        </div>
      </PermissionGuard>
    </div>
  );
}
