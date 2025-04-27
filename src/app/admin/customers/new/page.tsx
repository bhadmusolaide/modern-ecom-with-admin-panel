'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  ArrowLeft,
  Tag
} from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';
import { CustomerSegment } from '@/lib/types';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import {
  getCustomerSegments,
  assignCustomersToSegment
} from '@/lib/firebase/customers';
import { createUser } from '@/lib/firebase/services/userService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import PageHeader from '@/components/admin/PageHeader';
import Container from '@/components/admin/layouts/Container';
import Section from '@/components/admin/layouts/Section';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { withAdminPage } from '@/lib/auth/withAdminPage';

function NewCustomerPage() {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // State
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      phone: ''
    },
    notes: '',
    segment: [] as string[],
    isActive: true
  });

  // Fetch segments
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        setIsLoading(true);
        const fetchedSegments = await getCustomerSegments();
        setSegments(fetchedSegments);
      } catch (error) {
        console.error('Error fetching segments:', error);
        showToast('Failed to load customer segments', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSegments();
  }, [showToast]);

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle segment selection
  const handleSegmentChange = (segmentId: string) => {
    setFormData(prev => {
      const currentSegments = [...prev.segment];

      if (currentSegments.includes(segmentId)) {
        return {
          ...prev,
          segment: currentSegments.filter(id => id !== segmentId)
        };
      } else {
        return {
          ...prev,
          segment: [...currentSegments, segmentId]
        };
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsProcessing(true);

      // Validate form
      if (!formData.email || !formData.password) {
        showToast('Email and password are required', 'error');
        return;
      }

      if (formData.password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }

      // Create customer
      const newCustomer = await createUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: 'CUSTOMER',
        emailVerified: true
      });

      // Update additional customer data
      if (newCustomer) {
        // Add customer to segments
        if (formData.segment.length > 0) {
          await Promise.all(
            formData.segment.map(segmentId =>
              assignCustomersToSegment([newCustomer.id], segmentId)
            )
          );
        }

        showToast('Customer created successfully', 'success');
        router.push(`/admin/customers/${newCustomer.id}`);
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      showToast('Failed to create customer', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PermissionGuard permissions={['customers:create']}>
      <Container>
        <PageHeader
          title="Create New Customer"
          description="Add a new customer to your store"
          showBreadcrumbs={true}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Customers', href: '/admin/customers' },
            { label: 'New Customer', href: '/admin/customers/new' }
          ]}
          actions={[
            {
              label: 'Back to Customers',
              icon: <ArrowLeft size={16} />,
              onClick: () => router.push('/admin/customers'),
              variant: 'outline'
            }
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Section title="Customer Information">
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Name
                        </label>
                        <Input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Customer name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Email*
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="customer@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Password*
                        </label>
                        <Input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Password"
                          required
                          minLength={6}
                        />
                        <p className="mt-1 text-sm text-neutral-500">
                          Must be at least 6 characters
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Phone
                        </label>
                        <Input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Phone number"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                      />
                      <label
                        htmlFor="isActive"
                        className="ml-2 block text-sm text-neutral-900"
                      >
                        Active
                      </label>
                    </div>
                  </div>
                </Section>

                <Section title="Address Information">
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Street
                        </label>
                        <Input
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleInputChange}
                          placeholder="Street address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          City
                        </label>
                        <Input
                          type="text"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          State/Province
                        </label>
                        <Input
                          type="text"
                          name="address.state"
                          value={formData.address.state}
                          onChange={handleInputChange}
                          placeholder="State or province"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Postal Code
                        </label>
                        <Input
                          type="text"
                          name="address.zip"
                          value={formData.address.zip}
                          onChange={handleInputChange}
                          placeholder="Postal code"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Country
                        </label>
                        <Input
                          type="text"
                          name="address.country"
                          value={formData.address.country}
                          onChange={handleInputChange}
                          placeholder="Country"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Phone (Alternative)
                        </label>
                        <Input
                          type="tel"
                          name="address.phone"
                          value={formData.address.phone}
                          onChange={handleInputChange}
                          placeholder="Alternative phone"
                        />
                      </div>
                    </div>
                  </div>
                </Section>

                <Section title="Notes">
                  <div className="p-6">
                    <Textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Add notes about this customer"
                      rows={4}
                    />
                  </div>
                </Section>
              </div>

              <div className="space-y-6">
                <Section title="Customer Segments">
                  <div className="p-6">
                    {isLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                      </div>
                    ) : segments.length > 0 ? (
                      <div className="space-y-2">
                        {segments.map(segment => (
                          <div
                            key={segment.id}
                            className="flex items-center"
                          >
                            <input
                              type="checkbox"
                              id={`segment-${segment.id}`}
                              checked={formData.segment.includes(segment.id)}
                              onChange={() => handleSegmentChange(segment.id)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                            />
                            <label
                              htmlFor={`segment-${segment.id}`}
                              className="ml-2 block text-sm text-neutral-900"
                            >
                              {segment.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-500 text-sm">
                        No segments available. Create segments in the Segments section.
                      </p>
                    )}
                  </div>
                </Section>

                <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
                  <h3 className="text-lg font-medium text-neutral-900 mb-4">Create Customer</h3>
                  <p className="text-neutral-600 text-sm mb-6">
                    This will create a new customer account with the provided information. The customer will be able to log in using the email and password you set.
                  </p>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    icon={<Save size={16} />}
                    iconPosition="left"
                    className="w-full"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Creating...' : 'Create Customer'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </Container>
    </PermissionGuard>
  );
}

export default withAdminPage(NewCustomerPage);
