'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import {
     createSupabaseOperationsRepository,
     fetchPosProductsUseCase,
     loadPosLayoutUseCase,
     savePosLayoutUseCase,
     fetchPosSalesUseCase,
     recordPosSaleUseCase,
     openNewAccountInSections,
     findAccountToClose,
     closeAccountInSections,
     cancelAccountInSections,
     removeItemFromAccountInSections,
     sendOrderToTargetInSections,
} from '@/lib/features/operations';
import {
     Section,
     Account,
     AccountItem,
     Product,
     Sale,
     SelectedItem,
     Status,
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
     const operationsRepository = useMemo(() => createSupabaseOperationsRepository(), []);

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
               const result = await fetchPosProductsUseCase(operationsRepository, establishmentId);
               setProducts(result.products);
               setCategories(result.categories);
          } catch (error) {
               console.error('Error fetching products:', error);
          } finally {
               setLoadingProducts(false);
          }
     };

     const loadLayout = useCallback(async () => {
          try {
               const loadedSections = await loadPosLayoutUseCase(operationsRepository);
               if (loadedSections) setSections(loadedSections);
          } catch (error) {
               console.error('Error loading layout:', error);
          }
     }, [operationsRepository]);

     const saveLayout = useCallback(async (sectionsToSave: Section[]) => {
          try {
               await savePosLayoutUseCase(operationsRepository, sectionsToSave);
          } catch (error) {
               console.error('Error saving layout (exception):', error);
          }
     }, [operationsRepository]);

     const refreshSales = useCallback(async () => {
          if (!establishmentId) return;

          setLoadingSales(true);
          try {
               const loadedSales = await fetchPosSalesUseCase(operationsRepository, establishmentId);
               setSales(loadedSales);
          } catch (error) {
               console.error('Error fetching sales:', error);
          } finally {
               setLoadingSales(false);
          }
     }, [establishmentId, operationsRepository]);

     const openNewAccount = useCallback((sectionId: string, itemId: string, type: 'table' | 'bar') => {
          setSections((prev) => openNewAccountInSections(prev, sectionId, itemId, type));
     }, []);

     const closeAccount = useCallback(async (sectionId: string, itemId: string, accountId: string, type: 'table' | 'bar') => {
          if (!establishmentId) return;

          const closeCandidate = findAccountToClose(sections, sectionId, itemId, accountId, type);
          if (!closeCandidate || closeCandidate.account.items.length === 0) {
               // Just close the account without saving to sales
               setSections((prev) => closeAccountInSections(prev, sectionId, itemId, accountId, type));
               return;
          }

          // Save to sales
          try {
               const saleItems = closeCandidate.account.items.map(item => ({
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.total,
               }));

               const subtotal = closeCandidate.account.total;
               const tax = subtotal * 0.16;
               const total = subtotal + tax;

               await recordPosSaleUseCase(operationsRepository, {
                    establishmentId,
                    tableName: closeCandidate.account.seatLabel
                         ? `${closeCandidate.itemName} - ${closeCandidate.account.seatLabel}`
                         : closeCandidate.itemName,
                    items: saleItems,
                    subtotal,
                    tax,
                    total,
                    paymentMethod: 'pending',
               });

               toast.success('Cuenta cerrada y registrada');

               // Update sections
               setSections((prev) => closeAccountInSections(prev, sectionId, itemId, accountId, type));

               // Refresh sales
               refreshSales();

          } catch (error) {
               console.error('Error closing account:', error);
               toast.error('Error al cerrar la cuenta');
          }
     }, [establishmentId, sections, refreshSales, operationsRepository]);

     // Cancel account without saving to sales (just remove the account)
     const cancelAccount = useCallback((sectionId: string, itemId: string, accountId: string, type: 'table' | 'bar') => {
          setSections((prev) => cancelAccountInSections(prev, sectionId, itemId, accountId, type));

          toast.success('Cuenta cancelada');
     }, []);

     // Remove a specific item from an account
     const removeItemFromAccount = useCallback((sectionId: string, itemId: string, accountId: string, itemToRemoveId: string, type: 'table' | 'bar') => {
          setSections((prev) =>
               removeItemFromAccountInSections(prev, sectionId, itemId, accountId, itemToRemoveId, type)
          );
     }, []);

     const sendOrderToTable = useCallback(async () => {
          if (!selectedTableForOrder || currentOrder.length === 0) return;

          const [sectionId, itemId, type] = selectedTableForOrder.split('|');
          const normalizedType = type === 'bar' ? 'bar' : 'table';
          const updated = sendOrderToTargetInSections(
               sections,
               sectionId,
               itemId,
               normalizedType,
               currentOrder
          );
          setSections(updated);
          await saveLayout(updated);

          toast.success('Orden enviada');
          setCurrentOrder([]);
          setProductQuantities({});
          // Keep selectedTableForOrder so user can continue adding items to same table
     }, [selectedTableForOrder, currentOrder, saveLayout, sections]);

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
