// Updated supply categories for bar inventory management

export const SUPPLY_CATEGORIES = [
     "Bebidas alcohólicas",
     "Bebidas no alcohólicas",
     "Insumos para cócteles",
     "Mezcladores y adornos",
     "Alimentos y aperitivos",
     "Materiales desechables",
     "Cristalería y utensilios",
] as const;

export type SupplyCategory = typeof SUPPLY_CATEGORIES[number];

// Category mapping for translation and organization
export const CATEGORY_INFO: Record<string, { label: string; description: string; icon: string }> = {
     "Bebidas alcohólicas": {
          label: "Bebidas alcohólicas",
          description: "Licores, vinos, cervezas",
          icon: "🍾"
     },
     "Bebidas no alcohólicas": {
          label: "Bebidas no alcohólicas",
          description: "Refrescos, jugos, aguas",
          icon: "🥤"
     },
     "Insumos para cócteles": {
          label: "Insumos para cócteles",
          description: "Azúcar, limón, hierbabuena, jarabes",
          icon: "🍋"
     },
     "Mezcladores y adornos": {
          label: "Mezcladores y adornos",
          description: "Tónicos, garnishes, frutas",
          icon: "🍒"
     },
     "Alimentos y aperitivos": {
          label: "Alimentos y aperitivos",
          description: "Tapas, snacks",
          icon: "🥜"
     },
     "Materiales desechables": {
          label: "Materiales desechables",
          description: "Vasos, servilletas, popotes",
          icon: "🥤"
     },
     "Cristalería y utensilios": {
          label: "Cristalería y utensilios",
          description: "Copas, shakers, coladores",
          icon: "🍸"
     }
};

// Legacy category mapping for backward compatibility
export const LEGACY_CATEGORY_MAP: Record<string, SupplyCategory> = {
     "Licores": "Bebidas alcohólicas",
     "Licores Dulces": "Bebidas alcohólicas",
     "Refrescos": "Bebidas no alcohólicas",
     "Frutas": "Insumos para cócteles",
     "Hierbas": "Insumos para cócteles",
     "Especias": "Insumos para cócteles",
     "Otros": "Insumos para cócteles",
};

// Helper function to migrate old categories to new ones
export function migrateCategory(oldCategory: string): SupplyCategory {
     return LEGACY_CATEGORY_MAP[oldCategory] || "Insumos para cócteles";
}
