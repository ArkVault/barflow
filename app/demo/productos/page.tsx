'use client';

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DemoSidebar } from "@/components/demo-sidebar"
import { Plus, Edit, Trash2, X } from "lucide-react"
import { GlowButton } from "@/components/glow-button"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/hooks/use-language"
import { MenuManager } from "@/components/menu-manager"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { ProductImageUpload } from "@/components/product-image-upload"


interface Product {
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

// Mock menu ID for "Los Clásicos"
const LOS_CLASICOS_MENU_ID = 'los-clasicos';

const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Mojito',
    category: 'Cócteles',
    price: 8.50,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: 'Ron Blanco', quantity: 50, unit: 'ml' },
      { name: 'Hierbabuena', quantity: 10, unit: 'hojas' },
      { name: 'Azúcar Blanca', quantity: 2, unit: 'cucharaditas' },
      { name: 'Lima', quantity: 1, unit: 'unidad' },
      { name: 'Agua Mineral', quantity: 100, unit: 'ml' },
      { name: 'Hielo', quantity: 100, unit: 'g' }
    ],
    active: true,
    description: 'Refrescante cóctel cubano con hierbabuena y ron'
  },
  {
    id: 2,
    name: 'Margarita',
    category: 'Cócteles',
    price: 9.00,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: 'Tequila Blanco', quantity: 50, unit: 'ml' },
      { name: 'Cointreau', quantity: 25, unit: 'ml' },
      { name: 'Jugo de Lima', quantity: 25, unit: 'ml' },
      { name: 'Sal', quantity: 1, unit: 'pizca' },
      { name: 'Hielo', quantity: 100, unit: 'g' }
    ],
    active: true,
    description: 'Clásico cóctel mexicano con tequila y lima'
  },
  {
    id: 3,
    name: 'Piña Colada',
    category: 'Cócteles',
    price: 10.00,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: 'Ron Blanco', quantity: 50, unit: 'ml' },
      { name: 'Crema de Coco', quantity: 30, unit: 'ml' },
      { name: 'Jugo de Piña', quantity: 90, unit: 'ml' },
      { name: 'Piña Natural', quantity: 50, unit: 'g' },
      { name: 'Hielo', quantity: 150, unit: 'g' }
    ],
    active: true,
    description: 'Tropical y cremoso cóctel caribeño'
  },
  {
    id: 4,
    name: 'Daiquiri',
    category: 'Cócteles',
    price: 8.00,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: 'Ron Blanco', quantity: 60, unit: 'ml' },
      { name: 'Jugo de Lima', quantity: 30, unit: 'ml' },
      { name: 'Jarabe Simple', quantity: 15, unit: 'ml' },
      { name: 'Hielo', quantity: 100, unit: 'g' }
    ],
    active: true,
    description: 'Cóctel cubano clásico, simple y refrescante'
  },
  {
    id: 5,
    name: 'Cosmopolitan',
    category: 'Cócteles',
    price: 10.50,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: 'Vodka', quantity: 40, unit: 'ml' },
      { name: 'Cointreau', quantity: 15, unit: 'ml' },
      { name: 'Jugo de Arándano', quantity: 30, unit: 'ml' },
      { name: 'Jugo de Lima', quantity: 15, unit: 'ml' },
      { name: 'Hielo', quantity: 100, unit: 'g' }
    ],
    active: true,
    description: 'Elegante cóctel popularizado en los 90s'
  },
  {
    id: 6,
    name: 'Old Fashioned',
    category: 'Cócteles',
    price: 11.00,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: 'Whisky Bourbon', quantity: 60, unit: 'ml' },
      { name: 'Azúcar', quantity: 1, unit: 'cubo' },
      { name: 'Angostura Bitters', quantity: 3, unit: 'gotas' },
      { name: 'Naranja', quantity: 1, unit: 'rodaja' },
      { name: 'Cereza Marrasquino', quantity: 1, unit: 'unidad' },
      { name: 'Hielo', quantity: 80, unit: 'g' }
    ],
    active: true,
    description: 'Cóctel clásico americano con whisky'
  },
  {
    id: 7,
    name: 'Manhattan',
    category: 'Cócteles',
    price: 10.50,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: 'Whisky Rye', quantity: 50, unit: 'ml' },
      { name: 'Vermut Rojo', quantity: 25, unit: 'ml' },
      { name: 'Angostura Bitters', quantity: 2, unit: 'gotas' },
      { name: 'Cereza Marrasquino', quantity: 1, unit: 'unidad' },
      { name: 'Hielo', quantity: 100, unit: 'g' }
    ],
    active: true,
    description: 'Sofisticado cóctel de Nueva York'
  },
  {
    id: 8,
    name: 'Negroni',
    category: 'Cócteles',
    price: 9.50,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: 'Gin', quantity: 30, unit: 'ml' },
      { name: 'Campari', quantity: 30, unit: 'ml' },
      { name: 'Vermut Rojo', quantity: 30, unit: 'ml' },
      { name: 'Naranja', quantity: 1, unit: 'rodaja' },
      { name: 'Hielo', quantity: 80, unit: 'g' }
    ],
    active: true,
    description: 'Amargo y aromático cóctel italiano'
  },
  {
    id: 9,
    name: 'Martini',
    category: 'Cócteles',
    price: 11.50,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: 'Gin', quantity: 60, unit: 'ml' },
      { name: 'Vermut Seco', quantity: 10, unit: 'ml' },
      { name: 'Aceituna', quantity: 2, unit: 'unidades' },
      { name: 'Hielo', quantity: 100, unit: 'g' }
    ],
    active: true,
    description: 'El rey de los cócteles, elegante y seco'
  },
  {
    id: 10,
    name: 'Whisky Sour',
    category: 'Cócteles',
    price: 9.00,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: 'Whisky Bourbon', quantity: 50, unit: 'ml' },
      { name: 'Jugo de Limón', quantity: 30, unit: 'ml' },
      { name: 'Jarabe Simple', quantity: 20, unit: 'ml' },
      { name: 'Clara de Huevo', quantity: 15, unit: 'ml' },
      { name: 'Angostura Bitters', quantity: 2, unit: 'gotas' },
      { name: 'Hielo', quantity: 100, unit: 'g' }
    ],
    active: true,
    description: 'Equilibrio perfecto entre dulce y ácido'
  },
  {
    id: 11,
    name: 'Caipirinha',
    category: 'Cócteles',
    price: 8.00,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: 'Cachaça', quantity: 60, unit: 'ml' },
      { name: 'Lima', quantity: 1, unit: 'unidad' },
      { name: 'Azúcar Blanca', quantity: 2, unit: 'cucharaditas' },
      { name: 'Hielo Picado', quantity: 150, unit: 'g' }
    ],
    active: true,
    description: 'Cóctel nacional de Brasil, fresco y potente'
  },
  {
    id: 12,
    name: 'Aperol Spritz',
    category: 'Cócteles',
    price: 8.50,
    menu_id: LOS_CLASICOS_MENU_ID,
    ingredients: [
      { name: 'Aperol', quantity: 60, unit: 'ml' },
      { name: 'Prosecco', quantity: 90, unit: 'ml' },
      { name: 'Agua Mineral', quantity: 30, unit: 'ml' },
      { name: 'Naranja', quantity: 1, unit: 'rodaja' },
      { name: 'Hielo', quantity: 100, unit: 'g' }
    ],
    active: true,
    description: 'Refrescante aperitivo italiano'
  }
]


