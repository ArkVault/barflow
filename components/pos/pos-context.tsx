'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import {
     Section,
     TableItem,
     BarItem,
     Account,
     AccountItem,
     Product,
     Sale,
     SelectedItem,
     Status,
     AccountStatus,
} from './types';
import { useLayoutManager } from './hooks/use-layout-manager';
import { useAccountManager } from './hooks/use-account-manager';
import { useOrderManager } from './hooks/use-order-manager';

// Context interface following Interface Segregation Principle
interface POSContextValue {
     // Layout state
     sections: Section[];
     setSections: React.Dispatch<React.SetStateAction<Section[]>>;
     selectedItem: SelectedItem | null;
     setSelectedItem: React.Dispatch<React.SetStateAction<SelectedItem | null>>;

     // Products
     products: Product[];
     categories: string[];
     loadingProducts: boolean;

     // Orders
     currentOrder: AccountItem[];
     setCurrentOrder: React.Dispatch<React.SetStateAction<AccountItem[]>>;
     selectedTableForOrder: string | null;
     setSelectedTableForOrder: React.Dispatch<React.SetStateAction<string | null>>;
     productQuantities: Record<string, number>;
     setProductQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;

     // Sales history
     sales: Sale[];
     loadingSales: boolean;
     refreshSales: () => Promise<void>;

     // Actions
     loadLayout: () => Promise<void>;
     saveLayout: (sectionsToSave: Section[]) => Promise<void>;
     openNewAccount: (sectionId: string, itemId: string, type: 'table' | 'bar') => void;
     closeAccount: (sectionId: string, itemId: string, accountId: string, type: 'table' | 'bar') => Promise<void>;
     cancelAccount: (sectionId: string, itemId: string, accountId: string, type: 'table' | 'bar') => void;
     removeItemFromAccount: (sectionId: string, itemId: string, accountId: string, itemToRemoveId: string, type: 'table' | 'bar') => void;
     sendOrderToTable: () => Promise<void>;

     // Helpers
     getCurrentAccount: () => Account | null;
     getAllTablesAndBars: () => Array<{ id: string; name: string; type: 'table' | 'bar'; sectionId: string; status: Status }>;
     getElapsedTime: (openedAt: Date) => string;

     // Active tab for cross-tab navigation
     activeTab: 'mesas' | 'comandas' | 'historial';
     setActiveTab: React.Dispatch<React.SetStateAction<'mesas' | 'comandas' | 'historial'>>;
}

const POSContext = createContext<POSContextValue | undefined>(undefined);

export function usePOS() {
     const context = useContext(POSContext);
     if (!context) {
          throw new Error('usePOS must be used within a POSProvider');
     }
     return context;
}

interface POSProviderProps {
     children: ReactNode;
}

