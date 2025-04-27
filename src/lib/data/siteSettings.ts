// Define section item interface
export interface SectionItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  link?: string;
  description?: string;
}

// Define section interface
export interface SiteSection {
  id: string;
  name: string;
  type: string;
  order: number;
  enabled: boolean;
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
  items?: SectionItem[];
}

// Default homepage sections
export const DEFAULT_HOMEPAGE_SECTIONS: SiteSection[] = [
  {
    id: 'hero',
    name: 'Hero Banner',
    type: 'hero',
    order: 1,
    enabled: true,
    title: 'Modern Unisex Fashion',
    subtitle: 'Discover our collection of timeless, sustainable unisex fashion pieces designed for everyone.',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    imageUrl: 'https://images.pexels.com/photos/5868720/pexels-photo-5868720.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b'
  },
  {
    id: 'categories',
    name: 'Categories',
    type: 'categories',
    order: 2,
    enabled: true,
    title: 'Shop by Category',
    subtitle: 'Explore our collections',
    items: [
      {
        id: 'cat-1',
        title: 'Tops & Shirts',
        imageUrl: 'https://images.pexels.com/photos/5384423/pexels-photo-5384423.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        link: '/category/tops'
      },
      {
        id: 'cat-2',
        title: 'Outerwear',
        imageUrl: 'https://images.pexels.com/photos/7691168/pexels-photo-7691168.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        link: '/category/outerwear'
      },
      {
        id: 'cat-3',
        title: 'Bottoms',
        imageUrl: 'https://images.pexels.com/photos/5384427/pexels-photo-5384427.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        link: '/category/bottoms'
      }
    ]
  },
  {
    id: 'featured',
    name: 'Featured Products',
    type: 'featured',
    order: 3,
    enabled: true,
    title: 'Featured Products',
    subtitle: 'Our most popular items'
  },
  {
    id: 'banner',
    name: 'Promo Banner',
    type: 'banner',
    order: 4,
    enabled: true,
    title: 'Summer Sale',
    subtitle: 'Up to 50% off on selected items',
    buttonText: 'Shop Sale',
    buttonLink: '/sale',
    imageUrl: 'https://images.pexels.com/photos/5868743/pexels-photo-5868743.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    backgroundColor: '#f0f9ff',
    textColor: '#0c4a6e'
  },
  {
    id: 'values',
    name: 'Our Values',
    type: 'values',
    order: 5,
    enabled: true,
    title: 'Our Values',
    subtitle: 'What makes us different',
    items: [
      {
        id: 'value-1',
        title: 'Sustainable Materials',
        description: 'We use eco-friendly fabrics and sustainable production methods to minimize our environmental impact.'
      },
      {
        id: 'value-2',
        title: 'Timeless Design',
        description: 'Our pieces are designed to transcend trends, ensuring they remain stylish and relevant for years to come.'
      },
      {
        id: 'value-3',
        title: 'Inclusive Sizing',
        description: 'We offer a wide range of sizes to ensure our clothing is accessible and flattering for all body types.'
      }
    ]
  },
  {
    id: 'new-arrivals',
    name: 'New Arrivals',
    type: 'new-arrivals',
    order: 6,
    enabled: true,
    title: 'New Arrivals',
    subtitle: 'Just landed in store'
  },
  {
    id: 'testimonials',
    name: 'Testimonials',
    type: 'testimonials',
    order: 7,
    enabled: true,
    title: 'What Our Customers Say',
    subtitle: 'Real experiences from our community',
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    items: [
      {
        id: 'testimonial-1',
        title: 'Sarah M.',
        description: 'The quality of the clothes is exceptional. I love how each piece is designed to be both stylish and sustainable.',
      },
      {
        id: 'testimonial-2',
        title: 'James K.',
        description: 'Finally, a brand that truly understands inclusive fashion. The fits are perfect for everyone.',
      },
      {
        id: 'testimonial-3',
        title: 'Emma R.',
        description: 'The customer service is outstanding, and the clothes are even better. My new go-to fashion destination!',
      }
    ]
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    type: 'newsletter',
    order: 8,
    enabled: true,
    title: 'Stay in Touch',
    subtitle: 'Subscribe to our newsletter for exclusive offers and updates',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    buttonText: 'Subscribe',
    buttonLink: '#'
  }
];
