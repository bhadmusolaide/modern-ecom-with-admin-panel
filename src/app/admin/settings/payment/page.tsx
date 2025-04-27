'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Undo2, Plus, Trash2, CreditCard, DollarSign, Check, X } from 'lucide-react';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import { useToast } from '@/lib/context/ToastContext';
import { PaymentMethod } from '@/lib/context/SiteSettingsContext';

export default function PaymentSettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, isLoading } = useSiteSettings();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    currencyCode: settings?.currencyCode || 'USD',
    currencySymbol: settings?.currencySymbol || '$',
    paymentMethods: settings?.paymentMethods || [],
    stripeEnabled: settings?.stripeEnabled || false,
    stripePublicKey: settings?.stripePublicKey || '',
    stripeSecretKey: settings?.stripeSecretKey || '',
    paypalEnabled: settings?.paypalEnabled || false,
    paypalClientId: settings?.paypalClientId || '',
    paypalSecretKey: settings?.paypalSecretKey || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showNewMethodForm, setShowNewMethodForm] = useState(false);
  const [newMethod, setNewMethod] = useState<PaymentMethod>({
    id: '',
    name: '',
    enabled: true,
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // If changing currency code, update the currency symbol automatically
    if (name === 'currencyCode') {
      const currencySymbol = getCurrencySymbol(value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        currencySymbol
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Helper function to get currency symbol based on currency code
  const getCurrencySymbol = (currencyCode: string): string => {
    switch (currencyCode) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'CAD': return 'C$';
      case 'AUD': return 'A$';
      case 'JPY': return '¥';
      case 'NGN': return '₦';
      default: return '$';
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Handle payment method toggle
  const handleMethodToggle = (id: string) => {
    const updatedMethods = formData.paymentMethods.map((method) =>
      method.id === id ? { ...method, enabled: !method.enabled } : method
    );
    setFormData((prev) => ({ ...prev, paymentMethods: updatedMethods }));
  };

  // Handle payment method removal
  const handleRemoveMethod = (id: string) => {
    const updatedMethods = formData.paymentMethods.filter((method) => method.id !== id);
    setFormData((prev) => ({ ...prev, paymentMethods: updatedMethods }));
  };

  // Handle adding a new payment method
  const handleAddMethod = () => {
    if (!newMethod.id || !newMethod.name) {
      showToast('Please enter both ID and name for the payment method', 'error');
      return;
    }

    // Check if ID already exists
    if (formData.paymentMethods.some((method) => method.id === newMethod.id)) {
      showToast('A payment method with this ID already exists', 'error');
      return;
    }

    const updatedMethods = [...formData.paymentMethods, newMethod];
    setFormData((prev) => ({ ...prev, paymentMethods: updatedMethods }));
    setNewMethod({ id: '', name: '', enabled: true });
    setShowNewMethodForm(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateSettings(formData);
      showToast('Payment settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      showToast('Failed to save payment settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form to current settings
  const handleReset = () => {
    const currencyCode = settings?.currencyCode || 'USD';
    setFormData({
      currencyCode,
      currencySymbol: settings?.currencySymbol || getCurrencySymbol(currencyCode),
      paymentMethods: settings?.paymentMethods || [],
      stripeEnabled: settings?.stripeEnabled || false,
      stripePublicKey: settings?.stripePublicKey || '',
      stripeSecretKey: settings?.stripeSecretKey || '',
      paypalEnabled: settings?.paypalEnabled || false,
      paypalClientId: settings?.paypalClientId || '',
      paypalSecretKey: settings?.paypalSecretKey || '',
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Settings</h1>
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
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Currency Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="currencyCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Currency Code
                </label>
                <select
                  id="currencyCode"
                  name="currencyCode"
                  value={formData.currencyCode}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="NGN">NGN - Nigerian Naira</option>
                </select>
              </div>
              <div>
                <label htmlFor="currencySymbol" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  id="currencySymbol"
                  name="currencySymbol"
                  value={formData.currencySymbol}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="$"
                  maxLength={3}
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Methods</h2>

            {formData.paymentMethods.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                <p className="text-gray-500 dark:text-gray-400">No payment methods added yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-md"
                  >
                    <div className="flex items-center">
                      <div className="mr-3 text-gray-500 dark:text-gray-400">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {method.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {method.id}
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
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Add Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="methodId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Method ID
                    </label>
                    <input
                      type="text"
                      id="methodId"
                      value={newMethod.id}
                      onChange={(e) => setNewMethod({ ...newMethod, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      placeholder="e.g. bank-transfer"
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
                      placeholder="e.g. Bank Transfer"
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
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
                Add Payment Method
              </button>
            )}
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Gateways</h2>

            <div className="space-y-6">
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="mr-3 text-gray-500 dark:text-gray-400">
                      <CreditCard size={20} />
                    </div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">Stripe</h3>
                  </div>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        name="stripeEnabled"
                        checked={formData.stripeEnabled}
                        onChange={handleCheckboxChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {formData.stripeEnabled && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="stripePublicKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Stripe Public Key
                      </label>
                      <input
                        type="text"
                        id="stripePublicKey"
                        name="stripePublicKey"
                        value={formData.stripePublicKey}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="pk_test_..."
                      />
                    </div>
                    <div>
                      <label htmlFor="stripeSecretKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Stripe Secret Key
                      </label>
                      <input
                        type="password"
                        id="stripeSecretKey"
                        name="stripeSecretKey"
                        value={formData.stripeSecretKey}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="sk_test_..."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="mr-3 text-gray-500 dark:text-gray-400">
                      <DollarSign size={20} />
                    </div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">PayPal</h3>
                  </div>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        name="paypalEnabled"
                        checked={formData.paypalEnabled}
                        onChange={handleCheckboxChange}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {formData.paypalEnabled && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="paypalClientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        PayPal Client ID
                      </label>
                      <input
                        type="text"
                        id="paypalClientId"
                        name="paypalClientId"
                        value={formData.paypalClientId}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Client ID from PayPal Developer Dashboard"
                      />
                    </div>
                    <div>
                      <label htmlFor="paypalSecretKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        PayPal Secret Key
                      </label>
                      <input
                        type="password"
                        id="paypalSecretKey"
                        name="paypalSecretKey"
                        value={formData.paypalSecretKey}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Secret Key from PayPal Developer Dashboard"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
