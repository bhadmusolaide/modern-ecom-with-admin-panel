'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Undo2,
  Footprints,
  Plus,
  Trash2,
  ArrowLeft,
  Eye,
  Settings,
  ToggleLeft,
  ToggleRight,
  Edit,
  Check,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Mail
} from 'lucide-react';
import PreviewPanel from '@/components/admin/PreviewPanel';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { useSiteSettings, FooterLinkGroup, FooterLink } from '@/lib/context/SiteSettingsContext';
import Link from 'next/link';
import { useToast } from '@/lib/context/ToastContext';
import ActionButtons from '@/components/admin/ActionButtons';

export default function FooterSettingsPage() {
  const router = useRouter();
  const { settings, updateFooter, isLoading } = useSiteSettings();
  const { showToast } = useToast();

  const [footerSettings, setFooterSettings] = useState({
    companyDescription: settings?.footer?.companyDescription || '',
    copyrightText: settings?.footer?.copyrightText || '',
    showSocialLinks: settings?.footer?.showSocialLinks ?? true,
    socialLinks: settings?.footer?.socialLinks || [],
    footerLinks: settings?.footer?.footerLinks || [],
    showFaq: settings?.footer?.showFaq ?? false,
    faqItems: settings?.footer?.faqItems || []
  });

  const [showNewLinkGroupForm, setShowNewLinkGroupForm] = useState(false);
  const [newLinkGroup, setNewLinkGroup] = useState({
    title: '',
    links: [] as FooterLink[]
  });

  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
  const [showNewLinkForm, setShowNewLinkForm] = useState(false);
  const [newLink, setNewLink] = useState({
    text: '',
    url: ''
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && settings) {
      const hasChanges =
        footerSettings.companyDescription !== settings.footer.companyDescription ||
        footerSettings.copyrightText !== settings.footer.copyrightText ||
        footerSettings.showSocialLinks !== settings.footer.showSocialLinks ||
        JSON.stringify(footerSettings.socialLinks) !== JSON.stringify(settings.footer.socialLinks) ||
        JSON.stringify(footerSettings.footerLinks) !== JSON.stringify(settings.footer.footerLinks) ||
        footerSettings.showFaq !== settings.footer.showFaq ||
        JSON.stringify(footerSettings.faqItems) !== JSON.stringify(settings.footer.faqItems || []);

      setHasChanges(hasChanges);
    }
  }, [footerSettings, settings, isLoading]);

  useEffect(() => {
    if (!isLoading && settings) {
      setFooterSettings({
        companyDescription: settings.footer.companyDescription,
        copyrightText: settings.footer.copyrightText,
        showSocialLinks: settings.footer.showSocialLinks,
        socialLinks: settings.footer.socialLinks,
        footerLinks: settings.footer.footerLinks,
        showFaq: settings.footer.showFaq,
        faqItems: settings.footer.faqItems || []
      });
    }
  }, [settings, isLoading]);

  const handleToggleSocialLinks = () => {
    setFooterSettings({
      ...footerSettings,
      showSocialLinks: !footerSettings.showSocialLinks
    });
  };

  const handleToggleFaq = () => {
    setFooterSettings({
      ...footerSettings,
      showFaq: !footerSettings.showFaq
    });
  };

  const handleAddLinkGroup = () => {
    if (!newLinkGroup.title) {
      showToast('Link group title is required', 'error');
      return;
    }

    setFooterSettings({
      ...footerSettings,
      footerLinks: [
        ...footerSettings.footerLinks,
        {
          title: newLinkGroup.title,
          links: []
        }
      ]
    });

    setNewLinkGroup({
      title: '',
      links: []
    });

    setShowNewLinkGroupForm(false);
    showToast('Link group added successfully', 'success');
  };

  const handleDeleteLinkGroup = (index: number) => {
    const updatedFooterLinks = [...footerSettings.footerLinks];
    updatedFooterLinks.splice(index, 1);

    setFooterSettings({
      ...footerSettings,
      footerLinks: updatedFooterLinks
    });

    showToast('Link group removed', 'success');
  };

  const handleUpdateLinkGroupTitle = (index: number, title: string) => {
    const updatedFooterLinks = [...footerSettings.footerLinks];
    updatedFooterLinks[index] = {
      ...updatedFooterLinks[index],
      title
    };

    setFooterSettings({
      ...footerSettings,
      footerLinks: updatedFooterLinks
    });
  };

  const handleAddLink = (groupIndex: number) => {
    if (!newLink.text || !newLink.url) {
      showToast('Link text and URL are required', 'error');
      return;
    }

    const updatedFooterLinks = [...footerSettings.footerLinks];
    updatedFooterLinks[groupIndex].links.push({
      text: newLink.text,
      url: newLink.url
    });

    setFooterSettings({
      ...footerSettings,
      footerLinks: updatedFooterLinks
    });

    setNewLink({
      text: '',
      url: ''
    });

    setShowNewLinkForm(false);
    showToast('Link added successfully', 'success');
  };

  const handleDeleteLink = (groupIndex: number, linkIndex: number) => {
    const updatedFooterLinks = [...footerSettings.footerLinks];
    updatedFooterLinks[groupIndex].links.splice(linkIndex, 1);

    setFooterSettings({
      ...footerSettings,
      footerLinks: updatedFooterLinks
    });

    showToast('Link removed', 'success');
  };

  const handleUpdateSocialLink = (index: number, field: string, value: string) => {
    const updatedSocialLinks = [...footerSettings.socialLinks];
    updatedSocialLinks[index] = {
      ...updatedSocialLinks[index],
      [field]: value
    };

    setFooterSettings({
      ...footerSettings,
      socialLinks: updatedSocialLinks
    });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const validatedFooterSettings = {
        ...footerSettings,
        socialLinks: footerSettings.socialLinks?.map(link => ({
          platform: link.platform || '',
          url: link.url || ''
        })) || [],
        footerLinks: footerSettings.footerLinks?.map(group => ({
          title: group.title || '',
          links: group.links?.map(link => ({
            text: link.text || '',
            url: link.url || ''
          })) || []
        })) || [],
        faqItems: footerSettings.faqItems?.map(item => ({
          question: item.question || '',
          answer: item.answer || ''
        })) || []
      };

      await updateFooter(validatedFooterSettings);
      showToast('Footer settings saved successfully', 'success');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving footer settings:', error);
      // Show a more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to save footer settings';
      showToast(errorMessage, 'error');

      // If it's an authentication error, provide more guidance
      if (errorMessage.includes('Authentication required')) {
        showToast('You need to log in as an admin to save settings', 'error');
        // Optional: Redirect to login page
        // router.push('/auth/login?from=/admin/site-settings/footer');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (settings) {
      setFooterSettings({
        companyDescription: settings.footer.companyDescription,
        copyrightText: settings.footer.copyrightText,
        showSocialLinks: settings.footer.showSocialLinks,
        socialLinks: settings.footer.socialLinks,
        footerLinks: settings.footer.footerLinks,
        showFaq: settings.footer.showFaq,
        faqItems: settings.footer.faqItems || []
      });
      setHasChanges(false);
      showToast('Changes discarded', 'info');
    }
  };

  const renderSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook size={16} />;
      case 'instagram':
        return <Instagram size={16} />;
      case 'twitter':
        return <Twitter size={16} />;
      case 'youtube':
        return <Youtube size={16} />;
      case 'linkedin':
        return <Linkedin size={16} />;
      default:
        return null;
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
        isSaving={isSaving}
      />
      <PermissionGuard
        permissions={['settings:edit']}
        fallback={
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 text-center">
            <Settings size={48} className="mx-auto text-neutral-400 dark:text-neutral-600 mb-4" />
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">Access Denied</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              You don't have permission to edit footer settings.
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
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Footer Settings</h1>
              <p className="text-neutral-600 dark:text-neutral-400">Customize your website's footer layout and content</p>
            </div>
          </div>
        </div>

        <PreviewPanel title="Footer Preview" defaultOpen={true}>
          <div className="bg-white dark:bg-neutral-900 pt-12 pb-6">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <h3 className="font-bold text-lg mb-4">OMJ</h3>
                  <p className="text-gray-600 mb-4">{footerSettings.companyDescription}</p>
                  {footerSettings.showSocialLinks && (
                    <div className="flex space-x-4">
                      {footerSettings.socialLinks.map((link, index) => (
                        <a key={index} href={link.url} className="text-gray-500 hover:text-primary-600">
                          {renderSocialIcon(link.platform)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {footerSettings.footerLinks.map((group, index) => (
                  <div key={index}>
                    <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">{group.title}</h3>
                    <ul className="space-y-3">
                      {group.links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                          <a href={link.url} className="text-gray-600 hover:text-primary-600">
                            {link.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-500 text-sm mb-4 md:mb-0">
                  {footerSettings.copyrightText.replace('{year}', new Date().getFullYear().toString())}
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">Privacy Policy</a>
                  <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">Terms of Service</a>
                </div>
              </div>
            </div>
          </div>
        </PreviewPanel>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-medium text-neutral-800 dark:text-white">Company Information</h2>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Company Description
              </label>
              <textarea
                value={footerSettings.companyDescription}
                onChange={(e) => setFooterSettings({...footerSettings, companyDescription: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                placeholder="Describe your company"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Copyright Text
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                Use {'{year}'} to automatically insert the current year
              </p>
              <input
                type="text"
                value={footerSettings.copyrightText}
                onChange={(e) => setFooterSettings({...footerSettings, copyrightText: e.target.value})}
                className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                placeholder="© {year} Your Company. All rights reserved."
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-neutral-800 dark:text-white">Social Links</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Configure social media links in the footer
              </p>
            </div>
            <button
              onClick={handleToggleSocialLinks}
              className="text-primary"
            >
              {footerSettings.showSocialLinks ? (
                <ToggleRight size={40} />
              ) : (
                <ToggleLeft size={40} />
              )}
            </button>
          </div>

          {footerSettings.showSocialLinks && (
            <div className="p-6">
              <div className="space-y-4">
                {footerSettings.socialLinks.map((link, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-24 flex items-center">
                      <span className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-md text-neutral-700 dark:text-neutral-300">
                        {renderSocialIcon(link.platform)}
                      </span>
                      <span className="ml-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">
                        {link.platform}
                      </span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => handleUpdateSocialLink(index, 'url', e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                        placeholder={`https://${link.platform}.com/yourusername`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-neutral-800 dark:text-white">Footer Links</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Configure link groups in the footer
              </p>
            </div>
            <button
              onClick={() => setShowNewLinkGroupForm(!showNewLinkGroupForm)}
              className="px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center text-sm"
            >
              <Plus size={16} className="mr-1" />
              Add Link Group
            </button>
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {showNewLinkGroupForm && (
              <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50">
                <h3 className="font-medium text-neutral-800 dark:text-white mb-4">New Link Group</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Group Title
                  </label>
                  <input
                    type="text"
                    value={newLinkGroup.title}
                    onChange={(e) => setNewLinkGroup({...newLinkGroup, title: e.target.value})}
                    className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                    placeholder="e.g. Shop, Company, Support"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowNewLinkGroupForm(false)}
                    className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddLinkGroup}
                    className="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary-dark"
                  >
                    Add Group
                  </button>
                </div>
              </div>
            )}

            {footerSettings.footerLinks.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                No link groups added. Click "Add Link Group" to create footer navigation.
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {footerSettings.footerLinks.map((group, groupIndex) => (
                  <div key={groupIndex} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-neutral-800 dark:text-white">{group.title}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingGroupIndex(editingGroupIndex === groupIndex ? null : groupIndex);
                            setShowNewLinkForm(false);
                          }}
                          className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                          aria-label="Edit group"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteLinkGroup(groupIndex)}
                          className="p-1.5 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-500"
                          aria-label="Delete group"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {editingGroupIndex === groupIndex && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Group Title
                        </label>
                        <input
                          type="text"
                          value={group.title}
                          onChange={(e) => handleUpdateLinkGroupTitle(groupIndex, e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 mb-3"
                        />
                      </div>
                    )}

                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Links</h4>
                        <button
                          onClick={() => {
                            setShowNewLinkForm(!showNewLinkForm);
                            setEditingGroupIndex(groupIndex);
                          }}
                          className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center"
                        >
                          <Plus size={12} className="mr-1" />
                          Add Link
                        </button>
                      </div>

                      {showNewLinkForm && editingGroupIndex === groupIndex && (
                        <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-md">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Text
                              </label>
                              <input
                                type="text"
                                value={newLink.text}
                                onChange={(e) => setNewLink({...newLink, text: e.target.value})}
                                className="w-full px-2 py-1.5 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                                placeholder="e.g. About Us"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                URL
                              </label>
                              <input
                                type="text"
                                value={newLink.url}
                                onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                                className="w-full px-2 py-1.5 text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                                placeholder="e.g. /about"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setShowNewLinkForm(false)}
                              className="px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAddLink(groupIndex)}
                              className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}

                      {group.links.length === 0 ? (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">
                          No links added to this group.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {group.links.map((link, linkIndex) => (
                            <li key={linkIndex} className="flex items-center justify-between">
                              <div>
                                <span className="text-sm text-neutral-800 dark:text-neutral-200">{link.text}</span>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
                                  {link.url}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteLink(groupIndex, linkIndex)}
                                className="p-1 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-500"
                                aria-label="Delete link"
                              >
                                <Trash2 size={14} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 mb-8">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-neutral-800 dark:text-white">FAQ Section</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Show frequently asked questions in the footer
              </p>
            </div>
            <button
              onClick={handleToggleFaq}
              className="text-primary"
            >
              {footerSettings.showFaq ? (
                <ToggleRight size={40} />
              ) : (
                <ToggleLeft size={40} />
              )}
            </button>
          </div>

          {footerSettings.showFaq && (
            <div className="p-6">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                FAQ items can be managed in the dedicated FAQ section.
              </p>
              <Link
                href="/admin/site-settings/faq"
                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 inline-block"
              >
                Go to FAQ Management
              </Link>
            </div>
          )}
        </div>
      </PermissionGuard>
    </div>
  );
}
