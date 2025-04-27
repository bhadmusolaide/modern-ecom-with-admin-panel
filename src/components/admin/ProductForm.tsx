'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/context/ToastContext';
import type { ToastType } from '@/lib/context/ToastContext';
import { Product, ProductVariant } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { FiX, FiPlus, FiEdit, FiTrash, FiAlertCircle, FiCheck, FiPackage, FiDollarSign, FiImage, FiTag, FiSearch } from 'react-icons/fi';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Image from 'next/image';
import ProxiedImage from '@/components/ui/ProxiedImage';
import ImageUploader from '@/components/ui/ImageUploader';
import FormSection from '@/components/ui/FormSection';
import FormStatusIndicator from '@/components/ui/FormStatusIndicator';
import useAutosave from '@/lib/hooks/useAutosave';
import ActionButtons from '@/components/admin/ActionButtons';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import MobileFormLayout from '@/components/ui/MobileFormLayout';

interface ProductFormProps {
  product?: Product;
  onSubmit: (product: Partial<Product>) => Promise<void>;
}

interface Category {
  id: string;
  name: string;
  slug?: string;
  isActive?: boolean;
  order?: number;
  parentId?: string;
}

const PRESET_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Green', value: '#008000' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Purple', value: '#800080' },
  { name: 'Pink', value: '#FFC0CB' },
  { name: 'Orange', value: '#FFA500' },
  { name: 'Gray', value: '#808080' },
  { name: 'Brown', value: '#A52A2A' },
  { name: 'Navy', value: '#000080' },
];

const PRESET_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '28', '30', '32', '34', '36', '38', '40',
  'One Size',
];

