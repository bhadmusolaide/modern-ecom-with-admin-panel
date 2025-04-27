'use client';

import React, { useMemo } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const strength = useMemo(() => {
    if (!password) return 0;
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1; // Has uppercase
    if (/[a-z]/.test(password)) score += 1; // Has lowercase
    if (/[0-9]/.test(password)) score += 1; // Has number
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // Has special char
    
    // Normalize to 0-4 scale
    return Math.min(4, Math.floor(score / 1.5));
  }, [password]);

  const getStrengthLabel = () => {
    if (!password) return '';
    const labels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
    return labels[strength];
  };

  const getStrengthColor = () => {
    if (!password) return 'bg-gray-200';
    const colors = [
      'bg-red-500', // Very Weak
      'bg-orange-500', // Weak
      'bg-yellow-500', // Medium
      'bg-green-500', // Strong
      'bg-green-600', // Very Strong
    ];
    return colors[strength];
  };

  const getStrengthWidth = () => {
    if (!password) return '0%';
    const widths = ['20%', '40%', '60%', '80%', '100%'];
    return widths[strength];
  };

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getStrengthColor()} transition-all duration-300 ease-in-out`}
          style={{ width: getStrengthWidth() }}
        ></div>
      </div>
      <p className="text-xs mt-1 text-gray-600">
        Password strength: <span className="font-medium">{getStrengthLabel()}</span>
      </p>
      {strength < 2 && password.length > 0 && (
        <ul className="text-xs mt-1 text-gray-600 list-disc list-inside">
          {password.length < 8 && <li>Use at least 8 characters</li>}
          {!/[A-Z]/.test(password) && <li>Include uppercase letters</li>}
          {!/[a-z]/.test(password) && <li>Include lowercase letters</li>}
          {!/[0-9]/.test(password) && <li>Include numbers</li>}
          {!/[^A-Za-z0-9]/.test(password) && <li>Include special characters</li>}
        </ul>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
