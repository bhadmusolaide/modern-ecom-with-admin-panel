'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/context/ToastContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product } from '@/lib/types';
import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { getProductsByCategory } from '@/lib/firebase/utils/queryOptimizer';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { use } from 'react';
import { getSafeImageUrl, isValidImageUrl } from '@/lib/utils/imageUrlHelper';
import ProductImage from '@/components/ui/ProductImage';

export default function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Use the params with React.use
  const { id } = use(props.params);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() } as Product;

          // Enhanced debugging for image issues
          console.log('Product data:', productData);
          console.log('Product image URL:', productData.image);
          console.log('Product image type:', typeof productData.image);
          console.log('Is image URL valid:', isValidImageUrl(productData.image));
          console.log('Safe image URL:', getSafeImageUrl(productData.image));

          // Check for additional images
          if (productData.images && productData.images.length > 0) {
            console.log('Product has additional images:', productData.images);
          } else {
            console.log('Product has no additional images');
          }

          setProduct(productData);

          // Set default selected color and size if available
          if (productData.colors && productData.colors.length > 0) {
            setSelectedColor(productData.colors[0]);
          }

          if (productData.sizes && productData.sizes.length > 0) {
            setSelectedSize(productData.sizes[0]);
          }

          // Fetch related products based on category
          if (productData.category) {
            fetchRelatedProducts(productData.category, productData.id);
          }
        } else {
          showToast('Product not found', 'error');
          router.push('/shop');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        showToast('Error fetching product', 'error');
        router.push('/shop');
      } finally {
        setLoading(false);
      }
    };

    // Function to fetch related products
    const fetchRelatedProducts = async (categoryId: string, currentProductId: string) => {
      try {
        setLoadingRelated(true);
        // Get products in the same category
        const categoryProducts = await getProductsByCategory(categoryId, 'newest', 10);
        // Filter out the current product
        const filtered = categoryProducts.filter(p => p.id !== currentProductId);
        // Limit to 4 related products
        setRelatedProducts(filtered.slice(0, 4));
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setLoadingRelated(false);
      }
    };


    fetchProduct();
  }, [id, router, showToast]);

  const handleAddToCart = () => {
    if (!product) return;

    setIsAddingToCart(true);

    try {
      addToCart({
        ...product,
        selectedColor,
        selectedSize,
      }, quantity);

      showToast('Product added to cart', 'success');
    } catch (error) {
      console.error('Error adding product to cart:', error);
      showToast('Failed to add product to cart', 'error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  // Get all images for the product (main image + additional images)
  const getAllImages = () => {
    if (!product) return [];

    const images = [];
    if (product.image) {
      images.push(product.image);
    }
    if (product.images && product.images.length > 0) {
      images.push(...product.images);
    }
    return images;
  };

  // Handle thumbnail click
  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Handle next image
  const handleNextImage = () => {
    const allImages = getAllImages();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  // Handle previous image
  const handlePrevImage = () => {
    const allImages = getAllImages();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Get current image to display
  const getCurrentImage = () => {
    const allImages = getAllImages();
    return allImages.length > 0 ? allImages[currentImageIndex] : product?.image;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Product Detail Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row -mx-4">
          {/* Product Images */}
          <div className="md:w-1/2 px-4 mb-6 md:mb-0">
            <div className="product-image-container w-full aspect-square rounded-lg">
              <ProductImage
                src={getCurrentImage()}
                alt={product?.name || 'Product image'}
                className="w-full h-full"
                onError={() => {
                  console.error('ProductImage component failed to load image:', getCurrentImage());
                }}
              />

              {/* Navigation arrows */}
              {getAllImages().length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all duration-200"
                    aria-label="Previous image"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all duration-200"
                    aria-label="Next image"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Product tags */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product?.isNew && (
                  <span className="product-tag-new">
                    New
                  </span>
                )}
                {product?.isSale && (
                  <span className="product-tag-sale">
                    Sale
                  </span>
                )}
              </div>

              {/* Image counter */}
              {getAllImages().length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {currentImageIndex + 1} / {getAllImages().length}
                </div>
              )}
            </div>

            {/* Additional images gallery - if available */}
            {getAllImages().length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {getAllImages().map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(index)}
                    className={`product-gallery-thumb w-full transition-all duration-200 ${
                      index === currentImageIndex
                        ? 'ring-2 ring-primary-500 ring-offset-2'
                        : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                    }`}
                  >
                    <ProductImage
                      src={image}
                      alt={`${product?.name} - Image ${index + 1}`}
                      className="w-full h-full"
                      onError={() => {
                        console.error('Gallery image failed to load:', image);
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="md:w-1/2 px-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product?.name}</h1>

            {/* Price */}
            <div className="mb-4">
              {product?.isSale && product?.salePrice ? (
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-red-600">{formatPrice(product.salePrice)}</span>
                  <span className="ml-2 text-lg text-gray-500 line-through">{formatPrice(product.price)}</span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-gray-900">{product && formatPrice(product.price)}</span>
              )}
            </div>

            {/* Description */}
            {product?.description && (
              <div className="mb-6">
                <p className="text-gray-700">{product.description}</p>
              </div>
            )}

            {/* Color selection */}
            {product?.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Color</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border ${selectedColor === color ? 'ring-2 ring-offset-2 ring-primary-500' : 'ring-1 ring-gray-200'}`}
                      style={{ backgroundColor: color.toLowerCase() }}
                      aria-label={`Color: ${color}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size selection */}
            {product?.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1 border rounded-md ${selectedSize === size ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-gray-200 text-gray-700'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity</h3>
              <div className="flex items-center">
                <button
                  onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                  className="w-10 h-10 border border-gray-300 rounded-l-md flex items-center justify-center text-gray-600 hover:bg-gray-50"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-16 h-10 border-t border-b border-gray-300 text-center text-gray-700 focus:outline-none"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 border border-gray-300 rounded-r-md flex items-center justify-center text-gray-600 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to cart button */}
            <div className="mb-6">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || !product}
                className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>

            {/* Additional product details */}
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">SKU</p>
                  <p className="font-medium">{product?.sku || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-medium">{product?.categoryName || 'N/A'}</p>
                </div>
                {product?.stock !== undefined && (
                  <div>
                    <p className="text-gray-500">Availability</p>
                    <p className="font-medium">
                      {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {(relatedProducts.length > 0 || loadingRelated) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h2>

          {loadingRelated ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <div key={relatedProduct.id} className="group related-product">
                <Link href={`/shop/product/${relatedProduct.id}`} className="block">
                  <div className="related-product-image mb-3 relative">
                    <ProductImage
                      src={relatedProduct.image}
                      alt={relatedProduct.name || 'Related product'}
                      className="w-full h-full"
                      onError={() => {
                        console.error('Related product image failed to load:', relatedProduct.image);
                      }}
                    />

                    {/* Product tags - full width banner style */}
                    <div className="absolute top-0 left-0 right-0 flex flex-col">
                      {relatedProduct.isNew && (
                        <span className="product-tag-new">
                          NEW
                        </span>
                      )}
                      {relatedProduct.isSale && (
                        <span className="product-tag-sale">
                          SALE
                        </span>
                      )}
                    </div>

                    {/* Quick action buttons */}
                    <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          // Add wishlist functionality here
                        }}
                        aria-label="Add to wishlist"
                      >
                        <FiHeart className="h-5 w-5 text-gray-700" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    {relatedProduct.name}
                  </h3>

                  <div className="mt-1">
                    {relatedProduct.isSale && relatedProduct.salePrice ? (
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-red-600">{formatPrice(relatedProduct.salePrice)}</span>
                        <span className="ml-2 text-xs text-gray-500 line-through">{formatPrice(relatedProduct.price)}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{formatPrice(relatedProduct.price)}</span>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
}