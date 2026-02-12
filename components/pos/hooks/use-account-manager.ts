'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
     Section,
     TableItem,
     BarItem,
     Account,
     AccountStatus,
     Status,
     SelectedItem,
} from '../types';

interface UseAccountManagerOptions {
     establishmentId: string | null;
     sections: Section[];
     setSections: React.Dispatch<React.SetStateAction<Section[]>>;
     refreshSales: () => Promise<void>;
}

/**
 * Custom hook encapsulating account management logic:
 * opening, closing, canceling accounts, and removing items.
 */
export function useAccountManager({
     establishmentId,
     sections,
     setSections,
     refreshSales,
}: UseAccountManagerOptions) {

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
     }, [setSections]);

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
     }, [establishmentId, sections, setSections, refreshSales]);

     // Cancel account without saving to sales
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
     }, [setSections]);

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
     }, [setSections]);

     return {
          openNewAccount,
          closeAccount,
          cancelAccount,
          removeItemFromAccount,
     };
}
