'use client';

import React, { useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useSiteSettings } from './SiteSettingsContext';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSiteSettings();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can access the DOM
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!settings || !mounted) return;

    // Update CSS variables
    const root = document.documentElement;

    // Set color variables
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--secondary-color', settings.secondaryColor);
    root.style.setProperty('--accent-color', settings.accentColor);

    // Set font variables
    root.style.setProperty('--font-primary', settings.fontPrimary);
    root.style.setProperty('--font-secondary', settings.fontSecondary);

    // Apply fonts to document
    document.body.style.fontFamily = settings.fontPrimary;
    document.body.style.setProperty('--font-heading', settings.fontSecondary);

    // Update Tailwind classes
    const updateTailwindClasses = () => {
      // Remove existing theme classes
      document.body.classList.remove('theme-light', 'theme-dark');

      // Update color classes
      const colorClasses = [
        'text-primary',
        'bg-primary',
        'border-primary',
        'text-secondary',
        'bg-secondary',
        'border-secondary',
        'text-accent',
        'bg-accent',
        'border-accent'
      ];

      colorClasses.forEach(className => {
        document.body.classList.remove(className);
      });
    };

    updateTailwindClasses();
  }, [settings, mounted]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      enableColorScheme={false} // Prevents color-scheme style attribute
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}