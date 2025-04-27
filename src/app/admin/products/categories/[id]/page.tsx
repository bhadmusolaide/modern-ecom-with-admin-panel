'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/lib/context/ToastContext';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Image from 'next/image';
import S3Image from '@/components/ui/S3Image';
import ImageUploader from '@/components/ui/ImageUploader';
import { generateSlug, ensureUniqueSlug } from '@/lib/utils/slugUtils';
import { FiAlertTriangle, FiImage, FiLoader } from 'react-icons/fi';
import { getPathFromUrl, deleteFromSupabase } from '@/lib/supabase/storage';

export default function CategoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params?.id as string;
  const isEditMode = categoryId !== 'new';

  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    slug: '',
    parentId: '',
    parentName: '',
    isActive: true,
    order: 0,
  });
  const [originalData, setOriginalData] = useState({
    name: '',
    description: '',
    image: '',
    slug: '',
    parentId: '',
    parentName: '',
    isActive: true,
    order: 0,
  });
  const [existingSlugs, setExistingSlugs] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [category, setCategory] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [allCategories, setAllCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setPageLoading(true);
        await fetchExistingSlugs();

        if (isEditMode) {
          await fetchCategory();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Error loading category data', 'error');
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const categoryRef = doc(db, 'categories', categoryId);
      const categorySnap = await getDoc(categoryRef);

      if (categorySnap.exists()) {
        const categoryData = categorySnap.data();
        setCategory(categoryData);

        // If this category has a parent, fetch the parent's name
        let parentName = '';
        if (categoryData.parentId) {
          try {
            const parentRef = doc(db, 'categories', categoryData.parentId);
            const parentSnap = await getDoc(parentRef);
            if (parentSnap.exists()) {
              parentName = parentSnap.data().name || '';
            }
          } catch (err) {
            console.error('Error fetching parent category:', err);
          }
        }

        setFormData({
          name: categoryData.name || '',
          description: categoryData.description || '',
          image: categoryData.image || '',
          slug: categoryData.slug || '',
          parentId: categoryData.parentId || '',
          parentName: parentName,
          isActive: categoryData.isActive !== false, // Default to true if not set
          order: categoryData.order || 0,
        });

        setOriginalData({
          name: categoryData.name || '',
          description: categoryData.description || '',
          image: categoryData.image || '',
          slug: categoryData.slug || '',
          parentId: categoryData.parentId || '',
          parentName: parentName,
          isActive: categoryData.isActive !== false,
          order: categoryData.order || 0,
        });
      } else {
        showToast('Category not found', 'error');
        router.push('/admin/products/categories');
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      showToast('Error loading category', 'error');
    }
  };

  const fetchExistingSlugs = async () => {
    try {
      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);

      // Extract slugs for validation
      const slugs = snapshot.docs
        .map(doc => {
          // Exclude the current category's slug when in edit mode
          if (isEditMode && doc.id === categoryId) {
            return null;
          }
          return doc.data().slug;
        })
        .filter(slug => slug) as string[];
      setExistingSlugs(slugs);

      // Extract all categories for parent selection
      const categories = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            parentId: data.parentId || null,
            level: data.level || 0,
            slug: data.slug || '',
            ...data
          };
        })
        // Sort categories by name
        .sort((a, b) => a.name.localeCompare(b.name));

      setAllCategories(categories);
    } catch (error) {
      console.error('Error fetching categories data:', error);
      throw error;
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate slug when name changes, unless slug was manually edited
      slug: prev.slug === generateSlug(prev.name) ? generateSlug(name) : prev.slug
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = generateSlug(e.target.value);
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleImageChange = async (imageUrl: string | null, metadata?: any) => {
    if (!imageUrl) {
      setFormData(prev => ({ ...prev, image: '' }));
      return;
    }

    try {
      // If we have an existing image, delete it from Supabase
      if (formData.image) {
        const oldPath = getPathFromUrl(formData.image);
        if (oldPath) {
          await deleteFromSupabase(oldPath, 'categories');
        }
      }

      setFormData(prev => ({ ...prev, image: imageUrl }));
      setImageUploadError(null);
    } catch (error) {
      console.error('Error handling image change:', error);
      setImageUploadError('Failed to update image. Please try again.');
    }
  };

  const handleImageUploadStart = () => {
    setImageUploading(true);
    setImageUploadError(null);
  };

  const handleImageUploadComplete = () => {
    setImageUploading(false);
  };

  const handleImageUploadError = (error: string) => {
    setImageUploading(false);
    setImageUploadError(error);
    showToast(`Image upload failed: ${error}`, 'error');
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    // Generate a slug if not provided
    if (!formData.slug.trim()) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(formData.name)
      }));
    }

    // Ensure slug is properly formatted
    const formattedSlug = generateSlug(formData.slug);
    if (formattedSlug !== formData.slug) {
      setFormData(prev => ({ ...prev, slug: formattedSlug }));
    }

    // Check for duplicate slugs
    if (formData.slug && existingSlugs.includes(formData.slug)) {
      // Only show warning if the slug has changed from the original
      if (isEditMode && originalData.slug !== formData.slug) {
        newErrors.slug = 'This URL slug is already in use. It will be made unique on save.';
      } else if (!isEditMode) {
        newErrors.slug = 'This URL slug is already in use. It will be made unique on save.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Show errors and stop
      const errorMessage = Object.values(errors).join(', ');
      showToast(errorMessage || 'Please fix the errors before submitting', 'error');
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setLoading(true);

      // Prepare the category data
      const categoryData: Record<string, any> = {
        name: formData.name,
        description: formData.description,
        image: formData.image,
        updatedAt: new Date().toISOString(),
        parentId: formData.parentId || null,
        isActive: formData.isActive,
        order: formData.order || 0,
        level: formData.parentId ? 1 : 0, // Set level based on whether it has a parent
      };

      if (isEditMode) {
        // Update existing category
        const categoryRef = doc(db, 'categories', categoryId);

        // Check if we need to delete the old image
        if (originalData.image && originalData.image !== formData.image) {
          try {
            const oldPath = getPathFromUrl(originalData.image);
            if (oldPath) {
              await deleteFromSupabase(oldPath, 'categories');
            }
          } catch (error) {
            console.error('Error deleting old image:', error);
            // Continue with the update even if image deletion fails
          }
        }

        // Only update the slug if it has changed
        if (formData.slug !== originalData.slug) {
          const uniqueSlug = ensureUniqueSlug(formData.slug || generateSlug(formData.name), existingSlugs);
          categoryData.slug = uniqueSlug;
        }

        await updateDoc(categoryRef, categoryData);
        showToast('Category updated successfully', 'success');
      } else {
        // Create new category
        const categoriesRef = collection(db, 'categories');
        const uniqueSlug = ensureUniqueSlug(formData.slug || generateSlug(formData.name), existingSlugs);

        await addDoc(categoriesRef, {
          ...categoryData,
          slug: uniqueSlug,
          createdAt: new Date().toISOString(),
        });

        showToast('Category created successfully', 'success');
      }

      router.push('/admin/products/categories');
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} category:`, error);
      showToast(`Error ${isEditMode ? 'updating' : 'creating'} category: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FiLoader className="animate-spin h-8 w-8 mx-auto text-primary-600 mb-4" />
          <p className="text-neutral-600">Loading category data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          {isEditMode ? 'Edit Category' : 'New Category'}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {isEditMode ? 'Update an existing product category' : 'Create a new product category'}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <form onSubmit={handleSubmitClick} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Enter category name"
              required
              className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${errors.name ? 'border-red-500' : 'border-neutral-300'}`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              URL Slug
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={formData.slug}
                onChange={handleSlugChange}
                placeholder="Enter URL slug"
                className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${errors.slug ? 'border-red-500' : 'border-neutral-300'}`}
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              This will be used in the URL: /shop/category/<strong>{formData.slug || 'example-slug'}</strong>
            </p>
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Parent Category
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => {
                const selectedParentId = e.target.value;
                const selectedParent = allCategories.find(cat => cat.id === selectedParentId);
                setFormData(prev => ({
                  ...prev,
                  parentId: selectedParentId,
                  parentName: selectedParent ? selectedParent.name : ''
                }));
              }}
              className="mt-1 block w-full px-4 py-2 border border-neutral-300 focus:ring-primary-500 focus:border-primary-500 text-sm rounded-md"
            >
              <option value="">No parent (top-level category)</option>
              {allCategories
                .filter(cat => cat.id !== categoryId) // Prevent selecting self as parent
                .map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              }
            </select>
            <p className="mt-1 text-xs text-neutral-500">
              Select a parent category to create a hierarchy. Leave empty for a top-level category.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-neutral-700">
              Active (visible to customers)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={formData.order.toString()}
              onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              min="0"
              className="w-24 px-4 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Lower numbers will be displayed first. Categories with the same order will be sorted alphabetically.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter category description"
              rows={3}
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Category Image
            </label>
            <div className="mt-2">
              <div className={`mb-4 ${imageUploadError ? 'border border-red-300 bg-red-50 p-3 rounded-md' : ''}`}>
                {imageUploadError && (
                  <div className="flex items-start text-red-600 mb-2">
                    <FiAlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{imageUploadError}</p>
                  </div>
                )}

                <ImageUploader
                  initialImage={formData.image}
                  onImageChange={handleImageChange}
                  label="Upload Category Image"
                  maxSizeMB={5}
                  aspectRatio="1:1"
                  previewSize="lg"
                  processImage={true}
                  format="webp"
                  quality={90}
                  width={600}
                  height={600}
                  fit="cover"
                  onUploadStart={handleImageUploadStart}
                  onUploadComplete={handleImageUploadComplete}
                  onUploadError={handleImageUploadError}
                />
              </div>

              <div className="mt-2 space-y-2">
                <p className="text-xs text-neutral-500">
                  Recommended size: 600x600px. Image will be automatically optimized.
                </p>

                {imageUploading && (
                  <div className="flex items-center text-primary-600">
                    <FiLoader className="animate-spin h-4 w-4 mr-2" />
                    <span className="text-sm">Uploading and optimizing image...</span>
                  </div>
                )}

                {formData.image && !imageUploading && (
                  <div className="text-xs text-green-600">
                    ✓ Image uploaded and optimized successfully
                  </div>
                )}

                {!formData.image && !imageUploading && (
                  <div className="flex items-center text-amber-600 text-xs">
                    <FiImage className="h-3 w-3 mr-1" />
                    <span>No image selected. Categories with images are more engaging.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors"
              onClick={() => router.push('/admin/products/categories')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              disabled={loading}
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              {isEditMode ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center text-amber-500 mb-4">
              <FiAlertTriangle className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-medium text-neutral-900">
                Confirm Category {isEditMode ? 'Update' : 'Creation'}
              </h3>
            </div>

            <p className="text-sm text-neutral-500 mb-4">
              Are you sure you want to {isEditMode ? 'update' : 'create'} this category?
            </p>

            <div className="bg-neutral-50 p-3 rounded-md mb-4 border border-neutral-200">
              <p className="text-sm font-medium">Category Details:</p>
              <ul className="mt-2 text-sm text-neutral-600">
                <li><strong>Name:</strong> {formData.name}</li>
                <li><strong>URL Slug:</strong> {formData.slug || generateSlug(formData.name)}</li>
                {formData.description && <li><strong>Description:</strong> {formData.description}</li>}
                {formData.image && (
                  <li className="mt-2">
                    <strong>Image:</strong>
                    <div className="mt-1 w-16 h-16 relative rounded overflow-hidden">
                      <S3Image
                        src={formData.image}
                        alt={formData.name}
                        fill
                        className="object-cover"
                        showNoImageMessage={true}
                      />
                    </div>
                  </li>
                )}
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors"
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                disabled={loading}
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                {isEditMode ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}