'use client';

import { useState } from 'react';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import { useToast } from '@/lib/context/ToastContext';
import { RefreshCw, Trash2, AlertTriangle } from 'lucide-react';

export default function ClearTaxPage() {
  const { settings, updateSettings, refreshSettings } = useSiteSettings();
  const { showToast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleClearLocalStorage = () => {
    try {
      localStorage.removeItem('siteSettings');
      showToast('localStorage cleared successfully', 'success');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      showToast('Failed to clear localStorage', 'error');
    }
  };

  const handleResetTaxToZero = async () => {
    setIsResetting(true);
    try {
      await updateSettings({ taxRate: 0, taxIncluded: false });
      showToast('Tax rate reset to 0%', 'success');
      
      // Clear localStorage and refresh
      localStorage.removeItem('siteSettings');
      await refreshSettings();
      
      showToast('Settings refreshed. Please check checkout page.', 'success');
    } catch (error) {
      console.error('Error resetting tax:', error);
      showToast('Failed to reset tax rate', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleRefreshSettings = async () => {
    setIsClearing(true);
    try {
      await refreshSettings();
      showToast('Settings refreshed from database', 'success');
    } catch (error) {
      console.error('Error refreshing settings:', error);
      showToast('Failed to refresh settings', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clear Tax Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Use this page to troubleshoot tax calculation issues on the checkout page.
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="text-yellow-600 dark:text-yellow-500 mr-3 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-yellow-900 dark:text-yellow-200">Current Tax Settings</h3>
            <div className="mt-2 text-sm text-yellow-800 dark:text-yellow-300">
              <p><strong>Tax Rate:</strong> {settings?.taxRate ?? 'Loading...'}%</p>
              <p><strong>Tax Included in Prices:</strong> {settings?.taxIncluded ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Step 1: Reset Tax Rate to 0%
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This will set the tax rate to 0% in the database and clear the cache.
          </p>
          <button
            onClick={handleResetTaxToZero}
            disabled={isResetting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-2 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Resetting...' : 'Reset Tax to 0%'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Step 2: Clear localStorage Cache
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This will clear the cached settings from your browser and reload the page.
          </p>
          <button
            onClick={handleClearLocalStorage}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 size={16} className="mr-2" />
            Clear localStorage & Reload
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Step 3: Refresh Settings from Database
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This will fetch the latest settings from the database without reloading the page.
          </p>
          <button
            onClick={handleRefreshSettings}
            disabled={isClearing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-2 ${isClearing ? 'animate-spin' : ''}`} />
            {isClearing ? 'Refreshing...' : 'Refresh Settings'}
          </button>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">After completing these steps:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>Go to the checkout page</li>
          <li>Verify that the tax shows as ₦0.00</li>
          <li>If tax is still showing, open browser console (F12) and check for any errors</li>
          <li>You can also check the console logs for "TAX CALCULATION DEBUG" to see the actual values</li>
        </ol>
      </div>
    </div>
  );
}

