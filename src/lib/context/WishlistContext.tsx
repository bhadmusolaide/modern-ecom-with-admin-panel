"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/lib/context/ToastContext";
import type { ToastType } from "@/lib/context/ToastContext";
import { useFirebaseAuth } from "@/lib/firebase/auth/FirebaseAuthProvider";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface WishlistContextType {
  items: string[]; // product ID strings
  isLoading: boolean;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useFirebaseAuth();
  const { showToast } = useToast();
  const isHydrated = useRef(false);
  const [pendingToast, setPendingToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Load from localStorage first
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wishlist");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {

    } finally {
      setIsLoading(false);
      isHydrated.current = true;
    }
  }, []);

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (!isHydrated.current) return;
    try {
      localStorage.setItem("wishlist", JSON.stringify(items));
    } catch (e) {

    }
  }, [items]);

  // Optionally sync with Firestore when logged in
  useEffect(() => {
    const syncFromRemote = async () => {
      if (!user) return;
      try {
        const ref = doc(db, "users", user.id, "private", "wishlist");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const remoteItems: string[] = Array.isArray(snap.data().items) ? snap.data().items : [];
          // Merge local + remote (union)
          setItems(prev => Array.from(new Set([...(prev || []), ...remoteItems])));
        } else {
          // Ensure doc exists with current local state
          await setDoc(ref, { items, updatedAt: serverTimestamp() }, { merge: true });
        }
      } catch (e) {

      }
    };

    syncFromRemote();
    // Intentionally not including `items` to avoid write loop on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Push local changes to Firestore when logged in
  useEffect(() => {
    const pushToRemote = async () => {
      if (!user) return;
      try {
        const ref = doc(db, "users", user.id, "private", "wishlist");
        await setDoc(ref, { items, updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) {

      }
    };
    pushToRemote();
  }, [items, user]);

  // Show toast messages after state updates
  useEffect(() => {
    if (pendingToast) {
      showToast(pendingToast.message, pendingToast.type);
      setPendingToast(null);
    }
  }, [pendingToast, showToast]);

  const isInWishlist = useMemo(() => (productId: string) => items.includes(productId), [items]);

  const addToWishlist = (productId: string) => {
    setItems(prev => {
      if (prev.includes(productId)) return prev;
      const next = [...prev, productId];
      setPendingToast({ message: "Added to wishlist", type: "success" });
      return next;
    });
  };

  const removeFromWishlist = (productId: string) => {
    setItems(prev => {
      if (!prev.includes(productId)) return prev;
      const next = prev.filter(id => id !== productId);
      setPendingToast({ message: "Removed from wishlist", type: "info" });
      return next;
    });
  };

  const toggleWishlist = (productId: string) => {
    setItems(prev => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter(id => id !== productId) : [...prev, productId];
      setPendingToast({ message: exists ? "Removed from wishlist" : "Added to wishlist", type: exists ? "info" : "success" });
      return next;
    });
  };

  const value: WishlistContextType = {
    items,
    isLoading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}

