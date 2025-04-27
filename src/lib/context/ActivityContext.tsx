'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFirebaseAuth } from '@/lib/firebase';

// Define activity types
export type ActivityType =
  | 'product'
  | 'order'
  | 'user'
  | 'setting'
  | 'system';

// Define activity action types
export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'process';

// Define activity interface
export interface Activity {
  id: string;
  type: ActivityType;
  action: ActivityAction;
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
}

interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp' | 'userId' | 'userName'>) => void;
  getActivitiesByType: (type: ActivityType | 'all') => Activity[];
  getActivitiesByUser: (userId: string) => Activity[];
  clearActivities: () => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useFirebaseAuth();
  const [activities, setActivities] = useState<Activity[]>([]);

  // Load activities from localStorage on initial render
  useEffect(() => {
    const savedActivities = localStorage.getItem('adminActivities');
    if (savedActivities) {
      try {
        // Parse the JSON string and convert timestamp strings back to Date objects
        const parsedActivities = JSON.parse(savedActivities).map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }));
        setActivities(parsedActivities);
      } catch (error) {
        console.error('Failed to parse saved activities:', error);
        setActivities([]);
      }
    }
  }, []);

  // Save activities to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('adminActivities', JSON.stringify(activities));
  }, [activities]);

  // Add a new activity
  const addActivity = (
    activityData: Omit<Activity, 'id' | 'timestamp' | 'userId' | 'userName'>
  ) => {
    if (!user) return;

    const newActivity: Activity = {
      id: generateId(),
      timestamp: new Date(),
      userId: user.id,
      userName: user.name || user.email || 'Unknown User',
      ...activityData
    };

    setActivities(prev => [newActivity, ...prev].slice(0, 100)); // Keep only the last 100 activities
  };

  // Get activities by type
  const getActivitiesByType = (type: ActivityType | 'all') => {
    if (type === 'all') return activities;
    return activities.filter(activity => activity.type === type);
  };

  // Get activities by user
  const getActivitiesByUser = (userId: string) => {
    return activities.filter(activity => activity.userId === userId);
  };

  // Clear all activities
  const clearActivities = () => {
    setActivities([]);
  };

  // Generate a unique ID for activities
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  return (
    <ActivityContext.Provider value={{
      activities,
      addActivity,
      getActivitiesByType,
      getActivitiesByUser,
      clearActivities
    }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

// Helper function to generate activity description
export const getActivityDescription = (
  action: ActivityAction,
  type: ActivityType,
  targetName?: string
): string => {
  const target = targetName || 'item';

  switch (action) {
    case 'create':
      return `Created ${type} "${target}"`;
    case 'update':
      return `Updated ${type} "${target}"`;
    case 'delete':
      return `Deleted ${type} "${target}"`;
    case 'view':
      return `Viewed ${type} "${target}"`;
    case 'login':
      return `Logged in`;
    case 'logout':
      return `Logged out`;
    case 'export':
      return `Exported ${type} data`;
    case 'import':
      return `Imported ${type} data`;
    case 'process':
      return `Processed ${type} "${target}"`;
    default:
      return `Performed action on ${type} "${target}"`;
  }
};