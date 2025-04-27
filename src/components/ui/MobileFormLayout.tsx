'use client';

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Button from './Button';

interface MobileFormLayoutProps {
  children: React.ReactNode;
  title: string;
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  isSaved?: boolean;
  hasChanges?: boolean;
  backUrl?: string;
  steps?: {
    label: string;
    content: React.ReactNode;
  }[];
  className?: string;
}

const MobileFormLayout: React.FC<MobileFormLayoutProps> = ({
  children,
  title,
  onSave,
  onCancel,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  isLoading = false,
  isSaved = false,
  hasChanges = false,
  backUrl,
  steps,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // If steps are provided, render step-based layout
  if (steps && steps.length > 0) {
    const totalSteps = steps.length;
    const currentStepData = steps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    const handleNext = () => {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else if (onSave) {
        onSave();
      }
    };

    const handleBack = () => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      } else if (onCancel) {
        onCancel();
      }
    };

    return (
      <div className={`flex flex-col h-full ${className}`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={20} />
              <span>{isFirstStep ? cancelLabel : 'Back'}</span>
            </button>
            <h1 className="text-lg font-medium text-center">{title}</h1>
            <div className="w-20"></div> {/* Spacer for centering title */}
          </div>
          
          {/* Progress indicator */}
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span className="text-sm font-medium">
                {currentStepData.label}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentStepData.content}
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isLoading}
            >
              {isFirstStep ? cancelLabel : 'Back'}
            </Button>
            <Button
              onClick={handleNext}
              isLoading={isLoading && isLastStep}
              disabled={isLoading}
            >
              {isLastStep ? saveLabel : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default single-page layout
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {backUrl ? (
            <a
              href={backUrl}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </a>
          ) : (
            <button
              onClick={onCancel}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={20} />
              <span>{cancelLabel}</span>
            </button>
          )}
          <h1 className="text-lg font-medium text-center">{title}</h1>
          <div className="w-20"></div> {/* Spacer for centering title */}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
      
      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <Button
          onClick={onSave}
          isLoading={isLoading}
          disabled={isLoading || (!hasChanges && isSaved)}
          fullWidth
        >
          {isSaved && !hasChanges ? 'Saved' : saveLabel}
        </Button>
      </div>
    </div>
  );
};

export default MobileFormLayout;
