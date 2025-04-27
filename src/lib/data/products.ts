import { Product, Category, FilterOption } from '../types';

export const products: Product[] = [];

export const categories: Category[] = [
  {
    id: 'all',
    name: 'All Products',
    count: 0,
  },
  {
    id: 'tops',
    name: 'Tops',
    count: 0,
    image: 'https://images.pexels.com/photos/5384423/pexels-photo-5384423.jpeg'
  },
  {
    id: 'bottoms',
    name: 'Bottoms',
    count: 0,
    image: 'https://images.pexels.com/photos/52518/jeans-pants-blue-shop-52518.jpeg'
  },
  {
    id: 'outerwear',
    name: 'Outerwear',
    count: 0,
    image: 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg'
  },
  {
    id: 'accessories',
    name: 'Accessories',
    count: 0,
    image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg'
  },
  {
    id: 'footwear',
    name: 'Footwear',
    count: 0,
    image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg'
  }
];

export const filterOptions: FilterOption[] = [
  {
    id: 'category',
    name: 'Category',
    options: [
      { value: 'tops', label: 'Tops & Shirts', count: 0 },
      { value: 'bottoms', label: 'Bottoms', count: 0 },
      { value: 'outerwear', label: 'Outerwear', count: 0 },
      { value: 'knitwear', label: 'Knitwear', count: 0 },
      { value: 'one-pieces', label: 'One-Pieces', count: 0 },
      { value: 'accessories', label: 'Accessories', count: 0 },
    ]
  },
  {
    id: 'size',
    name: 'Size',
    options: [
      { value: 'xs', label: 'XS' },
      { value: 's', label: 'S' },
      { value: 'm', label: 'M' },
      { value: 'l', label: 'L' },
      { value: 'xl', label: 'XL' },
      { value: 'xxl', label: 'XXL' },
    ]
  },
  {
    id: 'color',
    name: 'Color',
    options: [
      { value: 'black', label: 'Black' },
      { value: 'white', label: 'White' },
      { value: 'gray', label: 'Gray' },
      { value: 'beige', label: 'Beige' },
      { value: 'blue', label: 'Blue' },
      { value: 'green', label: 'Green' },
      { value: 'burgundy', label: 'Burgundy' },
    ]
  },
  {
    id: 'price',
    name: 'Price',
    options: [
      { value: 'under-50', label: 'Under $50' },
      { value: '50-100', label: '$50 - $100' },
      { value: '100-150', label: '$100 - $150' },
      { value: '150-200', label: '$150 - $200' },
      { value: 'over-200', label: 'Over $200' },
    ]
  },
  {
    id: 'tag',
    name: 'Features',
    options: [
      { value: 'sustainable', label: 'Sustainable' },
      { value: 'organic', label: 'Organic' },
      { value: 'recycled', label: 'Recycled Materials' },
      { value: 'new-arrival', label: 'New Arrivals' },
      { value: 'sale', label: 'On Sale' },
    ]
  }
];
