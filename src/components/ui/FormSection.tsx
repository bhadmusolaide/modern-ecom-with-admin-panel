'use client';

import React from 'react';
import CollapsibleSection from './CollapsibleSection';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  hasErrors?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  children,
  defaultOpen = true,
  className = '',
  description,
  icon,
  badge,
  hasErrors = false,
  onToggle,
}) => {
  // Create an error badge if there are errors
  const errorBadge = hasErrors ? (
    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
      Error
    </span>
  ) : null;

  // Combine provided badge with error badge
  const combinedBadge = (
    <>
      {badge}
      {errorBadge}
    </>
  );

  return (
    <CollapsibleSection
      title={title}
      defaultOpen={defaultOpen || hasErrors} // Auto-open sections with errors
      className={`mb-6 ${className}`}
      titleClassName={hasErrors ? 'text-red-600' : ''}
      icon={icon}
      badge={combinedBadge}
      onToggle={onToggle}
    >
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}
      {children}
    </CollapsibleSection>
  );
};

export default FormSection;
