import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import ClientWrapper from "@/components/layout/ClientWrapper";
import { FirebaseAuthProvider } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { ToastProvider } from '@/lib/context/ToastContext';
import { ActivityProvider } from '@/lib/context/ActivityContext';
import AdminImpersonationBanner from '@/components/admin/AdminImpersonationBanner';

// Initialize server-side utilities
import "@/lib/server-init";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable} h-full`}>
      <body className={`${inter.className} h-full`}>
        <ToastProvider>
          <FirebaseAuthProvider>
            <ActivityProvider>
              <AdminImpersonationBanner />
              <ClientWrapper>
                {children}
              </ClientWrapper>
            </ActivityProvider>
          </FirebaseAuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
