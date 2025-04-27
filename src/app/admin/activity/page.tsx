'use client';

import React from 'react';
import { Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ActivityProvider } from '@/lib/context/ActivityContext';
import PageHeader from '@/components/admin/PageHeader';
import Container from '@/components/admin/layouts/Container';
import ActivityFeed from '@/components/admin/ActivityFeed';

export default function ActivityPage() {
  // Define action buttons for the PageHeader
  const headerActions = [
    {
      label: 'Back to Dashboard',
      icon: <ArrowLeft size={16} />,
      href: '/admin',
      variant: 'outline' as const
    }
  ];

  return (
    <ActivityProvider>
      <Container>
        <PageHeader 
          title="Activity History"
          description="Track all admin actions and system events"
          actions={headerActions}
          showBreadcrumbs={true}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Activity', href: '/admin/activity' }
          ]}
        />
        
        <div className="mt-6">
          <ActivityFeed 
            showFilters={true}
            maxItems={50}
          />
        </div>
      </Container>
    </ActivityProvider>
  );
}