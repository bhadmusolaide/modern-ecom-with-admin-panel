'use client';

import React from 'react';
import { Save, AlertCircle } from 'lucide-react';

interface SettingsAlertProps {
  visible: boolean;
  onSave: () => void;
}

const SettingsAlert: React.FC<SettingsAlertProps> = ({ visible, onSave }) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce-slow">
      <div className="bg-primary text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
        <AlertCircle size={20} />
        <span>You have unsaved changes!</span>
        <button
          onClick={onSave}
          className="ml-4 px-3 py-1 bg-white text-primary rounded-md font-medium flex items-center text-sm"
        >
          <Save size={16} className="mr-1.5" />
          Save Now
        </button>
      </div>
    </div>
  );
};

export default SettingsAlert; 