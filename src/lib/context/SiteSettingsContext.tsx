'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SiteSection, DEFAULT_HOMEPAGE_SECTIONS } from '@/lib/data/siteSettings';
import { auth } from '@/lib/firebase';

// Define payment method interface
export interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
}

// Define shipping method interface
export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  enabled: boolean;
}

// Define submenu item interface
export interface SubmenuItem {
  text: string;
  url: string;
}

// Define menu item interface
export interface MenuItem {
  text: string;
  url: string;
  submenu?: SubmenuItem[];
}

// Define header settings interface
export interface HeaderSettings {
  transparent: boolean;
  menuItems: MenuItem[];
}

// Define footer link interface
export interface FooterLink {
  text: string;
  url: string;
}

// Define footer link group interface
export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

// Define FAQ item interface
export interface FaqItem {
  question: string;
  answer: string;
}

// Define footer settings interface
export interface FooterSettings {
  companyDescription: string;
  copyrightText: string;
  showSocialLinks: boolean;
  socialLinks: Array<{ platform: string; url: string }>;
  footerLinks: FooterLinkGroup[];
  showFaq: boolean;
  faqItems: FaqItem[];
}

// Define the shape of our site settings
export interface SiteSettings {
  id: string;
  siteName: string;
  siteTagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontPrimary: string;
  fontSecondary: string;
  footerText: string | null;
  socialLinks: Array<{ platform: string; url: string }> | null;
  metaTitle: string | null;
  metaDescription: string | null;

  // Payment settings
  currencyCode: string;
  currencySymbol: string;
  paymentMethods: PaymentMethod[] | null;
  stripeEnabled: boolean;
  stripePublicKey: string | null;
  stripeSecretKey: string | null;
  paypalEnabled: boolean;
  paypalClientId: string | null;
  paypalSecretKey: string | null;

  // Shipping settings
  shippingMethods: ShippingMethod[] | null;
  freeShippingThreshold: number | null;
  taxRate: number;
  taxIncluded: boolean;
  shippingCountries: string[] | null;

  // Header and Footer settings
  header: HeaderSettings;
  footer: FooterSettings;

  // Homepage sections
  homepageSections: SiteSection[];

