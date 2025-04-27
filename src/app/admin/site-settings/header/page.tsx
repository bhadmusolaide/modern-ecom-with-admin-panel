'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Undo2,
  Menu,
  Plus,
  Trash2,
  ArrowLeft,
  Eye,
  Settings,
  ChevronRight,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Edit,
  Grip,
  Check,
  ShoppingBag,
  User,
  Search,
  Heart
} from 'lucide-react';
import PreviewPanel from '@/components/admin/PreviewPanel';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { useSiteSettings, MenuItem } from '@/lib/context/SiteSettingsContext';
import Link from 'next/link';
import { useToast } from '@/lib/context/ToastContext';
import ActionButtons from '@/components/admin/ActionButtons';

export default function HeaderSettingsPage() {
  const router = useRouter();
  const { settings, updateHeader, isLoading } = useSiteSettings();
  const { showToast } = useToast();

  const [headerSettings, setHeaderSettings] = useState({
    transparent: true,
    menuItems: [] as MenuItem[]
  });
  const [hasChanges, setHasChanges] = useState(false);

  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [newMenuItem, setNewMenuItem] = useState<MenuItem>({
    text: '',
    url: '',
    submenu: []
  });
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [showNewSubmenuItemForm, setShowNewSubmenuItemForm] = useState(false);
  const [newSubmenuItem, setNewSubmenuItem] = useState({
    text: '',
    url: ''
  });
  const [editingSubmenuIndex, setEditingSubmenuIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && settings) {
      setHeaderSettings({
        transparent: settings.header.transparent,
        menuItems: settings.header.menuItems
      });
      setHasChanges(false);
    }
  }, [settings, isLoading]);

  // Add effect to detect changes
  useEffect(() => {
    if (!isLoading && settings) {
      const transparentChanged = headerSettings.transparent !== settings.header.transparent;
      const menuItemsChanged = JSON.stringify(headerSettings.menuItems) !== JSON.stringify(settings.header.menuItems);
      setHasChanges(transparentChanged || menuItemsChanged);
    }
  }, [headerSettings, settings, isLoading]);

  const handleToggleTransparent = () => {
    setHeaderSettings({
      ...headerSettings,
      transparent: !headerSettings.transparent
    });
  };

  const handleAddMenuItem = () => {
    if (!newMenuItem.text || !newMenuItem.url) {
      showToast('Menu item text and URL are required', 'error');
      return;
    }

    setHeaderSettings({
      ...headerSettings,
      menuItems: [
        ...headerSettings.menuItems,
        {
          text: newMenuItem.text,
          url: newMenuItem.url,
          submenu: []
        }
      ]
    });

    setNewMenuItem({
      text: '',
      url: '',
      submenu: []
    });

    setShowNewItemForm(false);
    showToast('Menu item added successfully', 'success');
  };

  const handleDeleteMenuItem = (index: number) => {
    const updatedMenuItems = [...headerSettings.menuItems];
    updatedMenuItems.splice(index, 1);

    setHeaderSettings({
      ...headerSettings,
      menuItems: updatedMenuItems
    });

    showToast('Menu item removed', 'success');
  };

  const handleUpdateMenuItem = (index: number, field: string, value: string) => {
    const updatedMenuItems = [...headerSettings.menuItems];
    updatedMenuItems[index] = {
      ...updatedMenuItems[index],
      [field]: value
    };

    setHeaderSettings({
      ...headerSettings,
      menuItems: updatedMenuItems
    });
  };

  const handleAddSubmenuItem = (menuIndex: number) => {
    if (!newSubmenuItem.text || !newSubmenuItem.url) {
      showToast('Submenu item text and URL are required', 'error');
      return;
    }

    const updatedMenuItems = [...headerSettings.menuItems];

    if (!updatedMenuItems[menuIndex].submenu) {
      updatedMenuItems[menuIndex].submenu = [];
    }

    updatedMenuItems[menuIndex].submenu?.push({
      text: newSubmenuItem.text,
      url: newSubmenuItem.url
    });

    setHeaderSettings({
      ...headerSettings,
      menuItems: updatedMenuItems
    });

    setNewSubmenuItem({
      text: '',
      url: ''
    });

    setShowNewSubmenuItemForm(false);
    showToast('Submenu item added successfully', 'success');
  };

  const handleUpdateSubmenuItem = (menuIndex: number, submenuIndex: number, field: string, value: string) => {
    const updatedMenuItems = [...headerSettings.menuItems];

    if (updatedMenuItems[menuIndex].submenu && updatedMenuItems[menuIndex].submenu![submenuIndex]) {
      updatedMenuItems[menuIndex].submenu![submenuIndex] = {
        ...updatedMenuItems[menuIndex].submenu![submenuIndex],
        [field]: value
      };

      setHeaderSettings({
        ...headerSettings,
        menuItems: updatedMenuItems
      });
    }
  };

  const handleDeleteSubmenuItem = (menuIndex: number, submenuIndex: number) => {
    const updatedMenuItems = [...headerSettings.menuItems];
    updatedMenuItems[menuIndex].submenu?.splice(submenuIndex, 1);

    setHeaderSettings({
      ...headerSettings,
      menuItems: updatedMenuItems
    });

    showToast('Submenu item removed', 'success');
  };

  const handleSaveChanges = async () => {
    try {
      // Show a toast to indicate we're saving
      showToast('Saving header settings...', 'info');

      // Validate menu items and submenu items
      const validatedMenuItems = headerSettings.menuItems.map(item => ({
        text: item.text,
        url: item.url,
        submenu: Array.isArray(item.submenu) ? item.submenu.map(subitem => ({
          text: subitem.text,
          url: subitem.url
        })) : []
      }));

      const validatedHeaderSettings = {
        transparent: headerSettings.transparent,
        menuItems: validatedMenuItems
      };

      // Log detailed information for debugging
      console.log('Saving header settings:', JSON.stringify(validatedHeaderSettings));
      console.log('Current environment:', process.env.NODE_ENV);
      console.log('Auth cookie present:', document.cookie.includes('auth-token'));

      // Get auth token from cookies for debugging
      const authToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];
      console.log('Auth token present:', !!authToken);

      // Try to get token from Firebase directly
      try {
        const { auth } = await import('@/lib/firebase/config');
        if (auth.currentUser) {
          const token = await auth.currentUser.getIdToken(true);
          console.log('Firebase token retrieved directly:', !!token);

          // Store token in window for potential use by other components
          window.__FIREBASE_TOKEN__ = token;
        } else {
          console.log('No Firebase user found when saving header');
        }
      } catch (tokenError) {
        console.error('Error getting Firebase token:', tokenError);
      }

      // Log the exact headers we're about to send
      const finalAuthToken = await (async () => {
        try {
          const { auth } = await import('@/lib/firebase/config');
          if (auth.currentUser) {
            return await auth.currentUser.getIdToken(true);
          }
        } catch (e) {
          console.error('Final token check error:', e);
        }
        return authToken || window.__FIREBASE_TOKEN__ || null;
      })();

      console.log('Final auth token being used:', finalAuthToken ? 'Present (first 10 chars: ' + finalAuthToken.substring(0, 10) + '...)' : 'Missing');

      // Attempt to update header settings
      const result = await updateHeader(validatedHeaderSettings);
      console.log('Header update successful:', result ? 'Yes' : 'No');

      // Only show success message if we got here (no errors thrown)
      showToast('Header settings saved successfully', 'success');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving header settings:', error);

      // Show a more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to save header settings';
      showToast(`Error: ${errorMessage}`, 'error');

      // Log additional debugging information
      console.log('Headers settings that failed to save:', headerSettings);
      console.log('Current URL:', window.location.href);
      console.log('All cookies:', document.cookie);

      // If it's an authentication error, provide more guidance
      if (errorMessage.includes('Authentication required') || errorMessage.includes('401')) {
        showToast('You need to log in as an admin to save settings', 'error');
        // Optional: Redirect to login page
        // router.push('/auth/login?from=/admin/site-settings/header');
      } else if (errorMessage.includes('405')) {
        showToast('The server doesn\'t allow this operation. This might be a CORS or method not allowed issue.', 'error');
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        showToast('Network error. Please check your internet connection and try again.', 'error');
      }
    }
  };

  const handleDiscardChanges = () => {
    if (settings) {
      setHeaderSettings({
        transparent: settings.header.transparent,
        menuItems: settings.header.menuItems.map(item => ({
          text: item.text,
          url: item.url,
          submenu: Array.isArray(item.submenu) ? item.submenu.map(subitem => ({
            text: subitem.text,
            url: subitem.url
          })) : []
        }))
      });
      setHasChanges(false);
      showToast('Changes discarded', 'info');
    }
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
              You don't have permission to edit header settings.
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
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Header Settings</h1>
              <p className="text-neutral-600 dark:text-neutral-400">Customize your website's header layout and navigation</p>
            </div>
          </div>
        </div>

        <PreviewPanel title="Header Preview" defaultOpen={true}>
          <div className="bg-white dark:bg-neutral-900 shadow-md py-4">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-8">
                  <div className="font-bold text-xl">OMJ</div>
                  <nav className="hidden md:flex space-x-6">
                    {headerSettings.menuItems.map((item, index) => (
                      <div key={index} className="relative group">
                        <a
                          href={item.url}
                          className={`font-medium ${index === 0 ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'}`}
                        >
                          {item.text}
                          {index === 0 && (
                            <div className="h-0.5 bg-primary-600 mt-0.5" />
                          )}
                        </a>
                        {item.submenu && item.submenu.length > 0 && (
                          <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 z-10 hidden group-hover:block">
                            {item.submenu.map((subitem, subIndex) => (
                              <a
                                key={subIndex}
                                href={subitem.url}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {subitem.text}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </nav>
                </div>
                <div className="flex items-center space-x-4">
                  <button className="p-2 text-gray-600 hover:text-primary-600">
                    <Search size={20} />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-primary-600">
                    <User size={20} />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-primary-600">
                    <Heart size={20} />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-primary-600 relative">
                    <ShoppingBag size={20} />
                    <span className="absolute top-0 right-0 bg-primary-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
                  </button>
                  <button className="md:hidden p-2 text-gray-600">
                    <Menu size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </PreviewPanel>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-medium text-neutral-800 dark:text-white">General Header Settings</h2>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-neutral-800 dark:text-white">Transparent Header</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Make the header transparent on the homepage, with background appearing on scroll
                </p>
              </div>
              <button
                onClick={handleToggleTransparent}
                className="text-primary"
              >
                {headerSettings.transparent ? (
                  <ToggleRight size={40} />
                ) : (
                  <ToggleLeft size={40} />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-neutral-800 dark:text-white">Navigation Menu</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Configure the menu items in your website header
              </p>
            </div>
            <button
              onClick={() => setShowNewItemForm(!showNewItemForm)}
              className="px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center text-sm"
            >
              <Plus size={16} className="mr-1" />
              Add Menu Item
            </button>
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {showNewItemForm && (
              <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50">
                <h3 className="font-medium text-neutral-800 dark:text-white mb-4">New Menu Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Menu Text
                    </label>
                    <input
                      type="text"
                      value={newMenuItem.text}
                      onChange={(e) => setNewMenuItem({...newMenuItem, text: e.target.value})}
                      className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                      placeholder="e.g. About Us"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      URL
                    </label>
                    <input
                      type="text"
                      value={newMenuItem.url}
                      onChange={(e) => setNewMenuItem({...newMenuItem, url: e.target.value})}
                      className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                      placeholder="e.g. /about"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowNewItemForm(false)}
                    className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMenuItem}
                    className="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary-dark"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            )}

            {headerSettings.menuItems.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                No menu items added. Click "Add Menu Item" to create your navigation menu.
              </div>
            ) : (
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {headerSettings.menuItems.map((item, index) => (
                  <li key={index} className="p-6">
                    {editingItem === index ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                              Menu Text
                            </label>
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) => handleUpdateMenuItem(index, 'text', e.target.value)}
                              className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                              URL
                            </label>
                            <input
                              type="text"
                              value={item.url}
                              onChange={(e) => handleUpdateMenuItem(index, 'url', e.target.value)}
                              className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => setEditingItem(null)}
                            className="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary-dark flex items-center"
                          >
                            <Check size={16} className="mr-1" />
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Grip size={16} className="text-neutral-400 dark:text-neutral-600 mr-2" />
                            <h3 className="font-medium text-neutral-800 dark:text-white">{item.text}</h3>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => setEditingItem(index)}
                              className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                              aria-label="Edit menu item"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteMenuItem(index)}
                              className="p-1.5 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-500"
                              aria-label="Delete menu item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                          URL: {item.url}
                        </p>

                        {/* Submenu section */}
                        <div className="mt-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              Submenu Items
                            </h4>
                            <button
                              onClick={() => {
                                setShowNewSubmenuItemForm(!showNewSubmenuItemForm);
                                setEditingSubmenuIndex(index);
                              }}
                              className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center"
                            >
                              <Plus size={12} className="mr-1" />
                              Add Submenu Item
                            </button>
                          </div>

                          {showNewSubmenuItemForm && editingSubmenuIndex === index && (
                            <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-md">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Text
                                  </label>
                                  <input
                                    type="text"
                                    value={newSubmenuItem.text}
                                    onChange={(e) => setNewSubmenuItem({...newSubmenuItem, text: e.target.value})}
                                    className="w-full px-2 py-1.5 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                                    placeholder="e.g. Our Team"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    URL
                                  </label>
                                  <input
                                    type="text"
                                    value={newSubmenuItem.url}
                                    onChange={(e) => setNewSubmenuItem({...newSubmenuItem, url: e.target.value})}
                                    className="w-full px-2 py-1.5 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                                    placeholder="e.g. /about/team"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => setShowNewSubmenuItemForm(false)}
                                  className="px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleAddSubmenuItem(index)}
                                  className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          )}

                          {item.submenu && item.submenu.length > 0 ? (
                            <ul className="space-y-2 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700">
                              {item.submenu.map((subitem, subIndex) => (
                                <li key={subIndex} className="flex items-center justify-between">
                                  <div>
                                    <span className="text-sm text-neutral-800 dark:text-neutral-200">{subitem.text}</span>
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
                                      {subitem.url}
                                    </span>
                                  </div>
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => handleDeleteSubmenuItem(index, subIndex)}
                                      className="p-1 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-500"
                                      aria-label="Delete submenu item"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">
                              No submenu items added.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PermissionGuard>
    </div>
  );
}
