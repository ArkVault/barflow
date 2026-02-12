'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
     Section,
     TableItem,
     BarItem,
} from './types';

/**
 * Custom hook encapsulating all layout persistence logic (load/save from Supabase).
 */
export function useLayoutManager() {
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

     return {
          sections,
          setSections,
          loadLayout,
          saveLayout,
     };
}
