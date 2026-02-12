import type { Product } from './product';
import type { ProductIngredient } from './product';

/**
 * A single line-item within a POS sale.
 */
export interface SaleItem {
     productName: string;
     quantity: number;
     unitPrice: number;
     total: number;
}

/**
 * A completed sale recorded through the POS.
 */
export interface Sale {
     id: string;
     order_number?: string;
     table_name?: string | null;
     items?: SaleItem[];
     subtotal?: number;
     tax?: number;
     total?: number;
     total_price?: number;
     payment_method?: string | null;
     created_at?: string;
     sale_date?: string;
     quantity?: number;
     /** Joined product data — shape depends on the Supabase query. */
     products?: Product | { product_ingredients: ProductIngredient[] };
}

/**
 * An item placed in the POS cart before checkout.
 */
export interface CartItem {
     productId: string;
     productName: string;
     quantity: number;
     unitPrice: number;
     total: number;
}
