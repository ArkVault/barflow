// Mock data for demo purposes
export const mockSupplies = [
  { 
    id: '1', 
    name: 'Ron Blanco', 
    category: 'Licores', 
    current_quantity: 12, 
    unit: 'L', 
    min_threshold: 10, 
    daysUntilDepleted: 8,
    urgencyLevel: 'low' as const, // 12/10 = 120% -> Verde
    products: [
      { name: 'Mojito', category: 'Cócteles', quantityNeeded: 0.05 },
      { name: 'Daiquiri', category: 'Cócteles', quantityNeeded: 0.06 }
    ]
  },
  { 
    id: '2', 
    name: 'Vodka Premium', 
    category: 'Licores', 
    current_quantity: 8, 
    unit: 'L', 
    min_threshold: 10, 
    daysUntilDepleted: 4,
    urgencyLevel: 'low' as const, // 8/10 = 80% -> Verde
    products: [
      { name: 'Cosmopolitan', category: 'Cócteles', quantityNeeded: 0.05 },
      { name: 'Moscow Mule', category: 'Cócteles', quantityNeeded: 0.05 }
    ]
  },
  { 
    id: '3', 
    name: 'Jugo de Limón', 
    category: 'Refrescos', 
    current_quantity: 25, 
    unit: 'L', 
    min_threshold: 15, 
    daysUntilDepleted: 12,
    urgencyLevel: 'low' as const, // 25/15 = 166% -> Verde
    products: [
      { name: 'Margarita', category: 'Cócteles', quantityNeeded: 0.03 },
      { name: 'Limonada', category: 'Bebidas', quantityNeeded: 0.2 }
    ]
  },
  { 
    id: '4', 
    name: 'Azúcar', 
    category: 'Especias', 
    current_quantity: 2.5, 
    unit: 'kg', 
    min_threshold: 8, 
    daysUntilDepleted: 1,
    urgencyLevel: 'critical' as const, // 2.5/8 = 31% -> Rojo
    products: [
      { name: 'Mojito', category: 'Cócteles', quantityNeeded: 0.01 },
      { name: 'Caipirinha', category: 'Cócteles', quantityNeeded: 0.015 }
    ]
  },
  { 
    id: '5', 
    name: 'Hierbabuena', 
    category: 'Frutas', 
    current_quantity: 1.5, 
    unit: 'kg', 
    min_threshold: 3, 
    daysUntilDepleted: 3,
    urgencyLevel: 'warning' as const, // 1.5/3 = 50% -> Naranja
    products: [
      { name: 'Mojito', category: 'Cócteles', quantityNeeded: 0.02 }
    ]
  },
  { 
    id: '6', 
    name: 'Tequila Reposado', 
    category: 'Licores', 
    current_quantity: 15, 
    unit: 'L', 
    min_threshold: 10, 
    daysUntilDepleted: 10,
    urgencyLevel: 'low' as const, // 15/10 = 150% -> Verde
    products: [
      { name: 'Margarita', category: 'Cócteles', quantityNeeded: 0.05 },
      { name: 'Paloma', category: 'Cócteles', quantityNeeded: 0.05 }
    ]
  },
  { 
    id: '7', 
    name: 'Coca Cola', 
    category: 'Refrescos', 
    current_quantity: 48, 
    unit: 'L', 
    min_threshold: 30, 
    daysUntilDepleted: 15,
    urgencyLevel: 'low' as const, // 48/30 = 160% -> Verde
    products: [
      { name: 'Cuba Libre', category: 'Cócteles', quantityNeeded: 0.15 }
    ]
  },
  { 
    id: '8', 
    name: 'Limones', 
    category: 'Frutas', 
    current_quantity: 1, 
    unit: 'kg', 
    min_threshold: 3, 
    daysUntilDepleted: 1,
    urgencyLevel: 'critical' as const, // 1/3 = 33% -> Rojo
    products: [
      { name: 'Margarita', category: 'Cócteles', quantityNeeded: 0.05 },
      { name: 'Limonada', category: 'Bebidas', quantityNeeded: 0.1 }
    ]
  },
  { 
    id: '9', 
    name: 'Ginebra', 
    category: 'Licores', 
    current_quantity: 5, 
    unit: 'L', 
    min_threshold: 10, 
    daysUntilDepleted: 2,
    urgencyLevel: 'warning' as const, // 5/10 = 50% -> Naranja
    products: [
      { name: 'Gin Tonic', category: 'Cócteles', quantityNeeded: 0.05 }
    ]
  },
];

export type UrgencyPeriod = 'day' | 'week' | 'month';

// Calculate urgency level based on stock ratio (quintas partes)
function getUrgencyLevelByStock(current: number, max: number): 'critical' | 'warning' | 'low' {
  if (max <= 0) return 'low';
  const ratio = current / max;
  
  // 0-2/5 (0-40%) = Crítico
  if (ratio <= 0.4) return 'critical';
  // 3/5 (40-60%) = Bajo/Warning
  if (ratio <= 0.6) return 'warning';
  // 4/5-5/5 (60-100%+) = Óptimo
  return 'low';
}

// Adjust urgency levels and filter by period to show different items
export function getSuppliesByPeriod(period: UrgencyPeriod) {
  return mockSupplies
    .map(supply => {
      // Calculate base urgency from stock ratio
      const urgencyLevel = getUrgencyLevelByStock(supply.current_quantity, supply.min_threshold);

      return {
        ...supply,
        urgencyLevel
      };
    })
    .filter(supply => {
      // Filter supplies based on period and days until depleted
      if (period === 'day') {
        // Día: Solo mostrar insumos que se agotan en 1-3 días
        return supply.daysUntilDepleted <= 3;
      } else if (period === 'week') {
        // Semana: Mostrar insumos que se agotan en 1-10 días
        return supply.daysUntilDepleted <= 10;
      } else {
        // Mes: Mostrar todos los insumos
        return true;
      }
    });
}
