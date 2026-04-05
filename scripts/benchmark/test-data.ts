/**
 * Realistic bar inventory test datasets with ground truth for benchmarking.
 * Includes edge cases: mixed units, Spanish/English, messy formatting, compound values.
 */

export interface GroundTruthItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export interface TestCase {
  id: string;
  description: string;
  csv: string;
  groundTruth: GroundTruthItem[];
}

export const VALID_CATEGORIES = [
  'Licores', 'Licores Dulces', 'Refrescos', 'Frutas',
  'Hierbas', 'Especias', 'Cerveza', 'Vinos', 'Otros'
];

export const EXISTING_SUPPLIES = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Tequila Don Julio Blanco', category: 'Licores', unit: 'bottles' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Ron Bacardí Blanco', category: 'Licores', unit: 'bottles' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Coca-Cola 600ml', category: 'Refrescos', unit: 'units' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Limón Verde', category: 'Frutas', unit: 'kg' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Jarabe Natural', category: 'Licores Dulces', unit: 'bottles' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Cerveza Corona Extra', category: 'Cerveza', unit: 'units' },
  { id: '77777777-7777-7777-7777-777777777777', name: 'Vodka Absolut', category: 'Licores', unit: 'bottles' },
  { id: '88888888-8888-8888-8888-888888888888', name: 'Menta Fresca', category: 'Hierbas', unit: 'g' },
];

// ─── Test Case 1: Clean, well-formatted inventory ───
export const TEST_CLEAN: TestCase = {
  id: 'clean',
  description: 'Clean well-formatted inventory with standard columns',
  csv: `Producto,Cantidad,Unidad,Categoría
Tequila Don Julio Blanco,12,bottles,Licores
Vodka Absolut,8,bottles,Licores
Triple Sec Cointreau,4,bottles,Licores Dulces
Coca-Cola 600ml,48,units,Refrescos
Agua Mineral Topo Chico,36,units,Refrescos
Limón Verde,5,kg,Frutas
Naranja,3,kg,Frutas
Menta Fresca,500,g,Hierbas
Jarabe Natural,6,bottles,Licores Dulces
Ron Bacardí Blanco,10,bottles,Licores
Cerveza Corona Extra,72,units,Cerveza
Whisky Jack Daniels,5,bottles,Licores
Jugo de Arándano,12,L,Refrescos
Sal de Gusano,200,g,Especias
Angostura Bitters,3,bottles,Licores Dulces`,
  groundTruth: [
    { name: 'Tequila Don Julio Blanco', quantity: 12, unit: 'bottles', category: 'Licores' },
    { name: 'Vodka Absolut', quantity: 8, unit: 'bottles', category: 'Licores' },
    { name: 'Triple Sec Cointreau', quantity: 4, unit: 'bottles', category: 'Licores Dulces' },
    { name: 'Coca-Cola 600ml', quantity: 48, unit: 'units', category: 'Refrescos' },
    { name: 'Agua Mineral Topo Chico', quantity: 36, unit: 'units', category: 'Refrescos' },
    { name: 'Limón Verde', quantity: 5, unit: 'kg', category: 'Frutas' },
    { name: 'Naranja', quantity: 3, unit: 'kg', category: 'Frutas' },
    { name: 'Menta Fresca', quantity: 500, unit: 'g', category: 'Hierbas' },
    { name: 'Jarabe Natural', quantity: 6, unit: 'bottles', category: 'Licores Dulces' },
    { name: 'Ron Bacardí Blanco', quantity: 10, unit: 'bottles', category: 'Licores' },
    { name: 'Cerveza Corona Extra', quantity: 72, unit: 'units', category: 'Cerveza' },
    { name: 'Whisky Jack Daniels', quantity: 5, unit: 'bottles', category: 'Licores' },
    { name: 'Jugo de Arándano', quantity: 12, unit: 'L', category: 'Refrescos' },
    { name: 'Sal de Gusano', quantity: 200, unit: 'g', category: 'Especias' },
    { name: 'Angostura Bitters', quantity: 3, unit: 'bottles', category: 'Licores Dulces' },
  ],
};

// ─── Test Case 2: Messy real-world data with compound values ───
export const TEST_MESSY: TestCase = {
  id: 'messy',
  description: 'Messy data: compound units, inconsistent formatting, missing columns',
  csv: `item,qty,notes
tequila don julio 750ml,12 botellas,para coctelería
vodka absolut 1L,8,importado
cointreau 700ml,4 bots,licor dulce
coca cola,2 cajas de 24,600ml c/u
limon,5 kilos,verde
menta,medio kilo,fresca
jarabe simple,6 botellas de 750ml,hecho en casa
bacardi blanco,10 btls,ron
corona extra,3 cartones,24 por carton
whisky JD,5,750ml
jugo de arandano 1L,12 piezas,tetra pak
sal de gusano,200g,oaxaqueña
hierbabuena,250 gramos,para mojitos
angostura,3 frascos,bitters
agua mineral,36 botellas,topo chico`,
  groundTruth: [
    { name: 'Tequila Don Julio', quantity: 12, unit: 'bottles', category: 'Licores' },
    { name: 'Vodka Absolut', quantity: 8, unit: 'bottles', category: 'Licores' },
    { name: 'Cointreau', quantity: 4, unit: 'bottles', category: 'Licores Dulces' },
    { name: 'Coca-Cola', quantity: 48, unit: 'units', category: 'Refrescos' },
    { name: 'Limón', quantity: 5, unit: 'kg', category: 'Frutas' },
    { name: 'Menta', quantity: 500, unit: 'g', category: 'Hierbas' },
    { name: 'Jarabe Simple', quantity: 6, unit: 'bottles', category: 'Licores Dulces' },
    { name: 'Ron Bacardí Blanco', quantity: 10, unit: 'bottles', category: 'Licores' },
    { name: 'Cerveza Corona Extra', quantity: 72, unit: 'units', category: 'Cerveza' },
    { name: 'Whisky Jack Daniels', quantity: 5, unit: 'bottles', category: 'Licores' },
    { name: 'Jugo de Arándano', quantity: 12, unit: 'L', category: 'Refrescos' },
    { name: 'Sal de Gusano', quantity: 200, unit: 'g', category: 'Especias' },
    { name: 'Hierbabuena', quantity: 250, unit: 'g', category: 'Hierbas' },
    { name: 'Angostura Bitters', quantity: 3, unit: 'bottles', category: 'Licores Dulces' },
    { name: 'Agua Mineral Topo Chico', quantity: 36, unit: 'bottles', category: 'Refrescos' },
  ],
};

