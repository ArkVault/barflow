import type { Supply } from './supply';

/**
 * A single ingredient entry linking a product to a supply with a quantity.
 *
 * `supplies` is the joined/expanded supply object that Supabase returns
 * when you `.select('*, supplies(*)')`. It is optional because not every
 * query fetches the full join.
 */
export interface ProductIngredient {
     id?: string;
     quantity_needed: number;
     supply_id: string;
     supplies?: Supply;
}

/**
 * Canonical Product type — single source of truth.
 *
 * Core fields are required; fields only needed in some views are optional.
 */
export interface Product {
     id: string;
     name: string;
     category?: string | null;
     price?: number;
     description?: string | null;
     is_active?: boolean;
     menu_id?: string;
     image_url?: string | null;
     product_ingredients?: ProductIngredient[];
}
