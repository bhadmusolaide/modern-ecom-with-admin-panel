'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Undo2,
  Layout,
  Plus,
  Eye,
  MoveUp,
  MoveDown,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  GripVertical
} from 'lucide-react';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import Link from 'next/link';
import { SiteSection } from '@/lib/data/siteSettings';
import { useToast } from '@/lib/context/ToastContext';

export default function HomepageSettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, reorderSections, updateSection, resetToDefaults, isLoading } = useSiteSettings();
  const { showToast } = useToast();
  const [sections, setSections] = useState<SiteSection[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize sections from settings
  useEffect(() => {
    if (!isLoading && settings?.homepageSections) {
      const sortedSections = [...settings.homepageSections].sort((a, b) => a.order - b.order);
      setSections(sortedSections);
    }
  }, [settings, isLoading]);

  // Handle section toggle
  const handleToggleSection = async (sectionId: string) => {
    const sectionIndex = sections.findIndex(section => section.id === sectionId);
    if (sectionIndex !== -1) {
      const updatedSections = [...sections];
      const newEnabledState = !updatedSections[sectionIndex].enabled;

      try {
        // Update the section directly via API
        await updateSection(sectionId, { enabled: newEnabledState });

        // Update local state
        updatedSections[sectionIndex] = {
          ...updatedSections[sectionIndex],
          enabled: newEnabledState
        };
        setSections(updatedSections);

        // Show success message
        showToast(`Section ${newEnabledState ? 'enabled' : 'disabled'} successfully!`, 'success');
      } catch (error) {
        console.error('Error toggling section:', error);
        showToast('Failed to toggle section. Please try again.', 'error');
      }
    }
  };

  // Handle section move up
  const handleMoveUp = async (sectionId: string) => {
    const sectionIndex = sections.findIndex(section => section.id === sectionId);
    if (sectionIndex > 0) {
      const updatedSections = [...sections];
      const temp = updatedSections[sectionIndex];
      updatedSections[sectionIndex] = updatedSections[sectionIndex - 1];
      updatedSections[sectionIndex - 1] = temp;
      
      // Update order property
      updatedSections.forEach((section, index) => {
        section.order = index + 1;
      });
      
      setSections(updatedSections);
      setHasChanges(true);
    }
  };

  // Handle section move down
  const handleMoveDown = async (sectionId: string) => {
    const sectionIndex = sections.findIndex(section => section.id === sectionId);
    if (sectionIndex < sections.length - 1) {
      const updatedSections = [...sections];
      const temp = updatedSections[sectionIndex];
      updatedSections[sectionIndex] = updatedSections[sectionIndex + 1];
      updatedSections[sectionIndex + 1] = temp;
      
      // Update order property
      updatedSections.forEach((section, index) => {
        section.order = index + 1;
      });
      
      setSections(updatedSections);
      setHasChanges(true);
    }
  };

  // Handle drag start
  const handleDragStart = (sectionId: string) => {
    setIsDragging(true);
    setDraggedSectionId(sectionId);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    
    if (!draggedSectionId || draggedSectionId === targetSectionId) return;
    
    const draggedIndex = sections.findIndex(section => section.id === draggedSectionId);
    const targetIndex = sections.findIndex(section => section.id === targetSectionId);
    
    if (draggedIndex === targetIndex) return;
    
    const updatedSections = [...sections];
    const draggedSection = updatedSections[draggedIndex];
    
    // Remove the dragged section
    updatedSections.splice(draggedIndex, 1);
    
    // Insert it at the target position
    updatedSections.splice(targetIndex, 0, draggedSection);
    
    // Update order property
    updatedSections.forEach((section, index) => {
      section.order = index + 1;
    });
    
    setSections(updatedSections);
    setHasChanges(true);
  };

  // Handle drag end
  const handleDragEnd = async () => {
    if (draggedSectionId && hasChanges) {
      try {
        // Get the section IDs in the current order
        const sectionIds = sections.map(section => section.id);

        // Call the API to reorder sections
        await reorderSections(sectionIds);

        // Show success message
        showToast('Sections reordered successfully!', 'success');
        setHasChanges(false);
      } catch (error) {
        console.error('Error reordering sections:', error);
        showToast('Failed to reorder sections. Please try again.', 'error');
      }
    }

    setIsDragging(false);
    setDraggedSectionId(null);
  };

  // Save changes
  const handleSaveChanges = async () => {
    try {
      // Get the section IDs in the current order
      const sectionIds = sections.map(section => section.id);

      // Call the API to reorder sections
      await reorderSections(sectionIds);

      setHasChanges(false);
      showToast('Homepage settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving homepage settings:', error);
      showToast('Failed to save homepage settings. Please try again.', 'error');
    }
  };

  // Reset changes
  const handleResetChanges = () => {
    if (settings?.homepageSections) {
      const sortedSections = [...settings.homepageSections].sort((a, b) => a.order - b.order);
      setSections(sortedSections);
      setHasChanges(false);
      showToast('Changes reset to saved settings', 'info');
    }
  };

  // Handle reset to defaults
  const handleResetToDefaults = async () => {
    if (confirm('Are you sure you want to reset all homepage sections to defaults? This action cannot be undone.')) {
      try {
        await resetToDefaults();
        showToast('Homepage sections reset to defaults successfully!', 'success');
      } catch (error) {
        console.error('Error resetting to defaults:', error);
        showToast('Failed to reset to defaults. Please try again.', 'error');
      }
    }
  };

  // Get section icon
  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'hero':
        return <Layout size={20} />;
      case 'categories':
        return <Layout size={20} />;
      case 'featured':
        return <Layout size={20} />;
      case 'banner':
        return <Layout size={20} />;
      case 'values':
        return <Layout size={20} />;
      case 'new-arrivals':
        return <Layout size={20} />;
      default:
        return <Layout size={20} />;
    }
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Homepage Sections</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and reorder homepage sections</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center"
          >
            <Eye size={16} className="mr-2" />
            Preview
          </Link>
          {hasChanges && (
            <>
              <button
                onClick={handleResetChanges}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center"
              >
                <Undo2 size={16} className="mr-2" />
                Reset
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Manage Sections</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Drag and drop to reorder sections. Click the toggle to enable or disable sections.
          </p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(section.id)}
                onDragOver={(e) => handleDragOver(e, section.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center p-4 border ${
                  draggedSectionId === section.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                } rounded-lg ${
                  section.enabled
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-gray-50 dark:bg-gray-900'
                }`}
              >
                <div className="cursor-move text-gray-400 dark:text-gray-500 mr-3">
                  <GripVertical size={20} />
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                  section.enabled
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {getSectionIcon(section.type)}
                </div>
                <div className="flex-grow">
                  <h3 className={`font-medium ${
                    section.enabled
                      ? 'text-gray-800 dark:text-gray-200'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {section.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleMoveUp(section.id)}
                    disabled={index === 0}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move Up"
                  >
                    <MoveUp size={18} />
                  </button>
                  <button
                    onClick={() => handleMoveDown(section.id)}
                    disabled={index === sections.length - 1}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move Down"
                  >
                    <MoveDown size={18} />
                  </button>
                  <Link
                    href={`/admin/settings/homepage/section/${section.id}`}
                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Edit Section"
                  >
                    <Edit size={18} />
                  </Link>
                  <button
                    onClick={() => handleToggleSection(section.id)}
                    className={`p-2 ${
                      section.enabled
                        ? 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                    title={section.enabled ? 'Disable Section' : 'Enable Section'}
                  >
                    {section.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {sections.length === 0 && (
            <div className="text-center py-12">
              <Layout size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">No Sections Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                There are no homepage sections configured.
              </p>
              <button
                onClick={handleResetToDefaults}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Reset to Defaults
              </button>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleResetToDefaults}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center"
            >
              <Undo2 size={16} className="mr-2" />
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
