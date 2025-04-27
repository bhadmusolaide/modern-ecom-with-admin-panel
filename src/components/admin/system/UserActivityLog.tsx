'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, Filter, User, RefreshCw,
  Download, Calendar, Search
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useActivity, Activity, ActivityType } from '@/lib/context/ActivityContext';
import Section from '@/components/admin/layouts/Section';
import { formatDate, formatTime } from '@/lib/utils';

const UserActivityLog: React.FC = () => {
  // Try to use the activity context, but handle errors gracefully
  let activityContext;
  try {
    activityContext = useActivity();
  } catch (error) {
    console.error('Error using activity context:', error);
    // Return a fallback UI when the context is not available
    return (
      <Section
        title="Activity Log"
        description="Track all user actions and system events"
      >
        <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="mb-4">
            <Clock size={48} className="mx-auto text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Log Unavailable</h3>
          <p className="mb-4">The activity tracking system is currently unavailable.</p>
          <p className="text-sm text-gray-500">
            This could be due to a configuration issue or missing context provider.
          </p>
        </div>
      </Section>
    );
  }

  const { activities, getActivitiesByType, getActivitiesByUser } = activityContext;

  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [uniqueUsers, setUniqueUsers] = useState<{ id: string; name: string }[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Extract unique users from activities
  useEffect(() => {
    setIsLoading(true);
    try {
      if (!activities || !Array.isArray(activities)) {
        console.warn('UserActivityLog: No activities available');
        setUniqueUsers([]);
        setFilteredActivities([]);
        return;
      }

      const users = activities.reduce((acc, activity) => {
        if (!acc.some(user => user.id === activity.userId)) {
          acc.push({
            id: activity.userId,
            name: activity.userName
          });
        }
        return acc;
      }, [] as { id: string; name: string }[]);

      setUniqueUsers(users);
    } catch (error) {
      console.error('Error processing activities:', error);
      setUniqueUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [activities]);

  // Apply filters
  useEffect(() => {
    try {
      if (!activities || !Array.isArray(activities) || activities.length === 0) {
        setFilteredActivities([]);
        return;
      }

      let filtered = [...activities];

      // Apply type filter
      if (typeFilter !== 'all') {
        filtered = filtered.filter(activity => activity.type === typeFilter);
      }

      // Apply user filter
      if (userFilter !== 'all') {
        filtered = filtered.filter(activity => activity.userId === userFilter);
      }

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'yesterday':
            startDate = new Date(now.setDate(now.getDate() - 1));
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            startDate = new Date(0); // Beginning of time
        }

        filtered = filtered.filter(activity => {
          try {
            return new Date(activity.timestamp) >= startDate;
          } catch (error) {
            console.error('Error parsing timestamp:', error, activity);
            return false;
          }
        });
      }

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          activity => {
            try {
              return (
                (activity.description && activity.description.toLowerCase().includes(term)) ||
                (activity.userName && activity.userName.toLowerCase().includes(term)) ||
                (activity.targetName && activity.targetName.toLowerCase().includes(term))
              );
            } catch (error) {
              console.error('Error filtering by search term:', error, activity);
              return false;
            }
          }
        );
      }

      // Sort by timestamp (newest first)
      try {
        filtered.sort((a, b) => {
          try {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          } catch (error) {
            console.error('Error sorting activities:', error, { a, b });
            return 0;
          }
        });
      } catch (error) {
        console.error('Error sorting activities array:', error);
      }

      setFilteredActivities(filtered);
    } catch (error) {
      console.error('Error applying filters to activities:', error);
      setFilteredActivities([]);
    }
  }, [activities, typeFilter, userFilter, dateFilter, searchTerm]);

  // Export activities to CSV
  const handleExport = () => {
    setIsExporting(true);

    try {
      // Create CSV content
      const headers = ['Timestamp', 'User', 'Type', 'Action', 'Description', 'Target'];
      const rows = filteredActivities.map(activity => [
        new Date(activity.timestamp).toISOString(),
        activity.userName,
        activity.type,
        activity.action,
        activity.description,
        activity.targetName || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `activity-log-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting activities:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Get activity icon based on type
  const getActivityTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'product':
        return <span className="bg-blue-100 text-blue-800 p-1 rounded">Product</span>;
      case 'order':
        return <span className="bg-green-100 text-green-800 p-1 rounded">Order</span>;
      case 'user':
        return <span className="bg-purple-100 text-purple-800 p-1 rounded">User</span>;
      case 'setting':
        return <span className="bg-yellow-100 text-yellow-800 p-1 rounded">Setting</span>;
      case 'system':
        return <span className="bg-red-100 text-red-800 p-1 rounded">System</span>;
      default:
        return null;
    }
  };

  return (
    <Section
      title="Activity Log"
      description="Track all user actions and system events"
      actions={
        <Button
          variant="outline"
          size="sm"
          icon={<Download size={16} />}
          onClick={handleExport}
          isLoading={isExporting}
          loadingText="Exporting..."
        >
          Export CSV
        </Button>
      }
    >
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search activities..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <select
            className="input appearance-none pr-8"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ActivityType | 'all')}
          >
            <option value="all">All Types</option>
            <option value="product">Product</option>
            <option value="order">Order</option>
            <option value="user">User</option>
            <option value="setting">Setting</option>
            <option value="system">System</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <Filter size={16} className="text-gray-400" />
          </div>
        </div>

        <div className="relative">
          <select
            className="input appearance-none pr-8"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="all">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <User size={16} className="text-gray-400" />
          </div>
        </div>

        <div className="relative">
          <select
            className="input appearance-none pr-8"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <Calendar size={16} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Activity List */}
      <Card className="border border-gray-200">
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No activities found matching your filters
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-gray-50"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>

                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        {activity.userName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(activity.timestamp.toString())} at {formatTime(activity.timestamp.toString())}
                      </div>
                    </div>

                    <div className="mt-1 text-sm text-gray-700">
                      {activity.description}
                    </div>

                    <div className="mt-2 flex items-center text-xs text-gray-500 space-x-2">
                      {getActivityTypeIcon(activity.type)}
                      <span className="bg-gray-100 text-gray-800 p-1 rounded capitalize">
                        {activity.action}
                      </span>
                      {activity.targetName && (
                        <span className="text-gray-500">
                          Target: {activity.targetName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>
    </Section>
  );
};

export default UserActivityLog;
