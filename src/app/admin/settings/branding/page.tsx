'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Undo2, Upload } from 'lucide-react';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import { useToast } from '@/lib/context/ToastContext';
import Image from 'next/image';
import ImageUploader from '@/components/ui/ImageUploader';

export default function BrandingSettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, isLoading } = useSiteSettings();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    siteName: settings?.siteName || '',
    siteTagline: settings?.siteTagline || '',
    logoUrl: settings?.logoUrl || '',
    faviconUrl: settings?.faviconUrl || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateSettings(formData);
      showToast('Branding settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving branding settings:', error);
      showToast('Failed to save branding settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form to current settings
  const handleReset = () => {
    setFormData({
      siteName: settings?.siteName || '',
      siteTagline: settings?.siteTagline || '',
      logoUrl: settings?.logoUrl || '',
      faviconUrl: settings?.faviconUrl || '',
    });
    showToast('Form reset to saved settings', 'info');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Branding Settings</h1>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Undo2 size={16} className="mr-2" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Site Name
            </label>
            <input
              type="text"
              id="siteName"
              name="siteName"
              value={formData.siteName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your site name"
            />
          </div>

          <div>
            <label htmlFor="siteTagline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Site Tagline
            </label>
            <input
              type="text"
              id="siteTagline"
              name="siteTagline"
              value={formData.siteTagline || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="A short description of your site"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo
            </label>
            <div className="flex items-start space-x-6">
              <ImageUploader
                initialImage={formData.logoUrl || null}
                onImageChange={(url) => setFormData({ ...formData, logoUrl: url || '' })}
                label="Upload Logo"
                previewSize="md"
                aspectRatio="1:1"
              />
              <div className="flex-1">
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Recommended size: 200x200 pixels. PNG or SVG format with transparent background works best.
                </p>
                <div className="mt-4">
                  <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Or enter logo URL
                  </label>
                  <input
                    type="text"
                    id="logoUrl"
                    name="logoUrl"
                    value={formData.logoUrl || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Favicon
            </label>
            <div className="flex items-start space-x-6">
              <ImageUploader
                initialImage={formData.faviconUrl || null}
                onImageChange={(url) => setFormData({ ...formData, faviconUrl: url || '' })}
                label="Upload Favicon"
                previewSize="sm"
                aspectRatio="1:1"
              />
              <div className="flex-1">
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Recommended size: 32x32 or 64x64 pixels. ICO, PNG, or SVG format.
                </p>
                <div className="mt-4">
                  <label htmlFor="faviconUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Or enter favicon URL
                  </label>
                  <input
                    type="text"
                    id="faviconUrl"
                    name="faviconUrl"
                    value={formData.faviconUrl || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
