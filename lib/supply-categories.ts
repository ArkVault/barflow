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
export const CATEGORY_INFO: Record<string, {
     label: string;
     description: string;
     icon: string;
     defaultContentPerUnit: number;
     defaultContentUnit: string;
     defaultUnit: string;
}> = {
     "Bebidas alcohólicas": {
          label: "Bebidas alcohólicas",
          description: "Licores, licores dulces, vinos, cervezas, destilados",
          icon: "🍾",
          defaultContentPerUnit: 750,
          defaultContentUnit: "ml",
          defaultUnit: "ml" // Backend en ml, visualización en botellas
     },
     "Bebidas no alcohólicas": {
          label: "Bebidas no alcohólicas",
          description: "Refrescos, jugos, aguas",
          icon: "🥤",
          defaultContentPerUnit: 3000,
          defaultContentUnit: "ml",
          defaultUnit: "ml" // Backend en ml, visualización en botellas/litros
     },
     "Refrescos": {
          label: "Refrescos",
          description: "Refrescos y bebidas carbonatadas",
          icon: "🥤",
          defaultContentPerUnit: 3000,
          defaultContentUnit: "ml",
          defaultUnit: "ml" // Backend en ml, visualización en botellas/litros (3L por botella)
     },
     "Agua mineral": {
          label: "Agua mineral",
          description: "Agua embotellada",
          icon: "💧",
          defaultContentPerUnit: 1750,
          defaultContentUnit: "ml",
          defaultUnit: "ml" // Backend en ml, visualización en botellas/litros (1.75L por botella)
     },
     "Insumos para cócteles": {
          label: "Insumos para cócteles",
          description: "Azúcar, limón, hierbabuena, jarabes",
          icon: "🍋",
          defaultContentPerUnit: 1000,
          defaultContentUnit: "g",
          defaultUnit: "g" // Backend en g, visualización en kg
     },
     "Frutas": {
          label: "Frutas",
          description: "Frutas frescas",
          icon: "🍋",
          defaultContentPerUnit: 1000,
          defaultContentUnit: "g",
          defaultUnit: "g" // Backend en g, visualización en kg
     },
     "Hierbas": {
          label: "Hierbas",
          description: "Hierbas aromáticas",
          icon: "🌿",
          defaultContentPerUnit: 100,
          defaultContentUnit: "g",
          defaultUnit: "g" // Backend en g, visualización en kg
     },
     "Especias": {
          label: "Especias",
          description: "Especias y condimentos",
          icon: "🧂",
          defaultContentPerUnit: 100,
          defaultContentUnit: "g",
          defaultUnit: "g" // Backend en g, visualización en gramos
     },
     "Mezcladores y adornos": {
          label: "Mezcladores y adornos",
          description: "Tónicos, garnishes, frutas",
          icon: "🍒",
          defaultContentPerUnit: 1000,
          defaultContentUnit: "ml",
          defaultUnit: "ml"
     },
     "Alimentos y aperitivos": {
          label: "Alimentos y aperitivos",
          description: "Tapas, snacks",
          icon: "🥜",
          defaultContentPerUnit: 1000,
          defaultContentUnit: "g",
          defaultUnit: "g"
     },
     "Materiales desechables": {
          label: "Materiales desechables",
          description: "Vasos, servilletas, popotes",
          icon: "🥤",
          defaultContentPerUnit: 1,
          defaultContentUnit: "units",
          defaultUnit: "units"
     },
     "Cristalería y utensilios": {
          label: "Cristalería y utensilios",
          description: "Copas, shakers, coladores",
          icon: "🍸",
          defaultContentPerUnit: 1,
          defaultContentUnit: "units",
          defaultUnit: "units"
     },
     "Otros": {
          label: "Otros",
          description: "Otros insumos",
          icon: "📦",
          defaultContentPerUnit: 1,
          defaultContentUnit: "units",
          defaultUnit: "units" // Debe definirse manualmente
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

// Helper function to get category defaults
export function getCategoryDefaults(category: string) {
     const info = CATEGORY_INFO[category];
     if (info) {
          return {
               contentPerUnit: info.defaultContentPerUnit,
               contentUnit: info.defaultContentUnit,
               unit: info.defaultUnit,
          };
     }
     // Fallback defaults
     return {
          contentPerUnit: 1,
          contentUnit: "units",
          unit: "units",
     };
}