  // New FAQ section
  faq: {
    items: FaqItem[];
    enabled: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

// Define the shape of our context
interface SiteSettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (settings: Partial<SiteSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  updateSection: (sectionId: string, sectionData: Partial<SiteSection>) => Promise<void>;
  reorderSections: (sectionIds: string[]) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  updateHeader: (headerSettings: HeaderSettings) => Promise<void>;
  updateFooter: (footerSettings: FooterSettings) => Promise<void>;
  addSection: (sectionType: string) => Promise<void>;
}

// Create the context
const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

// Create a provider component
export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default settings to use as fallback
  const defaultSettings: SiteSettings = {
    id: 'default',
    siteName: 'Yours Ecommerce',
    siteTagline: 'Modern Unisex Boutique',
    logoUrl: '/images/logo.svg',
    faviconUrl: '/favicon.ico',
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    accentColor: '#f59e0b',
    fontPrimary: 'Inter',
    fontSecondary: 'Playfair Display',
    footerText: '© 2024 Yours Ecommerce. All rights reserved.',
    socialLinks: [],
    metaTitle: 'Yours Ecommerce - Modern Unisex Boutique',
    metaDescription: 'Discover our collection of timeless, sustainable unisex fashion pieces designed for everyone.',
    currencyCode: 'USD', // Supported currencies include USD, EUR, GBP, CAD, AUD, JPY, NGN
    currencySymbol: '$', // For NGN, use '₦'
    paymentMethods: [],
    stripeEnabled: false,
    stripePublicKey: null,
    stripeSecretKey: null,
    paypalEnabled: false,
    paypalClientId: null,
    paypalSecretKey: null,
    shippingMethods: [],
    freeShippingThreshold: null,
    taxRate: 0,
    taxIncluded: false,
    shippingCountries: [],
    header: {
      transparent: true,
      menuItems: [
        { text: 'Home', url: '/' },
        { text: 'Shop', url: '/shop' },
        { text: 'Collections', url: '/collections' },
        { text: 'About', url: '/about' },
        { text: 'Contact', url: '/contact' }
      ]
    },
    footer: {
      companyDescription: 'Modern, sustainable fashion for everyone. Our unisex boutique offers timeless pieces designed with quality and style in mind.',
      copyrightText: '© {year} Yours. All rights reserved.',
      showSocialLinks: true,
      socialLinks: [],
      footerLinks: [
        {
          title: 'Shop',
          links: [
            { text: 'All Products', url: '/shop' },
            { text: 'New Arrivals', url: '/shop/new-arrivals' },
            { text: 'Best Sellers', url: '/shop/best-sellers' },
            { text: 'Sale', url: '/shop/sale' }
          ]
        },
        {
          title: 'Company',
          links: [
            { text: 'About Us', url: '/about' },
            { text: 'Careers', url: '/careers' },
            { text: 'Store Locations', url: '/stores' },
            { text: 'Sustainability', url: '/sustainability' }
          ]
        },
        {
          title: 'Support',
          links: [
            { text: 'Contact Us', url: '/contact' },
            { text: 'FAQs', url: '/faqs' },
            { text: 'Shipping & Returns', url: '/shipping-returns' },
            { text: 'Size Guide', url: '/size-guide' }
          ]
        }
      ],
      showFaq: false,
      faqItems: []
    },
    homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
    faq: {
      items: [],
      enabled: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Helper function to get Firebase token
  const getFirebaseToken = async (): Promise<string | null> => {
    try {
      // In development mode, return a dummy token
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: returning dummy token');
        return 'dev-token';
      }

      // First priority: Get token directly from Firebase Auth
      try {
        const { auth } = await import('@/lib/firebase/config');
        const currentUser = auth.currentUser;

        if (currentUser) {
          console.log('Firebase user found, getting fresh token');
          // Force token refresh to ensure it's valid
          const token = await currentUser.getIdToken(true);
          console.log('Successfully retrieved fresh token from Firebase');

          // Store the token in a cookie for future use
          document.cookie = `auth-token=${token}; path=/; max-age=3600; SameSite=Strict`;

          // Also store in window for other components
          window.__FIREBASE_TOKEN__ = token;

          return token;
        } else {
          console.log('No Firebase user found - user not logged in');
        }
      } catch (authError) {
        console.error('Error getting token from Firebase Auth:', authError);
      }

      // Second priority: Check for token in window object (might be set by other components)
      if (window.__FIREBASE_TOKEN__) {
        console.log('Found token in window object');
        return window.__FIREBASE_TOKEN__;
      }

      // Third priority: Try to get token from cookies
      const authToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      if (authToken) {
        console.log('Found auth token in cookies');
        return authToken;
      }

      console.log('No authentication token found. Please log in as an admin user.');
      return null;
    } catch (error) {
      console.error('Error getting Firebase token:', error);

      // In development mode, return a dummy token even if there's an error
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: returning dummy token after error');
        return 'dev-token';
      }

      return null;
    }
  };

  // Function to fetch settings from the API
  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);

    // Declare timeoutId outside the try block so we can clear it in finally
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      console.log('Fetching site settings...');

