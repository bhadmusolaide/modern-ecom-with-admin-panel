'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Users,
  Search,
  Filter,
  RefreshCw,
  Save,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { useToast } from '@/lib/context/ToastContext';
import { CustomerSegment, SegmentCriteria } from '@/lib/types';
import { withAdminPage } from '@/lib/auth/withAdminPage';
import {
  getCustomerSegments,
  createCustomerSegment,
  updateCustomerSegment,
  deleteCustomerSegment,
  findCustomersMatchingSegmentCriteria
} from '@/lib/firebase/customers';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import PageHeader from '@/components/admin/PageHeader';
import Container from '@/components/admin/layouts/Container';
import Section from '@/components/admin/layouts/Section';
import { formatDate } from '@/lib/utils/format';
import PermissionGuard from '@/components/admin/PermissionGuard';
import Modal from '@/components/ui/Modal';

function CustomerSegmentsPage() {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // State
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<CustomerSegment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: {
      minSpent: undefined as number | undefined,
      maxSpent: undefined as number | undefined,
      minOrders: undefined as number | undefined,
      maxOrders: undefined as number | undefined
    },
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

  // Filter segments based on search term
  const filteredSegments = segments.filter(segment =>
    segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (segment.description && segment.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('criteria.')) {
      const criteriaField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          [criteriaField]: value === '' ? undefined : Number(value)
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

  // Open modal for creating a new segment
  const handleCreateSegment = () => {
    setEditingSegment(null);
    setFormData({
      name: '',
      description: '',
      criteria: {
        minSpent: undefined,
        maxSpent: undefined,
        minOrders: undefined,
        maxOrders: undefined
      },
      isActive: true
    });
    setShowModal(true);
  };

  // Open modal for editing a segment
  const handleEditSegment = (segment: CustomerSegment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description || '',
      criteria: {
        minSpent: segment.criteria?.minSpent,
        maxSpent: segment.criteria?.maxSpent,
        minOrders: segment.criteria?.minOrders,
        maxOrders: segment.criteria?.maxOrders
      },
      isActive: segment.isActive !== false
    });
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsProcessing(true);

      if (editingSegment) {
        // Update existing segment
        const updatedSegment = await updateCustomerSegment(
          editingSegment.id,
          {
            name: formData.name,
            description: formData.description,
            criteria: formData.criteria,
            isActive: formData.isActive
          }
        );

        // Update local state
        setSegments(prevSegments =>
          prevSegments.map(segment =>
            segment.id === editingSegment.id ? updatedSegment : segment
          )
        );

        showToast('Segment updated successfully', 'success');
      } else {
        // Create new segment
        const newSegment = await createCustomerSegment({
          name: formData.name,
          description: formData.description,
          criteria: formData.criteria,
          isActive: formData.isActive
        });

        // Update local state
        setSegments(prevSegments => [...prevSegments, newSegment]);

        showToast('Segment created successfully', 'success');
      }

      // Close modal
      setShowModal(false);
    } catch (error) {
      console.error('Error saving segment:', error);
      showToast('Failed to save segment', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle segment deletion
  const handleDeleteSegment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this segment? This will remove all customers from this segment.')) {
      return;
    }

    try {
      setIsProcessing(true);

      await deleteCustomerSegment(id);

      // Update local state
      setSegments(prevSegments =>
        prevSegments.filter(segment => segment.id !== id)
      );

      showToast('Segment deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting segment:', error);
      showToast('Failed to delete segment', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PermissionGuard permissions={['customers:view']}>
      <Container>
        <PageHeader
          title="Customer Segments"
          description="Create and manage customer segments for targeted marketing"
          showBreadcrumbs={true}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Customers', href: '/admin/customers' },
            { label: 'Segments', href: '/admin/customers/segments' }
          ]}
          actions={[
            {
              label: 'Create Segment',
              icon: <Plus size={16} />,
              onClick: handleCreateSegment,
              variant: 'primary'
            }
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          <Section>
            <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search segments..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="md"
                  icon={<RefreshCw size={16} />}
                  iconPosition="left"
                  onClick={() => router.refresh()}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredSegments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSegments.map(segment => (
                  <div
                    key={segment.id}
                    className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center">
                      <div className="flex items-center">
                        <Tag className="h-5 w-5 text-primary-600 mr-2" />
                        <h3 className="font-medium text-neutral-900">{segment.name}</h3>
                      </div>
                      <div>
                        {segment.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-4">
                        <p className="text-neutral-600 text-sm">
                          {segment.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-neutral-700 mb-2">Criteria</h4>
                        <div className="space-y-1 text-sm">
                          {segment.criteria?.minSpent !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Min Spent:</span>
                              <span className="font-medium">${segment.criteria.minSpent}</span>
                            </div>
                          )}
                          {segment.criteria?.maxSpent !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Max Spent:</span>
                              <span className="font-medium">${segment.criteria.maxSpent}</span>
                            </div>
                          )}
                          {segment.criteria?.minOrders !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Min Orders:</span>
                              <span className="font-medium">{segment.criteria.minOrders}</span>
                            </div>
                          )}
                          {segment.criteria?.maxOrders !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-neutral-500">Max Orders:</span>
                              <span className="font-medium">{segment.criteria.maxOrders}</span>
                            </div>
                          )}
                          {(!segment.criteria || Object.keys(segment.criteria).length === 0) && (
                            <p className="text-neutral-500">No criteria defined.</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-neutral-400 mr-1" />
                          <span>{segment.customerCount || 0} customers</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Created: </span>
                          <span>{segment.createdAt ? formatDate(segment.createdAt) : 'Unknown'}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          iconPosition="left"
                          onClick={() => handleDeleteSegment(segment.id)}
                          disabled={isProcessing}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit size={16} />}
                          iconPosition="left"
                          onClick={() => handleEditSegment(segment)}
                          disabled={isProcessing}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Tag className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-1">No Segments Found</h3>
                <p className="text-neutral-500 mb-6">
                  {searchTerm
                    ? 'No segments match your search criteria.'
                    : 'You haven\'t created any customer segments yet.'}
                </p>
                {!searchTerm && (
                  <Button
                    variant="primary"
                    size="md"
                    icon={<Plus size={16} />}
                    iconPosition="left"
                    onClick={handleCreateSegment}
                  >
                    Create Your First Segment
                  </Button>
                )}
              </div>
            )}
          </Section>
        </motion.div>

        {/* Create/Edit Segment Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingSegment ? 'Edit Segment' : 'Create Segment'}
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Segment Name*
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., VIP Customers"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe this segment"
                  rows={3}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-3">Segment Criteria</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Minimum Spent ($)
                    </label>
                    <Input
                      type="number"
                      name="criteria.minSpent"
                      value={formData.criteria.minSpent === undefined ? '' : formData.criteria.minSpent}
                      onChange={handleInputChange}
                      placeholder="Min amount"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Maximum Spent ($)
                    </label>
                    <Input
                      type="number"
                      name="criteria.maxSpent"
                      value={formData.criteria.maxSpent === undefined ? '' : formData.criteria.maxSpent}
                      onChange={handleInputChange}
                      placeholder="Max amount"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Minimum Orders
                    </label>
                    <Input
                      type="number"
                      name="criteria.minOrders"
                      value={formData.criteria.minOrders === undefined ? '' : formData.criteria.minOrders}
                      onChange={handleInputChange}
                      placeholder="Min orders"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Maximum Orders
                    </label>
                    <Input
                      type="number"
                      name="criteria.maxOrders"
                      value={formData.criteria.maxOrders === undefined ? '' : formData.criteria.maxOrders}
                      onChange={handleInputChange}
                      placeholder="Max orders"
                      min="0"
                      step="1"
                    />
                  </div>
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

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={<Save size={16} />}
                iconPosition="left"
                disabled={isProcessing}
              >
                {isProcessing ? 'Saving...' : 'Save Segment'}
              </Button>
            </div>
          </form>
        </Modal>
      </Container>
    </PermissionGuard>
  );
}

export default withAdminPage(CustomerSegmentsPage);
