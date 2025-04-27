'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiChevronRight, FiFilter, FiGrid, FiList, FiX } from 'react-icons/fi';
import { Product, Category } from '@/lib/types';
import { getProductsByCategory, getCategories } from '@/lib/firebase/utils/queryOptimizer';
import { retryWithBackoff } from '@/lib/utils/errorHandling';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';

// Number of products per page
const PRODUCTS_PER_PAGE = 12;

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;

  // Get current page from URL or default to 1
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Get sort option from URL or default to 'newest'
  const sortOption = searchParams.get('sort') || 'newest';

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Price filter
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<[number, number]>([0, 1000]);

  // Availability filters
  const [showInStock, setShowInStock] = useState(false);
  const [showOnSale, setShowOnSale] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Format price for display
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Load category and products
  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all categories to find the one matching the slug
        const fetchCategories = async () => {
          const allCategories = await getCategories();
          const foundCategory = allCategories.find(
            (cat: any) => cat.slug === slug || cat.id === slug
          );

          if (!foundCategory) {
            throw new Error('Category not found');
          }

          return foundCategory;
        };

        // Use retry mechanism for fetching the category
        const categoryData = await retryWithBackoff(fetchCategories);
        setCategory(categoryData);

        // Fetch products for this category
        const fetchProducts = async () => {
          // Use the category ID to fetch products
          return await getProductsByCategory(categoryData.id, 'newest', 100);
        };

        // Use retry mechanism for fetching products
        const productsData = await retryWithBackoff(fetchProducts);
        setProducts(productsData);

        // Find min and max prices for the price filter
        if (productsData.length > 0) {
          const prices = productsData.map(p => p.price);
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setPriceRange([minPrice, maxPrice]);
          setSelectedPriceRange([minPrice, maxPrice]);
        }

      } catch (err: any) {
        console.error('Error fetching category data:', err);
        setError(err.message || 'Failed to load category data');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndProducts();
  }, [slug]);

  // Apply filters and sorting
  useEffect(() => {
    if (!products.length) return;

    let result = [...products];

    // Apply price filter
    result = result.filter(
      product => product.price >= selectedPriceRange[0] && product.price <= selectedPriceRange[1]
    );

    // Apply availability filters
    if (showInStock) {
      result = result.filter(product => (product.stock || 0) > 0);
    }

    if (showOnSale) {
      result = result.filter(product => product.isSale);
    }

    if (showNew) {
      result = result.filter(product => product.isNew);
    }

    // Apply sorting
    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
      default:
        // Assuming createdAt is a timestamp string
        result.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }

    setFilteredProducts(result);

    // Calculate total pages
    setTotalPages(Math.ceil(result.length / PRODUCTS_PER_PAGE));

  }, [products, selectedPriceRange, showInStock, showOnSale, showNew, sortOption]);

  // Get current page of products
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/collections/${slug}?${params.toString()}`);
  };

  // Handle sort change
  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    params.set('page', '1'); // Reset to first page when sorting changes
    router.push(`/collections/${slug}?${params.toString()}`);
  };

  // Handle price range change
  const handlePriceRangeChange = (range: [number, number]) => {
    setSelectedPriceRange(range);
  };

  // Toggle filters on mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState type="spinner" size="large" text="Loading category..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState
          message={error}
          retryAction={() => window.location.reload()}
          variant="full"
        />
      </div>
    );
  }

  // Category not found
  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Category Not Found"
          message="The category you're looking for doesn't exist or has been removed."
          actionText="Browse All Collections"
          actionLink="/collections"
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-6 text-sm">
          <ol className="flex items-center space-x-1">
            <li>
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <FiChevronRight className="h-4 w-4 text-gray-400" />
              <Link href="/collections" className="ml-1 text-gray-500 hover:text-gray-700">
                Collections
              </Link>
            </li>
            <li className="flex items-center">
              <FiChevronRight className="h-4 w-4 text-gray-400" />
              <span className="ml-1 font-medium text-gray-900">{category.name}</span>
            </li>
          </ol>
        </nav>

        {/* Category header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
              {category.description && (
                <p className="mt-2 text-gray-600">{category.description}</p>
              )}
            </div>
            {category.image && (
              <div className="mt-4 md:mt-0">
                <Image
                  src={category.image}
                  alt={category.name}
                  width={120}
                  height={120}
                  className="rounded-lg object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Filters and sorting */}
        <div className="mb-6 flex flex-col lg:flex-row justify-between">
          {/* Mobile filter button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={toggleFilters}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiFilter className="mr-2 h-4 w-4" />
              Filters
            </button>
          </div>

          {/* Desktop filters */}
          <div className={`lg:flex lg:flex-1 lg:items-center lg:space-x-6 ${showFilters ? 'block' : 'hidden'}`}>
            {/* Mobile filter header */}
            <div className="lg:hidden flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="text-lg font-medium">Filters</h3>
              <button onClick={toggleFilters} className="text-gray-500">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Price range filter */}
            <div className="mb-4 lg:mb-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Range: {formatPrice(selectedPriceRange[0])} - {formatPrice(selectedPriceRange[1])}
              </label>
              <div className="flex items-center gap-2 ml-0">
                <input
                  type="range"
                  min={priceRange[0]}
                  max={priceRange[1]}
                  value={selectedPriceRange[0]}
                  onChange={(e) => handlePriceRangeChange([parseInt(e.target.value), selectedPriceRange[1]])}
                  className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="flex items-center h-6 mx-1">to</span>
                <input
                  type="range"
                  min={priceRange[0]}
                  max={priceRange[1]}
                  value={selectedPriceRange[1]}
                  onChange={(e) => handlePriceRangeChange([selectedPriceRange[0], parseInt(e.target.value)])}
                  className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Availability filters */}
            <div className="flex flex-wrap gap-2 mb-4 lg:mb-0">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showInStock}
                  onChange={() => setShowInStock(!showInStock)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">In Stock</span>
              </label>

              <label className="inline-flex items-center ml-4">
                <input
                  type="checkbox"
                  checked={showOnSale}
                  onChange={() => setShowOnSale(!showOnSale)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">On Sale</span>
              </label>

              <label className="inline-flex items-center ml-4">
                <input
                  type="checkbox"
                  checked={showNew}
                  onChange={() => setShowNew(!showNew)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">New Arrivals</span>
              </label>
            </div>
          </div>

          {/* View and sort options */}
          <div className="flex items-center space-x-4">
            {/* View mode toggle */}
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
                aria-label="Grid view"
              >
                <FiGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
                aria-label="List view"
              >
                <FiList className="h-5 w-5" />
              </button>
            </div>

            {/* Sort dropdown */}
            <div>
              <select
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Showing {filteredProducts.length > 0 ? (currentPage - 1) * PRODUCTS_PER_PAGE + 1 : 0} to {Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
          </p>
        </div>

        {/* No results */}
        {filteredProducts.length === 0 && (
          <EmptyState
            title="No Products Found"
            message="No products match your current filters. Try adjusting your filter criteria."
            actionText="Clear Filters"
            actionCallback={() => {
              setSelectedPriceRange(priceRange);
              setShowInStock(false);
              setShowOnSale(false);
              setShowNew(false);
            }}
          />
        )}

        {/* Product grid */}
        {filteredProducts.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {currentProducts.map((product) => (
              <Link key={product.id} href={`/shop/product/${product.id}`}>
                <Card className="h-full group overflow-hidden">
                  <div className="relative aspect-w-3 aspect-h-4 bg-gray-100">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-2">
                      {product.isNew && (
                        <div className="flex">
                          <span className="product-tag-new">New</span>
                        </div>
                      )}
                      {product.isSale && (
                        <div className="flex">
                          <span className="product-tag-sale">Sale</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="mt-1 flex justify-between items-center">
                      {product.isSale && product.salePrice ? (
                        <div>
                          <span className="text-accent-600 font-medium">{formatPrice(product.salePrice)}</span>
                          <span className="ml-2 text-gray-500 line-through text-sm">{formatPrice(product.price)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-900 font-medium">{formatPrice(product.price)}</span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Product list */}
        {filteredProducts.length > 0 && viewMode === 'list' && (
          <div className="space-y-6 mb-8">
            {currentProducts.map((product) => (
              <Link key={product.id} href={`/shop/product/${product.id}`}>
                <Card className="group overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-48 h-48">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 192px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-2">
                        {product.isNew && (
                          <div className="flex">
                            <span className="product-tag-new">New</span>
                          </div>
                        )}
                        {product.isSale && (
                          <div className="flex">
                            <span className="product-tag-sale">Sale</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="mt-1">
                        {product.isSale && product.salePrice ? (
                          <div>
                            <span className="text-accent-600 font-medium">{formatPrice(product.salePrice)}</span>
                            <span className="ml-2 text-gray-500 line-through text-sm">{formatPrice(product.price)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-900 font-medium">{formatPrice(product.price)}</span>
                        )}
                      </div>
                      {product.description && (
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                      )}
                      <div className="mt-4 flex items-center space-x-4">
                        {product.stock !== undefined && (
                          <span className={`text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === page
                      ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}