      // Add a timeout to the fetch request
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      let responseText;
      let response;
      try {
        response = await fetch('/api/site-settings', {
          credentials: 'same-origin', // Use same-origin to ensure cookies are sent and received
          cache: 'no-store', // Disable caching
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal
        });

        // Get the raw response text first for debugging
        responseText = await response.text();
        console.log('Raw API response:', responseText);
      } catch (fetchError) {
        console.error('Error fetching site settings:', fetchError);

        // Try to load settings from localStorage as a fallback
        try {
          const cachedSettings = localStorage.getItem('siteSettings');
          if (cachedSettings) {
            console.log('Fetch failed. Using cached settings from localStorage');
            setSettings(JSON.parse(cachedSettings));
          } else {
            console.log('Fetch failed. No cached settings found, using defaults');
            setSettings(defaultSettings);
          }
        } catch (localStorageError) {
          console.error('Error reading from localStorage:', localStorageError);
          setSettings(defaultSettings);
        }

        setError(`Failed to fetch site settings: ${fetchError.message}. Using fallback settings.`);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMessage;
        try {
          // Only try to parse as JSON if it looks like JSON
          if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || `Failed to fetch settings: ${response.status}`;
          } else {
            errorMessage = `Failed to fetch settings: ${response.status} - ${responseText}`;
          }
        } catch (e) {
          errorMessage = `Failed to fetch settings: ${response.status} - ${responseText}`;
        }
        console.error('Error fetching site settings:', errorMessage);
        // Don't throw, just use default settings
        setSettings(defaultSettings);
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Parse the response text as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Site settings fetched successfully:', Object.keys(data));
      } catch (parseError) {
        console.error('Error parsing site settings JSON:', parseError);
        console.error('Invalid JSON response:', responseText);

        // Try to load settings from localStorage as a fallback
        try {
          const cachedSettings = localStorage.getItem('siteSettings');
          if (cachedSettings) {
            console.log('Using cached settings from localStorage');
            data = JSON.parse(cachedSettings);
          } else {
            console.log('No cached settings found, using defaults');
            data = defaultSettings;
          }
        } catch (localStorageError) {
          console.error('Error reading from localStorage:', localStorageError);
          data = defaultSettings;
        }

        setError(`Failed to parse site settings response: ${parseError.message}. Using fallback settings.`);
      }

      // Parse the socialLinks JSON if it's a string
      if (data.socialLinks && typeof data.socialLinks === 'string') {
        data.socialLinks = JSON.parse(data.socialLinks);
      }

      // Parse the homepageSections JSON if it's a string
      if (data.homepageSections && typeof data.homepageSections === 'string') {
        data.homepageSections = JSON.parse(data.homepageSections);
      } else if (!data.homepageSections) {
        // If no homepage sections, use defaults
        data.homepageSections = DEFAULT_HOMEPAGE_SECTIONS;
      }

      // Initialize header settings if not present
      if (!data.header) {
        data.header = {
          transparent: true,
          menuItems: [
            { text: 'Home', url: '/' },
            { text: 'Shop', url: '/shop' },
            { text: 'Collections', url: '/collections' },
            { text: 'About', url: '/about' },
            { text: 'Contact', url: '/contact' }
          ]
        };
      } else if (typeof data.header === 'string') {
        data.header = JSON.parse(data.header);
      }

      // Initialize footer settings if not present
      if (!data.footer) {
        data.footer = {
          companyDescription: 'Modern, sustainable fashion for everyone. Our unisex boutique offers timeless pieces designed with quality and style in mind.',
          copyrightText: '© {year} Yours. All rights reserved.',
          showSocialLinks: true,
          socialLinks: data.socialLinks || [],
          footerLinks: [
            {
              title: 'Shop',
              links: [
                { text: 'All Products', url: '/shop' },
                { text: 'New Arrivals', url: '/shop/new-arrivals' },
                { text: 'Best Sellers', url: '/shop/best-sellers' },
                { text: 'Sale', url: '/shop/sale' }
              ]
            },
            {
              title: 'Company',
              links: [
                { text: 'About Us', url: '/about' },
                { text: 'Careers', url: '/careers' },
                { text: 'Store Locations', url: '/stores' },
                { text: 'Sustainability', url: '/sustainability' }
              ]
            },
            {
              title: 'Support',
              links: [
                { text: 'Contact Us', url: '/contact' },
                { text: 'FAQs', url: '/faqs' },
                { text: 'Shipping & Returns', url: '/shipping-returns' },
                { text: 'Size Guide', url: '/size-guide' }
              ]
            }
          ],
          showFaq: false,
          faqItems: []
        };
      } else if (typeof data.footer === 'string') {
        data.footer = JSON.parse(data.footer);
      }

      // Initialize FAQ section if not present
      if (!data.faq) {
        data.faq = { items: [], enabled: false };
      }

      setSettings(data);

      // Cache the settings in localStorage for fallback
      try {
        localStorage.setItem('siteSettings', JSON.stringify(data));
        console.log('Settings cached in localStorage');
      } catch (cacheError) {
        console.error('Error caching settings in localStorage:', cacheError);
      }
    } catch (err) {
      console.error('Error fetching site settings:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');

      // Use default settings as fallback
      console.log('Using default settings as fallback');
      setSettings(defaultSettings);
    } finally {
      // Always clear the timeout to prevent memory leaks and unexpected aborts
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsLoading(false);
    }
  };

  // Function to update settings
  const updateSettings = async (newSettings: Partial<SiteSettings>): Promise<void> => {
    if (!settings) return;

    setIsLoading(true);
    setError(null);

    // Store original settings for rollback in case of error
    const originalSettings = { ...settings };

    try {
      console.log('Updating settings with:', Object.keys(newSettings));

      // Merge the new settings with existing settings
      const updatedSettings = {
        ...settings,
        ...newSettings,
        // Ensure FAQ items are preserved when updating other settings
        faq: newSettings.faq || settings.faq || { items: [], enabled: false },
        updatedAt: new Date()
      };

      // Update local state first (optimistic update)
      setSettings(updatedSettings);

      // Get Firebase auth token with priority on getting a fresh token
      const authToken = await getFirebaseToken();

      if (!authToken && process.env.NODE_ENV !== 'development') {
        console.error('No authentication token available. Cannot update settings.');
        throw new Error('Authentication required. Please log in as an admin to update settings.');
      }

      console.log('Authentication token available:', !!authToken);

      // Update the settings in the database
      const response = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest',
          // Include auth token in header
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(updatedSettings),
        credentials: 'include', // Use include to ensure cookies are sent in cross-origin requests
        cache: 'no-store' // Ensure we don't use cached responses
      });

      if (!response.ok) {
        // Try to get more detailed error information
        let errorMessage = 'Failed to update settings';
        let errorDetails = '';

        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
            errorDetails = errorData.details || '';
          }
        } catch (e) {
          // If we can't parse the error response, use the status text
          errorMessage = `Failed to update settings: ${response.status} ${response.statusText}`;
        }

        console.error('Update settings error:', errorMessage, errorDetails);

        // Provide specific error messages based on status code
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in as an admin to update settings.');
        } else if (response.status === 403) {
          throw new Error('Forbidden. You do not have permission to update site settings. Please ensure you have admin privileges.');
        } else if (response.status === 500) {
          throw new Error(`Server error: ${errorMessage}. This might be due to Firebase security rules. Please check your Firebase rules.`);
        } else {
          throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
        }
      }

      // Get the updated settings from the response
      const responseData = await response.json();
      console.log('Settings updated successfully:', Object.keys(responseData));

      // Update local state with the response data
      setSettings(responseData);

      // Cache the settings in localStorage for fallback
      try {
        localStorage.setItem('siteSettings', JSON.stringify(responseData));
        console.log('Settings cached in localStorage');
      } catch (cacheError) {
        console.error('Error caching settings in localStorage:', cacheError);
      }
    } catch (error) {
      console.error('Error updating settings:', error);

      // Revert optimistic update if there was an error
      setSettings(originalSettings);

      // Set error state
      setError(error instanceof Error ? error.message : 'An unknown error occurred');

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch settings on initial load
  useEffect(() => {
    fetchSettings();
  }, []);

  // Function to update a section
  const updateSection = async (sectionId: string, sectionData: Partial<SiteSection>): Promise<void> => {
    if (!settings) {
      console.error('Cannot update section: settings not loaded');
      throw new Error('Settings not loaded. Please refresh the page and try again.');
    }

    try {
      console.log('Updating section:', { sectionId, sectionData });

      // Validate section ID
      const sectionExists = settings.homepageSections.some(section => section.id === sectionId);
      if (!sectionExists) {
        console.error(`Section with ID ${sectionId} not found in current settings`);
        throw new Error(`Section with ID ${sectionId} not found. Please refresh the page and try again.`);
      }

      // Update local state first for immediate feedback
      const updatedSections = settings.homepageSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            ...sectionData
          };
        }
        return section;
      });

      // Create a temporary optimistic update
      const optimisticSettings = {
        ...settings,
        homepageSections: updatedSections
      };

      setSettings(optimisticSettings);

      // Log cookies and headers for debugging
      console.log('Cookies before section update:', document.cookie);

      // Get Firebase auth token
      const authToken = await getFirebaseToken();

      // Send update to API with credentials
      console.log(`Sending API request to update section ${sectionId}:`, sectionData);
      const response = await fetch(`/api/site-settings/section/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest',
          // Include auth token in header
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(sectionData),
        credentials: 'include', // Use include to ensure cookies are sent in cross-origin requests
        cache: 'no-store' // Ensure we don't use cached responses
      });

      console.log('Section update response status:', response.status);

      // Handle error responses
      if (!response.ok) {
        let errorMessage = `Failed to update section: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
            if (errorData.details) {
              errorMessage += `: ${errorData.details}`;
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }

        throw new Error(errorMessage);
      }

      // Parse the successful response
      let updatedSettings;
      try {
        updatedSettings = await response.json();
        console.log('Section updated successfully, received settings:', updatedSettings);

        // Validate the response contains the expected data
        if (!updatedSettings || !updatedSettings.homepageSections) {
          console.error('Invalid response from server - missing homepageSections:', updatedSettings);
          throw new Error('Invalid response from server. Please refresh and try again.');
        }

        // Verify the section was actually updated
        const updatedSection = updatedSettings.homepageSections.find((s: any) => s.id === sectionId);
        if (!updatedSection) {
          console.error('Section not found in updated settings');
          throw new Error('Section update failed. Please refresh and try again.');
        }

        // Update local state with the response
        setSettings(updatedSettings);
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        throw new Error('Error processing server response. Please refresh and try again.');
      }
    } catch (error) {
      console.error('Error updating section:', error);
      // Revert local state on error by refreshing settings
      await fetchSettings();
      throw error;
    }
  };

  // Function to reorder sections
  const reorderSections = async (sectionIds: string[]) => {
    if (!settings) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create a map of sections by ID
      const sectionsMap = new Map(settings.homepageSections.map(section => [section.id, section]));

      // Create new array of sections in the specified order
      const updatedSections = sectionIds.map((id, index) => {
        const section = sectionsMap.get(id);
        if (!section) throw new Error(`Section with ID ${id} not found`);
        return { ...section, order: index + 1 };
      });

      // Update the settings with the new sections
      await updateSettings({ homepageSections: updatedSections });
    } catch (err) {
      console.error('Error reordering sections:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reset sections to defaults
  const resetToDefaults = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Update the settings with the default sections
      await updateSettings({ homepageSections: DEFAULT_HOMEPAGE_SECTIONS });
    } catch (err) {
      console.error('Error resetting sections to defaults:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update header settings
  const updateHeader = async (headerSettings: HeaderSettings) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting header update process');
      console.log('Environment:', process.env.NODE_ENV);

      // Validate and prepare header settings
      const validatedHeaderSettings = {
        transparent: headerSettings.transparent,
        menuItems: headerSettings.menuItems.map(item => ({
          text: item.text,
          url: item.url,
          submenu: Array.isArray(item.submenu) ? item.submenu.map(subitem => ({
            text: subitem.text,
            url: subitem.url
          })) : []
        }))
      };

      // Store original settings for rollback in case of error
      const originalSettings = settings ? { ...settings } : null;

      // Update local state first (optimistic update)
      if (settings) {
        setSettings({
          ...settings,
          header: validatedHeaderSettings
        });
      }

      // Get Firebase auth token
      const authToken = await getFirebaseToken();

      console.log('Updating header with Firebase auth token:', authToken ? 'Present' : 'Missing');
      console.log('Current URL:', window.location.href);

      // Check if user is authenticated by importing auth
      try {
        const { auth } = await import('@/lib/firebase/config');
        console.log('Current user authenticated:', auth?.currentUser ? 'Yes' : 'No');
      } catch (error) {
        console.log('Error checking authentication status:', error);
      }

      // Prepare headers with auth token
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if token exists or in development mode
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('Adding Authorization header with token');
      } else if (process.env.NODE_ENV === 'development') {
        headers['Authorization'] = 'Bearer dev-token';
        console.log('Adding development Authorization header');
      } else {
        console.warn('No auth token available for API request');
      }

      // Send to API
      console.log('Sending header update request with data:', validatedHeaderSettings);
      const response = await fetch('/api/site-settings/header', {
        method: 'PUT',
        headers,
        body: JSON.stringify(validatedHeaderSettings),
        credentials: 'include', // Use include to ensure cookies are sent
        cache: 'no-store' // Ensure we don't use cached responses
      });

      // Log response status
      console.log('Response status:', response.status, response.statusText);

      // Check if the response is OK before proceeding
      if (!response.ok) {
        // Try to get more detailed error information
        let errorMessage = `Failed to update header settings: ${response.status}`;
        let errorDetails = '';

        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);

          if (errorData.error) {
            errorMessage = errorData.error;
            errorDetails = errorData.details || '';
          }
        } catch (e) {
          // If we can't parse the error response, use the status text
          console.error('Error parsing error response:', e);
          errorMessage = `Failed to update header settings: ${response.status} ${response.statusText}`;
        }

        // If it's an authentication error, provide a more helpful message
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in as an admin to update settings.');
        } else if (response.status === 403) {
          throw new Error('Forbidden. Admin access required. Please ensure your account has admin privileges.');
        } else {
          throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
        }
      }

      // Parse the response data
      let responseData;
      try {
        responseData = await response.json();
        console.log('Header update successful, received data:', Object.keys(responseData));
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        throw new Error('Error processing server response. The update may have succeeded but the response was invalid.');
      }

      // Refresh settings to ensure we have the latest data
      try {
        await fetchSettings();
        console.log('Settings refreshed after header update');
      } catch (refreshError) {
        console.error('Error refreshing settings after update:', refreshError);
        // Don't throw here, the update was successful even if refresh failed
      }

      return responseData; // Return the response data for success handling
    } catch (err) {
      console.error('Error updating header settings:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');

      // Revert local state on error
      if (settings) {
        setSettings(settings);
      }

      // Re-throw the error so the caller can handle it
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update footer settings
  const updateFooter = async (footerSettings: FooterSettings): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting footer update process');

      // Store original settings for rollback in case of error
      const originalSettings = settings ? { ...settings } : null;

      // Update local state first (optimistic update)
      if (settings) {
        setSettings({
          ...settings,
          footer: footerSettings
        });
      }

      // Get Firebase auth token
      const authToken = await getFirebaseToken();

      // Prepare headers with auth token
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if token exists or in development mode
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('Adding Authorization header with token');
      } else if (process.env.NODE_ENV === 'development') {
        headers['Authorization'] = 'Bearer dev-token';
        console.log('Adding development Authorization header');
      } else {
        console.warn('No auth token available for API request');
      }

      // Send to API
      console.log('Sending footer update request');
      const response = await fetch('/api/site-settings/footer', {
        method: 'PUT',
        headers,
        body: JSON.stringify(footerSettings),
        credentials: 'include', // Use include to ensure cookies are sent
        cache: 'no-store' // Ensure we don't use cached responses
      });

      // Log response status
      console.log('Response status:', response.status, response.statusText);

      // Check if the response is OK before proceeding
      if (!response.ok) {
        // Try to get more detailed error information
        let errorMessage = `Failed to update footer settings: ${response.status}`;
        let errorDetails = '';

        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);

          if (errorData.error) {
            errorMessage = errorData.error;
            errorDetails = errorData.details || '';
          }
        } catch (e) {
          // If we can't parse the error response, use the status text
          console.error('Error parsing error response:', e);
          errorMessage = `Failed to update footer settings: ${response.status} ${response.statusText}`;
        }

        // If it's an authentication error, provide a more helpful message
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in as an admin to update settings.');
        } else if (response.status === 403) {
          throw new Error('Forbidden. Admin access required. Please ensure your account has admin privileges.');
        } else {
          throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
        }
      }

      // Parse the response data
      let responseData;
      try {
        responseData = await response.json();
        console.log('Footer update successful, received data:', Object.keys(responseData));
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        throw new Error('Error processing server response. The update may have succeeded but the response was invalid.');
      }

      // Refresh settings to ensure we have the latest data
      try {
        await fetchSettings();
        console.log('Settings refreshed after footer update');
      } catch (refreshError) {
        console.error('Error refreshing settings after update:', refreshError);
        // Don't throw here, the update was successful even if refresh failed
      }

      return responseData; // Return the response data for success handling
    } catch (err) {
      console.error('Error updating footer settings:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');

      // Revert local state on error
      if (settings) {
        setSettings(settings);
      }

      // Re-throw the error so the caller can handle it
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a new section
  const addSection = async (sectionType: string) => {
    if (!settings) return;

    setIsLoading(true);
    setError(null);

    try {
      // Find the default section template
      const defaultSection = DEFAULT_HOMEPAGE_SECTIONS.find(s => s.type === sectionType);
      if (!defaultSection) {
        throw new Error(`Invalid section type: ${sectionType}`);
      }

      // Create a new section based on the default template
      const newSection: SiteSection = {
        ...defaultSection,
        id: `${sectionType}-${Date.now()}`,
        order: settings.homepageSections.length + 1,
        enabled: true
      };

      // Add the new section to the list
      const updatedSections = [...settings.homepageSections, newSection];

      // Update the settings with the new sections
      await updateSettings({ homepageSections: updatedSections });
    } catch (err) {
      console.error('Error adding section:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create the context value
  const contextValue: SiteSettingsContextType = {
    settings,
    isLoading,
    error,
    updateSettings,
    refreshSettings: fetchSettings,
    updateSection,
    reorderSections,
    resetToDefaults,
    updateHeader,
    updateFooter,
    addSection
  };

  return (
    <SiteSettingsContext.Provider value={contextValue}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

// Custom hook to use the site settings context
export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);

  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }

  return context;
}
