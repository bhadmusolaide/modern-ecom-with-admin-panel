'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '../firebase/auth/FirebaseAuthProvider';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
    <p className="text-gray-600">{message}</p>
  </div>
);

interface ErrorPageProps {
  message: string;
  code?: number;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ message, code }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
      <h2 className="text-2xl font-semibold text-red-700 mb-2">
        {code ? `Error ${code}` : 'Access Denied'}
      </h2>
      <p className="text-red-600">{message}</p>
      <a
        href="/"
        className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
      >
        Return to Home
      </a>
    </div>
  </div>
);

/**
 * Higher-order component that wraps admin pages with authentication checks
 *
 * Enforces Firebase authentication and admin role checks in all environments.
 * Also provides error boundary functionality for components using the 'use' hook.
 *
 * @param Component - The component to wrap with authentication
 * @returns A new component with authentication checks
 */
export function withAdminPage<P extends object>(Component: React.ComponentType<P>) {
  // Create an error boundary component
  class AdminPageErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Admin page error boundary caught an error:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-semibold text-red-700 mb-2">
                Error Loading Page
              </h2>
              <p className="text-red-600 mb-4">
                {this.state.error?.message || 'An unexpected error occurred while loading this page.'}
              </p>
              <p className="text-neutral-600 mb-4">
                This could be due to a network issue or a problem with the page data.
              </p>
              <div className="flex space-x-4">
                <a
                  href="/admin"
                  className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                >
                  Return to Dashboard
                </a>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 inline-block px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        );
      }

      return this.props.children;
    }
  }

  // Return the protected page component
  return function ProtectedPage(props: P) {
    const { user, isAdmin, isLoading } = useFirebaseAuth();
    const router = useRouter();

    // Show loading spinner while checking authentication
    if (isLoading) {
      return <LoadingSpinner message="Checking authentication..." />;
    }

    // If not authenticated, show error page
    if (!user) {
      // Redirect to login after a short delay
      React.useEffect(() => {
        const timer = setTimeout(() => {
          router.push('/auth/login?from=' + encodeURIComponent(window.location.pathname));
        }, 2000);

        return () => clearTimeout(timer);
      }, [router]);

      return <ErrorPage message="Please log in to access this page" />;
    }

    // If not admin, show error page and redirect to unauthorized page
    if (!isAdmin) {
      React.useEffect(() => {
        const timer = setTimeout(() => {
          router.push('/auth/unauthorized');
        }, 2000);

        return () => clearTimeout(timer);
      }, [router]);

      return <ErrorPage
        message="You don't have permission to access this page. Admin privileges are required."
        code={403}
      />;
    }

    // If authenticated and admin, render the component with error boundary
    return (
      <AdminPageErrorBoundary>
        <Component {...props} />
      </AdminPageErrorBoundary>
    );
  };
}
