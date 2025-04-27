'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/context/ToastContext';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Image from 'next/image';
import ImageUploader from '@/components/ui/ImageUploader';
import { generateSlug, ensureUniqueSlug } from '@/lib/utils/slugUtils';
import { FiAlertTriangle } from 'react-icons/fi';

export default function NewCategoryPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    slug: '',
  });
  const [existingSlugs, setExistingSlugs] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchExistingSlugs();
  }, []);
  
  const fetchExistingSlugs = async () => {
    try {
      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);
      const slugs = snapshot.docs
        .map(doc => doc.data().slug)
        .filter(slug => slug);
      setExistingSlugs(slugs);
    } catch (error) {
      console.error('Error fetching existing slugs:', error);
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
  
  const handleImageChange = (imageUrl: string | null, metadata?: any) => {
    if (imageUrl) {
      setFormData(prev => ({ ...prev, image: imageUrl }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    
    // Validate slug
    if (!formData.slug.trim()) {
      // If slug is empty, generate one from the name
      const generatedSlug = generateSlug(formData.name);
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    } else {
      // Ensure the slug is properly formatted
      const formattedSlug = generateSlug(formData.slug);
      if (formattedSlug !== formData.slug) {
        setFormData(prev => ({ ...prev, slug: formattedSlug }));
      }
    }
    
    // Check for duplicate slugs
    if (formData.slug && existingSlugs.includes(formData.slug)) {
      newErrors.slug = 'This URL slug is already in use. It will be made unique on save.';
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
      
      // Ensure we have a valid slug
      let finalSlug = formData.slug.trim();
      if (!finalSlug) {
        finalSlug = generateSlug(formData.name);
      }
      
      // Make sure the slug is unique
      const uniqueSlug = ensureUniqueSlug(finalSlug, existingSlugs);
      
      const categoriesRef = collection(db, 'categories');
      
      await addDoc(categoriesRef, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image: formData.image,
        slug: uniqueSlug,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      showToast('Category created successfully', 'success');
      router.push('/admin/products/categories');
    } catch (err) {
      console.error('Error creating category:', err);
      
      // Provide more specific error messages based on the error
      const error = err as any; // Using any for Firebase error which has code property
      if (error.code === 'permission-denied') {
        showToast('You do not have permission to create categories', 'error');
      } else {
        const errorMessage = error.message || (err instanceof Error ? err.message : 'Unknown error');
        showToast(`Error creating category: ${errorMessage}`, 'error');
      }
      
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">New Category</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new product category
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmitClick} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Enter category name"
              required
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Slug
            </label>
            <div className="flex items-center">
              <Input
                type="text"
                value={formData.slug}
                onChange={handleSlugChange}
                placeholder="Enter URL slug"
                className={errors.slug ? 'border-red-500' : ''}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              This will be used in the URL: /shop/category/<strong>{formData.slug || 'example-slug'}</strong>
            </p>
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter category description"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Image
            </label>
            <div className="mt-2">
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
              />
              <p className="mt-2 text-xs text-gray-500">
                Recommended size: 600x600px. Image will be automatically optimized.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/products/categories')}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              Create Category
            </Button>
          </div>
        </form>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center text-amber-500 mb-4">
              <FiAlertTriangle className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Confirm Category Creation</h3>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to create this category?
            </p>
            
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p className="text-sm font-medium">Category Details:</p>
              <ul className="mt-2 text-sm text-gray-600">
                <li><strong>Name:</strong> {formData.name}</li>
                <li><strong>URL Slug:</strong> {formData.slug || generateSlug(formData.name)}</li>
                {formData.description && <li><strong>Description:</strong> {formData.description}</li>}
              </ul>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmSubmit}
                isLoading={loading}
              >
                Create Category
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}