export default function ProductForm({ product, onSubmit }: ProductFormProps): React.ReactElement {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    description: '',
    category: '', // Primary category (for backward compatibility)
    categoryName: '', // Primary category name (for backward compatibility)
    categories: [], // Array of category IDs for multiple categories
    categoryNames: [], // Array of category names for display
    image: '',
    images: [],
    colors: [],
    sizes: [],
    isNew: false,
    isSale: false,
    isFeatured: false,
    salePrice: 0,
    rating: 0,
    reviewCount: 0,
    tags: [],

    // Inventory management
    stock: 0,
    sku: '',
    barcode: '',
    trackInventory: true,
    lowStockThreshold: 5,

    // Variants
    hasVariants: false,
    variants: [],

    // SEO fields
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    slug: '',
  });

  // Field-specific validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  // Track if form has been submitted to show validation errors
  const [formSubmitted, setFormSubmitted] = useState(false);

  // We're using imageUrls instead of File objects directly
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  // Use a ref to track the current imageUrls state
  const imageUrlsRef = useRef<string[]>([]);
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  // Track which form sections have validation errors
  const [sectionErrors, setSectionErrors] = useState<Record<string, boolean>>({});

  // Autosave functionality
  const {
    lastSaved,
    isSaving,
    isError,
    errorMessage,
    triggerSave,
    saveStatus
  } = useAutosave<Partial<Product>>({
    data: formData,
    onSave: async (data) => {
      // Only save if we have a product ID (editing existing product)
      if (product?.id) {
        try {
          // Create a copy of the data to avoid mutation
          const dataToSave = { ...data };
          await onSubmit(dataToSave);
          return;
        } catch (error) {
          console.error('Autosave error:', error);
          throw error;
        }
      }
    },
    interval: 60000, // Save every minute
    debounce: 2000,  // Debounce for 2 seconds
    saveOnUnmount: true,
    enabled: false // Disable autosave functionality
  });

  // State for product variants
  const [showVariants, setShowVariants] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [variantFormData, setVariantFormData] = useState<Partial<ProductVariant>>({
    name: '',
    price: 0,
    stock: 0,
    sku: '',
    color: '',
    size: '',
    image: '',
    salePrice: 0,
    barcode: '',
    trackInventory: true,
  });
  // These will be used in future for variant images
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [variantImageUrls, setVariantImageUrls] = useState<string[]>([]);

  const [selectedVariantImage, setSelectedVariantImage] = useState<string>('');

  const prevProductRef = React.useRef<Partial<Product> | null>(null);

  useEffect(() => {
    const isProductChanged = JSON.stringify(product) !== JSON.stringify(prevProductRef.current);

    if (isProductChanged) {
      console.log('Product changed, initializing form data', {
        product,
        prevProduct: prevProductRef.current,
        currentImageUrls: imageUrlsRef.current
      });

      prevProductRef.current = product ? { ...product } : null;

      if (product) {
        // Create a deep copy of the product to avoid mutation
        const productCopy = JSON.parse(JSON.stringify(product));

        // Check if we already have images in the state
        const hasExistingImages = imageUrlsRef.current.length > 0;
        console.log('Has existing images:', hasExistingImages);

        // Only process and set images if we don't already have images in the state
        // This prevents overwriting newly uploaded images when the component re-renders
        if (!hasExistingImages) {
          // Process images first to ensure consistency
          let validImages: string[] = [];

          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            // Filter out any invalid URLs
            validImages = product.images.filter(url => url && typeof url === 'string' && url.trim() !== '');
            console.log('Setting imageUrls from product.images:', validImages);
          } else if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
            // Otherwise fall back to single image if it's valid
            validImages = [product.image];
            console.log('Setting imageUrls from product.image:', validImages);
          }

          // Ensure the product copy has consistent image data
          productCopy.images = [...validImages]; // Create a new array to avoid reference issues

          // If there's no main image but we have images, set the first one as main
          if ((!productCopy.image || productCopy.image.trim() === '') && validImages.length > 0) {
            productCopy.image = validImages[0];
          }

          // First update the ref to ensure it's the source of truth
          imageUrlsRef.current = [...validImages];

          // Then update the state variables
          setImageUrls([...validImages]);

          console.log('Initialized product with images:', {
            mainImage: productCopy.image,
            imagesArray: productCopy.images,
            imageUrlsState: validImages,
            imageUrlsRef: imageUrlsRef.current
          });
        } else {
          // If we already have images, keep them and update the product copy
          console.log('Keeping existing images:', imageUrlsRef.current);

          // Update the product copy with the current images
          productCopy.images = [...imageUrlsRef.current];

          // If there's no main image but we have images, set the first one as main
          if ((!productCopy.image || productCopy.image.trim() === '') && imageUrlsRef.current.length > 0) {
            productCopy.image = imageUrlsRef.current[0];
          }
        }

        // Update the form data with the product copy
        setFormData(productCopy);

        // Reset validation errors for images
        setValidationErrors(prev => ({
          ...prev,
          image: ''
        }));
      } else {
        // Reset form data and imageUrls for new product
        const emptyFormData = {
          name: '',
          price: 0,
          description: '',
          category: '',
          categoryName: '',
          categories: [],
          categoryNames: [],
          image: '',
          images: [],
          colors: [],
          sizes: [],
          isNew: false,
          isSale: false,
          isFeatured: false,
          salePrice: 0,
          rating: 0,
          reviewCount: 0,
          tags: [],
          stock: 0,
          sku: '',
          barcode: '',
          trackInventory: true,
          lowStockThreshold: 5,
          hasVariants: false,
          variants: [],
          seoTitle: '',
          seoDescription: '',
          seoKeywords: [],
          slug: '',
        };

        // First reset the ref
        imageUrlsRef.current = [];

        // Then update the state variables
        setImageUrls([]);
        setFormData(emptyFormData);

        // Reset validation errors
        setValidationErrors({});

        console.log('Initialized empty product form');
      }

      // Reset form submission state
      setFormSubmitted(false);
    }
  }, [product]);

  // Add a monitoring effect for imageUrls changes
  useEffect(() => {
    console.log('imageUrls state changed:', imageUrls);
    console.log('formData.image:', formData.image);
    console.log('formData.images:', formData.images);
    console.log('imageUrlsRef.current:', imageUrlsRef.current);

    // Keep the ref in sync with the state
    imageUrlsRef.current = [...imageUrls];

    // Check for inconsistencies between imageUrls and formData
    const needsImageUpdate = imageUrls.length > 0 && (!formData.image || formData.image.trim() === '');
    const needsImagesUpdate = imageUrls.length > 0 &&
                             (!Array.isArray(formData.images) ||
                              formData.images.length !== imageUrls.length ||
                              !formData.images.every((url, i) => url === imageUrls[i]));

    // If we need to update formData, do it
    if (needsImageUpdate || needsImagesUpdate) {
      console.log('Synchronizing formData from imageUrls due to:', { needsImageUpdate, needsImagesUpdate });

      setFormData(prev => {
        const updatedData = {
          ...prev,
          image: needsImageUpdate ? imageUrls[0] : prev.image,
          images: needsImagesUpdate ? [...imageUrls] : prev.images
        };
        console.log('Updated formData with synchronized images:', updatedData);
        return updatedData;
      });

      // Clear any image validation errors
      setValidationErrors(prev => {
        if (prev.image) {
          console.log('Clearing image validation error due to imageUrls update');
          return {
            ...prev,
            image: ''
          };
        }
        return prev;
      });
    }
  }, [imageUrls]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, 'categories');
        const snapshot = await getDocs(categoriesRef);
        const categoriesList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            slug: data.slug,
            isActive: data.isActive !== false, // Default to true if not set
            order: data.order || 0,
            parentId: data.parentId || null
          };
        }).sort((a, b) => {
          // Sort by order first, then by name
          if (a.order !== b.order) {
            return a.order - b.order;
          }
          return a.name.localeCompare(b.name);
        });

        // Filter out inactive categories
        const activeCategories = categoriesList.filter(cat => cat.isActive);
        setCategories(activeCategories);

        if (product) {
          // Handle both single category and multiple categories
          let categoryIds: string[] = [];
          let categoryNames: string[] = [];

          // If product has categories array, use it
          if (product.categories && Array.isArray(product.categories)) {
            categoryIds = product.categories;
            categoryNames = categoryIds.map(id => {
              const category = categoriesList.find(cat => cat.id === id);
              return category ? category.name : '';
            }).filter(Boolean);
          }
          // Otherwise, use the legacy single category field
          else if (product.category) {
            const category = categoriesList.find(cat => cat.id === product.category);
            if (category) {
              categoryIds = [product.category];
              categoryNames = [category.name];
            }
          }

          setFormData(prev => {
            // Create a copy of the current form data
            const updatedData = { ...prev };

            // Update only the category-related fields, preserving other fields
            updatedData.categories = categoryIds;
            updatedData.categoryNames = categoryNames;
            updatedData.category = categoryIds[0] || '';
            updatedData.categoryName = categoryNames[0] || '';

            // Preserve the current images state
            // This ensures we don't overwrite any newly uploaded images
            updatedData.images = prev.images || [];
            updatedData.image = prev.image || '';

            console.log('Updated form data with categories while preserving images:', {
              categories: updatedData.categories,
              images: updatedData.images,
              image: updatedData.image
            });

            return updatedData;
          });
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        showToast('Error loading categories', 'error');
      }
    };

    fetchCategories();
  }, [product, showToast]);

  // Validate a single field
  const validateField = (name: string, value: unknown): string => {
    switch (name) {
      case 'name':
        return !value || (typeof value === 'string' && value.trim() === '') ? 'Product name is required' : '';
      case 'price':
        return !value ||
               (typeof value === 'number' && value <= 0) ||
               (typeof value === 'string' && parseFloat(value) <= 0)
               ? 'Price must be greater than 0' : '';
      case 'description':
        return !value || (typeof value === 'string' && value.trim() === '') ? 'Description is required' : '';
      case 'category':
        return !value || (typeof value === 'string' && value.trim() === '') ? 'Category is required' : '';
      case 'salePrice':
        if (formData.isSale) {
          if (!value ||
              (typeof value === 'number' && value <= 0) ||
              (typeof value === 'string' && parseFloat(value) <= 0)) {
            return 'Sale price must be greater than 0';
          }
          if (formData.price &&
              ((typeof value === 'number' && typeof formData.price === 'number' && value >= formData.price) ||
               (typeof value === 'string' && parseFloat(value) >= (typeof formData.price === 'number' ? formData.price : parseFloat(String(formData.price)))))) {
            return 'Sale price must be less than regular price';
          }
        }
        return '';
      case 'sku':
        return formData.trackInventory && (!value || (typeof value === 'string' && value.trim() === ''))
          ? 'SKU is required when tracking inventory' : '';
      case 'stock':
        return formData.trackInventory && (
          value === undefined ||
          (typeof value === 'number' && value < 0) ||
          (typeof value === 'string' && parseInt(value) < 0)
        ) ? 'Stock cannot be negative' : '';
      case 'seoTitle':
        if (value && typeof value === 'string' && value.length > 60) {
          return 'SEO title should be 60 characters or less for optimal display';
        }
        return '';
      case 'seoDescription':
        if (value && typeof value === 'string' && value.length > 160) {
          return 'SEO description should be 160 characters or less for optimal display';
        }
        return '';
      case 'slug':
        if (value && typeof value === 'string' && !/^[a-z0-9-]+$/.test(value)) {
          return 'Slug can only contain lowercase letters, numbers, and hyphens';
        }
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) : value;

    if (name === 'category') {
      const selectedCategory = categories.find(cat => cat.id === value);
      setFormData(prev => ({
        ...prev,
        category: value,
        categoryName: selectedCategory?.name || '',
        // Also update the categories array for backward compatibility
        categories: value ? [value] : [],
        categoryNames: selectedCategory?.name ? [selectedCategory.name] : []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: parsedValue
      }));
    }

    // Mark that we have unsaved changes
    setHasUnsavedChanges(true);

    // Validate the field if form has been submitted or if the field already has an error
    if (formSubmitted || validationErrors[name]) {
      const error = validateField(name, parsedValue);
      setValidationErrors(prev => ({
        ...prev,
        [name]: error
      }));

      // Update section errors
      updateSectionErrors();
    }
  };

  // Handle multiple category selection
  const handleCategorySelection = (categoryId: string, isSelected: boolean) => {
    setFormData(prev => {
      // Get current categories array or initialize it
      const currentCategories = prev.categories || [];
      let newCategories: string[];

      if (isSelected) {
        // Add the category if it's not already in the array
        newCategories = currentCategories.includes(categoryId)
          ? currentCategories
          : [...currentCategories, categoryId];
      } else {
        // Remove the category if it's in the array
        newCategories = currentCategories.filter((id: string) => id !== categoryId);
      }

      // Get the category names for the selected categories
      const newCategoryNames = newCategories.map(id => {
        const category = categories.find(cat => cat.id === id);
        return category ? category.name : '';
      }).filter(Boolean);

      // Set the primary category (first in the list) for backward compatibility
      const primaryCategory = newCategories.length > 0 ? newCategories[0] : '';
      const primaryCategoryName = newCategoryNames.length > 0 ? newCategoryNames[0] : '';

      return {
        ...prev,
        categories: newCategories,
        categoryNames: newCategoryNames,
        category: primaryCategory,
        categoryName: primaryCategoryName
      };
    });

    // Validate if form has been submitted
    if (formSubmitted) {
      const error = validateField('category', formData.categories?.length ? formData.categories[0] : '');
      setValidationErrors(prev => ({
        ...prev,
        category: error
      }));
    }
  };

  // Function to update which sections have errors
  const updateSectionErrors = () => {
    const basicInfoErrors = !!validationErrors.name || !!validationErrors.description || !!validationErrors.category;
    const pricingErrors = !!validationErrors.price || !!validationErrors.salePrice;
    const inventoryErrors = !!validationErrors.sku || !!validationErrors.stock || !!validationErrors.lowStockThreshold;
    const imagesErrors = !!validationErrors.image;
    const seoErrors = !!validationErrors.seoTitle || !!validationErrors.seoDescription || !!validationErrors.slug;
    const variantsErrors = !!validationErrors.variants;

    setSectionErrors({
      basicInfo: basicInfoErrors,
      pricing: pricingErrors,
      inventory: inventoryErrors,
      images: imagesErrors,
      seo: seoErrors,
      variants: variantsErrors
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    // Special handling for isSale toggle
    if (name === 'isSale') {
      if (checked) {
        // If turning on sale mode, validate sale price
        const salePriceError = validateField('salePrice', formData.salePrice);

        if (salePriceError) {
          // If there's an error with the sale price, show a toast and focus on the sale price field
          showToast('Please set a valid sale price before enabling sale mode', 'warning');

          // Set focus on the sale price input (we'll need to add a ref to it)
          const salePriceInput = document.getElementById('salePrice');
          if (salePriceInput) {
            salePriceInput.focus();
          }

          // Update validation errors
          setValidationErrors(prev => ({
            ...prev,
            salePrice: salePriceError
          }));

          // Don't enable sale mode if there's no valid sale price
          if (!formData.salePrice ||
              (formData.price !== undefined && formData.salePrice <= 0 ||
              (formData.price !== undefined && formData.salePrice >= formData.price))) {
            return; // Don't update the checkbox
          }
        }
      }
    }

    // Update the form data for all checkboxes
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));

    // Mark that we have unsaved changes
    setHasUnsavedChanges(true);

    // Additional validation for other checkboxes if needed
    if (name === 'isNew' && checked) {
      // Maybe set a default "new until" date if implementing that feature
    } else if (name === 'isFeatured' && checked) {
      // Any special handling for featured products
    }

    // Update section errors
    updateSectionErrors();
  };

  const handleMultipleImagesUpload = (urls: string[]) => {
    console.log('handleMultipleImagesUpload called with URLs:', urls);

    if (!urls || !urls.length) {
      console.warn('handleMultipleImagesUpload received empty or null URLs array');
      return;
    }

    try {
      // First, filter out any empty or invalid URLs
      const validUrls = urls.filter(url => url && typeof url === 'string' && url.trim() !== '');

      if (validUrls.length === 0) {
        console.warn('No valid URLs found in upload response');
        return;
      }

      // Log for debugging
      console.log('Multiple upload - New URLs to add:', validUrls);

      // IMPORTANT: Use the ref to get the current state
      const currentImageUrls = [...imageUrlsRef.current]; // Create a copy to avoid reference issues
      console.log('Multiple upload - Current imageUrls from ref:', currentImageUrls);

      // Create a new array with all the images
      const updatedImageUrls = [...currentImageUrls, ...validUrls];
      console.log('Multiple upload - Setting imageUrls to:', updatedImageUrls);

      // Update the ref first to ensure it's the source of truth
      imageUrlsRef.current = [...updatedImageUrls]; // Create a new array to avoid reference issues

      // Then update the state
      setImageUrls([...updatedImageUrls]); // Create a new array to avoid reference issues

      // Update formData with the new images array and set main image if not already set
      // Use a callback to ensure we're working with the latest state
      setFormData(prev => {
        // Create a new object to avoid mutation
        const updatedData = {
          ...prev,
          // Always update the images array with the latest URLs
          images: [...updatedImageUrls], // Create a new array to avoid reference issues
          // Set the main image if not already set or if we prefer to use the first of the newly uploaded images
          image: prev.image && prev.image.trim() !== '' ? prev.image : validUrls[0]
        };

        console.log('Multiple upload - Updated formData:', updatedData);
        return updatedData;
      });

      // Clear any validation errors related to images
      setValidationErrors(prev => {
        console.log('Clearing image validation error (multiple upload)');
        return {
          ...prev,
          image: ''
        };
      });

      // Force a re-validation after a short delay to ensure state is updated
      setTimeout(() => {
        console.log('Delayed validation check - imageUrls:', imageUrls);
        console.log('Delayed validation check - imageUrlsRef.current:', imageUrlsRef.current);
        console.log('Delayed validation check - formData.images:', formData.images);

        // Force update formData again to ensure consistency
        setFormData(prev => {
          // Check if formData.images is out of sync with imageUrlsRef.current
          if (!prev.images || !Array.isArray(prev.images) || prev.images.length !== imageUrlsRef.current.length) {
            console.log('Fixing inconsistent formData.images in delayed check');
            return {
              ...prev,
              images: [...imageUrlsRef.current], // Use the ref as the source of truth
              image: prev.image && prev.image.trim() !== '' ? prev.image :
                     (imageUrlsRef.current.length > 0 ? imageUrlsRef.current[0] : '')
            };
          }
          return prev;
        });
      }, 500); // Increased timeout to ensure all state updates have completed

      showToast(`${validUrls.length} images uploaded successfully`, 'success');
    } catch (error) {
      console.error('Error handling multiple image uploads:', error);
      showToast('Error processing uploaded images', 'error');
    }
  };

  const handleSingleImageUpload = (url: string | null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    metadata?: Record<string, unknown>) => {
    console.log('ProductForm.handleSingleImageUpload called with URL:', url);
    if (!url) {
      console.warn('ProductForm.handleSingleImageUpload received null/undefined URL');
      return;
    }

    // Validate the URL
    if (typeof url !== 'string' || url.trim() === '') {
      console.warn('Invalid image URL received:', url);
      return;
    }

    console.log('Single upload - URL:', url);

    // IMPORTANT: Use the ref to get the current state
    const currentImageUrls = [...imageUrlsRef.current]; // Create a copy to avoid reference issues
    console.log('Single upload - Current imageUrls from ref:', currentImageUrls);

    // Create a new array with the new image
    const newUrls = [...currentImageUrls, url];
    console.log('Single upload - Setting imageUrls to:', newUrls);

    // Update the ref first to ensure it's always in sync
    imageUrlsRef.current = [...newUrls]; // Create a new array to avoid reference issues

    // Then update the state
    setImageUrls([...newUrls]); // Create a new array to avoid reference issues

    // Determine if we should update the main image
    // Only set the main image to the new image if there was no main image before
    const shouldSetMainImage = !formData.image || formData.image.trim() === '';

    // Update formData with the new image and images array
    setFormData(prev => {
      const updatedData = {
        ...prev,
        // Only set the main image to the newly uploaded image if there was no main image before
        image: shouldSetMainImage ? url : prev.image,
        // Always update the images array
        images: [...newUrls] // Create a new array to avoid reference issues
      };

      console.log('Single upload - Updated formData:', updatedData);
      return updatedData;
    });

    // Clear any validation errors related to images
    setValidationErrors(prev => {
      console.log('Clearing image validation error');
      return {
        ...prev,
        image: ''
      };
    });

    // Force a re-validation after a short delay to ensure state is updated
    setTimeout(() => {
      console.log('Delayed validation check - imageUrls:', imageUrls);
      console.log('Delayed validation check - imageUrlsRef.current:', imageUrlsRef.current);
      console.log('Delayed validation check - formData.images:', formData.images);

      // Force update formData again to ensure consistency
      setFormData(prev => {
        // Check if formData.images is out of sync with imageUrlsRef.current
        if (!prev.images || !Array.isArray(prev.images) || prev.images.length !== imageUrlsRef.current.length) {
          console.log('Fixing inconsistent formData.images in delayed check');
          return {
            ...prev,
            images: [...imageUrlsRef.current], // Use the ref as the source of truth
            image: shouldSetMainImage ? url : prev.image
          };
        }
        return prev;
      });
    }, 500); // Increased timeout to ensure all state updates have completed

    showToast('Image uploaded successfully', 'success');
  };

  const handleRemoveImage = async (index: number) => {
    try {
      // IMPORTANT: Use the ref to get the current state
      const currentImageUrls = [...imageUrlsRef.current]; // Create a copy to avoid reference issues

      // Get the URL that's being removed
      const urlToRemove = currentImageUrls[index];

      if (!urlToRemove) {
        console.warn('Attempted to remove image at invalid index:', index);
        return;
      }

      console.log('Remove - Image at index', index, 'URL:', urlToRemove);
      console.log('Remove - Current imageUrls from ref:', currentImageUrls);

      // Create a new array without the removed image
      const newUrls = currentImageUrls.filter((_, i) => i !== index);
      console.log('Remove - Setting imageUrls to:', newUrls);

      // Update the ref first to ensure it's always in sync
      imageUrlsRef.current = [...newUrls]; // Create a new array to avoid reference issues

      // Then update the state
      setImageUrls([...newUrls]); // Create a new array to avoid reference issues

      // Check if we're removing the main image
      const isRemovingMainImage = formData.image === urlToRemove;
      const newMainImage = isRemovingMainImage ? (newUrls.length > 0 ? newUrls[0] : '') : formData.image;

      // Update formData with the new images array and update main image if needed
      setFormData(prev => {
        const updatedData = {
          ...prev,
          // Always update the images array
          images: [...newUrls], // Create a new array to avoid reference issues
          // If removing the main image, set the next image as main
          image: newMainImage
        };

        console.log('Remove - Updated formData:', updatedData);
        return updatedData;
      });

      // If we have no images left, we might need to show validation errors again
      if (newUrls.length === 0) {
        setValidationErrors(prev => ({
          ...prev,
          image: 'At least one product image is required'
        }));
      }

      // Force a re-validation after a short delay to ensure state is updated
      setTimeout(() => {
        console.log('Delayed validation check after remove - imageUrls:', imageUrls);
        console.log('Delayed validation check after remove - imageUrlsRef.current:', imageUrlsRef.current);
        console.log('Delayed validation check after remove - formData.images:', formData.images);

        // Force update formData again to ensure consistency
        setFormData(prev => {
          // Check if formData.images is out of sync with imageUrlsRef.current
          if (!prev.images || !Array.isArray(prev.images) || prev.images.length !== imageUrlsRef.current.length) {
            console.log('Fixing inconsistent formData.images after remove');
            return {
              ...prev,
              images: [...imageUrlsRef.current], // Use the ref as the source of truth
              image: isRemovingMainImage ?
                     (imageUrlsRef.current.length > 0 ? imageUrlsRef.current[0] : '') :
                     prev.image
            };
          }
          return prev;
        });
      }, 500); // Increased timeout to ensure all state updates have completed

      // Attempt to delete the image from storage if it's a production URL
      if (urlToRemove && (urlToRemove.includes('amazonaws.com') || urlToRemove.includes('firebasestorage.googleapis.com') || urlToRemove.includes('supabase.co'))) {
        try {
          // Send the full URL to the API for proper key extraction
          const response = await fetch('/api/upload', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: urlToRemove }),
          });

          const result = await response.json();

          if (!result.success) {
            console.warn('Image deletion warning:', result.error || 'Unknown error');
            // Don't show error to user as this is a background operation
          }
        } catch (err) {
          console.error('Error deleting image from storage:', err);
          // Log the error but don't disrupt the user experience
        }
      }

      // Show success message
      showToast('Image removed successfully', 'success');
    } catch (error) {
      console.error('Error removing image:', error);
      showToast('Error removing image', 'error');
    }
  };

  const handleAddColor = () => {
    if (newColor && !formData.colors?.includes(newColor)) {
      setFormData(prev => ({
        ...prev,
        colors: [...(prev.colors || []), newColor]
      }));
      setNewColor('');
    }
  };

  const handleRemoveColor = (color: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors?.filter(c => c !== color)
    }));
  };

  const handleAddSize = () => {
    if (newSize && !formData.sizes?.includes(newSize)) {
      setFormData(prev => ({
        ...prev,
        sizes: [...(prev.sizes || []), newSize]
      }));
      setNewSize('');
    }
  };

  const handleRemoveSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes?.filter(s => s !== size)
    }));
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag)
    }));
  };

  const handleAddKeyword = () => {
    if (newKeyword && !formData.seoKeywords?.includes(newKeyword)) {
      setFormData(prev => ({
        ...prev,
        seoKeywords: [...(prev.seoKeywords || []), newKeyword]
      }));
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      seoKeywords: prev.seoKeywords?.filter(k => k !== keyword)
    }));
  };

  // Generate a slug from the product name
  const generateSlug = () => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with a single one

      setFormData(prev => ({
        ...prev,
        slug
      }));
    }
  };

  // Variant handling functions
  const handleVariantInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setVariantFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleAddVariant = () => {
    // Validate variant data
    if (!variantFormData.name || !variantFormData.price) {
      showToast('Variant name and price are required', 'error');
      return;
    }

    // Auto-generate name if not provided but color and size are
    let variantName = variantFormData.name || '';
    if (!variantName && (variantFormData.color || variantFormData.size)) {
      variantName = [variantFormData.color, variantFormData.size].filter(Boolean).join(' / ');
    }

    // Auto-generate SKU if not provided
    let variantSku = variantFormData.sku || '';
    if (!variantSku && formData.sku) {
      const colorCode = variantFormData.color ? variantFormData.color.substring(0, 3).toUpperCase() : '';
      const sizeCode = variantFormData.size ? variantFormData.size.toUpperCase() : '';
      variantSku = `${formData.sku}-${colorCode}${sizeCode}`.replace(/\s+/g, '-');
    }

    const newVariant: ProductVariant = {
      id: editingVariant?.id || `variant-${Date.now()}`,
      productId: product?.id || '',
      name: variantName,
      price: variantFormData.price || 0,
      stock: variantFormData.stock,
      sku: variantSku,
      color: variantFormData.color,
      size: variantFormData.size,
      image: selectedVariantImage || variantFormData.image,
      barcode: variantFormData.barcode,
      trackInventory: variantFormData.trackInventory,
      salePrice: variantFormData.salePrice
    };

    setFormData(prev => {
      const currentVariants = prev.variants || [];

      // If editing, replace the existing variant
      if (editingVariant) {
        const updatedVariants = currentVariants.map(v =>
          v.id === editingVariant.id ? newVariant : v
        );
        return { ...prev, variants: updatedVariants };
      }

      // Otherwise add a new variant
      return { ...prev, variants: [...currentVariants, newVariant] };
    });

    // Reset the variant form
    setVariantFormData({
      name: '',
      price: 0,
      stock: 0,
      sku: '',
      color: '',
      size: '',
      image: '',
      salePrice: 0,
      barcode: '',
      trackInventory: true,
    });

    setSelectedVariantImage('');
    setEditingVariant(null);
    showToast(`Variant ${editingVariant ? 'updated' : 'added'} successfully`, 'success');
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setVariantFormData({ ...variant });
    if (variant.image) {
      setSelectedVariantImage(variant.image);
    }
  };

  const handleRemoveVariant = (variantId: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants?.filter(v => v.id !== variantId)
    }));

    if (editingVariant?.id === variantId) {
      setEditingVariant(null);
      setVariantFormData({
        name: '',
        price: 0,
        stock: 0,
        sku: '',
        color: '',
        size: '',
        image: '',
        salePrice: 0,
        barcode: '',
        trackInventory: true,
      });
      setSelectedVariantImage('');
    }

    showToast('Variant removed successfully', 'success');
  };

  // Handle selecting an image for a variant
  const handleSelectVariantImage = (imageUrl: string) => {
    setSelectedVariantImage(imageUrl);
    setVariantFormData(prev => ({
      ...prev,
      image: imageUrl
    }));
  };

  // Generate variants from combinations of colors and sizes
  const generateVariants = () => {
    // Get selected colors and sizes
    const colors = formData.colors || [];
    const sizes = formData.sizes || [];

    if (colors.length === 0 && sizes.length === 0) {
      showToast('Please add colors and/or sizes first', 'error');
      return;
    }

    // Create combinations
    const newVariants: ProductVariant[] = [];

    // If we have both colors and sizes, create all combinations
    if (colors.length > 0 && sizes.length > 0) {
      colors.forEach(color => {
        sizes.forEach(size => {
          const name = `${color} / ${size}`;
          const sku = formData.sku ? `${formData.sku}-${color.substring(0, 3).toUpperCase()}${size.toUpperCase()}`.replace(/\s+/g, '-') : '';

          // Skip if this combination already exists
          if (formData.variants?.some(v => v.color === color && v.size === size)) {
            return;
          }

          newVariants.push({
            id: `variant-${Date.now()}-${newVariants.length}`,
            productId: product?.id || '',
            name,
            price: formData.price || 0,
            stock: 0,
            sku,
            color,
            size,
            image: '',
            trackInventory: true
          });
        });
      });
    }
    // If we only have colors, create variants for each color
    else if (colors.length > 0) {
      colors.forEach(color => {
        // Skip if this color already exists
        if (formData.variants?.some(v => v.color === color && !v.size)) {
          return;
        }

        const sku = formData.sku ? `${formData.sku}-${color.substring(0, 3).toUpperCase()}`.replace(/\s+/g, '-') : '';

        newVariants.push({
          id: `variant-${Date.now()}-${newVariants.length}`,
          productId: product?.id || '',
          name: color,
          price: formData.price || 0,
          stock: 0,
          sku,
          color,
          size: '',
          image: '',
          trackInventory: true
        });
      });
    }
    // If we only have sizes, create variants for each size
    else if (sizes.length > 0) {
      sizes.forEach(size => {
        // Skip if this size already exists
        if (formData.variants?.some(v => v.size === size && !v.color)) {
          return;
        }

        const sku = formData.sku ? `${formData.sku}-${size.toUpperCase()}`.replace(/\s+/g, '-') : '';

        newVariants.push({
          id: `variant-${Date.now()}-${newVariants.length}`,
          productId: product?.id || '',
          name: size,
          price: formData.price || 0,
          stock: 0,
          sku,
          color: '',
          size,
          image: '',
          trackInventory: true
        });
      });
    }

    if (newVariants.length === 0) {
      showToast('All possible variants already exist', 'info');
      return;
    }

    // Add the new variants to the form data
    setFormData(prev => ({
      ...prev,
      variants: [...(prev.variants || []), ...newVariants],
      hasVariants: true
    }));

    showToast(`Generated ${newVariants.length} new variants`, 'success');
  };

  // Validation function to check all required fields
  const validateForm = (): { valid: boolean; errors: string[] } => {
    const newErrors: Record<string, string> = {};
    const errorMessages: string[] = [];

    // Validate basic product information
    newErrors.name = validateField('name', formData.name);

    // Validate categories - either the legacy category field or the new categories array
    if (formData.categories && formData.categories.length > 0) {
      newErrors.category = ''; // Valid if we have at least one category in the array
    } else {
      newErrors.category = validateField('category', formData.category);
    }

    newErrors.price = validateField('price', formData.price);
    newErrors.description = validateField('description', formData.description);

    // Validate image - check all possible sources of image data
    console.log('Validating images:', {
      'formData.image': formData.image,
      'formData.images': formData.images,
      'imageUrls': imageUrls,
      'imageUrlsRef.current': imageUrlsRef.current
    });

    // Always use the ref as the source of truth for image URLs
    const currentImageUrls = imageUrlsRef.current;

    // Check if we have valid images in any of the possible sources
    const hasMainImage = formData.image && typeof formData.image === 'string' && formData.image.trim() !== '';
    const hasImagesArray = Array.isArray(formData.images) && formData.images.length > 0 &&
                          formData.images.some(url => url && typeof url === 'string' && url.trim() !== '');
    const hasImageUrls = imageUrls.length > 0 &&
                        imageUrls.some(url => url && typeof url === 'string' && url.trim() !== '');
    const hasImageUrlsRef = currentImageUrls.length > 0 &&
                           currentImageUrls.some(url => url && typeof url === 'string' && url.trim() !== '');

    // Log detailed validation results
    console.log('Image validation details:', {
      hasMainImage,
      hasImagesArray,
      hasImageUrls,
      hasImageUrlsRef
    });

    if (!hasMainImage && !hasImagesArray && !hasImageUrls && !hasImageUrlsRef) {
      newErrors.image = 'At least one product image is required';
      errorMessages.push('At least one product image is required');
      console.log('Image validation failed - no images found');
    } else {
      // Clear any existing image error if we have images
      newErrors.image = '';
      console.log('Image validation passed - images found');

      // If we have images in the ref but not in formData, update formData
      if (hasImageUrlsRef && (!hasImagesArray || !hasMainImage)) {
        console.log('Images found in ref but not in formData - will be fixed before submission');
      }
    }

    // Validate sale price if product is on sale
    if (formData.isSale) {
      newErrors.salePrice = validateField('salePrice', formData.salePrice);
    }

    // Validate inventory fields if tracking inventory
    if (formData.trackInventory) {
      newErrors.sku = validateField('sku', formData.sku);
      newErrors.stock = validateField('stock', formData.stock);

      if (formData.lowStockThreshold !== undefined && formData.lowStockThreshold < 0) {
        newErrors.lowStockThreshold = 'Low stock threshold cannot be negative';
        errorMessages.push('Low stock threshold cannot be negative');
      }
    }

    // Validate SEO fields
    newErrors.seoTitle = validateField('seoTitle', formData.seoTitle);
    newErrors.seoDescription = validateField('seoDescription', formData.seoDescription);
    newErrors.slug = validateField('slug', formData.slug);

    // Validate variants if product has variants
    if (formData.hasVariants) {
      if (!formData.variants || formData.variants.length === 0) {
        newErrors.variants = 'At least one variant is required when variants are enabled';
        errorMessages.push('At least one variant is required when variants are enabled');
      } else {
        // Check each variant for required fields
        const variantErrors: string[] = [];
        formData.variants.forEach((variant, index) => {
          if (!variant.name) {
            variantErrors.push(`Variant #${index + 1} is missing a name`);
          }
          if (!variant.price || variant.price <= 0) {
            variantErrors.push(`Variant #${index + 1} (${variant.name || 'Unnamed'}) must have a price greater than 0`);
          }
          if (variant.trackInventory && variant.stock === undefined) {
            variantErrors.push(`Variant #${index + 1} (${variant.name || 'Unnamed'}) must have stock quantity when tracking inventory`);
          }
        });

        if (variantErrors.length > 0) {
          newErrors.variants = variantErrors.join('; ');
          errorMessages.push(...variantErrors);
        }
      }
    }

    // Add all field-specific errors to the error messages array
    Object.entries(newErrors).forEach(([, error]) => {
      if (error && !errorMessages.includes(error)) {
        errorMessages.push(error);
      }
    });

    // Update validation errors state
    setValidationErrors(newErrors);

    return {
      valid: errorMessages.length === 0,
      errors: errorMessages
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get the latest image URLs from the ref to ensure we have the most up-to-date data
    const currentImageUrls = imageUrlsRef.current;
    console.log('Form submission - Current image URLs from ref:', currentImageUrls);

    // Force synchronize image state before validation
    if (currentImageUrls.length > 0) {
      console.log('Form submission - Forcing image state synchronization');

      // Update the state with the ref values to ensure consistency
      setImageUrls(currentImageUrls);

      // Update formData with the current image URLs
      setFormData(prev => {
        const updatedData = {
          ...prev,
          image: currentImageUrls[0],
          images: [...currentImageUrls]
        };
        console.log('Form submission - Updated formData with images:', updatedData);
        return updatedData;
      });

      // Clear any image validation errors
      setValidationErrors(prev => ({
        ...prev,
        image: ''
      }));

      // Small delay to ensure state updates before validation
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Mark form as submitted to show all validation errors
    setFormSubmitted(true);

    // Validate form before submission
    const { valid, errors } = validateForm();
    if (!valid) {
      // Show the first error as a toast
      if (errors.length > 0) {
        showToast(errors[0], 'error');
      }

      // Update section errors to highlight sections with errors
      updateSectionErrors();

      // Scroll to the first input with an error
      const firstErrorField = document.querySelector('[aria-invalid="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      return;
    }

    setLoading(true);

    try {
      // Get the latest image URLs from the ref to ensure we have the most up-to-date data
      const latestImageUrls = [...imageUrlsRef.current];

      // Log the current state before submission
      console.log('Submit - Current state before submission:', {
        imageUrls,
        imageUrlsRef: latestImageUrls,
        formDataImages: formData.images,
        formDataImage: formData.image
      });

      // Ensure images are properly set in the form data
      // Filter out any invalid URLs
      const validImageUrls = latestImageUrls.filter(url => url && typeof url === 'string' && url.trim() !== '');

      console.log('Submit - Valid image URLs:', validImageUrls);

      // Create a copy of the form data to avoid mutation
      const updatedFormData = {
        ...formData,
        // Make sure we're using the latest imageUrls as the source of truth
        images: [...validImageUrls], // Create a new array to avoid reference issues
        // Set the main image to the first image if not already set
        image: formData.image && formData.image.trim() !== '' ?
               formData.image :
               (validImageUrls.length > 0 ? validImageUrls[0] : '')
      };

      // Double-check that images are properly set
      if (validImageUrls.length > 0 && (!updatedFormData.images || updatedFormData.images.length === 0)) {
        console.warn('Images missing from updatedFormData, forcing them to be included');
        updatedFormData.images = [...validImageUrls];
      }

      console.log('Submitting product with images:', updatedFormData.images);

      // Submit the form data
      await onSubmit(updatedFormData);

      // Reset unsaved changes state
      setHasUnsavedChanges(false);

      // If this is an existing product, trigger a save to update the autosave state
      if (product?.id) {
        await triggerSave();
      }

      showToast(`Product ${product ? 'updated' : 'created'} successfully`, 'success');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error submitting product:', error);
      if (error instanceof Error) {
        showToast(`Error: ${error.message}`, 'error');
      } else {
        showToast(`Error ${product ? 'updating' : 'creating'} product`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to discard changes - can be used in a future cancel button implementation
  // Currently not used but kept for future reference
  /*
  const handleDiscardChanges = () => {
    if (product) {
      // Reset to original product data
      const productCopy = JSON.parse(JSON.stringify(product));

      // Process images
      let validImages: string[] = [];
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        validImages = product.images.filter(url => url && typeof url === 'string' && url.trim() !== '');
      } else if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
        validImages = [product.image];
      }

      // Update the ref first
      imageUrlsRef.current = [...validImages];

      // Then update the state variables
      setImageUrls([...validImages]);
      setFormData(productCopy);

      // Reset validation errors
      setValidationErrors({});
      setFormSubmitted(false);

      // Reset unsaved changes state
      setHasUnsavedChanges(false);

      showToast('Changes discarded', 'info');
    } else {
      // For new products, just reset the form
      router.push('/admin/products');
    }
  };
  */

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleInputChange}
            required
            error={formSubmitted ? validationErrors.name : undefined}
            aria-invalid={!!validationErrors.name}
            aria-describedby={validationErrors.name ? "name-error" : undefined}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categories <span className="text-red-500">*</span>
          </label>

          {/* Primary category dropdown (for backward compatibility) */}
          <Select
            name="category"
            value={formData.category || ''}
            error={formSubmitted ? validationErrors.category : undefined}
            aria-invalid={!!validationErrors.category}
            aria-describedby={validationErrors.category ? "category-error" : undefined}
            onChange={handleInputChange}
            required
            className="mb-2"
          >
            <option value="">Select primary category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          {/* Multiple category selection */}
          <div className="mt-3 border border-gray-200 rounded-md p-3 bg-gray-50">
            <div className="text-sm font-medium text-gray-700 mb-2">Additional Categories</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {categories.map((category) => {
                // Skip the primary category in the checkboxes
                if (category.id === formData.category) return null;

                const isSelected = formData.categories?.includes(category.id) || false;

                return (
                  <div key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`category-${category.id}`}
                      checked={isSelected}
                      onChange={(e) => handleCategorySelection(category.id, e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-700">
                      {category.name}
                    </label>
                  </div>
                );
              })}
            </div>
            {formData.categories && formData.categories.length > 1 && (
              <div className="mt-2 text-xs text-gray-500">
                Product will appear in {formData.categories.length} categories
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            name="price"
            min="0"
            step="0.01"
            value={formData.price?.toString() || '0'}
            onChange={handleInputChange}
            required
            error={formSubmitted ? validationErrors.price : undefined}
            aria-invalid={!!validationErrors.price}
            aria-describedby={validationErrors.price ? "price-error" : undefined}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sale Price {formData.isSale && <span className="text-red-500">*</span>}
          </label>
          <Input
            id="salePrice"
            type="number"
            name="salePrice"
            value={formData.salePrice?.toString() || '0'}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            disabled={!formData.isSale}
            error={formData.isSale && formSubmitted ? validationErrors.salePrice : undefined}
            aria-invalid={formData.isSale && !!validationErrors.salePrice}
            aria-describedby={validationErrors.salePrice ? "salePrice-error" : undefined}
          />
          {formData.isSale && (
            <p className="mt-1 text-xs text-gray-500">
              Sale price must be lower than the regular price.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock Quantity {formData.trackInventory && <span className="text-red-500">*</span>}
          </label>
          <Input
            type="number"
            name="stock"
            value={formData.stock?.toString() || '0'}
            onChange={handleInputChange}
            min="0"
            step="1"
            disabled={!formData.trackInventory}
            error={formData.trackInventory && formSubmitted ? validationErrors.stock : undefined}
            aria-invalid={formData.trackInventory && !!validationErrors.stock}
            aria-describedby={validationErrors.stock ? "stock-error" : undefined}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU (Stock Keeping Unit) {formData.trackInventory && <span className="text-red-500">*</span>}
          </label>
          <Input
            type="text"
            name="sku"
            value={formData.sku || ''}
            onChange={handleInputChange}
            placeholder="e.g. PROD-12345"
            error={formData.trackInventory && formSubmitted ? validationErrors.sku : undefined}
            aria-invalid={formData.trackInventory && !!validationErrors.sku}
            aria-describedby={validationErrors.sku ? "sku-error" : undefined}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Barcode / UPC / ISBN
          </label>
          <Input
            type="text"
            name="barcode"
            value={formData.barcode || ''}
            onChange={handleInputChange}
            placeholder="e.g. 123456789012"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleInputChange}
          rows={4}
          required
          className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          aria-invalid={!!validationErrors.description}
          aria-describedby={validationErrors.description ? "description-error" : undefined}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Images <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <ImageUploader
                  label="Upload product images"
                  onImageChange={handleSingleImageUpload}
                  multiple={true}
                  onMultipleUpload={handleMultipleImagesUpload}
                  maxSizeMB={10}
                  aspectRatio="1:1"
                  processImage={true}
                  format="webp"
                  quality={85}
                  width={800}
                  height={800}
                  fit="cover"
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Images will be optimized automatically.</p>
              <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, WebP, GIF, SVG up to 10MB</p>
              {imageUrls.length > 0 ? (
                <p className="text-xs text-green-600 font-medium mt-2">
                  {imageUrls.length} {imageUrls.length === 1 ? 'image' : 'images'} uploaded
                </p>
              ) : formSubmitted && validationErrors.image ? (
                <p className="text-xs text-red-600 font-medium mt-2" id="image-error">
                  <FiAlertCircle className="inline mr-1" /> {validationErrors.image}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Always show the image gallery if we have images in either state source */}
        {(imageUrls.length > 0 || imageUrlsRef.current.length > 0) && (
          <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb-3">
              <span className="mr-2">Product Image Gallery</span>
              <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-0.5 rounded">
                {imageUrls.length} {imageUrls.length === 1 ? 'image' : 'images'}
              </span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Use imageUrlsRef.current as the source of truth for rendering */}
              {imageUrlsRef.current.map((url, index) => {
                // Skip rendering if URL is empty or invalid
                if (!url || typeof url !== 'string' || url.trim() === '') {
                  console.warn(`Skipping invalid image URL at index ${index}:`, url);
                  return null;
                }

                // Determine URL type for proper rendering
                const isBlobUrl = url.startsWith('blob:');
                const isFirebaseUrl = url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com');
                const isSupabaseUrl = url.includes('supabase.co');
                const isS3Url = url.includes('amazonaws.com');
                const isHttpUrl = url.startsWith('http://') || url.startsWith('https://');

                // Consider any HTTP/HTTPS URL as potentially valid
                const isValidImageUrl = isBlobUrl || isFirebaseUrl || isSupabaseUrl || isS3Url || isHttpUrl;

                // Check if this is the main image
                const isMainImage = formData.image === url || index === 0;

                console.log(`Image ${index} validation:`, {
                  url,
                  isValidImageUrl,
                  isBlobUrl,
                  isFirebaseUrl,
                  isSupabaseUrl,
                  isS3Url,
                  isHttpUrl,
                  isMainImage
                });

                return (
                  <div
                    key={`image-${index}-${url.substring(0, 20)}-${Date.now()}`}
                    className="relative group border border-gray-200 rounded-md p-1 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative">
                      {isBlobUrl ? (
                        // Use standard img tag for blob URLs
                        <img
                          src={url}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md"
                          onError={(e) => {
                            console.error(`Error loading blob image at index ${index}:`, url);
                            // Don't use placeholder image, show error state instead
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('error-image');
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'w-full h-32 bg-gray-100 rounded-md flex items-center justify-center';
                            errorDiv.innerHTML = '<span class="text-gray-400">Image error</span>';
                            e.currentTarget.parentElement?.appendChild(errorDiv);
                          }}
                        />
                      ) : isValidImageUrl ? (
                        // Use Next.js Image for remote URLs
                        <Image
                          src={url}
                          alt={`Product image ${index + 1}`}
                          width={128}
                          height={128}
                          className="w-full h-32 object-cover rounded-md"
                          onError={() => {
                            console.error(`Error loading image at index ${index}:`, url);
                            // We'll handle this in the component itself
                          }}
                        />
                      ) : (
                        // Fallback for invalid URLs
                        <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center">
                          <span className="text-gray-400">Invalid image</span>
                        </div>
                      )}
                      <button
                        type="button"
                        className="absolute top-2 right-2 p-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        onClick={() => handleRemoveImage(index)}
                        aria-label="Remove image"
                      >
                        <FiX className="h-4 w-4 text-red-600" />
                      </button>
                      {isMainImage && (
                        <span className="absolute top-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs rounded-md shadow-sm">
                          Main Image
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      Image {index + 1} of {imageUrlsRef.current.length}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Colors
          </label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => {
                    if (!formData.colors?.includes(color.name)) {
                      setFormData(prev => ({
                        ...prev,
                        colors: [...(prev.colors || []), color.name]
                      }));
                    }
                  }}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.colors?.includes(color.name)
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="Add custom color"
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={handleAddColor}
                className="shrink-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Add
              </button>
            </div>
            {formData.colors && formData.colors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.colors.map((color) => (
                  <span
                    key={color}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {color}
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(color)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sizes
          </label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {PRESET_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    if (!formData.sizes?.includes(size)) {
                      setFormData(prev => ({
                        ...prev,
                        sizes: [...(prev.sizes || []), size]
                      }));
                    }
                  }}
                  className={`px-3 py-1 rounded-md text-sm ${
                    formData.sizes?.includes(size)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="Add custom size"
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={handleAddSize}
                className="shrink-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Add
              </button>
            </div>
            {formData.sizes && formData.sizes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.sizes.map((size) => (
                  <span
                    key={size}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {size}
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(size)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Tags
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag"
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={handleAddTag}
            type="button"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <FiPlus className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {formData.tags?.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neutral-100"
            >
              {tag}
              <button
                type="button"
                className="ml-1 text-neutral-500 hover:text-red-600"
                onClick={() => handleRemoveTag(tag)}
              >
                <FiX className="h-4 w-4" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 border-t border-neutral-200 pt-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Product Status</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isNew"
              name="isNew"
              checked={formData.isNew || false}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
            <label htmlFor="isNew" className="ml-2 block text-sm text-neutral-700">
              Mark as New Arrival
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isSale"
              name="isSale"
              checked={formData.isSale || false}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
            <label htmlFor="isSale" className="ml-2 block text-sm text-neutral-700">
              Mark as On Sale
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isFeatured"
              name="isFeatured"
              checked={formData.isFeatured || false}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
            <label htmlFor="isFeatured" className="ml-2 block text-sm text-neutral-700">
              Mark as Featured
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-neutral-200 pt-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Inventory Management</h3>

        <div className="mb-4">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="trackInventory"
              name="trackInventory"
              checked={formData.trackInventory || false}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
            <label htmlFor="trackInventory" className="ml-2 block text-sm text-neutral-700">
              Track inventory for this product
            </label>
          </div>

          {formData.trackInventory && (
            <div className="pl-6 border-l-2 border-neutral-200">
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Low Stock Threshold
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold?.toString() || '5'}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        lowStockThreshold: value
                      }));
                    }}
                    min="0"
                    step="1"
                    className="max-w-xs px-4 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                  <span className="ml-2 text-sm text-neutral-500">
                    Alert when stock falls below this number
                  </span>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded-md mb-4">
                <div className="flex">
                  <div className="text-yellow-800">
                    <p className="text-sm">
                      Current stock: <span className="font-medium">{formData.stock}</span>
                      {formData.stock !== undefined && formData.lowStockThreshold !== undefined &&
                       formData.stock <= formData.lowStockThreshold && (
                        <span className="ml-2 text-red-600 font-medium">
                          (Low stock)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasVariants"
              name="hasVariants"
              checked={formData.hasVariants || false}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="hasVariants" className="ml-2 block text-sm text-gray-700">
              This product has multiple variants
            </label>
          </div>
        </div>

        {formData.hasVariants && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="mb-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowVariants(!showVariants)}
                  className="text-primary-600 hover:text-primary-800 font-medium text-sm flex items-center"
                >
                  {showVariants ? 'Hide Variant Form' : 'Add New Variant'}
                  <FiPlus className={`ml-1 h-4 w-4 ${showVariants ? 'rotate-45' : ''} transition-transform`} />
                </button>

                <button
                  type="button"
                  onClick={generateVariants}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm flex items-center"
                >
                  Generate Variants from Colors/Sizes
                  <FiPlus className="ml-1 h-4 w-4" />
                </button>
              </div>

              {showVariants && (
                <div className="bg-white p-4 rounded-md border border-gray-200 mb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    {editingVariant ? 'Edit Variant' : 'Add New Variant'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Variant Name *
                      </label>
                      <Input
                        type="text"
                        name="name"
                        value={variantFormData.name || ''}
                        onChange={handleVariantInputChange}
                        placeholder="e.g. Small / Blue"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave blank to auto-generate from color and size
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price *
                      </label>
                      <Input
                        type="number"
                        name="price"
                        value={variantFormData.price?.toString() || '0'}
                        onChange={handleVariantInputChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sale Price
                      </label>
                      <Input
                        type="number"
                        name="salePrice"
                        value={variantFormData.salePrice?.toString() || '0'}
                        onChange={handleVariantInputChange}
                        min="0"
                        step="0.01"
                      />
                      <div className="flex items-center mt-1">
                        <input
                          type="checkbox"
                          id="variantIsSale"
                          checked={!!variantFormData.salePrice && variantFormData.salePrice > 0}
                          onChange={(e) => {
                            setVariantFormData(prev => ({
                              ...prev,
                              salePrice: e.target.checked ? prev.salePrice || ((prev.price || 0) * 0.8) : 0
                            }));
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="variantIsSale" className="ml-2 block text-xs text-gray-700">
                          This variant is on sale
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock
                      </label>
                      <Input
                        type="number"
                        name="stock"
                        value={variantFormData.stock?.toString() || '0'}
                        onChange={handleVariantInputChange}
                        min="0"
                        step="1"
                      />
                      <div className="flex items-center mt-1">
                        <input
                          type="checkbox"
                          id="variantTrackInventory"
                          name="trackInventory"
                          checked={variantFormData.trackInventory !== false}
                          onChange={(e) => {
                            setVariantFormData(prev => ({
                              ...prev,
                              trackInventory: e.target.checked
                            }));
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="variantTrackInventory" className="ml-2 block text-xs text-gray-700">
                          Track inventory for this variant
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU
                      </label>
                      <Input
                        type="text"
                        name="sku"
                        value={variantFormData.sku || ''}
                        onChange={handleVariantInputChange}
                        placeholder="e.g. PROD-SM-BLU"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave blank to auto-generate from product SKU
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Barcode
                      </label>
                      <Input
                        type="text"
                        name="barcode"
                        value={variantFormData.barcode || ''}
                        onChange={handleVariantInputChange}
                        placeholder="e.g. 123456789012"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <Select
                        name="color"
                        value={variantFormData.color || ''}
                        onChange={handleVariantInputChange}
                      >
                        <option value="">Select a color</option>
                        {PRESET_COLORS.map((color) => (
                          <option key={`color-${color.name}`} value={color.name}>
                            {color.name}
                          </option>
                        ))}
                        {formData.colors?.filter(color => !PRESET_COLORS.some(pc => pc.name === color)).map(color => (
                          <option key={color} value={color}>
                            {color} (Custom)
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Size
                      </label>
                      <Select
                        name="size"
                        value={variantFormData.size || ''}
                        onChange={handleVariantInputChange}
                      >
                        <option value="">Select a size</option>
                        {PRESET_SIZES.map(size => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                        {formData.sizes?.filter(size => !PRESET_SIZES.includes(size)).map(size => (
                          <option key={size} value={size}>
                            {size} (Custom)
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Variant Image Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variant Image
                    </label>
                    {imageUrls.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {imageUrls.map((url, index) => (
                          <div
                            key={index}
                            onClick={() => handleSelectVariantImage(url)}
                            className={`relative cursor-pointer border-2 rounded-md overflow-hidden ${
                              selectedVariantImage === url ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="aspect-w-1 aspect-h-1">
                              <Image
                                src={url}
                                alt={`Product image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                            {selectedVariantImage === url && (
                              <div className="absolute top-1 right-1 bg-primary-500 text-white rounded-full p-1">
                                <FiCheck className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Upload product images first to select a variant image.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    {editingVariant && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingVariant(null);
                          setVariantFormData({
                            name: '',
                            price: 0,
                            stock: 0,
                            sku: '',
                            color: '',
                            size: '',
                            image: '',
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={handleAddVariant}
                    >
                      {editingVariant ? 'Update Variant' : 'Add Variant'}
                    </Button>
                  </div>
                </div>
              )}

              {formData.variants && formData.variants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Image
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Color/Size
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.variants.map((variant) => (
                        <tr key={variant.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-10 w-10 relative flex-shrink-0">
                              {variant.image ? (
                                <ProxiedImage
                                  src={variant.image}
                                  alt={variant.name}
                                  fill
                                  className="rounded-md object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                                  <span className="text-gray-500 text-xs">No image</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {variant.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {variant.salePrice && variant.salePrice > 0 ? (
                              <div>
                                <span className="text-red-600">${variant.salePrice.toFixed(2)}</span>
                                <span className="ml-2 line-through">${variant.price.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span>${variant.price.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {variant.trackInventory !== false ? (
                              <span>{variant.stock || 0}</span>
                            ) : (
                              <span className="text-gray-400">Not tracked</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              {variant.color && (
                                <div className="flex items-center mr-2">
                                  <div
                                    className="w-4 h-4 rounded-full border border-gray-300 mr-1"
                                    style={{
                                      backgroundColor: PRESET_COLORS.find(c => c.name === variant.color)?.value || variant.color
                                    }}
                                  />
                                  <span>{variant.color}</span>
                                </div>
                              )}
                              {variant.size && (
                                <div className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                  {variant.size}
                                </div>
                              )}
                              {!variant.color && !variant.size && '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {variant.sku || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => handleEditVariant(variant)}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                            >
                              <FiEdit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(variant.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FiTrash className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No variants added yet. Add variants to create different versions of this product.
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Note:</strong> When you enable variants, customers will need to select a variant to purchase.
                Each variant can have its own price, stock level, and attributes.
              </p>
              <ul className="text-sm text-blue-800 list-disc pl-5 space-y-1">
                <li>Add colors and sizes to the product first, then use &quot;Generate Variants&quot; to create all combinations</li>
                <li>Each variant can have its own image, price, and inventory settings</li>
                <li>Variant names are automatically generated if left blank</li>
                <li>SKUs are auto-generated based on the product SKU, color, and size</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* SEO Section */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">SEO Settings</h3>
          <div className="text-sm text-gray-500">
            Optimize your product for search engines
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Title
              </label>
              <Input
                type="text"
                name="seoTitle"
                value={formData.seoTitle || ''}
                onChange={handleInputChange}
                placeholder={formData.name || 'Product title for search engines'}
                error={formSubmitted ? validationErrors.seoTitle : undefined}
                aria-invalid={!!validationErrors.seoTitle}
              />
              <p className="mt-1 text-xs text-gray-500 flex justify-between">
                <span>Recommended: 50-60 characters</span>
                <span className={`${formData.seoTitle && formData.seoTitle.length > 60 ? 'text-red-500' : ''}`}>
                  {formData.seoTitle ? formData.seoTitle.length : 0}/60
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug
              </label>
              <div className="flex">
                <Input
                  type="text"
                  name="slug"
                  value={formData.slug || ''}
                  onChange={handleInputChange}
                  placeholder="product-url-slug"
                  className="flex-grow"
                  error={formSubmitted ? validationErrors.slug : undefined}
                  aria-invalid={!!validationErrors.slug}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="ml-2 whitespace-nowrap"
                  onClick={generateSlug}
                >
                  Generate
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                The URL path for this product (automatically generated if left blank)
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <Textarea
                name="seoDescription"
                value={formData.seoDescription || ''}
                onChange={handleInputChange}
                rows={2}
                placeholder={formData.description ? formData.description.substring(0, 160) : 'Brief description for search results'}
                error={formSubmitted ? validationErrors.seoDescription : undefined}
                aria-invalid={!!validationErrors.seoDescription}
              />
              <p className="mt-1 text-xs text-gray-500 flex justify-between">
                <span>Recommended: 120-160 characters</span>
                <span className={`${formData.seoDescription && formData.seoDescription.length > 160 ? 'text-red-500' : ''}`}>
                  {formData.seoDescription ? formData.seoDescription.length : 0}/160
                </span>
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords
              </label>
              <div className="flex">
                <Input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Add a keyword and press Enter"
                  className="flex-grow"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="ml-2"
                  onClick={handleAddKeyword}
                >
                  Add
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Keywords help search engines understand what your product is about
              </p>

              {formData.seoKeywords && formData.seoKeywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.seoKeywords.map((keyword, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center"
                    >
                      <span>{keyword}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">SEO Preview</h4>
            <div className="border border-gray-300 rounded p-3 bg-white">
              <div className="text-blue-800 text-lg font-medium truncate">
                {formData.seoTitle || formData.name || 'Product Title'}
              </div>
              <div className="text-green-700 text-sm truncate">
                www.yourstore.com/shop/{formData.slug || 'product-url'}
              </div>
              <div className="text-gray-600 text-sm mt-1 line-clamp-2">
                {formData.seoDescription || formData.description || 'Product description will appear here. Make sure to add a compelling description to attract customers.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-8">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors"
          onClick={() => router.push('/admin/products')}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          disabled={loading}
        >
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
          {product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}