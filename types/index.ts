/**
 * Barrel export — import any domain type from `@/types`.
 *
 * Usage:
 *   import type { Supply, Product, Sale } from '@/types';
 */

export type { Supply } from './supply';
export type { Product, ProductIngredient } from './product';
export type { Sale, SaleItem, CartItem } from './sale';
export type { Menu, MenuData } from './menu';

// POS-specific types
export type {
     Status,
     AccountStatus,
     AccountItem,
     Account,
     TableItem,
     BarItem,
     Section,
     SelectedItem,
} from './pos';

export { statusColors, barStatusColors } from './pos';
