'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Undo2,
  ArrowLeft,
  Settings,
  Layers,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import { SiteSection } from '@/lib/data/siteSettings';
import Link from 'next/link';
import { useToast } from '@/lib/context/ToastContext';
import ActionButtons from '@/components/admin/ActionButtons';

export default function HomepageSettingsPage() {
  const router = useRouter();
  const { settings, updateSection, reorderSections, resetToDefaults, addSection, isLoading } = useSiteSettings();
  const { showToast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [sections, setSections] = useState<SiteSection[]>([]);

  useEffect(() => {
    if (!isLoading && settings) {
      setSections(settings.homepageSections || []);
      setHasChanges(false);
    }
  }, [settings, isLoading]);

  const handleToggleSection = async (sectionId: string) => {
    try {
      const sectionIndex = sections.findIndex(section => section.id === sectionId);
      if (sectionIndex === -1) return;

      const section = sections[sectionIndex];
      await updateSection(sectionId, { enabled: !section.enabled });

      // Update local state
      const updatedSections = [...sections];
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        enabled: !section.enabled
      };
      setSections(updatedSections);

      showToast(`Section ${section.enabled ? 'disabled' : 'enabled'}`, 'success');
    } catch (error) {
      console.error('Error toggling section:', error);
      showToast('Failed to update section', 'error');
    }
  };

  const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
    try {
      const sectionIndex = sections.findIndex(section => section.id === sectionId);
      if (sectionIndex === -1) return;

      // Can't move up if already at the top
      if (direction === 'up' && sectionIndex === 0) return;

      // Can't move down if already at the bottom
      if (direction === 'down' && sectionIndex === sections.length - 1) return;

      const newIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
      const updatedSections = [...sections];

      // Swap positions
      [updatedSections[sectionIndex], updatedSections[newIndex]] =
        [updatedSections[newIndex], updatedSections[sectionIndex]];

      // Update the order in the database
      const sectionIds = updatedSections.map(section => section.id);
      await reorderSections(sectionIds);

      // Update local state
      setSections(updatedSections);

      showToast('Section order updated', 'success');
    } catch (error) {
      console.error('Error moving section:', error);
      showToast('Failed to update section order', 'error');
    }
  };

  const handleEditSection = (sectionId: string) => {
    router.push(`/admin/site-settings/homepage/section/${sectionId}`);
  };

  const handleSaveChanges = async () => {
    if (!settings) return;

    try {
      // Extract just the IDs in the new order
      const sectionIds = sections.map(section => section.id);

      // Call the reorderSections function
      await reorderSections(sectionIds);

      showToast('Homepage sections order saved successfully', 'success');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving homepage sections order:', error);
      // Show a more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to save homepage sections order';
      showToast(errorMessage, 'error');

      // If it's an authentication error, provide more guidance
      if (errorMessage.includes('Authentication required')) {
        showToast('You need to log in as an admin to save settings', 'error');
        // Optional: Redirect to login page
        // router.push('/auth/login?from=/admin/site-settings/homepage');
      }
    }
  };

  const handleDiscardChanges = () => {
    if (!settings) return;

    setSections(settings.homepageSections || []);
    showToast('Changes discarded', 'info');
    setHasChanges(false);
  };

  const handleResetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all homepage sections to defaults? This cannot be undone.')) return;

    try {
      await resetToDefaults();
      showToast('Homepage sections reset to defaults successfully', 'success');
    } catch (error) {
      console.error('Error resetting homepage sections:', error);
      // Show a more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset homepage sections';
      showToast(errorMessage, 'error');

      // If it's an authentication error, provide more guidance
      if (errorMessage.includes('Authentication required')) {
        showToast('You need to log in as an admin to reset settings', 'error');
      }
    }
  };

  const handleAddSection = async (sectionType: string) => {
    try {
      await addSection(sectionType);
      showToast('Section added successfully', 'success');
      // Refresh the page to show the new section
      router.refresh();
    } catch (error) {
      console.error('Error adding section:', error);
      // Show a more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to add section';
      showToast(errorMessage, 'error');

      // If it's an authentication error, provide more guidance
      if (errorMessage.includes('Authentication required')) {
        showToast('You need to log in as an admin to add sections', 'error');
      }
    }
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
              You don't have permission to edit homepage settings.
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
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Homepage Settings</h1>
              <p className="text-neutral-600 dark:text-neutral-400">Customize your website's homepage layout and sections</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={handleResetToDefaults}
              className="px-4 py-2 border border-red-300 dark:border-red-700 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center text-sm"
            >
              <RotateCcw size={16} className="mr-1.5" />
              Reset to Defaults
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-medium text-neutral-800 dark:text-white">Homepage Sections</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Arrange and customize the sections on your homepage
            </p>
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {sections.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                No homepage sections found. Add sections to customize your homepage.
              </div>
            ) : (
              sections.map((section, index) => (
                <div key={section.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center mr-4 ${
                        section.enabled
                          ? 'bg-primary/10 text-primary'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                      }`}>
                        <Layers size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-neutral-800 dark:text-white flex items-center">
                          {section.title}
                          {!section.enabled && (
                            <span className="ml-2 text-xs bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded">
                              Hidden
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {section.type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleSection(section.id)}
                        className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                        aria-label={section.enabled ? 'Disable section' : 'Enable section'}
                      >
                        {section.enabled ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>

                      <button
                        onClick={() => handleMoveSection(section.id, 'up')}
                        disabled={index === 0}
                        className={`p-2 ${
                          index === 0
                            ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                            : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                        }`}
                        aria-label="Move section up"
                      >
                        <MoveUp size={18} />
                      </button>

                      <button
                        onClick={() => handleMoveSection(section.id, 'down')}
                        disabled={index === sections.length - 1}
                        className={`p-2 ${
                          index === sections.length - 1
                            ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                            : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                        }`}
                        aria-label="Move section down"
                      >
                        <MoveDown size={18} />
                      </button>

                      <button
                        onClick={() => handleEditSection(section.id)}
                        className="p-2 text-neutral-500 hover:text-primary dark:text-neutral-400 dark:hover:text-primary"
                        aria-label="Edit section"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-lg font-medium text-neutral-800 dark:text-white mb-4">Add New Section</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Choose from the available section types to add to your homepage
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => handleAddSection('hero')}
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer"
            >
              <h3 className="font-medium text-neutral-800 dark:text-white mb-2">Hero Banner</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                Large banner with heading, text, and call-to-action buttons
              </p>
              <button className="text-primary hover:text-primary-dark text-sm flex items-center">
                Add Section <ChevronRight size={16} className="ml-1" />
              </button>
            </div>

            <div
              onClick={() => handleAddSection('featured')}
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer"
            >
              <h3 className="font-medium text-neutral-800 dark:text-white mb-2">Featured Products</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                Showcase your best-selling or featured products
              </p>
              <button className="text-primary hover:text-primary-dark text-sm flex items-center">
                Add Section <ChevronRight size={16} className="ml-1" />
              </button>
            </div>

            <div
              onClick={() => handleAddSection('banner')}
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer"
            >
              <h3 className="font-medium text-neutral-800 dark:text-white mb-2">Image with Text</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                Image alongside text content and optional button
              </p>
              <button className="text-primary hover:text-primary-dark text-sm flex items-center">
                Add Section <ChevronRight size={16} className="ml-1" />
              </button>
            </div>

            <div
              onClick={() => handleAddSection('categories')}
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer"
            >
              <h3 className="font-medium text-neutral-800 dark:text-white mb-2">Collection Grid</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                Display your product collections in a grid layout
              </p>
              <button className="text-primary hover:text-primary-dark text-sm flex items-center">
                Add Section <ChevronRight size={16} className="ml-1" />
              </button>
            </div>

            <div
              onClick={() => handleAddSection('testimonials')}
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer"
            >
              <h3 className="font-medium text-neutral-800 dark:text-white mb-2">Testimonials</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                Customer reviews and testimonials carousel
              </p>
              <button className="text-primary hover:text-primary-dark text-sm flex items-center">
                Add Section <ChevronRight size={16} className="ml-1" />
              </button>
            </div>

            <div
              onClick={() => handleAddSection('newsletter')}
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer"
            >
              <h3 className="font-medium text-neutral-800 dark:text-white mb-2">Newsletter</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                Email signup form with heading and description
              </p>
              <button className="text-primary hover:text-primary-dark text-sm flex items-center">
                Add Section <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      </PermissionGuard>
    </div>
  );
}
