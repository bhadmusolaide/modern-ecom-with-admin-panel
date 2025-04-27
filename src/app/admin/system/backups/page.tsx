'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Upload, Database, Clock, Trash2,
  AlertCircle, CheckCircle, XCircle, ArrowLeft
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { useToast } from '@/lib/context/ToastContext';
import Card from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import { withAdminPage } from '@/lib/auth/withAdminPage';
import Container from '@/components/admin/layouts/Container';
import PageHeader from '@/components/admin/PageHeader';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { useActivity } from '@/lib/context/ActivityContext';

interface BackupData {
  id: string;
  createdAt: string;
  size: string;
  status: 'completed' | 'failed' | 'in_progress';
  type: 'manual' | 'automatic';
  downloadUrl?: string;
  createdBy?: string;
  description?: string;
}

function BackupsPage() {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { showToast } = useToast();
  const { addActivity } = useActivity();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      fetchBackups();
    }
  }, [authLoading]);

  const fetchBackups = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/backups', {
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch backups');
      }

      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error('Error fetching backups:', error);
      showToast('Failed to load backups', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingBackup(true);

    try {
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`
        },
        body: JSON.stringify({ description })
      });

      if (!response.ok) {
        throw new Error('Failed to create backup');
      }

      showToast('Backup created successfully', 'success');
      setDescription('');
      setShowCreateForm(false);

      // Log activity
      addActivity({
        type: 'system',
        action: 'create',
        description: `Created system backup: ${description || 'Manual backup'}`,
      });

      fetchBackups(); // Refresh the backups list
    } catch (error) {
      console.error('Error creating backup:', error);
      showToast('Failed to create backup', 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const getStatusIcon = (status: BackupData['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
    }
  };

  // Define action buttons for the PageHeader
  const headerActions = [
    {
      label: 'Create Backup',
      icon: <Database size={16} />,
      onClick: () => setShowCreateForm(true),
      variant: 'primary' as const
    },
    {
      label: 'Back to System',
      icon: <ArrowLeft size={16} />,
      href: '/admin/system',
      variant: 'outline' as const
    }
  ];

  return (
    <Container>
      <PageHeader
        title="System Backups"
        description="Manage and create system backups"
        actions={headerActions}
        showBreadcrumbs={true}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'System', href: '/admin/system' },
          { label: 'Backups', href: '/admin/system/backups' }
        ]}
      />

      <PermissionGuard
        permissions={['system:backups']}
        fallback={
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 text-center">
            <Database size={48} className="mx-auto text-neutral-400 dark:text-neutral-600 mb-4" />
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">Access Denied</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              You don't have permission to view system backups.
            </p>
          </div>
        }
      >
        {showCreateForm && (
          <Card className="mb-6 p-6">
            <h2 className="text-lg font-medium text-neutral-800 dark:text-white mb-4">Create New Backup</h2>
            <form onSubmit={handleCreateBackup}>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter backup description"
                  className="w-full px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-neutral-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreatingBackup}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  icon={isCreatingBackup ? <Clock className="animate-spin" /> : <Database />}
                  iconPosition="left"
                  disabled={isCreatingBackup}
                >
                  {isCreatingBackup ? 'Creating...' : 'Create Backup'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : backups.length === 0 ? (
          <Card className="p-6 text-center">
            <Database size={48} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">No Backups Found</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              You haven't created any system backups yet.
            </p>
            <Button
              variant="primary"
              size="md"
              icon={<Database size={16} />}
              iconPosition="left"
              onClick={() => setShowCreateForm(true)}
            >
              Create First Backup
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {backups.map((backup) => (
              <Card key={backup.id} className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(backup.status)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
                        {backup.description || `Backup ${backup.id.substring(0, 8)}`}
                      </h3>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                        {backup.size}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {formatDate(backup.createdAt)}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          backup.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          backup.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {backup.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {backup.type === 'automatic' ? 'Auto' : 'Manual'}
                        </span>
                      </div>
                      {backup.status === 'completed' && backup.downloadUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Download size={14} />}
                          iconPosition="left"
                          onClick={() => window.open(backup.downloadUrl, '_blank')}
                        >
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PermissionGuard>
    </Container>
  );
}

export default withAdminPage(BackupsPage);
