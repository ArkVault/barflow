'use client';

import { useMemo, useCallback } from 'react';
import type { Status, AccountStatus } from '@/components/pos/types';

/**
 * Shared hook providing translated POS labels.
 * Eliminates duplication across tables-tab, orders-tab, operaciones, and products pages.
 */
export function usePosLabels(language: string) {

     const statusLabels: Record<Status, string> = useMemo(() => language === 'es'
          ? { libre: 'Libre', reservada: 'Reservada', ocupada: 'Ocupada', 'por-pagar': 'Por Pagar' }
          : { libre: 'Free', reservada: 'Reserved', ocupada: 'Occupied', 'por-pagar': 'Pending' },
          [language]);

     const accountStatusLabels: Record<AccountStatus, string> = useMemo(() => language === 'es'
          ? { 'abierta': 'Cuenta abierta', 'en-consumo': 'En consumo', 'lista-para-cobrar': 'Lista para cobrar', 'pagada': 'Pagada' }
          : { 'abierta': 'Account open', 'en-consumo': 'In consumption', 'lista-para-cobrar': 'Ready to pay', 'pagada': 'Paid' },
          [language]);

     const translateName = useCallback((name: string): string => {
          if (language === 'es') return name;
          if (name.startsWith('Mesa ')) return 'Table ' + name.substring(5);
          if (name.startsWith('Barra ')) return 'Bar ' + name.substring(6);
          if (name.startsWith('Sección ')) return 'Section ' + name.substring(8);
          return name;
     }, [language]);

     const translateCategory = useCallback((category: string | null): string => {
          if (!category) return '';
          if (language === 'es') return category;
          const map: Record<string, string> = {
               'Todos': 'All',
               'Cócteles': 'Cocktails',
               'Cervezas': 'Beers',
               'Shots': 'Shots',
               'Bebidas sin alcohol': 'Non-alcoholic',
               'Alimentos': 'Food',
               'Postres': 'Desserts',
               'Entradas': 'Appetizers',
               'Vinos': 'Wines',
               'Licores': 'Spirits',
               'Bebidas alcohólicas': 'Alcoholic drinks',
          };
          return map[category] || category;
     }, [language]);

     return {
          statusLabels,
          accountStatusLabels,
          translateName,
          translateCategory,
     };
}