// ─── Test Case 3: English headers, mixed languages ───
export const TEST_MIXED_LANG: TestCase = {
  id: 'mixed-lang',
  description: 'English column headers with Spanish product names and abbreviations',
  csv: `Product Name,Amount,Unit of Measure,Type
Tequila Herradura Reposado,6,btl,Spirit
Mezcal Unión,4,bottles,Spirit
Kahlúa,3,750ml bottles,Liqueur
Sprite 355ml,4 packs of 12,cans,Mixer
Toronja Rosa,8,kg,Produce
Pepino,3,kg,Produce
Chile Serrano,500,g,Produce
Canela en Raja,100,g,Spice
Vino Tinto Casa Madero,12,bottles,Wine
Cerveza Modelo Especial,5 cases,24-pack,Beer
Granadina,4,bottles,Syrup
Crema de Coco,6,latas,Mixer
Jengibre Fresco,1,kg,Produce
Romero,200,g,Herb
Pimienta Negra,150,g,Spice`,
  groundTruth: [
    { name: 'Tequila Herradura Reposado', quantity: 6, unit: 'bottles', category: 'Licores' },
    { name: 'Mezcal Unión', quantity: 4, unit: 'bottles', category: 'Licores' },
    { name: 'Kahlúa', quantity: 3, unit: 'bottles', category: 'Licores Dulces' },
    { name: 'Sprite 355ml', quantity: 48, unit: 'units', category: 'Refrescos' },
    { name: 'Toronja Rosa', quantity: 8, unit: 'kg', category: 'Frutas' },
    { name: 'Pepino', quantity: 3, unit: 'kg', category: 'Frutas' },
    { name: 'Chile Serrano', quantity: 500, unit: 'g', category: 'Frutas' },
    { name: 'Canela en Raja', quantity: 100, unit: 'g', category: 'Especias' },
    { name: 'Vino Tinto Casa Madero', quantity: 12, unit: 'bottles', category: 'Vinos' },
    { name: 'Cerveza Modelo Especial', quantity: 120, unit: 'units', category: 'Cerveza' },
    { name: 'Granadina', quantity: 4, unit: 'bottles', category: 'Licores Dulces' },
    { name: 'Crema de Coco', quantity: 6, unit: 'units', category: 'Refrescos' },
    { name: 'Jengibre Fresco', quantity: 1, unit: 'kg', category: 'Hierbas' },
    { name: 'Romero', quantity: 200, unit: 'g', category: 'Hierbas' },
    { name: 'Pimienta Negra', quantity: 150, unit: 'g', category: 'Especias' },
  ],
};

// ─── Test Case 4: Minimal / ambiguous data ───
export const TEST_MINIMAL: TestCase = {
  id: 'minimal',
  description: 'Minimal data with no headers, abbreviations, ambiguous entries',
  csv: `tequila,12
vodka,8
triple sec,4
coca,48
limon,5kg
menta,500g
jarabe,6
ron,10
corona,72
whisky,5
arandano,12L
sal gusano,200g
bitters,3
agua mineral,36
cerveza negra,24`,
  groundTruth: [
    { name: 'Tequila', quantity: 12, unit: 'bottles', category: 'Licores' },
    { name: 'Vodka', quantity: 8, unit: 'bottles', category: 'Licores' },
    { name: 'Triple Sec', quantity: 4, unit: 'bottles', category: 'Licores Dulces' },
    { name: 'Coca-Cola', quantity: 48, unit: 'units', category: 'Refrescos' },
    { name: 'Limón', quantity: 5, unit: 'kg', category: 'Frutas' },
    { name: 'Menta', quantity: 500, unit: 'g', category: 'Hierbas' },
    { name: 'Jarabe', quantity: 6, unit: 'bottles', category: 'Licores Dulces' },
    { name: 'Ron', quantity: 10, unit: 'bottles', category: 'Licores' },
    { name: 'Corona', quantity: 72, unit: 'units', category: 'Cerveza' },
    { name: 'Whisky', quantity: 5, unit: 'bottles', category: 'Licores' },
    { name: 'Jugo de Arándano', quantity: 12, unit: 'L', category: 'Refrescos' },
    { name: 'Sal de Gusano', quantity: 200, unit: 'g', category: 'Especias' },
    { name: 'Bitters', quantity: 3, unit: 'bottles', category: 'Licores Dulces' },
    { name: 'Agua Mineral', quantity: 36, unit: 'units', category: 'Refrescos' },
    { name: 'Cerveza Negra', quantity: 24, unit: 'units', category: 'Cerveza' },
  ],
};

export const ALL_TEST_CASES: TestCase[] = [
  TEST_CLEAN,
  TEST_MESSY,
  TEST_MIXED_LANG,
  TEST_MINIMAL,
];
