'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Undo2,
  Plus,
  Trash2,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Edit,
  Check,
  Settings,
  HelpCircle,
  MessageCircleQuestion,
  ChevronUp
} from 'lucide-react';
import PreviewPanel from '@/components/admin/PreviewPanel';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { useSiteSettings, FaqItem } from '@/lib/context/SiteSettingsContext';
import Link from 'next/link';
import { useToast } from '@/lib/context/ToastContext';
import ActionButtons from '@/components/admin/ActionButtons';

export default function FaqSettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, isLoading } = useSiteSettings();
  const { showToast } = useToast();
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [showFaq, setShowFaq] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [newFaqItem, setNewFaqItem] = useState<FaqItem>({
    question: '',
    answer: ''
  });
  const [showNewItemForm, setShowNewItemForm] = useState(false);

  useEffect(() => {
    if (!isLoading && settings && settings.footer) {
      setFaqItems(settings.footer.faqItems || []);
      setShowFaq(settings.footer.showFaq || false);
      setHasChanges(false);
    }
  }, [settings, isLoading]);

  // Effect to detect changes
  useEffect(() => {
    if (!isLoading && settings && settings.footer) {
      const faqItemsChanged = JSON.stringify(faqItems) !== JSON.stringify(settings.footer.faqItems || []);
      const showFaqChanged = showFaq !== (settings.footer.showFaq || false);

      setHasChanges(faqItemsChanged || showFaqChanged);
    }
  }, [faqItems, showFaq, settings, isLoading]);

  const handleAddFaqItem = () => {
    if (!newFaqItem.question || !newFaqItem.answer) {
      showToast('Question and answer are required', 'error');
      return;
    }

    setFaqItems([...faqItems, newFaqItem]);
    setNewFaqItem({
      question: '',
      answer: ''
    });
    setShowNewItemForm(false);
    setHasChanges(true);
    showToast('FAQ item added successfully', 'success');
  };

  const handleDeleteFaqItem = (index: number) => {
    const updatedFaqItems = [...faqItems];
    updatedFaqItems.splice(index, 1);
    setFaqItems(updatedFaqItems);
    setHasChanges(true);
    showToast('FAQ item removed', 'success');
  };

  const handleUpdateFaqItem = (index: number, field: string, value: string) => {
    const updatedFaqItems = [...faqItems];
    updatedFaqItems[index] = {
      ...updatedFaqItems[index],
      [field]: value
    };
    setFaqItems(updatedFaqItems);
    setHasChanges(true);
  };

  const handleToggleExpand = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  const handleShowFaqChange = (value: boolean) => {
    setShowFaq(value);
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!settings) return;

    try {
      // Create a new footer object with the updated FAQ items
      const updatedFooter = {
        ...settings.footer,
        faqItems,
        showFaq
      };

      await updateSettings({ footer: updatedFooter });
      showToast('FAQ settings saved successfully', 'success');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving FAQ settings:', error);
      // Show a more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to save FAQ settings';
      showToast(errorMessage, 'error');

      // If it's an authentication error, provide more guidance
      if (errorMessage.includes('Authentication required')) {
        showToast('You need to log in as an admin to save settings', 'error');
        // Optional: Redirect to login page
        // router.push('/auth/login?from=/admin/site-settings/faq');
      }
    }
  };

  const handleDiscardChanges = () => {
    if (!settings) return;

    // Reset to the original values
    setFaqItems(settings.footer.faqItems || []);
    setShowFaq(settings.footer.showFaq || false);
    setShowNewItemForm(false);
    setEditingItem(null);
    setHasChanges(false);
    showToast('Changes discarded', 'info');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700 mb-4"></div>
          <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-700 rounded mb-3"></div>
          <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pb-20">
      <ActionButtons
        hasChanges={hasChanges}
        onSave={handleSaveChanges}
        onDiscard={handleDiscardChanges}
      />
      <PermissionGuard
        permissions={['settings:edit']}
        fallback={
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 text-center">
            <Settings size={48} className="mx-auto text-neutral-400 dark:text-neutral-600 mb-4" />
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">Access Denied</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              You don't have permission to edit FAQ settings.
            </p>
          </div>
        }
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center">
            <Link
              href="/admin/site-settings"
              className="mr-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft size={20} className="text-neutral-500 dark:text-neutral-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">FAQ Settings</h1>
              <p className="text-neutral-600 dark:text-neutral-400">Manage frequently asked questions for your site</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewItemForm(!showNewItemForm)}
            className="px-4 py-2 bg-white text-neutral-900 rounded-md border border-neutral-200 hover:bg-neutral-50 flex items-center text-sm font-medium"
          >
            <Plus size={16} className="mr-2" />
            Add FAQ
          </button>
        </div>

        <PreviewPanel title="FAQ Preview" defaultOpen={true}>
          <div className="p-6 bg-white dark:bg-neutral-900">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Frequently Asked Questions</h2>
                <p className="text-neutral-600 dark:text-neutral-400">Find answers to common questions about our products and services</p>
              </div>

              {faqItems.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircle size={48} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-4" />
                  <p className="text-neutral-500 dark:text-neutral-400">No FAQ items added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {faqItems.map((item, index) => (
                    <div key={index} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                      <button
                        className="w-full p-4 flex items-center justify-between text-left font-medium"
                        onClick={() => {}}
                      >
                        <span>{item.question}</span>
                        <ChevronDown size={18} className="flex-shrink-0 text-neutral-500" />
                      </button>
                      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                        <p className="text-neutral-600 dark:text-neutral-400">{item.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PreviewPanel>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-neutral-800 dark:text-white">Frequently Asked Questions</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Add and manage FAQs to display in your website footer
              </p>
            </div>
            <button
              onClick={() => setShowNewItemForm(!showNewItemForm)}
              className="px-4 py-2 bg-white text-neutral-900 rounded-md border border-neutral-200 hover:bg-neutral-50 flex items-center text-sm font-medium"
            >
              <Plus size={16} className="mr-2" />
              Add FAQ
            </button>
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {showNewItemForm && (
              <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50">
                <h3 className="font-medium text-neutral-800 dark:text-white mb-4">New FAQ Item</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Question
                    </label>
                    <input
                      type="text"
                      value={newFaqItem.question}
                      onChange={(e) => setNewFaqItem({...newFaqItem, question: e.target.value})}
                      className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                      placeholder="e.g. What is your return policy?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Answer
                    </label>
                    <textarea
                      value={newFaqItem.answer}
                      onChange={(e) => setNewFaqItem({...newFaqItem, answer: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                      placeholder="Provide a clear and concise answer"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => setShowNewItemForm(false)}
                    className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddFaqItem}
                    className="px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary-dark"
                  >
                    Add FAQ
                  </button>
                </div>
              </div>
            )}

            {faqItems.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircleQuestion size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
                <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">No FAQs Added Yet</h3>
                <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-6">
                  Add frequently asked questions to help your customers find answers to common inquiries.
                </p>
                <button
                  onClick={() => setShowNewItemForm(true)}
                  className="px-4 py-2 bg-white text-neutral-900 rounded-md border border-neutral-200 hover:bg-neutral-50 flex items-center text-sm font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Add Your First FAQ
                </button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {faqItems.map((item, index) => (
                  <div key={index} className="p-4 md:p-6">
                    {editingItem === index ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Question
                          </label>
                          <input
                            type="text"
                            value={item.question}
                            onChange={(e) => handleUpdateFaqItem(index, 'question', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Answer
                          </label>
                          <textarea
                            value={item.answer}
                            onChange={(e) => handleUpdateFaqItem(index, 'answer', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => setEditingItem(null)}
                            className="px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center"
                          >
                            <Check size={16} className="mr-1" />
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <button
                            onClick={() => handleToggleExpand(index)}
                            className="flex-grow flex items-center text-left group"
                          >
                            <div className="mr-3">
                              {expandedItem === index ? (
                                <ChevronUp size={20} className="text-primary" />
                              ) : (
                                <ChevronDown size={20} className="text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-400" />
                              )}
                            </div>
                            <h3 className="font-medium text-neutral-800 dark:text-white text-base">
                              {item.question}
                            </h3>
                          </button>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => setEditingItem(index)}
                              className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              aria-label="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteFaqItem(index)}
                              className="p-1.5 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                              aria-label="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {expandedItem === index && (
                          <div className="mt-2 pl-10 text-neutral-600 dark:text-neutral-400 text-sm">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-lg font-medium text-neutral-800 dark:text-white mb-4">FAQ Display Settings</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            You can enable or disable the FAQ section in the footer from the footer settings page.
          </p>
          <Link
            href="/admin/site-settings/footer"
            className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 inline-block"
          >
            Back to Footer Settings
          </Link>
        </div>
      </PermissionGuard>
    </div>
  );
}
