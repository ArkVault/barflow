/**
 * Canonical Menu type — single source of truth.
 */
export interface Menu {
     id: string;
     name: string;
     is_active: boolean;
     is_secondary_active?: boolean;
     created_at: string;
}

/**
 * Alias kept for backward compatibility.
 * In new code prefer `Menu` directly.
 */
export type MenuData = Menu;
