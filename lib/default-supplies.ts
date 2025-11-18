// Default supplies for a bar
export const defaultBarSupplies = [
  // Licores
  { name: 'Ron Blanco', category: 'Licores', unit: 'L', defaultQuantity: 10 },
  { name: 'Ron Oscuro', category: 'Licores', unit: 'L', defaultQuantity: 8 },
  { name: 'Vodka', category: 'Licores', unit: 'L', defaultQuantity: 10 },
  { name: 'Tequila Blanco', category: 'Licores', unit: 'L', defaultQuantity: 10 },
  { name: 'Tequila Reposado', category: 'Licores', unit: 'L', defaultQuantity: 8 },
  { name: 'Ginebra', category: 'Licores', unit: 'L', defaultQuantity: 8 },
  { name: 'Whisky', category: 'Licores', unit: 'L', defaultQuantity: 6 },
  { name: 'Mezcal', category: 'Licores', unit: 'L', defaultQuantity: 5 },
  
  // Licores dulces
  { name: 'Triple Sec', category: 'Licores Dulces', unit: 'L', defaultQuantity: 3 },
  { name: 'Amaretto', category: 'Licores Dulces', unit: 'L', defaultQuantity: 2 },
  { name: 'Baileys', category: 'Licores Dulces', unit: 'L', defaultQuantity: 3 },
  
  // Refrescos
  { name: 'Coca Cola', category: 'Refrescos', unit: 'L', defaultQuantity: 30 },
  { name: 'Sprite', category: 'Refrescos', unit: 'L', defaultQuantity: 20 },
  { name: 'Agua Tónica', category: 'Refrescos', unit: 'L', defaultQuantity: 15 },
  { name: 'Agua Mineral', category: 'Refrescos', unit: 'L', defaultQuantity: 25 },
  { name: 'Jugo de Naranja', category: 'Refrescos', unit: 'L', defaultQuantity: 10 },
  { name: 'Jugo de Limón', category: 'Refrescos', unit: 'L', defaultQuantity: 15 },
  { name: 'Jugo de Arándano', category: 'Refrescos', unit: 'L', defaultQuantity: 8 },
  
  // Frutas y hierbas
  { name: 'Limones', category: 'Frutas', unit: 'kg', defaultQuantity: 5 },
  { name: 'Limas', category: 'Frutas', unit: 'kg', defaultQuantity: 4 },
  { name: 'Naranjas', category: 'Frutas', unit: 'kg', defaultQuantity: 3 },
  { name: 'Hierbabuena', category: 'Hierbas', unit: 'kg', defaultQuantity: 2 },
  { name: 'Albahaca', category: 'Hierbas', unit: 'kg', defaultQuantity: 1 },
  
  // Otros
  { name: 'Azúcar', category: 'Especias', unit: 'kg', defaultQuantity: 10 },
  { name: 'Sal', category: 'Especias', unit: 'kg', defaultQuantity: 3 },
  { name: 'Hielo', category: 'Otros', unit: 'kg', defaultQuantity: 50 },
  { name: 'Cerezas Marrasquino', category: 'Otros', unit: 'kg', defaultQuantity: 2 },
  { name: 'Aceitunas', category: 'Otros', unit: 'kg', defaultQuantity: 2 },
];

export type PlanPeriod = 'week' | 'month';

export interface SupplyPlan {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  selected: boolean;
}
