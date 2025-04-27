'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Upload, Database, Clock,
  AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { useToast } from '@/lib/context/ToastContext';
import Card from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import AccountLayout from '@/components/account/AccountLayout';
import { useRouter } from 'next/navigation';

interface BackupData {
  id: string;
  createdAt: string;
  size: string;
  status: 'completed' | 'failed' | 'in_progress';
  type: 'manual' | 'automatic';
  downloadUrl?: string;
}

function BackupPage() {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      showToast('Please log in to access your backups', 'error');
      router.push('/auth/login?redirect=/account/backup');
    }
  }, [user, authLoading, router, showToast]);

  useEffect(() => {
    if (user) {
      fetchBackups();
    }
  }, [user]);

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/account/backup', {
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch backups');
      }
      const data = await response.json();
      setBackups(data.backups);
    } catch (error) {
      console.error('Error fetching backups:', error);
      showToast('Failed to load backups', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await fetch('/api/account/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create backup');
      }

      showToast('Backup created successfully', 'success');
      fetchBackups(); // Refresh the backups list
    } catch (error) {
      console.error('Error creating backup:', error);
      showToast('Failed to create backup', 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    setIsRestoringBackup(true);
    try {
      // TODO: Implement backup restoration
      await new Promise(resolve => setTimeout(resolve, 2000));
      showToast('Backup restored successfully', 'success');
    } catch (error) {
      showToast('Failed to restore backup', 'error');
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const backup = backups.find(b => b.id === backupId);
      if (!backup?.downloadUrl) {
        throw new Error('Download URL not available');
      }

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = backup.downloadUrl;
      link.download = `backup-${backupId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Backup downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading backup:', error);
      showToast('Failed to download backup', 'error');
    }
  };

  if (authLoading || isLoading) {
    return (
      <AccountLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </AccountLayout>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <AccountLayout>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-lg leading-6 font-medium text-gray-900">Data Backup</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage your data backups and restorations
          </p>
        </div>

          <div className="p-6">
            <div className="mb-6">
              <Button
                variant="primary"
                size="md"
                icon={<Database size={16} />}
                iconPosition="left"
                onClick={handleCreateBackup}
                isLoading={isCreatingBackup}
                loadingText="Creating backup..."
              >
                Create New Backup
              </Button>
            </div>

            <div className="space-y-4">
              {backups.map((backup) => (
                <Card key={backup.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary-100 p-3 rounded-full">
                        <Database className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">
                          Backup {backup.id}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock size={14} />
                          <span>{formatDate(backup.createdAt)}</span>
                          <span>•</span>
                          <span>{backup.size}</span>
                          <span>•</span>
                          <span className="capitalize">{backup.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {backup.status === 'completed' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircle size={14} className="mr-1" /> Completed
                        </span>
                      ) : backup.status === 'failed' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          <XCircle size={14} className="mr-1" /> Failed
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          <AlertCircle size={14} className="mr-1" /> In Progress
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Download size={14} />}
                        onClick={() => handleDownloadBackup(backup.id)}
                      >
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Upload size={14} />}
                        onClick={() => handleRestoreBackup(backup.id)}
                        isLoading={isRestoringBackup}
                        loadingText="Restoring..."
                      >
                        Restore
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AccountLayout>
  );
}

export default BackupPage;