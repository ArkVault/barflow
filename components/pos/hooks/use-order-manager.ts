'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
     Section,
     TableItem,
     BarItem,
     Account,
     AccountItem,
     AccountStatus,
     Status,
} from '../types';

interface UseOrderManagerOptions {
     setSections: React.Dispatch<React.SetStateAction<Section[]>>;
     saveLayout: (sections: Section[]) => Promise<void>;
}

/**
 * Custom hook encapsulating order management logic:
 * building orders, sending to tables, and tracking quantities.
 */
export function useOrderManager({
     setSections,
     saveLayout,
}: UseOrderManagerOptions) {
     const [currentOrder, setCurrentOrder] = useState<AccountItem[]>([]);
     const [selectedTableForOrder, setSelectedTableForOrder] = useState<string | null>(null);
     const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});

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
     }, [selectedTableForOrder, currentOrder, setSections, saveLayout]);

     return {
          currentOrder,
          setCurrentOrder,
          selectedTableForOrder,
          setSelectedTableForOrder,
          productQuantities,
          setProductQuantities,
          sendOrderToTable,
     };
}
