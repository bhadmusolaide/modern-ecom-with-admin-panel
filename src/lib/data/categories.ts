export interface Category {
  id: string;
  name: string;
  count: number;
  image?: string;
}

export const categories: Category[] = [
  {
    id: 'all',
    name: 'All Products',
    count: 12,
  },
  {
    id: 'tops',
    name: 'Tops',
    count: 2,
    image: 'https://images.pexels.com/photos/5384423/pexels-photo-5384423.jpeg'
  },
  {
    id: 'bottoms',
    name: 'Bottoms',
    count: 3,
    image: 'https://images.pexels.com/photos/52518/jeans-pants-blue-shop-52518.jpeg'
  },
  {
    id: 'outerwear',
    name: 'Outerwear',
    count: 2,
    image: 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg'
  },
  {
    id: 'accessories',
    name: 'Accessories',
    count: 3,
    image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg'
  },
  {
    id: 'footwear',
    name: 'Footwear',
    count: 2,
    image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg'
  }
]; 