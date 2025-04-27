# Yours E-Commerce Website

A modern e-commerce website built with Next.js, Firebase, and Tailwind CSS.

## Features

- Dynamic product and category management
- Admin panel for content management
- Responsive design for all devices
- Optimized image loading and performance
- Error handling and recovery

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bhadmusolaide/my-ecom-project.git
cd my-ecom-project
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   - Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   - Edit the `.env.local` file and fill in your Firebase configuration values:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

   # Security (generate a strong random string for CSRF protection)
   CSRF_SECRET=your-csrf-secret-key
   ```

   > **Important**: Never commit your `.env.local` file to version control. It's already added to `.gitignore` for your protection.

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src/app` - Next.js app router pages
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions, hooks, and Firebase configuration
- `/src/lib/firebase` - Firebase setup and utility functions
- `/src/lib/context` - React context providers
- `/src/lib/types` - TypeScript type definitions
- `/public` - Static assets

## Dynamic Data Implementation

This project uses Firebase Firestore to store and retrieve product and category data. The implementation follows these principles:

1. **Data Models**: Clear separation of concerns with well-defined data models
2. **Reusable Hooks**: Custom hooks for data fetching with loading and error states
3. **Optimistic UI**: Updates appear immediately in the UI before being confirmed by the server
4. **Error Recovery**: Graceful handling of network issues and invalid data
5. **Performance**: Optimized data loading and rendering

### Key Components

- `DynamicSection.tsx` - Loads different section types based on configuration
- `FeaturedProducts.tsx` - Displays featured products from Firestore
- `Categories.tsx` - Shows category grid with dynamic data
- `ProductDetail.tsx` - Product detail page with dynamic data loading
- `CategoryDetail.tsx` - Category page showing all products in a category

### Admin Panel

The admin panel allows content managers to:

1. Create, edit, and delete products
2. Manage product categories
3. Upload and manage product images
4. Control product visibility and featured status
5. Organize categories with custom ordering

## Testing

A comprehensive test plan is available in `test-plan.md`. This covers:

1. Category management testing
2. Product management testing
3. Performance testing
4. Error recovery testing

## Documentation

For a complete summary of the dynamic data implementation, see `dynamic-data-implementation-summary.md`.

## Security

This project implements several security measures:

1. **Authentication**: Firebase Authentication for secure user management
2. **Authorization**: Role-based access control for admin and user actions
3. **CSRF Protection**: Cross-Site Request Forgery protection for all forms and API endpoints
4. **Content Security Policy**: Strict CSP headers to prevent XSS attacks
5. **Rate Limiting**: Protection against brute force attacks on authentication endpoints
6. **Secure Headers**: HTTP security headers to protect against common web vulnerabilities
7. **Firestore Security Rules**: Granular access control for database operations

### Security Best Practices

When deploying this application:

1. Always use environment variables for sensitive configuration (never hardcode)
2. Set a strong CSRF secret in your environment variables
3. Configure proper Firebase security rules for your production environment
4. Enable Firebase Authentication security features like email verification
5. Regularly update dependencies to patch security vulnerabilities

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
