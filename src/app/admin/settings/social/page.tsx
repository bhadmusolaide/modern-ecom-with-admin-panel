'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  Undo2, 
  Plus, 
  Trash2,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Github,
  Globe
} from 'lucide-react';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import { useToast } from '@/lib/context/ToastContext';

interface SocialLink {
  platform: string;
  url: string;
}

export default function SocialMediaSettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, isLoading } = useSiteSettings();
  const { showToast } = useToast();
  
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    settings?.socialLinks || []
  );
  const [newLink, setNewLink] = useState<SocialLink>({
    platform: 'facebook',
    url: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Get icon for social platform
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook size={20} />;
      case 'instagram':
        return <Instagram size={20} />;
      case 'twitter':
        return <Twitter size={20} />;
      case 'linkedin':
        return <Linkedin size={20} />;
      case 'youtube':
        return <Youtube size={20} />;
      case 'github':
        return <Github size={20} />;
      default:
        return <Globe size={20} />;
    }
  };

  // Handle adding a new social link
  const handleAddLink = () => {
    if (!newLink.url) {
      showToast('Please enter a URL for the social link', 'error');
      return;
    }

    // Add http:// if not present
    let url = newLink.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    setSocialLinks([...socialLinks, { ...newLink, url }]);
    setNewLink({ platform: 'facebook', url: '' });
    setShowAddForm(false);
  };

  // Handle removing a social link
  const handleRemoveLink = (index: number) => {
    const updatedLinks = [...socialLinks];
    updatedLinks.splice(index, 1);
    setSocialLinks(updatedLinks);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await updateSettings({ socialLinks });
      showToast('Social media settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving social media settings:', error);
      showToast('Failed to save social media settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form to current settings
  const handleReset = () => {
    setSocialLinks(settings?.socialLinks || []);
    setNewLink({ platform: 'facebook', url: '' });
    setShowAddForm(false);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Social Media Settings</h1>
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
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Social Media Links</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Connect your social media accounts to display links on your website.
          </p>
          
          {socialLinks.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-md">
              <p className="text-gray-500 dark:text-gray-400">No social media links added yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {socialLinks.map((link, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-md"
                >
                  <div className="flex items-center">
                    <div className="mr-3 text-gray-500 dark:text-gray-400">
                      {getSocialIcon(link.platform)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white capitalize">
                        {link.platform}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {link.url}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {showAddForm ? (
            <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Add Social Media Link</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Platform
                  </label>
                  <select
                    id="platform"
                    value={newLink.platform}
                    onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="youtube">YouTube</option>
                    <option value="github">GitHub</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL
                  </label>
                  <input
                    type="text"
                    id="url"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    placeholder="https://example.com/profile"
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Link
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Plus size={16} className="mr-2" />
              Add Social Media Link
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
