'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

import {
  Save,
  Undo2,
  ArrowLeft,
  Settings,
  Palette,
  Type,
  Link as LinkIcon,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import ImageUploader from '@/components/ui/ImageUploader';
import PreviewPanel from '@/components/admin/PreviewPanel';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import { SiteSection } from '@/lib/data/siteSettings';
import Link from 'next/link';
import { useToast } from '@/lib/context/ToastContext';
import ActionButtons from '@/components/admin/ActionButtons';

// Define section types
const sectionTypes = [
  { type: 'hero', label: 'Hero Banner' },
  { type: 'featured', label: 'Featured Products' },
  { type: 'banner', label: 'Promo Banner' },
  { type: 'categories', label: 'Collection Grid' },
  { type: 'values', label: 'Our Values' },
  { type: 'new-arrivals', label: 'New Arrivals' },
  { type: 'newsletter', label: 'Newsletter' }
];

// Extend SiteSection type with additional properties
interface ExtendedSiteSection extends SiteSection {
  buttonStyle?: 'primary' | 'secondary' | 'outline' | 'link';
  alignment?: 'left' | 'center' | 'right';
  fullWidth?: boolean;
}

interface FormData {
  title: string;
  subtitle: string;
  enabled: boolean;
  backgroundColor: string;
  textColor: string;
  buttonText: string;
  buttonLink: string;
  buttonStyle: 'primary' | 'secondary' | 'outline' | 'link';
  imageUrl: string;
  alignment: 'left' | 'center' | 'right';
  fullWidth: boolean;
}

export default function SectionEditPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(props.params);
  const { settings, updateSection, isLoading } = useSiteSettings();
  const { showToast } = useToast();
  const [section, setSection] = useState<ExtendedSiteSection | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<FormData | null>(null);

  useEffect(() => {
    if (!isLoading && settings) {
      const foundSection = settings.homepageSections.find(s => s.id === id) as ExtendedSiteSection;
      if (foundSection) {
        setSection(foundSection);
        const initialData = {
          title: foundSection.title || '',
          subtitle: foundSection.subtitle || '',
          enabled: foundSection.enabled,
          backgroundColor: foundSection.backgroundColor || '#ffffff',
          textColor: foundSection.textColor || '#000000',
          buttonText: foundSection.buttonText || '',
          buttonLink: foundSection.buttonLink || '',
          buttonStyle: foundSection.buttonStyle || 'primary',
          imageUrl: foundSection.imageUrl || '',
          alignment: foundSection.alignment || 'left',
          fullWidth: foundSection.fullWidth || false
        };
        setFormData(initialData);
      } else {
        router.push('/admin/site-settings/homepage');
      }
    }
  }, [settings, isLoading, id, router]);

  useEffect(() => {
    if (!isLoading && section && formData) {
      const original = {
        title: section.title || '',
        subtitle: section.subtitle || '',
        enabled: section.enabled,
        backgroundColor: section.backgroundColor || '#ffffff',
        textColor: section.textColor || '#000000',
        buttonText: section.buttonText || '',
        buttonLink: section.buttonLink || '',
        buttonStyle: section.buttonStyle || 'primary',
        imageUrl: section.imageUrl || '',
        alignment: section.alignment || 'left',
        fullWidth: section.fullWidth || false
      };

      const hasFieldChanges = Object.entries(formData).some(([key, value]) => value !== (original as any)[key]);
      setHasChanges(hasFieldChanges);
    }
  }, [formData, section, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    if (!formData) return;

    setFormData(prev => ({
      ...prev!,
      [name]: newValue
    }));
  };

  const handleToggle = (field: keyof FormData) => {
    if (!formData) return;

    const newValue = !formData[field];
    setFormData(prev => ({
      ...prev!,
      [field]: newValue
    }));
  };

  const handleSaveChanges = async () => {
    if (!section || !formData) {
      showToast('Section not found. Please refresh the page.', 'error');
      return;
    }

    // Set saving state to true
    setIsSaving(true);

    try {
      // Create an update object with only the fields that can be updated
      const updateData = {
        title: formData.title,
        subtitle: formData.subtitle,
        enabled: formData.enabled,
        backgroundColor: formData.backgroundColor,
        textColor: formData.textColor,
        buttonText: formData.buttonText,
        buttonLink: formData.buttonLink,
        buttonStyle: formData.buttonStyle,
        imageUrl: formData.imageUrl,
        alignment: formData.alignment,
        fullWidth: formData.fullWidth
      };

      console.log('Saving section changes:', { sectionId: id, updateData });

      // Show a saving toast
      showToast('Saving changes...', 'info');

      // Call the updateSection function from context
      await updateSection(id, updateData);

      // Show success message
      showToast('Section updated successfully', 'success');
      setHasChanges(false);

      // Small delay before navigation to ensure the toast is visible
      setTimeout(() => {
        router.push('/admin/site-settings/homepage');
      }, 1000); // Increased delay to ensure user sees the success message
    } catch (error) {
      console.error('Error updating section:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update section';

      // Show a more detailed error message
      showToast(errorMessage, 'error');

      // If it's an authentication error, provide more guidance
      if (errorMessage.includes('Authentication required') || errorMessage.includes('Not authenticated')) {
        showToast('You need to log in as an admin to update sections', 'error');
      }

      // If it's a server error, suggest refreshing
      if (errorMessage.includes('server') || errorMessage.includes('response')) {
        showToast('Server error. Please try refreshing the page.', 'error');
      }
    } finally {
      // Always reset saving state when done
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (!settings) return;

    const originalSection = settings.homepageSections.find(s => s.id === id);
    if (originalSection) {
      setSection(originalSection);
      showToast('Changes discarded', 'info');
      setHasChanges(false);
    }
  };

  // Helper function to handle image upload
  const handleImageUploaded = (url: string | null) => {
    if (!section || !formData) return;

    // Update form data
    setFormData(prev => ({
      ...prev!,
      imageUrl: url || ''
    }));

    // Update section state
    setSection({
      ...section,
      imageUrl: url || ''
    });

    // Mark that changes have been made
    setHasChanges(true);
  };

  if (isLoading || !section || !formData) {
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
        isSaving={isSaving}
      />
      <PermissionGuard
        permissions={['settings:edit']}
        fallback={
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 text-center">
            <Settings size={48} className="mx-auto text-neutral-400 dark:text-neutral-600 mb-4" />
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">Access Denied</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              You don't have permission to edit homepage sections.
            </p>
          </div>
        }
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center">
            <Link
              href="/admin/site-settings/homepage"
              className="mr-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft size={20} className="text-neutral-500 dark:text-neutral-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Edit Section</h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                {section?.title || sectionTypes.find(t => t.type === section?.type)?.label || 'Loading...'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-neutral-800 dark:text-white">General Settings</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Basic settings for this section
              </p>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-neutral-600 dark:text-neutral-400 mr-2">Enabled</span>
              <button
                onClick={() => handleToggle('enabled')}
                className="text-primary"
              >
                {formData.enabled ? (
                  <ToggleRight size={40} />
                ) : (
                  <ToggleLeft size={40} />
                )}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                  placeholder="e.g. Featured Products"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                  placeholder="e.g. Check out our most popular items"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-medium text-neutral-800 dark:text-white">Appearance</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Customize the visual style of this section
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Background Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    name="backgroundColor"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                    className="w-10 h-10 rounded-md border border-neutral-300 dark:border-neutral-600 mr-2"
                  />
                  <input
                    type="text"
                    name="backgroundColor"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Text Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    name="textColor"
                    value={formData.textColor}
                    onChange={handleChange}
                    className="w-10 h-10 rounded-md border border-neutral-300 dark:border-neutral-600 mr-2"
                  />
                  <input
                    type="text"
                    name="textColor"
                    value={formData.textColor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Alignment
                </label>
                <select
                  name="alignment"
                  value={formData.alignment}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    name="fullWidth"
                    checked={formData.fullWidth}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                  />
                  Full Width Section
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-medium text-neutral-800 dark:text-white">Content</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Configure the content for this section
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Image
              </label>
              <div className="mt-2">
                <ImageUploader
                  initialImage={formData.imageUrl}
                  onImageChange={(url) => handleImageUploaded(url || '')}
                  aspectRatio={section.type === 'hero' ? '16:9' : '1:1'}
                  label="Upload Section Image"
                  className="w-full max-w-md"
                  previewSize="lg"
                />
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                {section.type === 'hero' ? 'Recommended size: 1920x1080px' : 'Recommended size: 800x800px'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Button Text
                </label>
                <input
                  type="text"
                  name="buttonText"
                  value={formData.buttonText}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                  placeholder="e.g. Shop Now"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Button Link
                </label>
                <input
                  type="text"
                  name="buttonLink"
                  value={formData.buttonLink}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                  placeholder="e.g. /shop"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Button Style
              </label>
              <select
                name="buttonStyle"
                value={formData.buttonStyle}
                onChange={handleChange}
                className="w-full md:w-1/3 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
                <option value="link">Link</option>
              </select>
            </div>
          </div>
        </div>

        <PreviewPanel title="Section Preview" defaultOpen={true}>
          {section.type === 'hero' && (
            <div
              className="relative"
              style={{
                backgroundColor: formData.backgroundColor,
                color: formData.textColor
              }}
            >
              {formData.imageUrl && (
                <div className="absolute inset-0 z-0">
                  <img
                    src={formData.imageUrl}
                    alt={formData.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="relative z-10 py-24 px-6 text-center bg-black/30">
                <div className="max-w-3xl mx-auto">
                  <h1 className="text-4xl font-bold mb-4" style={{ color: formData.textColor }}>
                    {formData.title || 'Section Title'}
                  </h1>
                  {formData.subtitle && (
                    <p className="text-xl mb-8" style={{ color: formData.textColor }}>
                      {formData.subtitle}
                    </p>
                  )}
                  {formData.buttonText && (
                    <button
                      className={`px-6 py-3 rounded-md ${formData.buttonStyle === 'primary' ? 'bg-primary text-white' : 'border border-white text-white'}`}
                    >
                      {formData.buttonText}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {section.type === 'featured' && (
            <div
              className="py-16 px-6"
              style={{
                backgroundColor: formData.backgroundColor,
                color: formData.textColor
              }}
            >
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4" style={{ color: formData.textColor }}>
                    {formData.title || 'Featured Products'}
                  </h2>
                  {formData.subtitle && (
                    <p className="text-lg" style={{ color: formData.textColor }}>
                      {formData.subtitle}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="bg-white dark:bg-neutral-800 rounded-lg overflow-hidden shadow-md">
                      <div className="h-64 bg-neutral-200 dark:bg-neutral-700"></div>
                      <div className="p-4">
                        <h3 className="font-medium text-lg mb-2">Product {item}</h3>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-3">$99.99</p>
                        <button className="text-primary hover:underline">View Details</button>
                      </div>
                    </div>
                  ))}
                </div>

                {formData.buttonText && (
                  <div className="text-center mt-10">
                    <button
                      className={`px-6 py-3 rounded-md ${formData.buttonStyle === 'primary' ? 'bg-primary text-white' : 'border border-primary text-primary'}`}
                    >
                      {formData.buttonText}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {section.type !== 'hero' && section.type !== 'featured' && (
            <div
              className="py-16 px-6"
              style={{
                backgroundColor: formData.backgroundColor,
                color: formData.textColor
              }}
            >
              <div className="max-w-6xl mx-auto">
                <div
                  className={`flex flex-col ${
                    formData.alignment === 'center'
                      ? 'items-center text-center'
                      : formData.alignment === 'right'
                        ? 'items-end text-right'
                        : 'items-start text-left'
                  }`}
                >
                  <h2 className="text-3xl font-bold mb-4" style={{ color: formData.textColor }}>
                    {formData.title || 'Section Title'}
                  </h2>
                  {formData.subtitle && (
                    <p className="text-lg mb-6" style={{ color: formData.textColor }}>
                      {formData.subtitle}
                    </p>
                  )}
                  {formData.buttonText && (
                    <button
                      className={`px-6 py-3 rounded-md ${
                        formData.buttonStyle === 'primary'
                          ? 'bg-primary text-white'
                          : formData.buttonStyle === 'secondary'
                            ? 'bg-secondary text-white'
                            : 'border border-current'
                      }`}
                    >
                      {formData.buttonText}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </PreviewPanel>

        {/* Section-specific settings would go here based on section.type */}
      </PermissionGuard>
    </div>
  );
}
