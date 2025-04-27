'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Undo2 } from 'lucide-react';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import { useToast } from '@/lib/context/ToastContext';

export default function SettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, isLoading } = useSiteSettings();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    siteName: settings?.siteName || '',
    siteTagline: settings?.siteTagline || '',
    metaTitle: settings?.metaTitle || '',
    metaDescription: settings?.metaDescription || '',
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
      showToast('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form to current settings
  const handleReset = () => {
    setFormData({
      siteName: settings?.siteName || '',
      siteTagline: settings?.siteTagline || '',
      metaTitle: settings?.metaTitle || '',
      metaDescription: settings?.metaDescription || '',
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">General Settings</h1>
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
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This is the name that appears in the browser tab and is used by search engines.
            </p>
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
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              A short phrase that describes your site or business.
            </p>
          </div>

          <div>
            <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Meta Title
            </label>
            <input
              type="text"
              id="metaTitle"
              name="metaTitle"
              value={formData.metaTitle || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="SEO title for your site"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The title that appears in search engine results. If left empty, the site name will be used.
            </p>
          </div>

          <div>
            <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Meta Description
            </label>
            <textarea
              id="metaDescription"
              name="metaDescription"
              value={formData.metaDescription || ''}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="A brief description of your site for search engines"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              A short description that appears in search engine results. Keep it under 160 characters for best results.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
