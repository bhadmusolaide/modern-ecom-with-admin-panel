import { Inter, Playfair_Display } from "next/font/google";
import { ToastProvider } from "@/lib/context/ToastContext";
import { FirebaseAuthProvider } from "@/lib/firebase/auth/FirebaseAuthProvider";
import type { Metadata } from "next";

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

export const metadata: Metadata = {
  title: "Authentication - Yours Ecommerce",
  description: "Sign in or create an account for Yours Ecommerce",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`min-h-screen ${inter.variable} ${playfairDisplay.variable}`}>
      <ToastProvider>
        <FirebaseAuthProvider>
          {children}
        </FirebaseAuthProvider>
      </ToastProvider>
    </div>
  );
}
