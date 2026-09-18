'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCartStorageKey } from '@/lib/config';

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  qty: number;
  stock: number;
  unit?: string;
}

interface StoredCart {
  items: CartItem[];
  updatedAt: number;
}

const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari TTL

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // P1-O: Load from localStorage on mount with 30-day TTL check
  useEffect(() => {
    try {
      const storageKey = getCartStorageKey();
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Legacy format migration
          setItems(parsed);
        } else if (parsed && Array.isArray(parsed.items)) {
          const isExpired = Date.now() - (parsed.updatedAt || 0) > CART_TTL_MS;
          if (isExpired) {
            localStorage.removeItem(storageKey);
            setItems([]);
          } else {
            setItems(parsed.items);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // P1-O: Save to localStorage on change with timestamp
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const storageKey = getCartStorageKey();
      const payload: StoredCart = {
        items,
        updatedAt: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save cart to storage', e);
    }
  }, [items, isLoaded]);

  // P1-O: Refresh stock and prices against server
  const refreshCart = async () => {
    if (items.length === 0) return;
    try {
      const res = await fetch('/api/validate-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.id, id: i.id, qty: i.qty })),
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setItems((prev) => {
          const validatedMap = new Map(data.items.map((vi: { productId: string; reason?: string; availableStock?: number; product?: { price?: number; name?: string } }) => [vi.productId, vi]));
          const nextItems: CartItem[] = [];

          for (const item of prev) {
            const vi = validatedMap.get(item.id) as { reason?: string; availableStock?: number; product?: { price?: number; name?: string } } | undefined;
            if (!vi) {
              nextItems.push(item);
              continue;
            }
            if (vi.reason === 'Produk tidak tersedia atau telah dihapus.') {
              continue;
            }
            const updatedProduct = vi.product || {};
            const newStock = typeof vi.availableStock === 'number' ? vi.availableStock : item.stock;
            if (newStock <= 0) {
              continue;
            }
            nextItems.push({
              ...item,
              price: typeof updatedProduct.price === 'number' ? updatedProduct.price : item.price,
              name: updatedProduct.name || item.name,
              stock: newStock,
              qty: Math.min(newStock, item.qty),
            });
          }
          return nextItems;
        });
      }
    } catch (e) {
      console.error('Failed to refresh cart', e);
    }
  };

  // P1-O: Remove direct object mutation on line 66, use immutable update
  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === newItem.id);
      if (existingIdx > -1) {
        return prev.map((item, idx) => {
          if (idx === existingIdx) {
            const currentQty = item.qty;
            const maxStock = item.stock;
            return {
              ...item,
              qty: Math.min(maxStock, currentQty + newItem.qty),
            };
          }
          return item;
        });
      } else {
        return [...prev, newItem];
      }
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            qty: Math.min(item.stock, Math.max(1, qty)),
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        refreshCart,
        totalItems,
        totalPrice,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
