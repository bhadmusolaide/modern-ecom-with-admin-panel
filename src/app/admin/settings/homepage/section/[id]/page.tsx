'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Save,
  ArrowLeft,
  Layout,
  Image,
  Type,
  Link as LinkIcon,
  Palette,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2
} from 'lucide-react';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import { useToast } from '@/lib/context/ToastContext';
import Link from 'next/link';
import { SectionItem } from '@/lib/data/siteSettings';
import ImageUploader from '@/components/ui/ImageUploader';

export default function SectionEditPage() {
  const router = useRouter();
  const { id } = useParams();
  const { settings, updateSection, isLoading } = useSiteSettings();
  const { showToast } = useToast();
  const [section, setSection] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<SectionItem>>({
    id: '',
    title: '',
    subtitle: '',
    imageUrl: '',
    link: '',
    description: ''
  });

  // Load section data
  useEffect(() => {
    if (!isLoading && settings?.homepageSections) {
      const sectionId = Array.isArray(id) ? id[0] : id;
      const foundSection = settings.homepageSections.find(s => s.id === sectionId);

      if (foundSection) {
        setSection(foundSection);
        setFormData({
          title: foundSection.title || '',
          subtitle: foundSection.subtitle || '',
          enabled: foundSection.enabled || false,
          backgroundColor: foundSection.backgroundColor || '',
          textColor: foundSection.textColor || '',
          buttonText: foundSection.buttonText || '',
          buttonLink: foundSection.buttonLink || '',
          imageUrl: foundSection.imageUrl || '',
          items: foundSection.items || []
        });
      }
    }
  }, [id, settings, isLoading]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: checked }));
  };

  // Handle image change
  const handleImageChange = (imageUrl: string | null) => {
    setFormData((prev: any) => ({ ...prev, imageUrl: imageUrl || '' }));
  };

  // Handle adding a new item
  const handleAddItem = () => {
    if (!newItem.id || !newItem.title) {
      showToast('ID and title are required for new items', 'error');
      return;
    }

    // Check if ID already exists
    if (formData.items.some((item: SectionItem) => item.id === newItem.id)) {
      showToast('An item with this ID already exists', 'error');
      return;
    }

    const updatedItems = [...formData.items, newItem];
    setFormData((prev: any) => ({ ...prev, items: updatedItems }));
    setNewItem({
      id: '',
      title: '',
      subtitle: '',
      imageUrl: '',
      link: '',
      description: ''
    });
    setShowAddItemForm(false);
  };

  // Handle removing an item
  const handleRemoveItem = (itemId: string) => {
    const updatedItems = formData.items.filter((item: SectionItem) => item.id !== itemId);
    setFormData((prev: any) => ({ ...prev, items: updatedItems }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Update the section
      await updateSection(Array.isArray(id) ? id[0] : id as string, formData);

      // Show success message
      showToast('Section updated successfully!', 'success');

      // Redirect back to homepage settings
      router.push('/admin/settings/homepage');
    } catch (error) {
      console.error('Error updating section:', error);
      showToast('Failed to update section. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !section) {
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
        <div className="flex items-center">
          <button
            onClick={() => router.push('/admin/settings/homepage')}
            className="mr-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Section: {section.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">{section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center mr-2"
          >
            <LinkIcon size={16} className="mr-2" />
            Preview
          </Link>
          <button
            type="submit"
            form="section-form"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-black rounded-md hover:bg-blue-700 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Section Settings</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Customize the content and appearance of this section.
          </p>
        </div>

        <form id="section-form" onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Settings */}
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-md font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Basic Settings
              </h3>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  name="enabled"
                  checked={formData.enabled}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Enable Section
                </label>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Section title"
                />
              </div>

              <div>
                <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subtitle
                </label>
                <input
                  type="text"
                  id="subtitle"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Section subtitle"
                />
              </div>
            </div>

            {/* Appearance Settings */}
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-md font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Appearance
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Background Color
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="color"
                      id="backgroundColor"
                      name="backgroundColor"
                      value={formData.backgroundColor || '#ffffff'}
                      onChange={handleChange}
                      className="h-10 w-10 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      name="backgroundColor"
                      value={formData.backgroundColor || ''}
                      onChange={handleChange}
                      className="ml-2 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="textColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Text Color
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="color"
                      id="textColor"
                      name="textColor"
                      value={formData.textColor || '#000000'}
                      onChange={handleChange}
                      className="h-10 w-10 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      name="textColor"
                      value={formData.textColor || ''}
                      onChange={handleChange}
                      className="ml-2 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Button Settings */}
            {(section.type === 'hero' || section.type === 'banner') && (
              <div className="space-y-6 md:col-span-2">
                <h3 className="text-md font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Button
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="buttonText" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Button Text
                    </label>
                    <input
                      type="text"
                      id="buttonText"
                      name="buttonText"
                      value={formData.buttonText || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Shop Now"
                    />
                  </div>

                  <div>
                    <label htmlFor="buttonLink" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Button Link
                    </label>
                    <input
                      type="text"
                      id="buttonLink"
                      name="buttonLink"
                      value={formData.buttonLink || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="/shop"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Image Settings */}
            {(section.type === 'hero' || section.type === 'banner') && (
              <div className="space-y-6 md:col-span-2">
                <h3 className="text-md font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Image
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Section Image
                    </label>
                    <ImageUploader
                      initialImage={formData.imageUrl || null}
                      onImageChange={handleImageChange}
                      label="Upload Image"
                      previewSize="lg"
                      aspectRatio="16:9"
                    />
                  </div>

                  <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Or enter image URL
                    </label>
                    <input
                      type="text"
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Recommended size: 1920x1080 pixels for hero sections.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Items Settings */}
            {(section.type === 'categories' || section.type === 'values') && (
              <div className="space-y-6 md:col-span-2">
                <h3 className="text-md font-medium text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Section Items
                </h3>

                {formData.items && formData.items.length > 0 ? (
                  <div className="space-y-4">
                    {formData.items.map((item: SectionItem) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-md"
                      >
                        <div className="flex items-center">
                          {item.imageUrl && (
                            <div className="w-12 h-12 mr-4 rounded-md overflow-hidden">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {item.subtitle}
                              </div>
                            )}
                            {item.link && (
                              <div className="text-sm text-blue-600 dark:text-blue-400">
                                {item.link}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                    <p className="text-gray-500 dark:text-gray-400">No items added yet.</p>
                  </div>
                )}

                {showAddItemForm ? (
                  <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Add Item</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Item ID
                        </label>
                        <input
                          type="text"
                          id="itemId"
                          value={newItem.id}
                          onChange={(e) => setNewItem({ ...newItem, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                          placeholder="e.g. item-1"
                          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="itemTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          id="itemTitle"
                          value={newItem.title}
                          onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                          placeholder="Item title"
                          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="itemSubtitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          id="itemSubtitle"
                          value={newItem.subtitle}
                          onChange={(e) => setNewItem({ ...newItem, subtitle: e.target.value })}
                          placeholder="Item subtitle"
                          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="itemLink" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Link
                        </label>
                        <input
                          type="text"
                          id="itemLink"
                          value={newItem.link}
                          onChange={(e) => setNewItem({ ...newItem, link: e.target.value })}
                          placeholder="/category/item"
                          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="itemImageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Image URL
                      </label>
                      <input
                        type="text"
                        id="itemImageUrl"
                        value={newItem.imageUrl}
                        onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {section.type === 'values' && (
                      <div className="mb-4">
                        <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          id="itemDescription"
                          value={newItem.description}
                          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                          rows={3}
                          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Item description"
                        />
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowAddItemForm(false)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddItemForm(true)}
                    className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Item
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <Link
              href="/admin/settings/homepage"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 mr-3"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-black rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
