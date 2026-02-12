/**
 * POS Types — re-exports from the canonical @/types/pos module.
 *
 * This file exists for backward compatibility so that existing imports
 * from '@/components/pos/types' continue to work.
 */
export {
     type Status,
     type AccountStatus,
     type AccountItem,
     type Account,
     type TableItem,
     type BarItem,
     type Section,
     type Product,
     type SaleItem,
     type Sale,
     type SelectedItem,
     statusColors,
     barStatusColors,
} from '@/types/pos';
