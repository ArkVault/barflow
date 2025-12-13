// POS Types - Single Responsibility: Only type definitions

export type Status = 'libre' | 'reservada' | 'ocupada' | 'por-pagar';
export type AccountStatus = 'abierta' | 'en-consumo' | 'lista-para-cobrar' | 'pagada';

export interface AccountItem {
     id: string;
     productName: string;
     quantity: number;
     unitPrice: number;
     total: number;
     timestamp: Date;
}

export interface Account {
     id: string;
     status: AccountStatus;
     openedAt: Date;
     closedAt?: Date;
     items: AccountItem[];
     total: number;
     seatLabel?: string;
}

export interface TableItem {
     id: string;
     name: string;
     x: number;
     y: number;
     status: Status;
     accounts: Account[];
     currentAccountId?: string;
}

export interface BarItem {
     id: string;
     name: string;
     x: number;
     y: number;
     status: Status;
     accounts: Account[];
     currentAccountId?: string;
     orientation?: 'horizontal' | 'vertical';
}

export interface Section {
     id: string;
     name: string;
     x: number;
     y: number;
     width: number;
     height: number;
     tables: TableItem[];
     bars: BarItem[];
}

export interface Product {
     id: string;
     name: string;
     price: number;
     category: string;
     menu_id: string;
     image_url?: string | null;
}

export interface SaleItem {
     productName: string;
     quantity: number;
     unitPrice: number;
     total: number;
}

export interface Sale {
     id: string;
     order_number: string;
     table_name: string | null;
     items: SaleItem[];
     subtotal: number;
     tax: number;
     total: number;
     payment_method: string | null;
     created_at: string;
}

export interface SelectedItem {
     type: 'table' | 'bar';
     sectionId: string;
     itemId: string;
}

// Status color mappings
export const statusColors: Record<Status, string> = {
     libre: 'from-green-400 to-green-600',
     reservada: 'from-yellow-400 to-yellow-600',
     ocupada: 'from-blue-400 to-blue-600',
     'por-pagar': 'from-orange-400 to-orange-600',
};

export const barStatusColors: Record<Status, string> = {
     libre: 'from-green-600 to-green-800',
     reservada: 'from-yellow-600 to-yellow-800',
     ocupada: 'from-blue-600 to-blue-800',
     'por-pagar': 'from-orange-600 to-orange-800',
};
