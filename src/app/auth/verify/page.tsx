'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

// Create a separate component that uses useSearchParams
function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email. Please try again.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center"
      >
        <div>
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight text-primary-600">
              Yours <span className="text-accent-500">Ecommerce</span>
            </h1>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Email Verification</h2>
        </div>

        <div className="mt-8">
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <Loader2 size={64} className="text-primary-600 animate-spin mb-4" />
              <p className="text-lg text-gray-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center">
              <CheckCircle size={64} className="text-green-500 mb-4" />
              <p className="text-lg text-gray-600 mb-6">{message}</p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push('/auth/login')}
                className="mt-4"
              >
                Sign In
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center">
              <XCircle size={64} className="text-red-500 mb-4" />
              <p className="text-lg text-gray-600 mb-6">{message}</p>
              <div className="flex flex-col space-y-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/auth/login')}
                >
                  Go to Login
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/auth/signup')}
                >
                  Sign Up Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Loading fallback for Suspense
function LoadingVerification() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary-600">
            Yours <span className="text-accent-500">Ecommerce</span>
          </h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Email Verification</h2>
        </div>
        <div className="mt-8 flex flex-col items-center">
          <Loader2 size={64} className="text-primary-600 animate-spin mb-4" />
          <p className="text-lg text-gray-600">Loading verification page...</p>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingVerification />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
