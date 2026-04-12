"use client";

import { DemoShell } from "@/components/shells";
import { DemoPageContainer } from "@/components/presentation/demo-page-container";
import { ProductosContent } from "@/components/productos-content";

interface DemoProduct {
  id: string | number;
  name: string;
  category: string;
  price: number;
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  active: boolean;
  description?: string;
  menu_id?: string;
  image_url?: string | null;
}

const LOS_CLASICOS_MENU_ID = "los-clasicos";

const initialProducts: DemoProduct[] = [
  {
    id: 1,
    name: "Mojito",
    category: "Cócteles",
    price: 8.5,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: "Ron Blanco", quantity: 50, unit: "ml" },
      { name: "Hierbabuena", quantity: 10, unit: "hojas" },
      { name: "Azúcar Blanca", quantity: 2, unit: "cucharaditas" },
      { name: "Lima", quantity: 1, unit: "unidad" },
      { name: "Agua Mineral", quantity: 100, unit: "ml" },
      { name: "Hielo", quantity: 100, unit: "g" },
    ],
    active: true,
    description: "Refrescante cóctel cubano con hierbabuena y ron",
  },
  {
    id: 2,
    name: "Margarita",
    category: "Cócteles",
    price: 9.0,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: "Tequila Blanco", quantity: 50, unit: "ml" },
      { name: "Cointreau", quantity: 25, unit: "ml" },
      { name: "Jugo de Lima", quantity: 25, unit: "ml" },
      { name: "Sal", quantity: 1, unit: "pizca" },
      { name: "Hielo", quantity: 100, unit: "g" },
    ],
    active: true,
    description: "Clásico cóctel mexicano con tequila y lima",
  },
  {
    id: 3,
    name: "Piña Colada",
    category: "Cócteles",
    price: 10.0,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: "Ron Blanco", quantity: 50, unit: "ml" },
      { name: "Crema de Coco", quantity: 30, unit: "ml" },
      { name: "Jugo de Piña", quantity: 90, unit: "ml" },
      { name: "Piña Natural", quantity: 50, unit: "g" },
      { name: "Hielo", quantity: 150, unit: "g" },
    ],
    active: true,
    description: "Tropical y cremoso cóctel caribeño",
  },
  {
    id: 4,
    name: "Daiquiri",
    category: "Cócteles",
    price: 8.0,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: "Ron Blanco", quantity: 60, unit: "ml" },
      { name: "Jugo de Lima", quantity: 30, unit: "ml" },
      { name: "Jarabe Simple", quantity: 15, unit: "ml" },
      { name: "Hielo", quantity: 100, unit: "g" },
    ],
    active: true,
    description: "Cóctel cubano clásico, simple y refrescante",
  },
  {
    id: 5,
    name: "Cosmopolitan",
    category: "Cócteles",
    price: 10.5,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: "Vodka", quantity: 40, unit: "ml" },
      { name: "Cointreau", quantity: 15, unit: "ml" },
      { name: "Jugo de Arándano", quantity: 30, unit: "ml" },
      { name: "Jugo de Lima", quantity: 15, unit: "ml" },
      { name: "Hielo", quantity: 100, unit: "g" },
    ],
    active: true,
    description: "Elegante cóctel popularizado en los 90s",
  },
  {
    id: 6,
    name: "Old Fashioned",
    category: "Cócteles",
    price: 11.0,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: "Whisky Bourbon", quantity: 60, unit: "ml" },
      { name: "Azúcar", quantity: 1, unit: "cubo" },
      { name: "Angostura Bitters", quantity: 3, unit: "gotas" },
      { name: "Naranja", quantity: 1, unit: "rodaja" },
      { name: "Cereza Marrasquino", quantity: 1, unit: "unidad" },
      { name: "Hielo", quantity: 80, unit: "g" },
    ],
    active: true,
    description: "Cóctel clásico americano con whisky",
  },
  {
    id: 7,
    name: "Manhattan",
    category: "Cócteles",
    price: 10.5,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: "Whisky Rye", quantity: 50, unit: "ml" },
      { name: "Vermut Rojo", quantity: 25, unit: "ml" },
      { name: "Angostura Bitters", quantity: 2, unit: "gotas" },
      { name: "Cereza Marrasquino", quantity: 1, unit: "unidad" },
      { name: "Hielo", quantity: 100, unit: "g" },
    ],
    active: true,
    description: "Sofisticado cóctel de Nueva York",
  },
  {
    id: 8,
    name: "Negroni",
    category: "Cócteles",
    price: 9.5,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: "Gin", quantity: 30, unit: "ml" },
      { name: "Campari", quantity: 30, unit: "ml" },
      { name: "Vermut Rojo", quantity: 30, unit: "ml" },
      { name: "Naranja", quantity: 1, unit: "rodaja" },
      { name: "Hielo", quantity: 80, unit: "g" },
    ],
    active: true,
    description: "Amargo y aromático cóctel italiano",
  },
  {
    id: 9,
    name: "Martini",
    category: "Cócteles",
    price: 11.5,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: "Gin", quantity: 60, unit: "ml" },
      { name: "Vermut Seco", quantity: 10, unit: "ml" },
      { name: "Aceituna", quantity: 2, unit: "unidades" },
      { name: "Hielo", quantity: 100, unit: "g" },
    ],
    active: true,
    description: "El rey de los cócteles, elegante y seco",
  },
  {
    id: 10,
    name: "Whisky Sour",
    category: "Cócteles",
    price: 9.0,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: "Whisky Bourbon", quantity: 50, unit: "ml" },
      { name: "Jugo de Limón", quantity: 30, unit: "ml" },
      { name: "Jarabe Simple", quantity: 20, unit: "ml" },
      { name: "Clara de Huevo", quantity: 15, unit: "ml" },
      { name: "Angostura Bitters", quantity: 2, unit: "gotas" },
      { name: "Hielo", quantity: 100, unit: "g" },
    ],
    active: true,
    description: "Equilibrio perfecto entre dulce y ácido",
  },
  {
    id: 11,
    name: "Caipirinha",
    category: "Cócteles",
    price: 8.0,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: "Cachaça", quantity: 60, unit: "ml" },
      { name: "Lima", quantity: 1, unit: "unidad" },
      { name: "Azúcar Blanca", quantity: 2, unit: "cucharaditas" },
      { name: "Hielo Picado", quantity: 150, unit: "g" },
    ],
    active: true,
    description: "Cóctel nacional de Brasil, fresco y potente",
  },
  {
    id: 12,
    name: "Aperol Spritz",
    category: "Cócteles",
    price: 8.5,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: "Aperol", quantity: 60, unit: "ml" },
      { name: "Prosecco", quantity: 90, unit: "ml" },
      { name: "Agua Mineral", quantity: 30, unit: "ml" },
      { name: "Naranja", quantity: 1, unit: "rodaja" },
      { name: "Hielo", quantity: 100, unit: "g" },
    ],
    active: true,
    description: "Refrescante aperitivo italiano",
  },
];

export default function ProductosPage() {
  return (
    <DemoShell>
      <DemoPageContainer paddingClassName="p-6" maxWidthClassName="max-w-5xl">
        <ProductosContent fallbackProducts={initialProducts} />
      </DemoPageContainer>
    </DemoShell>
  );
}
