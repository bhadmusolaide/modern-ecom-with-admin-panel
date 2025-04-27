'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, Shield, Settings, Database,
  Activity, Server, Lock, FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import PageHeader from '@/components/admin/PageHeader';
import Container from '@/components/admin/layouts/Container';
import Section from '@/components/admin/layouts/Section';
import Card from '@/components/ui/Card';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { withAdminPage } from '@/lib/auth/withAdminPage';

interface SystemModuleProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  permissions: string | string[];
}

const SystemModule: React.FC<SystemModuleProps> = ({
  title,
  description,
  icon,
  href,
  permissions,
}) => {
  const router = useRouter();

  return (
    <PermissionGuard permissions={permissions}>
      <Card
        className="border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200"
        hoverEffect={true}
        onClick={() => router.push(href)}
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
              {icon}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>
        </div>
      </Card>
    </PermissionGuard>
  );
};

function SystemPage() {
  const { isLoading, isAdmin } = useFirebaseAuth();

  if (isLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Container>
    );
  }

  return (
    <PermissionGuard permissions={['users:view', 'roles:view', 'settings:view']}>
      <Container>
        <PageHeader
          title="System Administration"
          description="Manage system settings, users, roles, and permissions"
          showBreadcrumbs={true}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'System', href: '/admin/system' }
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          <Section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SystemModule
                title="User Management"
                description="Manage users, roles, and permissions"
                icon={<Users className="h-6 w-6 text-primary-600" />}
                href="/admin/system/users"
                permissions={['users:view']}
              />

              <SystemModule
                title="Role Management"
                description="Define roles and their permissions"
                icon={<Shield className="h-6 w-6 text-primary-600" />}
                href="/admin/system/users?tab=roles"
                permissions={['roles:view']}
              />

              <SystemModule
                title="Activity Logs"
                description="View system and user activity"
                icon={<Activity className="h-6 w-6 text-primary-600" />}
                href="/admin/system/users?tab=activity"
                permissions={['users:view']}
              />

              <SystemModule
                title="System Settings"
                description="Configure global system settings"
                icon={<Settings className="h-6 w-6 text-primary-600" />}
                href="/admin/settings"
                permissions={['settings:view']}
              />

              <SystemModule
                title="Security Settings"
                description="Configure security and authentication"
                icon={<Lock className="h-6 w-6 text-primary-600" />}
                href="/admin/settings/security"
                permissions={['settings:view']}
              />

              <SystemModule
                title="System Logs"
                description="View system logs and diagnostics"
                icon={<FileText className="h-6 w-6 text-primary-600" />}
                href="/admin/system/logs"
                permissions={['settings:view']}
              />

              <SystemModule
                title="System Backups"
                description="Manage system backups and restoration"
                icon={<Database className="h-6 w-6 text-primary-600" />}
                href="/admin/system/backups"
                permissions={['settings:view']}
              />

              <SystemModule
                title="Admin Tools"
                description="Advanced tools for system administration"
                icon={<Server className="h-6 w-6 text-primary-600" />}
                href="/admin/system/tools"
                permissions={['system:admin']}
              />
            </div>
          </Section>
        </motion.div>
      </Container>
    </PermissionGuard>
  );
}

export default withAdminPage(SystemPage);