export function POSProvider({ children }: POSProviderProps) {
     const { establishmentId } = useAuth();

     // Active tab state
     const [activeTab, setActiveTab] = useState<'mesas' | 'comandas' | 'historial'>('mesas');

     // Layout management (load/save from Supabase)
     const { sections, setSections, loadLayout, saveLayout } = useLayoutManager();

     const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

     // Products state
     const [products, setProducts] = useState<Product[]>([]);
     const [categories, setCategories] = useState<string[]>([]);
     const [loadingProducts, setLoadingProducts] = useState(true);

     // Sales state
     const [sales, setSales] = useState<Sale[]>([]);
     const [loadingSales, setLoadingSales] = useState(false);

     // Load products from active menus
     useEffect(() => {
          if (establishmentId) {
               fetchProducts();
          }
     }, [establishmentId]);

     // Load layout on mount
     useEffect(() => {
          if (establishmentId) {
               loadLayout();
          }
     }, [establishmentId]);

     const fetchProducts = async () => {
          if (!establishmentId) return;

          setLoadingProducts(true);
          try {
               const supabase = createClient();

               // Get active menus (primary and secondary)
               const { data: activeMenus } = await supabase
                    .from('menus')
                    .select('id')
                    .eq('establishment_id', establishmentId)
                    .or('is_active.eq.true,is_secondary_active.eq.true');

               if (!activeMenus || activeMenus.length === 0) {
                    setProducts([]);
                    setCategories(['Todos']);
                    setLoadingProducts(false);
                    return;
               }

               const menuIds = activeMenus.map(m => m.id);

               // Get products from active menus
               const { data: productsData } = await supabase
                    .from('products')
                    .select('id, name, price, category, menu_id, image_url')
                    .in('menu_id', menuIds)
                    .eq('is_active', true)
                    .order('category', { ascending: true });

               if (productsData) {
                    setProducts(productsData);
                    const uniqueCategories = ['Todos', ...new Set(productsData.map(p => p.category))];
                    setCategories(uniqueCategories);
               }
          } catch (error) {
               console.error('Error fetching products:', error);
          } finally {
               setLoadingProducts(false);
          }
     };

     const refreshSales = useCallback(async () => {
          if (!establishmentId) return;

          setLoadingSales(true);
          try {
               const supabase = createClient();
               const { data, error } = await supabase
                    .from('sales')
                    .select('*')
                    .eq('establishment_id', establishmentId)
                    .order('created_at', { ascending: false });

               if (!error && data) {
                    setSales(data);
               }
          } catch (error) {
               console.error('Error fetching sales:', error);
          } finally {
               setLoadingSales(false);
          }
     }, [establishmentId]);

     // Account management (open/close/cancel)
     const {
          openNewAccount,
          closeAccount,
          cancelAccount,
          removeItemFromAccount,
     } = useAccountManager({
          establishmentId,
          sections,
          setSections,
          refreshSales,
     });

     // Order management (send orders to tables)
     const {
          currentOrder,
          setCurrentOrder,
          selectedTableForOrder,
          setSelectedTableForOrder,
          productQuantities,
          setProductQuantities,
          sendOrderToTable,
     } = useOrderManager({
          setSections,
          saveLayout,
     });

     const getCurrentAccount = useCallback((): Account | null => {
          if (!selectedItem) return null;

          for (const section of sections) {
               if (section.id === selectedItem.sectionId) {
                    const items = selectedItem.type === 'table' ? section.tables : section.bars;
                    const item = items.find(i => i.id === selectedItem.itemId);
                    if (item && item.currentAccountId) {
                         return item.accounts.find(a => a.id === item.currentAccountId) || null;
                    }
               }
          }
          return null;
     }, [selectedItem, sections]);

     const getAllTablesAndBars = useCallback(() => {
          const result: Array<{ id: string; name: string; type: 'table' | 'bar'; sectionId: string; status: Status }> = [];

          sections.forEach(section => {
               section.tables.forEach(table => {
                    result.push({
                         id: `${section.id}|${table.id}|table`,
                         name: table.name,
                         type: 'table',
                         sectionId: section.id,
                         status: table.status,
                    });
               });

               section.bars.forEach(bar => {
                    result.push({
                         id: `${section.id}|${bar.id}|bar`,
                         name: bar.name,
                         type: 'bar',
                         sectionId: section.id,
                         status: bar.status,
                    });
               });
          });

          return result;
     }, [sections]);

     const getElapsedTime = useCallback((openedAt: Date): string => {
          const diff = Date.now() - new Date(openedAt).getTime();
          const minutes = Math.floor(diff / 60000);
          const hours = Math.floor(minutes / 60);

          if (hours > 0) return `${hours}h ${minutes % 60}m`;
          return `${minutes}m`;
     }, []);

     const value: POSContextValue = {
          sections,
          setSections,
          selectedItem,
          setSelectedItem,
          products,
          categories,
          loadingProducts,
          currentOrder,
          setCurrentOrder,
          selectedTableForOrder,
          setSelectedTableForOrder,
          productQuantities,
          setProductQuantities,
          sales,
          loadingSales,
          refreshSales,
          loadLayout,
          saveLayout,
          openNewAccount,
          closeAccount,
          cancelAccount,
          removeItemFromAccount,
          sendOrderToTable,
          getCurrentAccount,
          getAllTablesAndBars,
          getElapsedTime,
          activeTab,
          setActiveTab,
     };

     return (
          <POSContext.Provider value={value}>
               {children}
          </POSContext.Provider>
     );
}
