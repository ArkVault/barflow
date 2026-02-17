'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
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

     // Layout state
     const [sections, setSections] = useState<Section[]>([
          {
               id: '1',
               name: 'Sección 1',
               x: 50,
               y: 50,
               width: 600,
               height: 450,
               tables: [
                    { id: 'table-1', name: 'Mesa 1', x: 50, y: 50, status: 'libre', accounts: [], currentAccountId: undefined },
                    { id: 'table-2', name: 'Mesa 2', x: 200, y: 50, status: 'libre', accounts: [], currentAccountId: undefined },
                    { id: 'table-3', name: 'Mesa 3', x: 350, y: 50, status: 'libre', accounts: [], currentAccountId: undefined },
                    { id: 'table-4', name: 'Mesa 4', x: 50, y: 180, status: 'libre', accounts: [], currentAccountId: undefined },
                    { id: 'table-5', name: 'Mesa 5', x: 200, y: 180, status: 'libre', accounts: [], currentAccountId: undefined },
                    { id: 'table-6', name: 'Mesa 6', x: 350, y: 180, status: 'libre', accounts: [], currentAccountId: undefined },
               ],
               bars: [
                    { id: 'bar-1', name: 'Barra 1', x: 150, y: 320, status: 'libre', accounts: [], currentAccountId: undefined, orientation: 'horizontal' },
               ],
          },
     ]);

     const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

     // Products state
     const [products, setProducts] = useState<Product[]>([]);
     const [categories, setCategories] = useState<string[]>([]);
     const [loadingProducts, setLoadingProducts] = useState(true);

     // Orders state
     const [currentOrder, setCurrentOrder] = useState<AccountItem[]>([]);
     const [selectedTableForOrder, setSelectedTableForOrder] = useState<string | null>(null);
     const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});

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

     const loadLayout = useCallback(async () => {
          try {
               const supabase = createClient();
               const { data: { user } } = await supabase.auth.getUser();

               if (!user) return;

               const { data, error } = await supabase
                    .from('operations_layout')
                    .select('sections, table_counter')
                    .eq('user_id', user.id)
                    .single();

               if (error && error.code !== 'PGRST116') {
                    console.error('Error loading layout:', error.message);
                    return;
               }

               if (data?.sections) {
                    const parsedSections = data.sections.map((section: any) => ({
                         ...section,
                         tables: section.tables.map((table: any) => ({
                              ...table,
                              accounts: (table.accounts || []).map((acc: any) => ({
                                   ...acc,
                                   openedAt: new Date(acc.openedAt),
                                   closedAt: acc.closedAt ? new Date(acc.closedAt) : undefined,
                                   items: (acc.items || []).map((item: any) => ({
                                        ...item,
                                        timestamp: new Date(item.timestamp),
                                   })),
                              })),
                         })),
                         bars: section.bars.map((bar: any) => ({
                              ...bar,
                              accounts: (bar.accounts || []).map((acc: any) => ({
                                   ...acc,
                                   openedAt: new Date(acc.openedAt),
                                   closedAt: acc.closedAt ? new Date(acc.closedAt) : undefined,
                                   items: (acc.items || []).map((item: any) => ({
                                        ...item,
                                        timestamp: new Date(item.timestamp),
                                   })),
                              })),
                         })),
                    }));
                    setSections(parsedSections);
               }
          } catch (error) {
               console.error('Error loading layout:', error);
          }
     }, []);

     const saveLayout = useCallback(async (sectionsToSave: Section[]) => {
          try {
               const supabase = createClient();
               const { data: { user } } = await supabase.auth.getUser();

               if (!user || sectionsToSave.length === 0) return;

               // Serialize sections to ensure dates are ISO strings for Supabase
               const serializedSections = sectionsToSave.map(section => ({
                    ...section,
                    tables: section.tables.map(table => ({
                         ...table,
                         accounts: table.accounts.map(acc => ({
                              ...acc,
                              openedAt: acc.openedAt instanceof Date ? acc.openedAt.toISOString() : acc.openedAt,
                              closedAt: acc.closedAt instanceof Date ? acc.closedAt.toISOString() : acc.closedAt,
                              items: acc.items.map(item => ({
                                   ...item,
                                   timestamp: item.timestamp instanceof Date ? item.timestamp.toISOString() : item.timestamp,
                              })),
                         })),
                    })),
                    bars: section.bars.map(bar => ({
                         ...bar,
                         accounts: bar.accounts.map(acc => ({
                              ...acc,
                              openedAt: acc.openedAt instanceof Date ? acc.openedAt.toISOString() : acc.openedAt,
                              closedAt: acc.closedAt instanceof Date ? acc.closedAt.toISOString() : acc.closedAt,
                              items: acc.items.map(item => ({
                                   ...item,
                                   timestamp: item.timestamp instanceof Date ? item.timestamp.toISOString() : item.timestamp,
                              })),
                         })),
                    })),
               }));

               const { error } = await supabase
                    .from('operations_layout')
                    .upsert({
                         user_id: user.id,
                         sections: serializedSections,
                    }, {
                         onConflict: 'user_id'
                    });

               if (error) {
                    console.error('Error saving layout:', error.message, error.details, error.hint);
               }
          } catch (error) {
               console.error('Error saving layout (exception):', error);
          }
     }, []);

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

     const openNewAccount = useCallback((sectionId: string, itemId: string, type: 'table' | 'bar') => {
          setSections(prev => prev.map(section => {
               if (section.id !== sectionId) return section;

               const updateItem = (item: TableItem | BarItem) => {
                    if (item.id !== itemId) return item;

                    const newAccount: Account = {
                         id: `acc-${Date.now()}`,
                         status: 'abierta',
                         openedAt: new Date(),
                         items: [],
                         total: 0,
                         seatLabel: type === 'bar' ? `Asiento ${item.accounts.length + 1}` : undefined,
                    };

                    return {
                         ...item,
                         status: 'ocupada' as Status,
                         accounts: [...item.accounts, newAccount],
                         currentAccountId: newAccount.id,
                    };
               };

               if (type === 'table') {
                    return { ...section, tables: section.tables.map(updateItem) as TableItem[] };
               } else {
                    return { ...section, bars: section.bars.map(updateItem) as BarItem[] };
               }
          }));
     }, []);

     const closeAccount = useCallback(async (sectionId: string, itemId: string, accountId: string, type: 'table' | 'bar') => {
          if (!establishmentId) return;

          // Find the account to get items
          let accountToClose: Account | undefined;
          let itemName = '';

          sections.forEach(section => {
               if (section.id === sectionId) {
                    const items = type === 'table' ? section.tables : section.bars;
                    const item = items.find(i => i.id === itemId);
                    if (item) {
                         itemName = item.name;
                         accountToClose = item.accounts.find(a => a.id === accountId);
                    }
               }
          });

          if (!accountToClose || accountToClose.items.length === 0) {
               // Just close the account without saving to sales
               setSections(prev => prev.map(section => {
                    if (section.id !== sectionId) return section;

                    const updateItem = (item: TableItem | BarItem) => {
                         if (item.id !== itemId) return item;

                         const updatedAccounts = item.accounts.filter(a => a.id !== accountId);
                         const hasOpenAccounts = updatedAccounts.some(a => a.status !== 'pagada');

                         return {
                              ...item,
                              status: hasOpenAccounts ? item.status : 'libre' as Status,
                              accounts: updatedAccounts,
                              currentAccountId: updatedAccounts.length > 0 ? updatedAccounts[updatedAccounts.length - 1].id : undefined,
                         };
                    };

                    if (type === 'table') {
                         return { ...section, tables: section.tables.map(updateItem) as TableItem[] };
                    } else {
                         return { ...section, bars: section.bars.map(updateItem) as BarItem[] };
                    }
               }));
               return;
          }

          // Save to sales
          try {
               const supabase = createClient();

               const saleItems = accountToClose.items.map(item => ({
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.total,
               }));

               const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
               const subtotal = accountToClose.total;
               const tax = subtotal * 0.16;
               const total = subtotal + tax;

               const { error } = await supabase.from('sales').insert({
                    establishment_id: establishmentId,
                    order_number: orderNumber,
                    table_name: accountToClose.seatLabel ? `${itemName} - ${accountToClose.seatLabel}` : itemName,
                    items: saleItems,
                    subtotal,
                    tax,
                    total,
                    payment_method: 'pending',
               });

               if (error) {
                    console.error('Error saving sale:', error);
                    toast.error('Error al guardar la venta');
                    return;
               }

               toast.success('Cuenta cerrada y registrada');

               // Update sections
               setSections(prev => prev.map(section => {
                    if (section.id !== sectionId) return section;

                    const updateItem = (item: TableItem | BarItem) => {
                         if (item.id !== itemId) return item;

                         const updatedAccounts = item.accounts.filter(a => a.id !== accountId);
                         const hasOpenAccounts = updatedAccounts.some(a => a.status !== 'pagada');

                         return {
                              ...item,
                              status: hasOpenAccounts ? item.status : 'libre' as Status,
                              accounts: updatedAccounts,
                              currentAccountId: updatedAccounts.length > 0 ? updatedAccounts[updatedAccounts.length - 1].id : undefined,
                         };
                    };

                    if (type === 'table') {
                         return { ...section, tables: section.tables.map(updateItem) as TableItem[] };
                    } else {
                         return { ...section, bars: section.bars.map(updateItem) as BarItem[] };
                    }
               }));

               // Refresh sales
               refreshSales();

          } catch (error) {
               console.error('Error closing account:', error);
               toast.error('Error al cerrar la cuenta');
          }
     }, [establishmentId, sections, refreshSales]);

     // Cancel account without saving to sales (just remove the account)
     const cancelAccount = useCallback((sectionId: string, itemId: string, accountId: string, type: 'table' | 'bar') => {
          setSections(prev => prev.map(section => {
               if (section.id !== sectionId) return section;

               const updateItem = (item: TableItem | BarItem) => {
                    if (item.id !== itemId) return item;

                    const updatedAccounts = item.accounts.filter(a => a.id !== accountId);
                    const hasOpenAccounts = updatedAccounts.length > 0;

                    return {
                         ...item,
                         status: hasOpenAccounts ? item.status : 'libre' as Status,
                         accounts: updatedAccounts,
                         currentAccountId: updatedAccounts.length > 0 ? updatedAccounts[updatedAccounts.length - 1].id : undefined,
                    };
               };

               if (type === 'table') {
                    return { ...section, tables: section.tables.map(updateItem) as TableItem[] };
               } else {
                    return { ...section, bars: section.bars.map(updateItem) as BarItem[] };
               }
          }));

          toast.success('Cuenta cancelada');
     }, []);

     // Remove a specific item from an account
     const removeItemFromAccount = useCallback((sectionId: string, itemId: string, accountId: string, itemToRemoveId: string, type: 'table' | 'bar') => {
          setSections(prev => prev.map(section => {
               if (section.id !== sectionId) return section;

               const updateItem = (item: TableItem | BarItem) => {
                    if (item.id !== itemId) return item;

                    return {
                         ...item,
                         accounts: item.accounts.map(acc => {
                              if (acc.id !== accountId) return acc;

                              const updatedItems = acc.items.filter(i => i.id !== itemToRemoveId);
                              const newTotal = updatedItems.reduce((sum, i) => sum + i.total, 0);

                              return {
                                   ...acc,
                                   items: updatedItems,
                                   total: newTotal,
                              };
                         }),
                    };
               };

               if (type === 'table') {
                    return { ...section, tables: section.tables.map(updateItem) as TableItem[] };
               } else {
                    return { ...section, bars: section.bars.map(updateItem) as BarItem[] };
               }
          }));
     }, []);

     const sendOrderToTable = useCallback(async () => {
          if (!selectedTableForOrder || currentOrder.length === 0) return;

          const [sectionId, itemId, type] = selectedTableForOrder.split('|');

          setSections(prev => {
               const updated = prev.map(section => {
                    if (section.id !== sectionId) return section;

                    const updateItem = (item: TableItem | BarItem) => {
                         if (item.id !== itemId) return item;

                         // Find or create current account
                         let targetAccount = item.accounts.find(a => a.id === item.currentAccountId);

                         if (!targetAccount) {
                              targetAccount = {
                                   id: `acc-${Date.now()}`,
                                   status: 'en-consumo',
                                   openedAt: new Date(),
                                   items: [],
                                   total: 0,
                              };
                              item.accounts.push(targetAccount);
                              item.currentAccountId = targetAccount.id;
                         }

                         // Add items to account
                         const updatedItems = [...targetAccount.items, ...currentOrder];
                         const newTotal = updatedItems.reduce((sum, i) => sum + i.total, 0);

                         return {
                              ...item,
                              status: 'ocupada' as Status,
                              accounts: item.accounts.map(acc =>
                                   acc.id === targetAccount!.id
                                        ? { ...acc, items: updatedItems, total: newTotal, status: 'en-consumo' as AccountStatus }
                                        : acc
                              ),
                         };
                    };

                    if (type === 'table') {
                         return { ...section, tables: section.tables.map(updateItem) as TableItem[] };
                    } else {
                         return { ...section, bars: section.bars.map(updateItem) as BarItem[] };
                    }
               });

               // Save layout
               saveLayout(updated);
               return updated;
          });

          toast.success('Orden enviada');
          setCurrentOrder([]);
          setProductQuantities({});
          // Keep selectedTableForOrder so user can continue adding items to same table
     }, [selectedTableForOrder, currentOrder, saveLayout]);

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
