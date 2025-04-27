'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Undo2,
  ArrowLeft,
  Palette,
  Settings,
  ToggleLeft,
  ToggleRight,
  ShoppingBag,
  Star,
  Heart
} from 'lucide-react';
import PreviewPanel from '@/components/admin/PreviewPanel';
import PermissionGuard from '@/components/admin/PermissionGuard';
import SettingsAlert from '@/components/admin/SettingsAlert';
import ActionButtons from '@/components/admin/ActionButtons';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import Link from 'next/link';
import { useToast } from '@/lib/context/ToastContext';

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontPrimary: string;
  fontSecondary: string;
  borderRadius: string;
  darkMode: boolean;
}

export default function ThemeSettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, isLoading } = useSiteSettings();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<ThemeSettings>({
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    accentColor: '#f59e0b',
    fontPrimary: 'Inter',
    fontSecondary: 'Playfair Display',
    borderRadius: 'md',
    darkMode: false
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!isLoading && settings) {
      setFormData({
        primaryColor: settings.primaryColor || '#3b82f6',
        secondaryColor: settings.secondaryColor || '#10b981',
        accentColor: settings.accentColor || '#f59e0b',
        fontPrimary: settings.fontPrimary || 'Inter',
        fontSecondary: settings.fontSecondary || 'Playfair Display',
        borderRadius: 'md',
        darkMode: false
      });
      setHasChanges(false);
    }
  }, [settings, isLoading]);

  // Effect to detect changes
  useEffect(() => {
    if (!isLoading && settings) {
      const hasFieldChanges =
        formData.primaryColor !== (settings.primaryColor || '#3b82f6') ||
        formData.secondaryColor !== (settings.secondaryColor || '#10b981') ||
        formData.accentColor !== (settings.accentColor || '#f59e0b') ||
        formData.fontPrimary !== (settings.fontPrimary || 'Inter') ||
        formData.fontSecondary !== (settings.fontSecondary || 'Playfair Display');

      setHasChanges(hasFieldChanges);
    }
  }, [formData, settings, isLoading]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setHasChanges(true);
  };

  const handleToggleDarkMode = () => {
    setFormData({
      ...formData,
      darkMode: !formData.darkMode
    });
    setHasChanges(true);
  };

  // Handle form submission
  const handleSaveChanges = async () => {
    try {
      await updateSettings({
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor,
        fontPrimary: formData.fontPrimary,
        fontSecondary: formData.fontSecondary
      });
      showToast('Theme settings saved successfully', 'success');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving theme settings:', error);
      showToast('Failed to save theme settings', 'error');
    }
  };

  const handleDiscardChanges = () => {
    if (settings) {
      setFormData({
        primaryColor: settings.primaryColor || '#3b82f6',
        secondaryColor: settings.secondaryColor || '#10b981',
        accentColor: settings.accentColor || '#f59e0b',
        fontPrimary: settings.fontPrimary || 'Inter',
        fontSecondary: settings.fontSecondary || 'Playfair Display',
        borderRadius: 'md',
        darkMode: false
      });
    }
    showToast('Changes discarded', 'info');
    setHasChanges(false);
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
              You don't have permission to edit theme settings.
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
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Theme Settings</h1>
              <p className="text-neutral-600 dark:text-neutral-400">Customize your website's colors, fonts, and visual style</p>
            </div>
          </div>
        </div>

        <PreviewPanel title="Theme Preview" defaultOpen={true}>
          <div className="p-6" style={{ backgroundColor: formData.darkMode ? '#1f2937' : '#f9fafb', color: formData.darkMode ? '#f9fafb' : '#1f2937' }}>
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: formData.fontPrimary, color: formData.darkMode ? '#f9fafb' : '#1f2937' }}>Theme Preview</h2>
                <p className="mb-6" style={{ fontFamily: formData.fontSecondary, color: formData.darkMode ? '#d1d5db' : '#4b5563' }}>
                  This preview shows how your selected colors, fonts, and styles will appear on your website.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="rounded-md overflow-hidden shadow-md" style={{ borderRadius: formData.borderRadius === 'none' ? '0' : formData.borderRadius === 'sm' ? '0.125rem' : formData.borderRadius === 'md' ? '0.25rem' : formData.borderRadius === 'lg' ? '0.5rem' : formData.borderRadius === 'xl' ? '0.75rem' : formData.borderRadius === '2xl' ? '1rem' : '9999px' }}>
                    <div className="h-40 bg-neutral-200 dark:bg-neutral-700"></div>
                    <div className="p-4" style={{ backgroundColor: formData.darkMode ? '#374151' : '#ffffff' }}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium" style={{ fontFamily: formData.fontPrimary, color: formData.darkMode ? '#f9fafb' : '#1f2937' }}>Product Title</h3>
                        <Heart size={18} style={{ color: formData.accentColor }} />
                      </div>
                      <p className="text-sm mb-3" style={{ fontFamily: formData.fontSecondary, color: formData.darkMode ? '#d1d5db' : '#4b5563' }}>$99.99</p>
                      <button style={{ backgroundColor: formData.primaryColor, color: '#ffffff', borderRadius: formData.borderRadius === 'none' ? '0' : formData.borderRadius === 'sm' ? '0.125rem' : formData.borderRadius === 'md' ? '0.25rem' : formData.borderRadius === 'lg' ? '0.5rem' : formData.borderRadius === 'xl' ? '0.75rem' : formData.borderRadius === '2xl' ? '1rem' : '9999px', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                        Add to Cart
                      </button>
                    </div>
                  </div>

                  <div className="rounded-md overflow-hidden shadow-md" style={{ borderRadius: formData.borderRadius === 'none' ? '0' : formData.borderRadius === 'sm' ? '0.125rem' : formData.borderRadius === 'md' ? '0.25rem' : formData.borderRadius === 'lg' ? '0.5rem' : formData.borderRadius === 'xl' ? '0.75rem' : formData.borderRadius === '2xl' ? '1rem' : '9999px' }}>
                    <div className="h-40 bg-neutral-200 dark:bg-neutral-700"></div>
                    <div className="p-4" style={{ backgroundColor: formData.darkMode ? '#374151' : '#ffffff' }}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium" style={{ fontFamily: formData.fontPrimary, color: formData.darkMode ? '#f9fafb' : '#1f2937' }}>Product Title</h3>
                        <div style={{ backgroundColor: formData.secondaryColor, color: '#ffffff', borderRadius: formData.borderRadius === 'none' ? '0' : formData.borderRadius === 'sm' ? '0.125rem' : formData.borderRadius === 'md' ? '0.25rem' : formData.borderRadius === 'lg' ? '0.5rem' : formData.borderRadius === 'xl' ? '0.75rem' : formData.borderRadius === '2xl' ? '1rem' : '9999px', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          Sale
                        </div>
                      </div>
                      <p className="text-sm mb-3" style={{ fontFamily: formData.fontSecondary, color: formData.darkMode ? '#d1d5db' : '#4b5563' }}>$79.99</p>
                      <button style={{ backgroundColor: formData.primaryColor, color: '#ffffff', borderRadius: formData.borderRadius === 'none' ? '0' : formData.borderRadius === 'sm' ? '0.125rem' : formData.borderRadius === 'md' ? '0.25rem' : formData.borderRadius === 'lg' ? '0.5rem' : formData.borderRadius === 'xl' ? '0.75rem' : formData.borderRadius === '2xl' ? '1rem' : '9999px', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                        Add to Cart
                      </button>
                    </div>
                  </div>

                  <div className="rounded-md overflow-hidden shadow-md" style={{ borderRadius: formData.borderRadius === 'none' ? '0' : formData.borderRadius === 'sm' ? '0.125rem' : formData.borderRadius === 'md' ? '0.25rem' : formData.borderRadius === 'lg' ? '0.5rem' : formData.borderRadius === 'xl' ? '0.75rem' : formData.borderRadius === '2xl' ? '1rem' : '9999px' }}>
                    <div className="h-40 bg-neutral-200 dark:bg-neutral-700"></div>
                    <div className="p-4" style={{ backgroundColor: formData.darkMode ? '#374151' : '#ffffff' }}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium" style={{ fontFamily: formData.fontPrimary, color: formData.darkMode ? '#f9fafb' : '#1f2937' }}>Product Title</h3>
                        <div style={{ backgroundColor: formData.accentColor, color: '#ffffff', borderRadius: formData.borderRadius === 'none' ? '0' : formData.borderRadius === 'sm' ? '0.125rem' : formData.borderRadius === 'md' ? '0.25rem' : formData.borderRadius === 'lg' ? '0.5rem' : formData.borderRadius === 'xl' ? '0.75rem' : formData.borderRadius === '2xl' ? '1rem' : '9999px', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          New
                        </div>
                      </div>
                      <p className="text-sm mb-3" style={{ fontFamily: formData.fontSecondary, color: formData.darkMode ? '#d1d5db' : '#4b5563' }}>$129.99</p>
                      <button style={{ backgroundColor: formData.primaryColor, color: '#ffffff', borderRadius: formData.borderRadius === 'none' ? '0' : formData.borderRadius === 'sm' ? '0.125rem' : formData.borderRadius === 'md' ? '0.25rem' : formData.borderRadius === 'lg' ? '0.5rem' : formData.borderRadius === 'xl' ? '0.75rem' : formData.borderRadius === '2xl' ? '1rem' : '9999px', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                  <button style={{ backgroundColor: formData.primaryColor, color: '#ffffff', borderRadius: formData.borderRadius === 'none' ? '0' : formData.borderRadius === 'sm' ? '0.125rem' : formData.borderRadius === 'md' ? '0.25rem' : formData.borderRadius === 'lg' ? '0.5rem' : formData.borderRadius === 'xl' ? '0.75rem' : formData.borderRadius === '2xl' ? '1rem' : '9999px', padding: '0.75rem 1.5rem', fontFamily: formData.fontPrimary }}>
                    Primary Button
                  </button>

                  <button style={{ backgroundColor: formData.secondaryColor, color: '#ffffff', borderRadius: formData.borderRadius === 'none' ? '0' : formData.borderRadius === 'sm' ? '0.125rem' : formData.borderRadius === 'md' ? '0.25rem' : formData.borderRadius === 'lg' ? '0.5rem' : formData.borderRadius === 'xl' ? '0.75rem' : formData.borderRadius === '2xl' ? '1rem' : '9999px', padding: '0.75rem 1.5rem', fontFamily: formData.fontPrimary }}>
                    Secondary Button
                  </button>

                  <button style={{ backgroundColor: 'transparent', color: formData.primaryColor, borderRadius: formData.borderRadius === 'none' ? '0' : formData.borderRadius === 'sm' ? '0.125rem' : formData.borderRadius === 'md' ? '0.25rem' : formData.borderRadius === 'lg' ? '0.5rem' : formData.borderRadius === 'xl' ? '0.75rem' : formData.borderRadius === '2xl' ? '1rem' : '9999px', padding: '0.75rem 1.5rem', fontFamily: formData.fontPrimary, border: `1px solid ${formData.primaryColor}` }}>
                    Outline Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        </PreviewPanel>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-medium text-neutral-800 dark:text-white">Colors</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Customize your website's color scheme
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="w-10 h-10 rounded-md border border-neutral-300 dark:border-neutral-600 mr-2"
                  />
                  <input
                    type="text"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Main brand color used for buttons, links, and accents
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Secondary Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="w-10 h-10 rounded-md border border-neutral-300 dark:border-neutral-600 mr-2"
                  />
                  <input
                    type="text"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Secondary brand color used for backgrounds and supporting elements
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    name="accentColor"
                    value={formData.accentColor}
                    onChange={handleChange}
                    className="w-10 h-10 rounded-md border border-neutral-300 dark:border-neutral-600 mr-2"
                  />
                  <input
                    type="text"
                    name="accentColor"
                    value={formData.accentColor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Used for highlights and special elements
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-medium text-neutral-800 dark:text-white">Typography</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Customize your website's fonts
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fontPrimary" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Primary Font
                </label>
                <select
                  id="fontPrimary"
                  name="fontPrimary"
                  value={formData.fontPrimary}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-neutral-800 dark:text-white"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                </select>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Used for headings and important text
                </p>
              </div>

              <div>
                <label htmlFor="fontSecondary" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Secondary Font
                </label>
                <select
                  id="fontSecondary"
                  name="fontSecondary"
                  value={formData.fontSecondary}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-neutral-800 dark:text-white"
                >
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Merriweather">Merriweather</option>
                  <option value="Lora">Lora</option>
                  <option value="Roboto Slab">Roboto Slab</option>
                  <option value="Georgia">Georgia</option>
                </select>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Used for body text and secondary elements
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-medium text-neutral-800 dark:text-white">Visual Style</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Configure additional visual settings
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="borderRadius" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Border Radius
              </label>
              <select
                id="borderRadius"
                name="borderRadius"
                value={formData.borderRadius}
                onChange={handleChange}
                className="w-full md:w-1/3 px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-neutral-800 dark:text-white"
              >
                <option value="none">None (0px)</option>
                <option value="sm">Small (0.125rem)</option>
                <option value="md">Medium (0.25rem)</option>
                <option value="lg">Large (0.5rem)</option>
                <option value="xl">Extra Large (0.75rem)</option>
                <option value="2xl">2XL (1rem)</option>
                <option value="full">Full (9999px)</option>
              </select>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Controls the roundness of corners for buttons, cards, and other elements
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-neutral-800 dark:text-white">Dark Mode</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Enable dark mode support for your website
                </p>
              </div>
              <button
                onClick={handleToggleDarkMode}
                className="text-primary"
              >
                {formData.darkMode ? (
                  <ToggleRight size={40} />
                ) : (
                  <ToggleLeft size={40} />
                )}
              </button>
            </div>
          </div>
        </div>
      </PermissionGuard>
    </div>
  );
}
