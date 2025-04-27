'use client';

import React from 'react';
import { Save, Undo2, Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  hasChanges: boolean;
  onSave: () => void;
  onDiscard: () => void;
  isSaving?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  hasChanges,
  onSave,
  onDiscard,
  isSaving = false
}) => {
  // Debug props
  console.log('ActionButtons props:', { hasChanges, isSaving });
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 shadow-lg z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex-1">
          {hasChanges && (
            <p className="text-sm text-accent-600 font-medium">
              You have unsaved changes
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onDiscard}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center text-sm"
            disabled={!hasChanges || isSaving}
          >
            <Undo2 size={16} className="mr-1.5" />
            Discard
          </button>
          <button
            onClick={onSave}
            className={`px-4 py-2 rounded-md flex items-center text-sm font-medium ${
              hasChanges
                ? 'bg-primary text-black hover:bg-primary-dark shadow-md' + (!isSaving ? ' animate-pulse' : '')
                : 'bg-neutral-400 text-black'
            }`}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-1.5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionButtons;