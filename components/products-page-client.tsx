"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye, Plus, ArrowLeft } from 'lucide-react';
import { EditProductDialog } from "@/components/edit-product-dialog";
import { DeleteProductDialog } from "@/components/delete-product-dialog";
import { ViewRecipeDialog } from "@/components/view-recipe-dialog";
import { AddProductDialog } from "@/components/add-product-dialog";
import { MenuManager, MenuData } from "@/components/menu-manager";
import { GlowButton } from "@/components/glow-button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/use-language";

interface Supply {
     id: string;
     name: string;
     unit: string;
     current_quantity?: number;
}

interface ProductIngredient {
     id: string;
     quantity_needed: number;
     supply_id: string;
     supplies: Supply;
}

interface Product {
     id: string;
     name: string;
     category: string | null;
     price: number;
     description: string | null;
     is_active: boolean;
     menu_id?: string;
     image_url?: string | null;
     product_ingredients: ProductIngredient[];
}

interface ProductsPageClientProps {
     initialProducts: Product[];
     supplies: Supply[];
     establishmentId: string;
}

export function ProductsPageClient({ initialProducts, supplies, establishmentId }: ProductsPageClientProps) {
     const { t, language } = useLanguage();
     const [products, setProducts] = useState<Product[]>([]);
     const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);
     const [activeMenuId, setActiveMenuId] = useState<string>("");
     const [secondaryMenuId, setSecondaryMenuId] = useState<string | null>(null);
     const [editingProduct, setEditingProduct] = useState<Product | null>(null);
     const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
     const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
     const [isLoading, setIsLoading] = useState(false);

     // State for viewing products of a specific menu
     const [selectedMenu, setSelectedMenu] = useState<MenuData | null>(null);

     // Load products from Supabase for selected menus
     const loadProductsForMenus = useCallback(async (primaryId: string | null, secondaryId: string | null) => {
          const menuIds = [primaryId, secondaryId].filter(Boolean) as string[];

          if (menuIds.length === 0) {
               console.log('ProductsPageClient - No menus selected, clearing products');
               setProducts([]);
               return;
          }

          try {
               setIsLoading(true);
               console.log('ProductsPageClient - Loading products for menus:', menuIds);
               const supabase = createClient();

               const { data, error } = await supabase
                    .from('products')
                    .select(`
          *,
          product_ingredients (
            id,
            quantity_needed,
            supply_id,
            supplies (
              id,
              name,
              unit
            )
          )
        `)
                    .in('menu_id', menuIds)
                    .order('created_at', { ascending: false });

               if (error) {
                    console.error('Error loading products:', error);
                    toast.error(language === 'es' ? 'Error al cargar productos' : 'Error loading products');
                    // Fallback to filtering from initial products
                    const filtered = allProducts.filter(p => p.menu_id && menuIds.includes(p.menu_id));
                    setProducts(filtered);
                    return;
               }

               console.log('ProductsPageClient - Loaded products:', data?.length || 0);
               setProducts(data || []);
               setAllProducts(prev => {
                    // Merge loaded products with existing ones
                    const existingIds = new Set(data?.map(p => p.id) || []);
                    const otherProducts = prev.filter(p => !existingIds.has(p.id) && (!p.menu_id || !menuIds.includes(p.menu_id)));
                    return [...(data || []), ...otherProducts];
               });
          } catch (error) {
               console.error('Error loading products:', error);
               const filtered = allProducts.filter(p => p.menu_id && menuIds.includes(p.menu_id));
               setProducts(filtered);
          } finally {
               setIsLoading(false);
          }
     }, [allProducts, language]);

     // Handle menu change (backward compatibility)
     const handleMenuChange = useCallback((menuId: string) => {
          console.log('ProductsPageClient - Menu changed to:', menuId);
          setActiveMenuId(menuId);
          if (!selectedMenu) {
               loadProductsForMenus(menuId, secondaryMenuId);
          }
     }, [secondaryMenuId, loadProductsForMenus, selectedMenu]);

     // Handle both primary and secondary menu changes
     const handleActiveMenusChange = useCallback((primaryMenuId: string | null, secondaryMenuIdNew: string | null) => {
          console.log('ProductsPageClient - Active menus changed:', { primaryMenuId, secondaryMenuIdNew });
          setActiveMenuId(primaryMenuId || "");
          setSecondaryMenuId(secondaryMenuIdNew);
          if (!selectedMenu) {
               loadProductsForMenus(primaryMenuId, secondaryMenuIdNew);
          }
     }, [loadProductsForMenus, selectedMenu]);

     // Handle click on a menu card to view its products
     const handleMenuClick = useCallback(async (menu: MenuData) => {
          console.log('ProductsPageClient - Menu clicked:', menu.name, menu.id);
          setSelectedMenu(menu);
          setIsLoading(true);

          try {
               const supabase = createClient();
               const { data, error } = await supabase
                    .from('products')
                    .select(`
                         *,
                         product_ingredients (
                              id,
                              quantity_needed,
                              supply_id,
                              supplies (
                                   id,
                                   name,
                                   unit
                              )
                         )
                    `)
                    .eq('menu_id', menu.id)
                    .order('created_at', { ascending: false });

               if (error) {
                    console.error('Error loading products for menu:', error);
                    const filtered = allProducts.filter(p => p.menu_id === menu.id);
                    setProducts(filtered);
                    return;
               }

               setProducts(data || []);
          } catch (error) {
               console.error('Error loading products for menu:', error);
               const filtered = allProducts.filter(p => p.menu_id === menu.id);
               setProducts(filtered);
          } finally {
               setIsLoading(false);
          }
     }, [allProducts]);

     // Handle going back to menu management view
     const handleBackToMenus = useCallback(() => {
          setSelectedMenu(null);
          loadProductsForMenus(activeMenuId, secondaryMenuId);
     }, [activeMenuId, secondaryMenuId, loadProductsForMenus]);

     const handleProductUpdated = (updatedProduct: Product) => {
          setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
          setAllProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
     };

     const handleProductDeleted = (deletedId: string) => {
          setProducts(prev => prev.filter(p => p.id !== deletedId));
          setAllProducts(prev => prev.filter(p => p.id !== deletedId));
     };

     // Translate category
     const translateCategory = (category: string | null) => {
          if (!category) return '';
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

     return (
          <div className="space-y-6">
               {/* Header when viewing specific menu products */}
               {selectedMenu && (
                    <div className="mb-6">
                         <div className="flex items-center gap-4 mb-4">
                              <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={handleBackToMenus}
                                   className="gap-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 hover:from-violet-500/20 hover:via-purple-500/20 hover:to-fuchsia-500/20 border border-violet-500/30 hover:border-violet-500/50 transition-all duration-300 shadow-sm hover:shadow-md text-violet-700 dark:text-violet-300 font-medium"
                              >
                                   <ArrowLeft className="w-5 h-5" />
                                   {language === 'es' ? '← Volver a Gestión de Menús' : '← Back to Menu Management'}
                              </Button>
                         </div>
                         <h2 className="text-2xl font-bold mb-2">{selectedMenu.name}</h2>
                         <div className="flex items-center gap-2">
                              <p className="text-muted-foreground">
                                   {language === 'es' ? 'Productos del menú' : 'Menu products'}
                              </p>
                              {selectedMenu.is_active && (
                                   <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs">
                                        {language === 'es' ? 'Principal' : 'Primary'}
                                   </Badge>
                              )}
                              {selectedMenu.is_secondary_active && (
                                   <Badge className="text-white text-xs" style={{ background: 'linear-gradient(135deg, #B4A0D8 0%, #A8B0D8 100%)' }}>
                                        {language === 'es' ? 'Secundario' : 'Secondary'}
                                   </Badge>
                              )}
                         </div>
                    </div>
               )}

               {/* Menu Manager - only show when not viewing specific menu products */}
               {!selectedMenu && (
                    <div className="mb-6">
                         <MenuManager
                              onMenuChange={handleMenuChange}
                              onActiveMenusChange={handleActiveMenusChange}
                              onMenuClick={handleMenuClick}
                         />
                    </div>
               )}

               {/* Add Product Button */}
               {(selectedMenu || activeMenuId) && (
                    <div className="mb-4">
                         <AddProductDialog
                              establishmentId={establishmentId}
                              supplies={supplies}
                              menuId={selectedMenu?.id || activeMenuId}
                         />
                    </div>
               )}

               {/* Loading State */}
               {isLoading && (
                    <div className="text-center py-8">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                         <p className="text-muted-foreground mt-2">
                              {language === 'es' ? 'Cargando productos...' : 'Loading products...'}
                         </p>
                    </div>
               )}

               {/* Empty State */}
               {!isLoading && products.length === 0 && (
                    <Card className="neumorphic border-0">
                         <CardContent className="py-12 text-center">
                              <p className="text-muted-foreground mb-4">
                                   {selectedMenu
                                        ? (language === 'es' ? `No hay productos en "${selectedMenu.name}"` : `No products in "${selectedMenu.name}"`)
                                        : !activeMenuId
                                             ? (language === 'es' ? 'Selecciona un menú para ver sus productos' : 'Select a menu to view its products')
                                             : (language === 'es' ? 'No hay productos en este menú' : 'No products in this menu')
                                   }
                              </p>
                              <p className="text-sm text-muted-foreground">
                                   {selectedMenu || activeMenuId
                                        ? (language === 'es' ? 'Usa el botón "Agregar Producto" para crear productos' : 'Use the "Add Product" button to create products')
                                        : (language === 'es' ? 'Haz clic en un menú para ver y agregar productos' : 'Click on a menu to view and add products')
                                   }
                              </p>
                         </CardContent>
                    </Card>
               )}

               {/* Products Grid */}
               {!isLoading && products.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {products.map((product) => (
                              <Card key={product.id} className="neumorphic border-0">
                                   <CardHeader>
                                        <div className="flex items-start justify-between">
                                             <div className="flex-1">
                                                  <CardTitle className="text-xl mb-2 text-balance">{product.name}</CardTitle>
                                                  <div className="flex gap-2 flex-wrap">
                                                       {product.category && (
                                                            <Badge variant="secondary" className="capitalize">
                                                                 {translateCategory(product.category)}
                                                            </Badge>
                                                       )}
                                                       <Badge variant={product.is_active ? "default" : "outline"}>
                                                            {product.is_active
                                                                 ? (language === 'es' ? 'Activo' : 'Active')
                                                                 : (language === 'es' ? 'Inactivo' : 'Inactive')
                                                            }
                                                       </Badge>
                                                  </div>
                                             </div>
                                        </div>
                                   </CardHeader>
                                   <CardContent>
                                        <div className="space-y-4">
                                             {product.description && (
                                                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                       {product.description}
                                                  </p>
                                             )}
                                             <div className="flex items-center justify-between">
                                                  <span className="text-2xl font-bold text-primary">
                                                       ${product.price.toFixed(2)}
                                                  </span>
                                                  <span className="text-sm text-muted-foreground">
                                                       {product.product_ingredients?.length || 0} {language === 'es' ? 'ingredientes' : 'ingredients'}
                                                  </span>
                                             </div>
                                             <div className="flex gap-2 pt-2">
                                                  <Button
                                                       variant="outline"
                                                       size="sm"
                                                       onClick={() => setViewingProduct(product)}
                                                       className="neumorphic-hover border-0 flex-1 gap-2"
                                                  >
                                                       <Eye className="h-4 w-4" />
                                                       {language === 'es' ? 'Ver Receta' : 'View Recipe'}
                                                  </Button>
                                                  <Button
                                                       variant="ghost"
                                                       size="icon"
                                                       onClick={() => setEditingProduct(product)}
                                                       className="neumorphic-hover h-9 w-9"
                                                  >
                                                       <Pencil className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                       variant="ghost"
                                                       size="icon"
                                                       onClick={() => setDeletingProduct(product)}
                                                       className="neumorphic-hover h-9 w-9 text-destructive hover:text-destructive"
                                                  >
                                                       <Trash2 className="h-4 w-4" />
                                                  </Button>
                                             </div>
                                        </div>
                                   </CardContent>
                              </Card>
                         ))}
                    </div>
               )}

               {/* Dialogs */}
               {editingProduct && (
                    <EditProductDialog
                         product={editingProduct}
                         supplies={supplies}
                         open={!!editingProduct}
                         onOpenChange={(open) => !open && setEditingProduct(null)}
                         onProductUpdated={handleProductUpdated}
                    />
               )}

               {deletingProduct && (
                    <DeleteProductDialog
                         product={deletingProduct}
                         open={!!deletingProduct}
                         onOpenChange={(open) => !open && setDeletingProduct(null)}
                         onProductDeleted={handleProductDeleted}
                    />
               )}

               {viewingProduct && (
                    <ViewRecipeDialog
                         product={viewingProduct}
                         open={!!viewingProduct}
                         onOpenChange={(open) => !open && setViewingProduct(null)}
                    />
               )}
          </div>
     );
}
