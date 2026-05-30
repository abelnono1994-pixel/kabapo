'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';

type UserProfile = {
  role: 'client' | 'shop_admin' | 'admin' | 'superadmin';
  shopId?: string;
};

type Shop = {
  id: string;
  name: string;
  ownerId: string;
  subscriptionPlan: 'basic' | 'premium' | 'pro' | 'none';
  status: 'active' | 'suspended' | 'pending_setup';
  createdAt: any;
  imageUrl?: string;
  phone?: string;
  averageRating?: number;
  reviewCount?: number;
}

interface ShopContextType {
  shop: Shop | null;
  isLoading: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider = ({
  children,
  user,
  userProfile,
}: {
  children: ReactNode;
  user: AuthUser | null;
  userProfile: UserProfile | null;
}) => {
  const firestore = useFirestore();

  const shopDocRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.shopId) return null;
    return doc(firestore, 'shops', userProfile.shopId);
  }, [firestore, userProfile?.shopId]);

  const { data: shop, isLoading } = useDoc<Shop>(shopDocRef);

  const value = { shop, isLoading };

  return React.createElement(ShopContext.Provider, { value }, children);
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
