'use client';

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DemoSidebar } from "@/components/demo-sidebar"
import { Plus, Edit, Trash2, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/hooks/use-language"
import { MenuManager } from "@/components/menu-manager"


interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  active: boolean;
  description?: string;
  menu_id?: string; // Added for menu filtering
}

const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Mojito Clásico',
    category: 'Cócteles',
    price: 8.50,
    ingredients: [
      { name: 'Ron Blanco', quantity: 50, unit: 'ml' },
      { name: 'Hierbabuena', quantity: 10, unit: 'hojas' },
      { name: 'Azúcar', quantity: 2, unit: 'cucharadas' },
      { name: 'Limón', quantity: 1, unit: 'unidad' },
      { name: 'Agua Mineral', quantity: 100, unit: 'ml' }
    ],
    active: true,
    description: 'Refrescante cóctel cubano con hierbabuena y ron'
  },
  {
    id: 2,
    name: 'Margarita',
    category: 'Cócteles',
    price: 9.00,
    ingredients: [
      { name: 'Tequila', quantity: 50, unit: 'ml' },
      { name: 'Triple Sec', quantity: 25, unit: 'ml' },
      { name: 'Jugo de Limón', quantity: 30, unit: 'ml' },
      { name: 'Sal', quantity: 1, unit: 'pizca' }
    ],
    active: true,
    description: 'Clásico cóctel mexicano con tequila y limón'
  },
  {
    id: 3,
    name: 'Piña Colada',
    category: 'Cócteles',
    price: 10.00,
    ingredients: [
      { name: 'Ron Blanco', quantity: 50, unit: 'ml' },
      { name: 'Crema de Coco', quantity: 30, unit: 'ml' },
      { name: 'Jugo de Piña', quantity: 90, unit: 'ml' },
      { name: 'Piña', quantity: 50, unit: 'g' },
      { name: 'Hielo', quantity: 100, unit: 'g' },
      { name: 'Cereza', quantity: 1, unit: 'unidad' }
    ],
    active: true,
    description: 'Tropical y cremoso cóctel caribeño'
  },
  {
    id: 4,
    name: 'Cuba Libre',
    category: 'Cócteles',
    price: 7.50,
    ingredients: [
      { name: 'Ron Blanco', quantity: 50, unit: 'ml' },
      { name: 'Coca Cola', quantity: 120, unit: 'ml' },
      { name: 'Limón', quantity: 0.5, unit: 'unidad' }
    ],
    active: true,
    description: 'Simple y delicioso, ron con cola y limón'
  },
  {
    id: 5,
    name: 'Cerveza Corona',
    category: 'Cervezas',
    price: 5.00,
    ingredients: [
      { name: 'Cerveza Corona', quantity: 355, unit: 'ml' }
    ],
    active: true,
    description: 'Cerveza mexicana premium'
  },
  {
    id: 6,
    name: 'Tequila Shot',
    category: 'Shots',
    price: 6.00,
    ingredients: [
      { name: 'Tequila', quantity: 45, unit: 'ml' },
      { name: 'Sal', quantity: 1, unit: 'pizca' }
    ],
    active: true,
    description: 'Shot de tequila tradicional'
  },
]

