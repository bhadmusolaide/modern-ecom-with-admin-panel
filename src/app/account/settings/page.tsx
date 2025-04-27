'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, User, Lock, ArrowLeft, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useFirebaseAuth } from '@/lib/firebase';
import { useToast } from '@/lib/context/ToastContext';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';

export default function AccountSettingsPage() {
  const { user, isLoading } = useFirebaseAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      setName(user.name || '');
      setEmail(user.email);
      // In a real app, you would fetch the profile picture URL from the user object
      setProfilePictureUrl('/images/placeholder-avatar.jpg');

      // Fetch CSRF token
      const fetchCsrfToken = async () => {
        try {
          const response = await fetch('/api/auth/csrf');
          const data = await response.json();
          setCsrfToken(data.csrfToken);
        } catch (error) {
          console.error('Error fetching CSRF token:', error);
          showToast('Failed to initialize security token', 'error');
        }
      };

      fetchCsrfToken();
    }
  }, [user, isLoading, router, showToast]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePictureUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!csrfToken) {
      showToast('Security token missing. Please refresh the page.', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      // Update profile information
      const profileResponse = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, csrfToken }),
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData.error || 'Failed to update profile');
      }

      // Upload profile picture if one was selected
      if (profilePicture) {
        const formData = new FormData();
        formData.append('file', profilePicture);

        const pictureResponse = await fetch('/api/user/profile-picture', {
          method: 'POST',
          body: formData,
        });

        const pictureData = await pictureResponse.json();

        if (!pictureResponse.ok) {
          throw new Error(pictureData.error || 'Failed to upload profile picture');
        }
      }

      showToast('Profile updated successfully', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!csrfToken) {
      showToast('Security token missing. Please refresh the page.', 'error');
      setIsSubmitting(false);
      return;
    }

    // Validate passwords
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          csrfToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      showToast('Password updated successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft size={16} />}
            iconPosition="left"
            onClick={() => router.push('/account')}
          >
            Back to Account
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="mt-2">Manage your profile and security settings</p>
          </div>

          <div className="p-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px space-x-8">
                <button
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('profile')}
                >
                  Profile
                </button>
                <button
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'password'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('password')}
                >
                  Password
                </button>
              </nav>
            </div>

            <div className="mt-6">
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileSubmit}>
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3">
                        <div className="flex flex-col items-center">
                          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-4">
                            {profilePictureUrl ? (
                              <img
                                src={profilePictureUrl}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full bg-gray-200">
                                <User size={48} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleProfilePictureChange}
                            />
                            <div className="flex items-center text-sm text-primary-600 hover:text-primary-500">
                              <Upload size={16} className="mr-1" />
                              Change Photo
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="md:w-2/3">
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                              Full Name
                            </label>
                            <input
                              type="text"
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="input mt-1"
                            />
                          </div>

                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email Address
                            </label>
                            <input
                              type="email"
                              id="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="input mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        icon={<Save size={16} />}
                        iconPosition="left"
                        isLoading={isSubmitting}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {activeTab === 'password' && (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-6 max-w-md mx-auto">
                    <div>
                      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="input mt-1"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input mt-1"
                        required
                      />
                      <PasswordStrengthIndicator password={newPassword} />
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input mt-1"
                        required
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        icon={<Lock size={16} />}
                        iconPosition="left"
                        isLoading={isSubmitting}
                      >
                        Update Password
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
