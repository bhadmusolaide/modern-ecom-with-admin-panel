import { db } from '../admin';
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  collection, getDocs, query, limit
} from 'firebase/firestore';

// Collection reference
const SETTINGS_COLLECTION = 'siteSettings';
const DEFAULT_SETTINGS_ID = 'default';

interface HomepageSection {
  id: string;
  type: string;
  title?: string;
  content?: string;
  [key: string]: any;
}

interface SiteSettings {
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
  paymentMethods: Array<{ id: string; name: string; enabled: boolean }> | null;
  stripeEnabled: boolean;
  stripePublicKey: string | null;
  stripeSecretKey: string | null;
  paypalEnabled: boolean;
  paypalClientId: string | null;
  paypalSecretKey: string | null;

  // Shipping settings
  shippingMethods: Array<{ id: string; name: string; price: number; enabled: boolean }> | null;
  freeShippingThreshold: number | null;
  taxRate: number;
  taxIncluded: boolean;
  shippingCountries: string[] | null;

  // Header and Footer settings
  header: any | null;
  footer: any | null;

  // FAQ settings
  faqItems: Array<{ question: string; answer: string }> | null;
  faqEnabled: boolean;

  // Homepage sections
  homepageSections?: HomepageSection[];

  createdAt: Date;
  updatedAt: Date;
}

// Convert Firestore data to SiteSettings
const convertToSiteSettings = (id: string, data: any): SiteSettings => {
  return {
    id,
    siteName: data.siteName || 'Yours Ecommerce',
    siteTagline: data.siteTagline || null,
    logoUrl: data.logoUrl || null,
    faviconUrl: data.faviconUrl || null,
    primaryColor: data.primaryColor || '#3b82f6',
    secondaryColor: data.secondaryColor || '#10b981',
    accentColor: data.accentColor || '#f59e0b',
    fontPrimary: data.fontPrimary || 'Inter',
    fontSecondary: data.fontSecondary || 'Playfair Display',
    footerText: data.footerText || null,
    socialLinks: data.socialLinks || null,
    metaTitle: data.metaTitle || null,
    metaDescription: data.metaDescription || null,
    currencyCode: data.currencyCode || 'USD',
    currencySymbol: data.currencySymbol || '$',
    paymentMethods: data.paymentMethods || null,
    stripeEnabled: data.stripeEnabled || false,
    stripePublicKey: data.stripePublicKey || null,
    stripeSecretKey: data.stripeSecretKey || null,
    paypalEnabled: data.paypalEnabled || false,
    paypalClientId: data.paypalClientId || null,
    paypalSecretKey: data.paypalSecretKey || null,
    shippingMethods: data.shippingMethods || null,
    freeShippingThreshold: data.freeShippingThreshold || null,
    taxRate: data.taxRate || 0,
    taxIncluded: data.taxIncluded || false,
    shippingCountries: data.shippingCountries || null,
    header: data.header || null,
    footer: data.footer || null,
    faqItems: data.faqItems || null,
    faqEnabled: data.faqEnabled || false,
    homepageSections: data.homepageSections || null,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

// Get site settings
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    console.log('getSiteSettings: Attempting to fetch settings from Firestore');

    // Check if db is initialized
    if (!db || typeof db.collection !== 'function') {
      console.error('getSiteSettings: Firestore db is not properly initialized');
      return null;
    }

    const settingsDoc = await db.collection('siteSettings').doc('default').get();

    console.log('getSiteSettings: Document exists?', settingsDoc.exists);

    if (!settingsDoc.exists) {
      console.log('getSiteSettings: No settings document found');
      return null;
    }

    // Get the data and log it
    const data = settingsDoc.data();
    console.log('getSiteSettings: Raw data keys:', Object.keys(data || {}));

    // Create the settings object
    const settings = { id: settingsDoc.id, ...data } as SiteSettings;

    // Log the final settings object
    console.log('getSiteSettings: Returning settings with keys:', Object.keys(settings));

    return settings;
  } catch (error) {
    console.error('Error getting site settings:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error');
    return null;
  }
}

// Create default site settings
export const createDefaultSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const defaultSettings = {
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
      socialLinks: [
        { platform: 'facebook', url: 'https://facebook.com' },
        { platform: 'instagram', url: 'https://instagram.com' },
        { platform: 'twitter', url: 'https://twitter.com' },
      ],
      metaTitle: 'Yours - Modern Unisex Boutique',
      metaDescription: 'Discover our collection of timeless, sustainable unisex fashion pieces designed for everyone.',
      currencyCode: 'USD',
      currencySymbol: '$',
      paymentMethods: [
        { id: 'credit-card', name: 'Credit Card', enabled: true },
        { id: 'paypal', name: 'PayPal', enabled: false },
        { id: 'bank-transfer', name: 'Bank Transfer', enabled: false },
      ],
      stripeEnabled: false,
      stripePublicKey: '',
      stripeSecretKey: '',
      paypalEnabled: false,
      paypalClientId: '',
      paypalSecretKey: '',
      shippingMethods: [
        { id: 'standard', name: 'Standard Shipping', price: 5.99, enabled: true },
        { id: 'express', name: 'Express Shipping', price: 14.99, enabled: true },
        { id: 'overnight', name: 'Overnight Shipping', price: 29.99, enabled: false },
      ],
      freeShippingThreshold: 100,
      taxRate: 0,
      taxIncluded: false,
      shippingCountries: ['US', 'CA', 'GB', 'AU'],
      header: null,
      footer: null,
      faqItems: [],
      faqEnabled: false,
      homepageSections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('siteSettings').doc('default').set(defaultSettings, { merge: true });

    return {
      id: DEFAULT_SETTINGS_ID,
      ...defaultSettings,
    };
  } catch (error) {
    console.error('Error creating default site settings:', error);
    throw error;
  }
};

// Update site settings
export async function updateSiteSettings(data: Partial<SiteSettings>): Promise<boolean> {
  try {
    await db.collection('siteSettings').doc('default').set(data, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating site settings:', error);
    return false;
  }
}

export async function updateSiteSettingsSection(sectionId: string, data: Partial<HomepageSection>): Promise<boolean> {
  try {
    const settings = await getSiteSettings();
    if (!settings) {
      return false;
    }

    const sections = settings.homepageSections || [];
    const sectionIndex = sections.findIndex((section) => section.id === sectionId);

    if (sectionIndex === -1) {
      return false;
    }

    sections[sectionIndex] = { ...sections[sectionIndex], ...data };
    await updateSiteSettings({ homepageSections: sections });

    return true;
  } catch (error) {
    console.error('Error updating site settings section:', error);
    return false;
  }
}
