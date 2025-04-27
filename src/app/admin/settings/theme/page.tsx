'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Undo2, Palette } from 'lucide-react';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import { useToast } from '@/lib/context/ToastContext';

export default function ThemeSettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, isLoading } = useSiteSettings();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    primaryColor: settings?.primaryColor || '#3b82f6',
    secondaryColor: settings?.secondaryColor || '#10b981',
    accentColor: settings?.accentColor || '#f59e0b',
    fontPrimary: settings?.fontPrimary || 'Inter',
    fontSecondary: settings?.fontSecondary || 'Playfair Display',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await updateSettings(formData);
      showToast('Theme settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving theme settings:', error);
      showToast('Failed to save theme settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form to current settings
  const handleReset = () => {
    setFormData({
      primaryColor: settings?.primaryColor || '#3b82f6',
      secondaryColor: settings?.secondaryColor || '#10b981',
      accentColor: settings?.accentColor || '#f59e0b',
      fontPrimary: settings?.fontPrimary || 'Inter',
      fontSecondary: settings?.fontSecondary || 'Playfair Display',
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Theme Settings</h1>
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
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Primary Color
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    id="primaryColor"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="h-10 w-10 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="ml-2 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Main color for buttons, links, and primary elements.
                </p>
              </div>

              <div>
                <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Secondary Color
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    id="secondaryColor"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="h-10 w-10 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="ml-2 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Used for secondary buttons and elements.
                </p>
              </div>

              <div>
                <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Accent Color
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="color"
                    id="accentColor"
                    name="accentColor"
                    value={formData.accentColor}
                    onChange={handleChange}
                    className="h-10 w-10 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="accentColor"
                    value={formData.accentColor}
                    onChange={handleChange}
                    className="ml-2 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Used for highlights, badges, and accent elements.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Typography</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fontPrimary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Primary Font
                </label>
                <select
                  id="fontPrimary"
                  name="fontPrimary"
                  value={formData.fontPrimary}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Montserrat">Montserrat</option>
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Main font used for body text and most UI elements.
                </p>
              </div>

              <div>
                <label htmlFor="fontSecondary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Secondary Font
                </label>
                <select
                  id="fontSecondary"
                  name="fontSecondary"
                  value={formData.fontSecondary}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Merriweather">Merriweather</option>
                  <option value="Lora">Lora</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Raleway">Raleway</option>
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Used for headings, titles, and accent text.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preview</h2>
            <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900">
              <div className="mb-4">
                <div 
                  className="h-10 rounded-md mb-2" 
                  style={{ backgroundColor: formData.primaryColor }}
                ></div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Primary Color</div>
              </div>
              <div className="mb-4">
                <div 
                  className="h-10 rounded-md mb-2" 
                  style={{ backgroundColor: formData.secondaryColor }}
                ></div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Secondary Color</div>
              </div>
              <div className="mb-4">
                <div 
                  className="h-10 rounded-md mb-2" 
                  style={{ backgroundColor: formData.accentColor }}
                ></div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Accent Color</div>
              </div>
              <div className="mb-4">
                <h3 
                  className="text-xl font-bold mb-2" 
                  style={{ fontFamily: formData.fontSecondary }}
                >
                  This is a heading in {formData.fontSecondary}
                </h3>
                <p 
                  className="text-base" 
                  style={{ fontFamily: formData.fontPrimary }}
                >
                  This is body text in {formData.fontPrimary}. It demonstrates how the primary font looks in a paragraph.
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-white"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  Primary Button
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-white"
                  style={{ backgroundColor: formData.secondaryColor }}
                >
                  Secondary Button
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-white"
                  style={{ backgroundColor: formData.accentColor }}
                >
                  Accent Button
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
