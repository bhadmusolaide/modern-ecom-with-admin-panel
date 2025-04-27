'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Undo2, Plus, Trash2, Truck, Check, X, DollarSign, Percent } from 'lucide-react';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import { useToast } from '@/lib/context/ToastContext';
import { ShippingMethod } from '@/lib/context/SiteSettingsContext';

// List of countries for the shipping countries selector
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
];

export default function ShippingSettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, isLoading } = useSiteSettings();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    shippingMethods: Array.isArray(settings?.shippingMethods) ? settings.shippingMethods : [],
    freeShippingThreshold: settings?.freeShippingThreshold || null,
    taxRate: settings?.taxRate || 0,
    taxIncluded: settings?.taxIncluded || false,
    shippingCountries: Array.isArray(settings?.shippingCountries) ? settings.shippingCountries : [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showNewMethodForm, setShowNewMethodForm] = useState(false);
  const [newMethod, setNewMethod] = useState<ShippingMethod>({
    id: '',
    name: '',
    price: 0,
    enabled: true,
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle numeric input changes
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value === '' ? null : parseFloat(value);
    setFormData((prev) => ({ ...prev, [name]: numericValue }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Handle shipping method toggle
  const handleMethodToggle = (id: string) => {
    const updatedMethods = formData.shippingMethods.map((method) => 
      method.id === id ? { ...method, enabled: !method.enabled } : method
    );
    setFormData((prev) => ({ ...prev, shippingMethods: updatedMethods }));
  };

  // Handle shipping method removal
  const handleRemoveMethod = (id: string) => {
    const updatedMethods = formData.shippingMethods.filter((method) => method.id !== id);
    setFormData((prev) => ({ ...prev, shippingMethods: updatedMethods }));
  };

  // Handle adding a new shipping method
  const handleAddMethod = () => {
    if (!newMethod.id || !newMethod.name) {
      showToast('Please enter both ID and name for the shipping method', 'error');
      return;
    }

    if (isNaN(newMethod.price) || newMethod.price < 0) {
      showToast('Please enter a valid price for the shipping method', 'error');
      return;
    }

    // Check if ID already exists
    if (formData.shippingMethods.some((method) => method.id === newMethod.id)) {
      showToast('A shipping method with this ID already exists', 'error');
      return;
    }

    const updatedMethods = [...formData.shippingMethods, newMethod];
    setFormData((prev) => ({ ...prev, shippingMethods: updatedMethods }));
    setNewMethod({ id: '', name: '', price: 0, enabled: true });
    setShowNewMethodForm(false);
  };

  // Handle country selection
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData((prev) => ({ ...prev, shippingCountries: selectedOptions }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await updateSettings(formData);
      showToast('Shipping settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving shipping settings:', error);
      showToast('Failed to save shipping settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form to current settings
  const handleReset = () => {
    setFormData({
      shippingMethods: Array.isArray(settings?.shippingMethods) ? settings.shippingMethods : [],
      freeShippingThreshold: settings?.freeShippingThreshold || null,
      taxRate: settings?.taxRate || 0,
      taxIncluded: settings?.taxIncluded || false,
      shippingCountries: Array.isArray(settings?.shippingCountries) ? settings.shippingCountries : [],
    });
    setShowNewMethodForm(false);
    showToast('Form reset to saved settings', 'info');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shipping Settings</h1>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Undo2 size={16} className="mr-2" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Shipping Methods</h2>
            
            {formData.shippingMethods.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                <p className="text-gray-500 dark:text-gray-400">No shipping methods added yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.shippingMethods.map((method) => (
                  <div 
                    key={method.id} 
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-md"
                  >
                    <div className="flex items-center">
                      <div className="mr-3 text-gray-500 dark:text-gray-400">
                        <Truck size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {method.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {settings?.currencySymbol || '$'}{method.price.toFixed(2)} - ID: {method.id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleMethodToggle(method.id)}
                        className={`p-1 rounded-md ${
                          method.enabled 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {method.enabled ? <Check size={18} /> : <X size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMethod(method.id)}
                        className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {showNewMethodForm ? (
              <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Add Shipping Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label htmlFor="methodId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Method ID
                    </label>
                    <input
                      type="text"
                      id="methodId"
                      value={newMethod.id}
                      onChange={(e) => setNewMethod({ ...newMethod, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      placeholder="e.g. express-shipping"
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Unique identifier, lowercase with hyphens
                    </p>
                  </div>
                  <div>
                    <label htmlFor="methodName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Method Name
                    </label>
                    <input
                      type="text"
                      id="methodName"
                      value={newMethod.name}
                      onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                      placeholder="e.g. Express Shipping"
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="methodPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                          {settings?.currencySymbol || '$'}
                        </span>
                      </div>
                      <input
                        type="number"
                        id="methodPrice"
                        value={newMethod.price}
                        onChange={(e) => setNewMethod({ ...newMethod, price: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                        className="block w-full pl-7 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="methodEnabled"
                    checked={newMethod.enabled}
                    onChange={(e) => setNewMethod({ ...newMethod, enabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="methodEnabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Enabled
                  </label>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewMethodForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMethod}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Method
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewMethodForm(true)}
                className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Plus size={16} className="mr-2" />
                Add Shipping Method
              </button>
            )}
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Free Shipping</h2>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                    {settings?.currencySymbol || '$'}
                  </span>
                </div>
                <input
                  type="number"
                  id="freeShippingThreshold"
                  name="freeShippingThreshold"
                  value={formData.freeShippingThreshold === null ? '' : formData.freeShippingThreshold}
                  onChange={handleNumericChange}
                  min="0"
                  step="0.01"
                  className="block w-full pl-7 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="No free shipping"
                />
              </div>
              <DollarSign size={20} className="text-gray-500 dark:text-gray-400" />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Minimum order amount for free shipping. Leave empty to disable free shipping.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tax Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tax Rate (%)
                </label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    id="taxRate"
                    name="taxRate"
                    value={formData.taxRate}
                    onChange={handleNumericChange}
                    min="0"
                    step="0.01"
                    className="block w-full pr-10 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Percent size={16} className="text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Set to 0 for tax-free orders
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="taxIncluded"
                  name="taxIncluded"
                  checked={formData.taxIncluded}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="taxIncluded" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Prices include tax
                </label>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Shipping Countries</h2>
            <select
              multiple
              id="shippingCountries"
              name="shippingCountries"
              value={formData.shippingCountries}
              onChange={handleCountryChange}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              size={8}
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Hold Ctrl (or Cmd on Mac) to select multiple countries. If none are selected, shipping will be available worldwide.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
