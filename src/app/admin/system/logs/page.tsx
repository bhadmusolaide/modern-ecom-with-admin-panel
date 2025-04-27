'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Search, Filter, Download, ArrowLeft,
  AlertCircle, Info, CheckCircle, XCircle, RefreshCw
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

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  type: string;
  message: string;
  details?: string;
  source?: string;
}

function LogsPage() {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { showToast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'info' | 'warning' | 'error' | 'debug'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      fetchLogs();
    }
  }, [authLoading]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/logs', {
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);

      // Extract unique types for filter
      const types = [...new Set(data.logs.map((log: LogEntry) => log.type))];
      console.log('Available log types:', types);

    } catch (error) {
      console.error('Error fetching logs:', error);
      showToast('Failed to load logs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLogs();
    setIsRefreshing(false);
  };

  const handleDownloadLogs = async () => {
    try {
      // Create a CSV string from the logs
      const csvContent = [
        ['Timestamp', 'Level', 'Type', 'Message', 'Details', 'Source'],
        ...logs.map(log => [
          new Date(log.timestamp).toISOString(),
          log.level,
          log.type,
          log.message,
          log.details || '',
          log.source || ''
        ])
      ].map(row => row.join(',')).join('\n');

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `system-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Logs downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading logs:', error);
      showToast('Failed to download logs', 'error');
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter;
    const matchesType = typeFilter === 'ALL' || log.type === typeFilter;
    return matchesSearch && matchesLevel && matchesType;
  });

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'debug':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'debug':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  // Define action buttons for the PageHeader
  const headerActions = [
    {
      label: 'Refresh',
      icon: <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />,
      onClick: handleRefresh,
      variant: 'outline' as const,
      disabled: isRefreshing
    },
    {
      label: 'Download CSV',
      icon: <Download size={16} />,
      onClick: handleDownloadLogs,
      variant: 'outline' as const,
      disabled: logs.length === 0
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
        title="System Logs"
        description="View and analyze system logs"
        actions={headerActions}
        showBreadcrumbs={true}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'System', href: '/admin/system' },
          { label: 'Logs', href: '/admin/system/logs' }
        ]}
      />

      <PermissionGuard
        permissions={['system:logs']}
        fallback={
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 text-center">
            <FileText size={48} className="mx-auto text-neutral-400 dark:text-neutral-600 mb-4" />
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">Access Denied</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              You don't have permission to view system logs.
            </p>
          </div>
        }
      >
        <Card className="mb-6 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Search logs..."
                className="w-full pl-10 px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-neutral-800 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-2">
              <select
                className="px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-neutral-800 dark:text-white"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as any)}
              >
                <option value="ALL">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>

              <select
                className="px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-neutral-800 dark:text-white"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Types</option>
                {[...new Set(logs.map(log => log.type))].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <Card className="p-6 text-center">
            <FileText size={48} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">No Logs Found</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              There are no system logs available.
            </p>
          </Card>
        ) : filteredLogs.length === 0 ? (
          <Card className="p-6 text-center">
            <Search size={48} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">No Matching Logs</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              No logs match your current search and filter criteria.
            </p>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setSearchTerm('');
                setLevelFilter('ALL');
                setTypeFilter('ALL');
              }}
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getLogIcon(log.level)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
                        {log.message}
                      </h3>
                      <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getLogColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                      <span>{formatDate(log.timestamp)}</span>
                      {log.type && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                          {log.type}
                        </span>
                      )}
                      {log.source && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          Source: {log.source}
                        </span>
                      )}
                    </div>
                    {log.details && (
                      <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 p-2 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                        {log.details}
                      </div>
                    )}
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

export default withAdminPage(LogsPage);
