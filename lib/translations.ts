export const translations = {
  es: {
    // Navigation
    planner: "Planner",
    supplies: "Insumos",
    products: "Productos",
    sales: "Ventas",
    projections: "Proyecciones",
    dashboard: "Panel de Control",
    account: "Cuenta",
    settings: "Configuración",

    // Common
    back: "Volver",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    add: "Agregar",
    search: "Buscar",
    filter: "Filtrar",

    // Demo
    demoMode: "Modo demo sin datos reales",
    reconfigurePlan: "Reconfigurar Plan",

    // Planner
    inventoryPlanner: "Planificador de Inventario",
    configureInventory: "Configura tu inventario inicial seleccionando los insumos que manejas en tu bar",
    planPeriod: "Periodo del plan:",
    week: "Semana",
    month: "Mes",
    day: "Día",

    // Dashboard
    dashboardDemo: "Panel de control demo",
    totalSupplies: "Total Insumos",
    configuredInPlan: "Configurados en tu plan",
    salesToday: "Ventas Hoy",
    healthyInventory: "Inventario saludable",

    // Supplies
    supplyManagement: "Gestión de Insumos",
    inventoryControl: "Control de inventario y stock",
    addSupply: "Añadir Insumo",
    critical: "Crítico",
    low: "Bajo",
    optimal: "Óptimo",
    viewAll: "Ver todo",

    // Products
    productManagement: "Gestión de Productos",
    menuRecipes: "Menú y recetas de bebidas",
    designMenu: "Agregar Producto",
    addProduct: "Añadir Producto",
    viewRecipe: "Ver Receta",
    ingredients: "Ingredientes",

    // Sales
    salesAccounting: "Ventas y Contabilidad",
    transactionLog: "Registro de transacciones",
    registerSale: "Registrar Venta",

    // Projections
    smartProjections: "Proyecciones Inteligentes",
    aiPredictiveAnalysis: "Análisis predictivo basado en IA",
    updateProjections: "Actualizar Proyecciones",

    // Auth
    logout: "Cerrar Sesión",

    // Table headers
    name: "Nombre",
    category: "Categoría",
    quantity: "Cantidad",
    unit: "Unidad",
    minimum: "Mínimo",
    status: "Estado",
    price: "Precio",
    actions: "Acciones",
    time: "Hora",
    product: "Producto",
    total: "Total",

    // Status labels
    active: "Activo",
    inactive: "Inactivo",
    stock: "Stock",
    current: "Actual",
    needed: "Necesario",
    days: "Días",

    // Common phrases
    ingredientsCount: "ingredientes",
    currentStock: "Stock actual",
    minimumStock: "Mínimo",
    usedIn: "Utilizado en",
    transactions: "Transacciones",
    average: "Promedio",

    // Cards and stats
    criticalStock: "Stock Crítico",
    lowStock: "Stock Bajo",
    goodStock: "Stock Bueno",
    allSupplies: "Todos",

    // Product categories
    cocktails: "Cócteles",
    beers: "Cervezas",
    shots: "Shots",

    // Supply categories
    liquors: "Licores",
    refreshments: "Refrescos",
    spices: "Especias",
    fruits: "Frutas",

    // Sales
    recentTransactions: "Últimas Transacciones",

    // Planner
    selectedSupplies: "insumos seleccionados",
    selectSupplies: "Seleccionar insumos",
    customSupply: "Insumo personalizado",
    addCustomSupply: "Agregar insumo personalizado",
    completePlan: "Completar Plan",
  },
  en: {
    // Navigation
    planner: "Planner",
    supplies: "Supplies",
    products: "Products",
    sales: "Sales",
    projections: "Projections",
    dashboard: "Dashboard",
    account: "Account",
    settings: "Settings",

    // Common
    back: "Back",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    add: "Add",
    search: "Search",
    filter: "Filter",

    // Demo
    demoMode: "Demo mode without real data",
    reconfigurePlan: "Reconfigure Plan",

    // Planner
    inventoryPlanner: "Inventory Planner",
    configureInventory: "Configure your initial inventory by selecting the supplies you manage in your bar",
    planPeriod: "Plan period:",
    week: "Week",
    month: "Month",
    day: "Day",

    // Dashboard
    dashboardDemo: "Demo dashboard",
    totalSupplies: "Total Supplies",
    configuredInPlan: "Configured in your plan",
    salesToday: "Sales Today",
    healthyInventory: "Healthy inventory",

    // Supplies
    supplyManagement: "Supply Management",
    inventoryControl: "Inventory and stock control",
    addSupply: "Add Supply",
    critical: "Critical",
    low: "Low",
    optimal: "Optimal",
    viewAll: "View all",

    // Products
    productManagement: "Product Management",
    menuRecipes: "Menu and drink recipes",
    designMenu: "Add Product",
    addProduct: "Add Product",
    viewRecipe: "View Recipe",
    ingredients: "Ingredients",

    // Sales
    salesAccounting: "Sales & Accounting",
    transactionLog: "Transaction log",
    registerSale: "Register Sale",

    // Projections
    smartProjections: "Smart Projections",
    aiPredictiveAnalysis: "AI-based predictive analysis",
    updateProjections: "Update Projections",

    // Auth
    logout: "Logout",

    // Table headers
    name: "Name",
    category: "Category",
    quantity: "Quantity",
    unit: "Unit",
    minimum: "Minimum",
    status: "Status",
    price: "Price",
    actions: "Actions",
    time: "Time",
    product: "Product",
    total: "Total",

    // Status labels
    active: "Active",
    inactive: "Inactive",
    stock: "Stock",
    current: "Current",
    needed: "Needed",
    days: "Days",

    // Common phrases
    ingredientsCount: "ingredients",
    currentStock: "Current stock",
    minimumStock: "Minimum",
    usedIn: "Used in",
    transactions: "Transactions",
    average: "Average",

    // Cards and stats
    criticalStock: "Critical Stock",
    lowStock: "Low Stock",
    goodStock: "Good Stock",
    allSupplies: "All",

    // Product categories
    cocktails: "Cocktails",
    beers: "Beers",
    shots: "Shots",

    // Supply categories
    liquors: "Liquors",
    refreshments: "Refreshments",
    spices: "Spices",
    fruits: "Fruits",

    // Sales
    recentTransactions: "Recent Transactions",

    // Planner
    selectedSupplies: "selected supplies",
    selectSupplies: "Select supplies",
    customSupply: "Custom supply",
    addCustomSupply: "Add custom supply",
    completePlan: "Complete Plan",
  }
};

export type Language = keyof typeof translations;

export function getTranslation(key: string, lang: Language = 'es'): string {
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    value = value?.[k];
  }

  return value || key;
}
