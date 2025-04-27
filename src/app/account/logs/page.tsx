'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Search, Filter, Download,
  AlertCircle, Info, CheckCircle, XCircle
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { useToast } from '@/lib/context/ToastContext';
import Card from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import AccountLayout from '@/components/account/AccountLayout';
import { useRouter } from 'next/navigation';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: string;
}

function LogsPage() {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'info' | 'warning' | 'error' | 'success'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      showToast('Please log in to access your activity logs', 'error');
      router.push('/auth/login?redirect=/account/logs');
    }
  }, [user, authLoading, router, showToast]);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/account/logs', {
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      showToast('Failed to load logs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadLogs = async () => {
    try {
      // Create a CSV string from the logs
      const csvContent = [
        ['Timestamp', 'Type', 'Message', 'Details'],
        ...logs.map(log => [
          new Date(log.timestamp).toISOString(),
          log.type,
          log.message,
          log.details || ''
        ])
      ].map(row => row.join(',')).join('\n');

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logs-${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Logs downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading logs:', error);
      showToast('Failed to download logs', 'error');
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 text-blue-800';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800';
      case 'error':
        return 'bg-red-50 text-red-800';
      case 'success':
        return 'bg-green-50 text-green-800';
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
          <h1 className="text-lg leading-6 font-medium text-gray-900">Activity Logs</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            View your account activity and system logs
          </p>
        </div>

          <div className="p-6">
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search logs..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <div className="relative">
                  <select
                    className="input appearance-none pr-8"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                  >
                    <option value="ALL">All Types</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="success">Success</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <Filter size={16} className="text-gray-400" />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="md"
                  icon={<Download size={16} />}
                  iconPosition="left"
                  onClick={handleDownloadLogs}
                >
                  Download Logs
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getLogIcon(log.type)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">
                          {log.message}
                        </h3>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLogColor(log.type)}`}>
                          {log.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </div>
                      {log.details && (
                        <div className="mt-2 text-sm text-gray-600">
                          {log.details}
                        </div>
                      )}
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

export default LogsPage;