export default function ProductosPage() {
  const { t, language } = useLanguage();
  const { establishmentId } = useAuth();
  const [activeMenuId, setActiveMenuId] = useState<string>("");
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; icon: string }>>([]);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Product>({
    id: 0,
    name: '',
    category: '',
    price: 0,
    ingredients: [{ name: '', quantity: 0, unit: '' }],
    active: true,
    description: ''
  });

  // Load categories from Supabase
  useEffect(() => {
    const loadCategories = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name, icon')
        .order('display_order');

      if (!error && data) {
        setCategories(data);
      }
    };

    loadCategories();
  }, []);

  // Helper function to translate category
  const translateCategory = (category: string) => {
    if (language === 'es') return category;

    const categoryMap: Record<string, string> = {
      'Cócteles': 'Cocktails',
      'Cervezas': 'Beers',
      'Shots': 'Shots',
      'Bebidas sin alcohol': 'Non-alcoholic drinks',
      'Alimentos': 'Food',
      'Postres': 'Desserts',
      'Entradas': 'Appetizers',
      'Vinos': 'Wines',
    };
    return categoryMap[category] || category;
  };

  // Load products from Supabase when menu changes
  const handleMenuChange = async (menuId: string) => {
    console.log('ProductosPage - Menu changed to:', menuId);
    setActiveMenuId(menuId);

    if (!menuId) {
      console.log('ProductosPage - No menu selected, clearing products');
      setProducts([]);
      return;
    }

    try {
      console.log('ProductosPage - Loading products from Supabase for menu:', menuId);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('menu_id', menuId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading products:', error);
        toast.error(language === 'es' ? 'Error al cargar productos' : 'Error loading products');
        // Fallback to mock data
        const mockFiltered = initialProducts.filter(p => p.menu_id === menuId);
        setProducts(mockFiltered);
        return;
      }

      console.log('ProductosPage - Loaded products from Supabase:', data?.length || 0);

      // Convert Supabase data to Product format
      const products = (data || []).map((p: any) => ({
        id: p.id, // Keep UUID as string
        name: p.name,
        category: p.category || 'Cócteles',
        price: parseFloat(p.price) || 0,
        description: p.description || '',
        active: p.is_active,
        menu_id: p.menu_id,
        image_url: p.image_url, // Include image URL
        ingredients: [] // TODO: Load ingredients from product_ingredients table
      }));

      setProducts(products);
      setAllProducts(products);
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to mock data
      const mockFiltered = initialProducts.filter(p => p.menu_id === menuId);
      setProducts(mockFiltered);
    }
  };


  // Load products on mount
  useEffect(() => {
    console.log('ProductosPage - Initial load, setting up products');
    // In production, this would load from Supabase
    // For demo, we'll use mock data
    setAllProducts(initialProducts);
    console.log('ProductosPage - All products loaded:', initialProducts.length);
    console.log('ProductosPage - Products with los-clasicos menu_id:',
      initialProducts.filter(p => p.menu_id === 'los-clasicos').length);

    // If there's an active menu, filter products
    if (activeMenuId) {
      const filtered = initialProducts.filter(p => p.menu_id === activeMenuId);
      console.log('ProductosPage - Filtering for active menu:', activeMenuId, 'Found:', filtered.length);
      setProducts(filtered);
    } else {
      console.log('ProductosPage - No active menu, showing empty state');
      setProducts([]);
    }
  }, [activeMenuId]);


  const handleEdit = (productId: string | number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setEditingProduct(product);
      setEditForm({ ...product });
    }
  };

  const handleSaveEdit = () => {
    if (editForm) {
      setProducts(products.map(p => p.id === editForm.id ? editForm : p));
      setEditingProduct(null);
      setEditForm(null);
    }
  };

  const handleDelete = (productId: string | number) => {
    const confirmMsg = language === 'es'
      ? '¿Estás seguro de que quieres eliminar este producto?'
      : 'Are you sure you want to delete this product?';
    if (confirm(confirmMsg)) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const handleViewRecipe = (productId: string | number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setViewingProduct(product);
    }
  };

  const handleAddProduct = async () => {
    if (newProduct.name && newProduct.category && newProduct.price > 0) {
      if (!activeMenuId) {
        toast.error(language === 'es'
          ? 'Por favor selecciona un menú activo primero'
          : 'Please select an active menu first');
        return;
      }

      try {
        const supabase = createClient();

        // Debug: Check user authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error('Auth error:', authError);
          toast.error(language === 'es' ? 'Error de autenticación' : 'Authentication error');
          return;
        }

        console.log('✅ Current user:', user.id);
        console.log('✅ Establishment ID:', establishmentId);
        console.log('✅ Active Menu ID:', activeMenuId);

        const productData = {
          menu_id: activeMenuId,
          name: newProduct.name,
          category: newProduct.category,
          price: newProduct.price,
          description: newProduct.description || null,
          ingredients: newProduct.ingredients.filter(ing => ing.name && ing.quantity > 0),
          image_url: newProduct.image_url || null,
          is_active: true
        };

        console.log('📦 Product data to insert:', JSON.stringify(productData, null, 2));

        const response = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        console.log('📡 Supabase response:', response);

        if (response.error) {
          console.error('❌ Error adding product:', response.error);
          console.error('❌ Error type:', typeof response.error);
          console.error('❌ Error keys:', Object.keys(response.error));
          console.error('❌ Error details:', {
            message: response.error.message,
            code: response.error.code,
            details: response.error.details,
            hint: response.error.hint,
            full: JSON.stringify(response.error)
          });
          toast.error(`Error: ${response.error.message || response.error.code || 'Error desconocido'}`);
          return;
        }

        if (response.data) {
          // Add to local state
          const productToAdd = {
            ...newProduct,
            id: response.data.id,
            menu_id: activeMenuId,
            ingredients: newProduct.ingredients.filter(ing => ing.name && ing.quantity > 0)
          };

          setAllProducts([...allProducts, productToAdd]);
          setProducts([...products, productToAdd]);

          toast.success(language === 'es' ? 'Producto agregado exitosamente' : 'Product added successfully');
        }

        setIsAddingProduct(false);

        // Reset form
        setNewProduct({
          id: 0,
          name: '',
          category: '',
          price: 0,
          ingredients: [{ name: '', quantity: 0, unit: '' }],
          active: true,
          description: ''
        });
      } catch (error) {
        console.error('💥 Unexpected error:', error);
        toast.error(language === 'es' ? 'Error inesperado al agregar producto' : 'Unexpected error adding product');
      }
    } else {
      toast.error(language === 'es'
        ? 'Por favor completa todos los campos requeridos'
        : 'Please fill in all required fields');
    }
  };

  const addIngredientToNew = () => {
    setNewProduct({
      ...newProduct,
      ingredients: [...newProduct.ingredients, { name: '', quantity: 0, unit: '' }]
    });
  };

  const removeIngredientFromNew = (index: number) => {
    setNewProduct({
      ...newProduct,
      ingredients: newProduct.ingredients.filter((_, idx) => idx !== index)
    });
  };

  return (
    <div className="min-h-svh bg-background">
      <DemoSidebar />
      <nav className="border-b neumorphic-inset">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/demo" className="block">
              <img
                src="/modoclaro.png"
                alt="Barmode"
                className="h-8 dark:hidden object-contain"
              />
              <img
                src="/modoscuro.png"
                alt="Barmode"
                className="h-8 hidden dark:block object-contain"
              />
            </Link>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-background p-6 ml-0 md:ml-20 lg:ml-72">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>{t('productManagement')}</h2>
              <p className="text-muted-foreground">{t('menuRecipes')}</p>
            </div>
          </div>

          {/* Menu Manager */}
          <div className="mb-8">
            <MenuManager onMenuChange={handleMenuChange} />
          </div>

          {/* Botón Diseñar Menú */}
          <div className="mb-8">
            <GlowButton onClick={() => setIsAddingProduct(true)}>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-inner">
                <Plus className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="hidden sm:inline">{t('addProduct')}</span>
            </GlowButton>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-2">
                {activeMenuId
                  ? (language === 'es' ? 'No hay productos en este menú' : 'No products in this menu')
                  : (language === 'es' ? 'No hay menú activo' : 'No active menu')}
              </p>
              <p className="text-sm text-muted-foreground">
                {activeMenuId
                  ? (language === 'es' ? 'Usa el botón "Agregar Producto" para crear productos en este menú' : 'Use the "Add Product" button to create products in this menu')
                  : (language === 'es' ? 'Activa "Los Clásicos" o crea un nuevo menú para comenzar' : 'Activate "Los Clásicos" or create a new menu to begin')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="relative rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] h-[180px] group"
                  style={{
                    backgroundImage: product.image_url
                      ? `url(${product.image_url})`
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  onClick={() => handleViewRecipe(product.id)}
                >
                  {/* Dark overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />

                  {/* Active badge */}
                  {product.active && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="bg-green-600 text-white text-xs">
                        {t('active')}
                      </Badge>
                    </div>
                  )}

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-end p-3">
                    {/* Product info */}
                    <div className="mb-2">
                      <h4 className="font-bold text-white text-sm line-clamp-2 drop-shadow-lg">
                        {product.name}
                      </h4>
                      <p className="text-xs text-white/70">{translateCategory(product.category)}</p>
                      <p className="text-lg font-bold text-white drop-shadow-lg mt-1">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 bg-transparent border-2 border-white text-white hover:bg-white/20 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(product.id);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        {t('edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500/20 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t('delete')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Ver Receta */}
        {viewingProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingProduct(null)}>
            <Card className="neumorphic border-0 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{viewingProduct.name}</CardTitle>
                    <CardDescription className="mt-2">{viewingProduct.description}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setViewingProduct(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <Badge variant="outline" className="text-base">{viewingProduct.category}</Badge>
                  <span className="text-2xl font-bold text-primary">${viewingProduct.price.toFixed(2)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">{t('ingredients')}:</h3>
                    <div className="space-y-2">
                      {viewingProduct.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg neumorphic-inset">
                          <span className="font-medium">{ing.name}</span>
                          <span className="text-muted-foreground">{ing.quantity} {ing.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal Diseñar Menú (Agregar Producto) */}
        {isAddingProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsAddingProduct(false)}>
            <Card className="neumorphic border-0 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-2xl">{language === 'es' ? 'Diseñar Nuevo Producto' : 'Design New Product'}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsAddingProduct(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <CardDescription>{language === 'es' ? 'Crea un nuevo producto para tu menú' : 'Create a new product for your menu'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-name">{t('productName')} *</Label>
                      <Input
                        id="new-name"
                        placeholder={language === 'es' ? 'Ej: Mojito Clásico' : 'Ex: Classic Mojito'}
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-category">{t('category')} *</Label>
                      <Select
                        value={newProduct.category}
                        onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                      >
                        <SelectTrigger id="new-category">
                          <SelectValue placeholder={language === 'es' ? 'Selecciona una categoría' : 'Select a category'} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              <span className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                <span>{cat.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-price">{t('price')} *</Label>
                    <Input
                      id="new-price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newProduct.price || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-description">{t('description')}</Label>
                    <Input
                      id="new-description"
                      placeholder={language === 'es' ? 'Describe tu producto...' : 'Describe your product...'}
                      value={newProduct.description || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('ingredients')}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIngredientToNew}
                        className="neumorphic-hover border-0"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {t('add')}
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {newProduct.ingredients.map((ing, idx) => (
                        <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 p-2 rounded-lg neumorphic-inset">
                          <Input
                            placeholder={language === 'es' ? 'Ingrediente' : 'Ingredient'}
                            value={ing.name}
                            onChange={(e) => {
                              const newIngredients = [...newProduct.ingredients];
                              newIngredients[idx].name = e.target.value;
                              setNewProduct({ ...newProduct, ingredients: newIngredients });
                            }}
                          />
                          <Input
                            type="number"
                            placeholder={language === 'es' ? 'Cantidad' : 'Quantity'}
                            value={ing.quantity || ''}
                            onChange={(e) => {
                              const newIngredients = [...newProduct.ingredients];
                              newIngredients[idx].quantity = parseFloat(e.target.value) || 0;
                              setNewProduct({ ...newProduct, ingredients: newIngredients });
                            }}
                          />
                          <Input
                            placeholder={language === 'es' ? 'Unidad' : 'Unit'}
                            value={ing.unit}
                            onChange={(e) => {
                              const newIngredients = [...newProduct.ingredients];
                              newIngredients[idx].unit = e.target.value;
                              setNewProduct({ ...newProduct, ingredients: newIngredients });
                            }}
                          />
                          {newProduct.ingredients.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeIngredientFromNew(idx)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleAddProduct}
                      className="flex-1"
                      disabled={!newProduct.name || !newProduct.category || newProduct.price <= 0}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {language === 'es' ? 'Crear Producto' : 'Create Product'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingProduct(false)} className="flex-1">
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal Editar Producto */}
        {editingProduct && editForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingProduct(null)}>
            <Card className="neumorphic border-0 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-2xl">{t('editProduct')}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setEditingProduct(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('name')}</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">{t('category')}</Label>
                      <Select
                        value={editForm.category}
                        onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder={language === 'es' ? 'Selecciona una categoría' : 'Select a category'} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              <span className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                <span>{cat.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">{t('price')}</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t('description')}</Label>
                    <Input
                      id="description"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('ingredients')}</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newIngredients = [...editForm.ingredients, { name: '', quantity: 0, unit: '' }];
                          setEditForm({ ...editForm, ingredients: newIngredients });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {language === 'es' ? 'Agregar Ingrediente' : 'Add Ingredient'}
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {editForm.ingredients.map((ing, idx) => (
                        <div key={idx} className="grid grid-cols-[1fr,1fr,1fr,auto] gap-2 p-2 rounded-lg neumorphic-inset">
                          <Input
                            placeholder={language === 'es' ? 'Ingrediente' : 'Ingredient'}
                            value={ing.name}
                            onChange={(e) => {
                              const newIngredients = [...editForm.ingredients];
                              newIngredients[idx].name = e.target.value;
                              setEditForm({ ...editForm, ingredients: newIngredients });
                            }}
                          />
                          <Input
                            type="number"
                            placeholder={language === 'es' ? 'Cantidad' : 'Quantity'}
                            value={isNaN(ing.quantity) ? '' : ing.quantity}
                            onChange={(e) => {
                              const newIngredients = [...editForm.ingredients];
                              newIngredients[idx].quantity = parseFloat(e.target.value) || 0;
                              setEditForm({ ...editForm, ingredients: newIngredients });
                            }}
                          />
                          <Input
                            placeholder={language === 'es' ? 'Unidad' : 'Unit'}
                            value={ing.unit}
                            onChange={(e) => {
                              const newIngredients = [...editForm.ingredients];
                              newIngredients[idx].unit = e.target.value;
                              setEditForm({ ...editForm, ingredients: newIngredients });
                            }}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const newIngredients = editForm.ingredients.filter((_, i) => i !== idx);
                              setEditForm({ ...editForm, ingredients: newIngredients });
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveEdit} className="flex-1">
                      {language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingProduct(null)} className="flex-1">
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
