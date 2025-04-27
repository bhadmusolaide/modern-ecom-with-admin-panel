'use client';

import React from 'react';
import { 
  ShoppingBag, 
  Package, 
  User, 
  Settings, 
  Server, 
  Plus, 
  Edit, 
  Trash, 
  Eye, 
  LogIn, 
  LogOut, 
  Upload, 
  Download, 
  Play 
} from 'lucide-react';
import { Activity, ActivityType, ActivityAction } from '@/lib/context/ActivityContext';

interface ActivityItemProps {
  activity: Activity;
  compact?: boolean;
}

export default function ActivityItem({ activity, compact = false }: ActivityItemProps) {
  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get icon based on activity type
  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'product':
        return <ShoppingBag size={compact ? 14 : 16} className="text-primary-500" />;
      case 'order':
        return <Package size={compact ? 14 : 16} className="text-blue-500" />;
      case 'user':
        return <User size={compact ? 14 : 16} className="text-indigo-500" />;
      case 'setting':
        return <Settings size={compact ? 14 : 16} className="text-amber-500" />;
      case 'system':
        return <Server size={compact ? 14 : 16} className="text-neutral-500" />;
      default:
        return <Server size={compact ? 14 : 16} className="text-neutral-500" />;
    }
  };

  // Get icon based on activity action
  const getActionIcon = (action: ActivityAction) => {
    switch (action) {
      case 'create':
        return <Plus size={compact ? 14 : 16} className="text-green-500" />;
      case 'update':
        return <Edit size={compact ? 14 : 16} className="text-amber-500" />;
      case 'delete':
        return <Trash size={compact ? 14 : 16} className="text-red-500" />;
      case 'view':
        return <Eye size={compact ? 14 : 16} className="text-blue-500" />;
      case 'login':
        return <LogIn size={compact ? 14 : 16} className="text-green-500" />;
      case 'logout':
        return <LogOut size={compact ? 14 : 16} className="text-neutral-500" />;
      case 'export':
        return <Download size={compact ? 14 : 16} className="text-indigo-500" />;
      case 'import':
        return <Upload size={compact ? 14 : 16} className="text-purple-500" />;
      case 'process':
        return <Play size={compact ? 14 : 16} className="text-blue-500" />;
      default:
        return <Edit size={compact ? 14 : 16} className="text-neutral-500" />;
    }
  };

  // Get URL for the activity target
  const getTargetUrl = () => {
    if (!activity.targetId) return undefined;

    switch (activity.type) {
      case 'product':
        return `/admin/products/${activity.targetId}`;
      case 'order':
        return `/admin/orders/${activity.targetId}`;
      case 'user':
        return `/admin/users/edit/${activity.targetId}`;
      case 'setting':
        return `/admin/site-settings`;
      default:
        return undefined;
    }
  };

  // Determine if we should show the target link
  const showTargetLink = activity.targetId && ['view', 'update', 'create'].includes(activity.action);
  const targetUrl = getTargetUrl();

  if (compact) {
    return (
      <div className="flex items-center py-2 px-3 hover:bg-neutral-50 rounded-md transition-colors">
        <div className="flex-shrink-0 mr-2">
          {getTypeIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-neutral-700 truncate">
            {activity.description}
          </p>
          <p className="text-xs text-neutral-500">
            {formatTime(activity.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 mt-1">
          {getTypeIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-neutral-900">
              {activity.userName}
            </p>
            <div className="flex items-center ml-2">
              <span className="p-1">
                {getActionIcon(activity.action)}
              </span>
            </div>
          </div>
          <p className="text-sm text-neutral-600 mt-1">
            {activity.description}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-neutral-500">
              {formatTime(activity.timestamp)}
            </span>
            {showTargetLink && targetUrl && (
              <a
                href={targetUrl}
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                View Details
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}