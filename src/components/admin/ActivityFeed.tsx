'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock, Filter, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivity, ActivityType } from '@/lib/context/ActivityContext';
import { useFirebaseAuth } from '@/lib/firebase';
import ActivityItem from './ActivityItem';

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
  showFilters?: boolean;
  compact?: boolean;
  title?: string;
}

export default function ActivityFeed({
  className = '',
  maxItems = 10,
  showFilters = true,
  compact = false,
  title = 'Activity Feed'
}: ActivityFeedProps) {
  const { activities, getActivitiesByType } = useActivity();
  const { user } = useFirebaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActivityType | 'all'>('all');
  const [userFilter, setUserFilter] = useState<string | 'all'>('all');
  const activityRef = useRef<HTMLDivElement>(null);

  // Filter activities
  const filteredActivities = activities
    .filter(activity => activeFilter === 'all' || activity.type === activeFilter)
    .filter(activity => userFilter === 'all' || activity.userId === userFilter)
    .slice(0, isOpen ? undefined : maxItems);

  // Get unique users from activities
  const uniqueUsers = Array.from(
    new Set(activities.map(activity => activity.userId))
  ).map(userId => {
    const activity = activities.find(a => a.userId === userId);
    return {
      id: userId,
      name: activity?.userName || 'Unknown User'
    };
  });

  // Close activity panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activityRef.current && !activityRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Reset filters
  const resetFilters = () => {
    setActiveFilter('all');
    setUserFilter('all');
  };

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-neutral-200 ${className}`}>
        <div className="flex items-center justify-between p-3 border-b border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          {showFilters && (
            <button
              onClick={() => setIsOpen(true)}
              className="text-xs text-neutral-500 hover:text-neutral-700"
            >
              <Filter size={14} />
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {filteredActivities.length === 0 ? (
            <div className="p-4 text-center text-neutral-500 text-sm">
              No activity to display
            </div>
          ) : (
            <div className="py-1">
              {filteredActivities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} compact={true} />
              ))}
            </div>
          )}
        </div>

        {filteredActivities.length > 0 && (
          <div className="p-2 text-center border-t border-neutral-200">
            <button
              onClick={() => setIsOpen(true)}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              View all activity
            </button>
          </div>
        )}

        {/* Full Activity Panel */}
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                ref={activityRef}
              >
                <FullActivityFeed
                  onClose={() => setIsOpen(false)}
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                  userFilter={userFilter}
                  setUserFilter={setUserFilter}
                  uniqueUsers={uniqueUsers}
                  filteredActivities={filteredActivities}
                  resetFilters={resetFilters}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        {activeFilter !== 'all' || userFilter !== 'all' ? (
          <button
            onClick={resetFilters}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
          >
            <X size={14} className="mr-1" /> Clear filters
          </button>
        ) : null}
      </div>

      {showFilters && (
        <div className="flex p-3 border-b border-neutral-200 overflow-x-auto">
          <div className="mr-4">
            <label className="text-xs text-neutral-500 block mb-1">Type</label>
            <div className="flex space-x-2">
              {['all', 'product', 'order', 'user', 'setting', 'system'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter as ActivityType | 'all')}
                  className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                    activeFilter === filter
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {uniqueUsers.length > 1 && (
            <div>
              <label className="text-xs text-neutral-500 block mb-1">User</label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="text-xs border rounded px-2 py-1 bg-white"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="max-h-96 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="p-6 text-center text-neutral-500">
            No activity to display
          </div>
        ) : (
          filteredActivities.map(activity => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        )}
      </div>

      {filteredActivities.length > maxItems && !isOpen && (
        <div className="p-3 text-center border-t border-neutral-200">
          <button
            onClick={() => setIsOpen(true)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            View all activity
          </button>
        </div>
      )}
    </div>
  );
}

// Full activity feed component for modal view
interface FullActivityFeedProps {
  onClose: () => void;
  activeFilter: ActivityType | 'all';
  setActiveFilter: (filter: ActivityType | 'all') => void;
  userFilter: string | 'all';
  setUserFilter: (filter: string | 'all') => void;
  uniqueUsers: { id: string; name: string }[];
  filteredActivities: any[];
  resetFilters: () => void;
}

function FullActivityFeed({
  onClose,
  activeFilter,
  setActiveFilter,
  userFilter,
  setUserFilter,
  uniqueUsers,
  filteredActivities,
  resetFilters
}: FullActivityFeedProps) {
  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900">Activity History</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-neutral-100"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 border-b border-neutral-200 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-neutral-500 block mb-2 flex items-center">
            <Filter size={14} className="mr-1" /> Filter by Type
          </label>
          <div className="flex flex-wrap gap-2">
            {['all', 'product', 'order', 'user', 'setting', 'system'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter as ActivityType | 'all')}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                  activeFilter === filter
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-neutral-500 block mb-2 flex items-center">
            <User size={14} className="mr-1" /> Filter by User
          </label>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-white"
          >
            <option value="all">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            No activity matches your filters
          </div>
        ) : (
          filteredActivities.map(activity => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        )}
      </div>

      <div className="p-4 border-t border-neutral-200 flex justify-between items-center">
        <button
          onClick={resetFilters}
          className="text-sm text-neutral-600 hover:text-neutral-800"
        >
          Reset Filters
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Close
        </button>
      </div>
    </>
  );
}