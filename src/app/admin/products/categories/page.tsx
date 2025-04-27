'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/context/ToastContext';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, updateDoc, writeBatch, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import S3Image from '@/components/ui/S3Image';
import { FiPlus, FiTrash2, FiEdit2, FiArrowUp, FiArrowDown, FiEye, FiEyeOff } from 'react-icons/fi';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  parentName?: string;
  isActive?: boolean;
  order?: number;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      // Get all categories
      const categoriesRef = collection(db, 'categories');
      const q = query(categoriesRef, orderBy('order'), orderBy('name'));
      const querySnapshot = await getDocs(q);

      // Create a map of category IDs to parent names
      const categoryMap = new Map();
      querySnapshot.docs.forEach(doc => {
        categoryMap.set(doc.id, doc.data().name);
      });

      // Get product counts for each category
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);

      // Count products for each category
      const productCounts: Record<string, number> = {};
      productsSnapshot.docs.forEach(doc => {
        const product = doc.data();
        const categoryId = product.category;

        if (categoryId) {
          productCounts[categoryId] = (productCounts[categoryId] || 0) + 1;
        }
      });

      // Map categories with parent names and product counts
      const categoriesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          parentName: data.parentId ? categoryMap.get(data.parentId) : null,
          productCount: productCounts[doc.id] || 0,
          isActive: data.isActive !== false, // Default to true if not set
          order: data.order || 0
        };
      }) as Category[];

      // Sort categories by order and then by name
      const sortedCategories = [...categoriesData].sort((a, b) => {
        const orderDiff = (a.order || 0) - (b.order || 0);
        if (orderDiff !== 0) return orderDiff;
        return a.name.localeCompare(b.name);
      });

      setCategories(sortedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast('Error fetching categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    try {
      const categoriesRef = collection(db, 'categories');
      const slug = newCategory.name.toLowerCase().replace(/\s+/g, '-');

      // Get the highest order value to place the new category at the end
      const highestOrderQuery = query(categoriesRef, orderBy('order', 'desc'), limit(1));
      const highestOrderSnapshot = await getDocs(highestOrderQuery);
      const highestOrder = highestOrderSnapshot.empty ? 0 : highestOrderSnapshot.docs[0].data().order || 0;

      await addDoc(categoriesRef, {
        ...newCategory,
        slug,
        order: highestOrder + 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      showToast('Category added successfully', 'success');
      setNewCategory({ name: '', description: '' });
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      showToast('Error adding category', 'error');
    }
  };

  const handleDeleteCategory = (categoryId: string, productCount: number) => {
    if (productCount > 0) {
      showToast(`Cannot delete category with ${productCount} products. Reassign products first.`, 'error');
      return;
    }

    if (window.confirm('Are you sure you want to delete this category?')) {
      // Use Promise chaining instead of async/await to avoid Promise leaking into URL
      deleteDoc(doc(db, 'categories', categoryId))
        .then(() => {
          showToast('Category deleted successfully', 'success');
          fetchCategories();
        })
        .catch((error) => {
          console.error('Error deleting category:', error);
          showToast('Error deleting category', 'error');
        });
    }
  };

  const handleToggleVisibility = async (categoryId: string, currentVisibility: boolean) => {
    try {
      const categoryRef = doc(db, 'categories', categoryId);
      await updateDoc(categoryRef, {
        isActive: !currentVisibility,
        updatedAt: new Date().toISOString()
      });

      showToast(`Category ${!currentVisibility ? 'shown' : 'hidden'} successfully`, 'success');
      fetchCategories();
    } catch (error) {
      console.error('Error updating category visibility:', error);
      showToast('Error updating category visibility', 'error');
    }
  };

  const handleChangeOrder = async (categoryId: string, _currentOrder: number, direction: 'up' | 'down') => {
    try {
      // Sort categories by order to ensure we have the correct sequence
      const sortedCategories = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));

      // Find the index of the category we're moving
      const currentIndex = sortedCategories.findIndex(c => c.id === categoryId);
      if (currentIndex === -1) {
        throw new Error('Category not found');
      }

      // Determine the new index based on direction
      let newIndex;
      if (direction === 'up') {
        // Can't move up if already at the top
        if (currentIndex === 0) {
          showToast('Category is already at the top', 'info');
          return;
        }
        newIndex = currentIndex - 1;
      } else { // down
        // Can't move down if already at the bottom
        if (currentIndex === sortedCategories.length - 1) {
          showToast('Category is already at the bottom', 'info');
          return;
        }
        newIndex = currentIndex + 1;
      }

      // Swap the categories
      const batch = writeBatch(db);
      const movingCategory = sortedCategories[currentIndex];
      const targetCategory = sortedCategories[newIndex];

      // Update the moving category's order
      const movingCategoryRef = doc(db, 'categories', movingCategory.id);
      batch.update(movingCategoryRef, {
        order: targetCategory.order,
        updatedAt: new Date().toISOString()
      });

      // Update the target category's order
      const targetCategoryRef = doc(db, 'categories', targetCategory.id);
      batch.update(targetCategoryRef, {
        order: movingCategory.order,
        updatedAt: new Date().toISOString()
      });

      // Commit the batch update
      await batch.commit();

      // Show success message
      showToast('Category order updated successfully', 'success');

      // Refresh the categories list
      fetchCategories();
    } catch (error) {
      console.error('Error updating category order:', error);
      showToast('Error updating category order', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Categories</h1>
      </div>

      {/* Add Category Form */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Enter category name"
              required
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              placeholder="Enter category description"
              className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            Add Category
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Parent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {categories.map((category) => (
              <tr key={category.id} className={`hover:bg-neutral-50 ${!category.isActive ? 'bg-neutral-50 text-neutral-400' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium">{category.order || 0}</span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleChangeOrder(category.id, category.order || 0, 'up')}
                        className="text-neutral-500 hover:text-neutral-700"
                        title="Move up"
                      >
                        <FiArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleChangeOrder(category.id, category.order || 0, 'down')}
                        className="text-neutral-500 hover:text-neutral-700"
                        title="Move down"
                      >
                        <FiArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-10 w-10 relative rounded overflow-hidden">
                    <S3Image
                      src={category.image || null}
                      alt={category.name}
                      fill
                      className="object-cover"
                      showNoImageMessage={true}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-neutral-900">{category.name}</div>
                  <div className="text-xs text-neutral-500">{category.slug}</div>
                  {category.description && (
                    <div className="text-xs text-neutral-500 mt-1 max-w-xs truncate">{category.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-900">{category.productCount || 0}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-neutral-900">{category.parentName || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      category.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleToggleVisibility(category.id, category.isActive || false)}
                      className={`${category.isActive ? 'text-green-600 hover:text-green-900' : 'text-neutral-400 hover:text-neutral-600'}`}
                      title={category.isActive ? 'Hide category' : 'Show category'}
                    >
                      {category.isActive ? (
                        <FiEye className="h-5 w-5" />
                      ) : (
                        <FiEyeOff className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => router.push(`/admin/products/categories/${category.id}`)}
                      className="text-primary-600 hover:text-primary-900"
                      title="Edit category"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id, category.productCount || 0)}
                      className={`text-red-600 hover:text-red-900 ${category.productCount ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={category.productCount ? `Cannot delete: has ${category.productCount} products` : 'Delete category'}
                      disabled={Boolean(category.productCount && category.productCount > 0)}
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                  No categories found. Create your first category above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}