'use client';

import React from 'react';
import { ToastProvider } from "@/lib/context/ToastContext";
import { SiteSettingsProvider } from "@/lib/context/SiteSettingsContext";
import { FirebaseAuthProvider } from "@/lib/firebase/auth/FirebaseAuthProvider";
import { CartProvider } from "@/lib/context/CartContext";
import { ThemeProvider } from "@/lib/context/ThemeProvider";
import { MetadataWrapper } from "@/components/layout/MetadataWrapper";
import { HeaderWrapper } from "@/components/layout/Header";
import { FooterWrapper } from "@/components/layout/Footer";
import PageWrapper from "@/components/layout/PageWrapper";
import ErrorBoundary from '@/components/ErrorBoundary';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <FirebaseAuthProvider>
          <SiteSettingsProvider>
            <CartProvider>
              <ThemeProvider>
                <MetadataWrapper>
                  <HeaderWrapper />
                  <main>
                    <PageWrapper>
                      {children}
                    </PageWrapper>
                  </main>
                  <FooterWrapper />
                </MetadataWrapper>
              </ThemeProvider>
            </CartProvider>
          </SiteSettingsProvider>
        </FirebaseAuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}