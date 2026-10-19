'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { IProduct } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

interface CompareContextType {
  comparedProducts: IProduct[];
  addToCompare: (product: IProduct) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const COMPARE_STORAGE_KEY = 'mentoos_compare_products';

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [comparedProducts, setComparedProducts] = useState<IProduct[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (saved) {
        setComparedProducts(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not load compare list:', e);
    }
  }, []);

  const saveList = (list: IProduct[]) => {
    setComparedProducts(list);
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Could not save compare list:', e);
    }
  };

  const addToCompare = (product: IProduct) => {
    if (comparedProducts.some((p) => p._id === product._id)) {
      toast({
        title: 'Already in Compare',
        description: `"${product.name}" is already in your comparison list.`,
      });
      return;
    }

    if (comparedProducts.length >= 3) {
      toast({
        title: 'Comparison Limit Reached',
        description: 'You can compare up to 3 products at a time.',
        variant: 'destructive',
      });
      return;
    }

    const updated = [...comparedProducts, product];
    saveList(updated);
    toast({
      title: 'Added to Compare',
      description: `"${product.name}" added to comparison (${updated.length}/3).`,
    });
  };

  const removeFromCompare = (productId: string) => {
    const updated = comparedProducts.filter((p) => p._id !== productId);
    saveList(updated);
  };

  const clearCompare = () => {
    saveList([]);
    setIsCompareOpen(false);
  };

  const isInCompare = (productId: string) => {
    return comparedProducts.some((p) => p._id === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        comparedProducts,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        isCompareOpen,
        setIsCompareOpen,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
