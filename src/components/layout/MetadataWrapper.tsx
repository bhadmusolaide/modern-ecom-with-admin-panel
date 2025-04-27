'use client';

import { useState, useEffect } from "react";
import { useSiteSettings } from "@/lib/context/SiteSettingsContext";

export function MetadataWrapper({ children }: { children: React.ReactNode }) {
  const { settings } = useSiteSettings();
  const [title, setTitle] = useState<string>("OMJ - Modern Unisex Boutique");
  const [description, setDescription] = useState<string>("Discover our collection of timeless, sustainable unisex fashion pieces designed for everyone.");

  useEffect(() => {
    // Update metadata when settings are loaded
    if (settings) {
      // Use site settings values or fallbacks
      const siteTitle = settings.metaTitle || settings.siteName || "OMJ";
      const siteDescription = settings.metaDescription || "Discover our collection of timeless, sustainable unisex fashion pieces designed for everyone.";

      // Update document title
      document.title = siteTitle;

      // Update meta description
      const metaDescTag = document.querySelector('meta[name="description"]');
      if (metaDescTag) {
        metaDescTag.setAttribute('content', siteDescription);
      } else {
        const newMetaTag = document.createElement('meta');
        newMetaTag.name = 'description';
        newMetaTag.content = siteDescription;
        document.head.appendChild(newMetaTag);
      }

      // Update state
      setTitle(siteTitle);
      setDescription(siteDescription);

      // Update favicon if available
      if (settings.faviconUrl) {
        const faviconLink = document.querySelector('link[rel="icon"]');
        if (faviconLink) {
          faviconLink.setAttribute('href', settings.faviconUrl);
        } else {
          const newFaviconLink = document.createElement('link');
          newFaviconLink.rel = 'icon';
          newFaviconLink.href = settings.faviconUrl;
          document.head.appendChild(newFaviconLink);
        }
      }
    }
  }, [settings]);

  return children;
}