export default function ProductosPage() {
  const { t } = useLanguage();
  const [activeMenuId, setActiveMenuId] = useState<string>("");
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);
  const [products, setProducts] = useState<Product[]>(initialProducts);
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

  // Helper function to translate category
  const translateCategory = (category: string) => {
    const categoryMap: Record<string, string> = {
      'Cócteles': t('cocktails'),
      'Cervezas': t('beers'),
      'Shots': t('shots'),
    };
    return categoryMap[category] || category;
  };

  // Filter products when active menu changes
  const handleMenuChange = (menuId: string) => {
    setActiveMenuId(menuId);

    // Filter products by menu_id
    // In demo mode, we simulate filtering by showing all products
    // In production, this would filter from database
    if (menuId) {
      // For now, show all products (mock data doesn't have menu_id)
      // TODO: Filter from Supabase: WHERE menu_id = menuId
      setProducts(allProducts);
      console.log('Filtering products for menu:', menuId);
    } else {
      setProducts([]);
    }
  };

  // Load products on mount
  useEffect(() => {
    // In production, load from Supabase filtered by active menu
    // For now, use mock data
    setProducts(initialProducts);
    setAllProducts(initialProducts);
  }, []);


  const handleEdit = (productId: number) => {
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

  const handleDelete = (productId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const handleViewRecipe = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setViewingProduct(product);
    }
  };

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.category && newProduct.price > 0) {
      const productToAdd = {
        ...newProduct,
        id: Math.max(...products.map(p => p.id), 0) + 1,
        ingredients: newProduct.ingredients.filter(ing => ing.name && ing.quantity > 0)
      };
      setProducts([...products, productToAdd]);
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
            <Link href="/demo">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BarFlow
              </h1>
            </Link>
            <Link href="/demo"><Button variant="outline" className="neumorphic-hover border-0">← Dashboard</Button></Link>
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
            <Button
              className="neumorphic-hover border-0"
              onClick={() => setIsAddingProduct(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Producto
            </Button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-2">
                No hay productos en este menú
              </p>
              <p className="text-sm text-muted-foreground">
                Agrega productos para comenzar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="neumorphic border-0 cursor-pointer transition-all hover:scale-[1.02]"
                  onClick={() => handleViewRecipe(product.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      {product.active && <Badge className="bg-green-600">{t('active')}</Badge>}
                    </div>
                    <CardDescription>{translateCategory(product.category)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground">{product.ingredients.length} {t('ingredientsCount')}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="ghost"
                          className="neumorphic border-0 bg-background/50 hover:bg-background/80 focus:outline-none focus:ring-0 focus-visible:ring-0"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(product.id);
                          }}
                          title="Editar producto"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          className="neumorphic border-0 bg-background/50 hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-0 focus-visible:ring-0"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(product.id);
                          }}
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Borrar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                    <h3 className="font-semibold text-lg mb-3">Ingredientes:</h3>
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
                  <CardTitle className="text-2xl">Diseñar Nuevo Producto</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsAddingProduct(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <CardDescription>Crea un nuevo producto para tu menú</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-name">Nombre del Producto *</Label>
                      <Input
                        id="new-name"
                        placeholder="Ej: Mojito Clásico"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-category">Categoría *</Label>
                      <Input
                        id="new-category"
                        placeholder="Ej: Cócteles"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-price">Precio *</Label>
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
                    <Label htmlFor="new-description">Descripción</Label>
                    <Input
                      id="new-description"
                      placeholder="Describe tu producto..."
                      value={newProduct.description || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Ingredientes</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIngredientToNew}
                        className="neumorphic-hover border-0"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {newProduct.ingredients.map((ing, idx) => (
                        <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 p-2 rounded-lg neumorphic-inset">
                          <Input
                            placeholder="Ingrediente"
                            value={ing.name}
                            onChange={(e) => {
                              const newIngredients = [...newProduct.ingredients];
                              newIngredients[idx].name = e.target.value;
                              setNewProduct({ ...newProduct, ingredients: newIngredients });
                            }}
                          />
                          <Input
                            type="number"
                            placeholder="Cantidad"
                            value={ing.quantity || ''}
                            onChange={(e) => {
                              const newIngredients = [...newProduct.ingredients];
                              newIngredients[idx].quantity = parseFloat(e.target.value) || 0;
                              setNewProduct({ ...newProduct, ingredients: newIngredients });
                            }}
                          />
                          <Input
                            placeholder="Unidad"
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
                      Crear Producto
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingProduct(false)} className="flex-1">
                      Cancelar
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
                  <CardTitle className="text-2xl">Editar Producto</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setEditingProduct(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría</Label>
                      <Input
                        id="category"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Precio</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ingredientes</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {editForm.ingredients.map((ing, idx) => (
                        <div key={idx} className="grid grid-cols-3 gap-2 p-2 rounded-lg neumorphic-inset">
                          <Input
                            placeholder="Ingrediente"
                            value={ing.name}
                            onChange={(e) => {
                              const newIngredients = [...editForm.ingredients];
                              newIngredients[idx].name = e.target.value;
                              setEditForm({ ...editForm, ingredients: newIngredients });
                            }}
                          />
                          <Input
                            type="number"
                            placeholder="Cantidad"
                            value={ing.quantity}
                            onChange={(e) => {
                              const newIngredients = [...editForm.ingredients];
                              newIngredients[idx].quantity = parseFloat(e.target.value);
                              setEditForm({ ...editForm, ingredients: newIngredients });
                            }}
                          />
                          <Input
                            placeholder="Unidad"
                            value={ing.unit}
                            onChange={(e) => {
                              const newIngredients = [...editForm.ingredients];
                              newIngredients[idx].unit = e.target.value;
                              setEditForm({ ...editForm, ingredients: newIngredients });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveEdit} className="flex-1">
                      Guardar Cambios
                    </Button>
                    <Button variant="outline" onClick={() => setEditingProduct(null)} className="flex-1">
                      Cancelar
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
