'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Trash2, Send, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { usePOS } from './pos-context';
import { ProductImage } from '@/components/products/product-image';
import { AccountItem, Product } from './types';
import { formatCurrency } from '@/lib/format';

// Single Responsibility: Only handles order creation and sending to tables
export function OrdersTab() {
     const { t, language } = useLanguage();
     const {
          products,
          categories,
          loadingProducts,
          currentOrder,
          setCurrentOrder,
          selectedTableForOrder,
          setSelectedTableForOrder,
          productQuantities,
          setProductQuantities,
          getAllTablesAndBars,
          sendOrderToTable,
          setActiveTab,
     } = usePOS();

     const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
     const [searchTerm, setSearchTerm] = useState('');

     const translateCategory = (category: string) => {
          if (language === 'es') return category;
          const categoryMap: Record<string, string> = {
               'Todos': 'All',
               'Cócteles': 'Cocktails',
               'Cervezas': 'Beers',
               'Shots': 'Shots',
               'Bebidas sin alcohol': 'Non-alcoholic',
               'Alimentos': 'Food',
               'Postres': 'Desserts',
               'Entradas': 'Appetizers',
               'Vinos': 'Wines',
               'Licores': 'Spirits',
               'Bebidas alcohólicas': 'Alcoholic drinks',
          };
          return categoryMap[category] || category;
     };

     const translateName = (name: string) => {
          if (language === 'es') return name;
          if (name.startsWith('Mesa ')) return 'Table ' + name.substring(5);
          if (name.startsWith('Barra ')) return 'Bar ' + name.substring(6);
          return name;
     };

     const filteredProducts = products.filter(p => {
          const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
          const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesCategory && matchesSearch;
     });

     const tablesAndBars = getAllTablesAndBars();

     const addProductToOrder = (product: Product, quantity: number = 1) => {
          const newItem: AccountItem = {
               id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
               productName: product.name,
               quantity,
               unitPrice: product.price ?? 0,
               total: (product.price ?? 0) * quantity,
               timestamp: new Date(),
          };

          setCurrentOrder([...currentOrder, newItem]);
          setProductQuantities({ ...productQuantities, [product.id]: 0 });
     };

     const updateProductQuantity = (productId: string, quantity: number) => {
          setProductQuantities({ ...productQuantities, [productId]: Math.max(0, quantity) });
     };

     const getProductQuantity = (productId: string): number => {
          return productQuantities[productId] || 0;
     };

     const removeOrderItem = (itemId: string) => {
          setCurrentOrder(currentOrder.filter(item => item.id !== itemId));
     };

     const updateOrderQuantity = (itemId: string, change: number) => {
          setCurrentOrder(currentOrder.map(item => {
               if (item.id === itemId) {
                    const newQuantity = Math.max(1, item.quantity + change);
                    return {
                         ...item,
                         quantity: newQuantity,
                         total: item.unitPrice * newQuantity,
                    };
               }
               return item;
          }));
     };

     const getOrderTotal = () => {
          return currentOrder.reduce((sum, item) => sum + item.total, 0);
     };

     const handleSendOrder = async () => {
          if (!selectedTableForOrder || currentOrder.length === 0) return;
          await sendOrderToTable();
     };

     if (loadingProducts) {
          return (
               <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">
                         {language === 'es' ? 'Cargando productos...' : 'Loading products...'}
                    </span>
               </div>
          );
     }

     return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Products Section */}
               <div className="lg:col-span-2 space-y-4">
                    {/* Table/Bar Selection */}
                    <Card className="neumorphic border-0 p-4">
                         <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1">
                                   <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                        {language === 'es' ? 'Seleccionar Mesa/Barra' : 'Select Table/Bar'}
                                   </label>
                                   <Select value={selectedTableForOrder || ''} onValueChange={setSelectedTableForOrder}>
                                        <SelectTrigger className="w-full">
                                             <SelectValue placeholder={language === 'es' ? 'Seleccionar destino...' : 'Select destination...'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {tablesAndBars.map(item => (
                                                  <SelectItem key={item.id} value={item.id}>
                                                       <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${item.status === 'libre' ? 'bg-green-500' :
                                                                 item.status === 'ocupada' ? 'bg-blue-500' :
                                                                      item.status === 'por-pagar' ? 'bg-orange-500' :
                                                                           'bg-yellow-500'
                                                                 }`}></span>
                                                            {translateName(item.name)}
                                                       </div>
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>
                              <Button
                                   variant="outline"
                                   onClick={() => setActiveTab('mesas')}
                                   className="sm:self-end"
                              >
                                   {language === 'es' ? 'Ver Mesas' : 'View Tables'}
                              </Button>
                         </div>
                    </Card>

                    {/* Search and Filters */}
                    <Card className="neumorphic border-0 p-4">
                         <div className="space-y-3">
                              <Input
                                   placeholder={language === 'es' ? 'Buscar productos...' : 'Search products...'}
                                   value={searchTerm}
                                   onChange={(e) => setSearchTerm(e.target.value)}
                                   className="w-full"
                              />
                              <div className="flex gap-2 flex-wrap">
                                   {categories.map(category => (
                                        <Button
                                             key={category}
                                             variant={selectedCategory === category ? 'default' : 'outline'}
                                             size="sm"
                                             onClick={() => setSelectedCategory(category)}
                                             className="neumorphic-hover"
                                        >
                                             {translateCategory(category)}
                                        </Button>
                                   ))}
                              </div>
                         </div>
                    </Card>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                         {filteredProducts.length === 0 ? (
                              <div className="col-span-full text-center py-12 text-muted-foreground">
                                   <p>{language === 'es' ? 'No hay productos disponibles' : 'No products available'}</p>
                              </div>
                         ) : (
                              filteredProducts.map(product => {
                                   const quantity = getProductQuantity(product.id);
                                   return (
                                        <div
                                             key={product.id}
                                             className="relative rounded-xl overflow-hidden transition-transform hover:scale-[1.02] h-[160px] group"
                                             style={{
                                                  backgroundImage: product.image_url
                                                       ? `url(${product.image_url})`
                                                       : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                  backgroundSize: 'cover',
                                                  backgroundPosition: 'center',
                                             }}
                                        >
                                             {/* Dark overlay gradient */}
                                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                                             {/* Content */}
                                             <div className="relative h-full flex flex-col justify-end p-3">
                                                  {/* Product info */}
                                                  <div className="mb-2">
                                                       <h4 className="font-bold text-white text-sm line-clamp-2 drop-shadow-lg">
                                                            {product.name}
                                                       </h4>
                                                       <p className="text-xl font-bold text-white drop-shadow-lg">
                                                            {formatCurrency(product.price)}
                                                       </p>
                                                  </div>

                                                  {/* Controls */}
                                                  <div className="flex items-center justify-center gap-2">
                                                       <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 bg-white/90 hover:bg-white dark:bg-black/70 dark:hover:bg-black/90 border-0 text-black dark:text-white"
                                                            onClick={() => updateProductQuantity(product.id, quantity - 1)}
                                                            disabled={quantity === 0}
                                                       >
                                                            <Minus className="w-4 h-4" />
                                                       </Button>
                                                       <span className="w-8 text-center font-bold text-lg text-white drop-shadow-lg">
                                                            {quantity}
                                                       </span>
                                                       <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 bg-white/90 hover:bg-white dark:bg-black/70 dark:hover:bg-black/90 border-0 text-black dark:text-white"
                                                            onClick={() => updateProductQuantity(product.id, quantity + 1)}
                                                       >
                                                            <Plus className="w-4 h-4" />
                                                       </Button>
                                                       {quantity > 0 && (
                                                            <Button
                                                                 size="sm"
                                                                 className="ml-1 h-8 px-3 bg-white hover:bg-white/90 dark:bg-black/70 dark:hover:bg-black/90 text-black dark:text-white font-semibold"
                                                                 onClick={() => addProductToOrder(product, quantity)}
                                                            >
                                                                 {language === 'es' ? 'Añadir' : 'Add'}
                                                            </Button>
                                                       )}
                                                  </div>
                                             </div>
                                        </div>
                                   );
                              })
                         )}
                    </div>
               </div>

               {/* Order Summary */}
               <div className="space-y-4">
                    <Card className="neumorphic border-0 p-4 sticky top-4">
                         <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-bold">
                                   {language === 'es' ? 'Orden Actual' : 'Current Order'}
                              </h3>
                              {currentOrder.length > 0 && (
                                   <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCurrentOrder([])}
                                        className="text-destructive"
                                   >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        {language === 'es' ? 'Limpiar' : 'Clear'}
                                   </Button>
                              )}
                         </div>

                         {currentOrder.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                   <p className="text-sm">{language === 'es' ? 'Orden vacía' : 'Empty order'}</p>
                                   <p className="text-xs mt-1">{language === 'es' ? 'Añade productos para comenzar' : 'Add products to start'}</p>
                              </div>
                         ) : (
                              <>
                                   <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                                        {currentOrder.map(item => (
                                             <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                                  <div className="flex-1 min-w-0">
                                                       <p className="font-medium text-sm truncate">{item.productName}</p>
                                                       <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} c/u</p>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                       <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-6 w-6 dark:text-white"
                                                            onClick={() => updateOrderQuantity(item.id, -1)}
                                                       >
                                                            <Minus className="w-3 h-3" />
                                                       </Button>
                                                       <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                                       <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-6 w-6 dark:text-white"
                                                            onClick={() => updateOrderQuantity(item.id, 1)}
                                                       >
                                                            <Plus className="w-3 h-3" />
                                                       </Button>
                                                       <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-destructive"
                                                            onClick={() => removeOrderItem(item.id)}
                                                       >
                                                            <Trash2 className="w-3 h-3" />
                                                       </Button>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>

                                   <div className="border-t pt-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                             <span className="text-lg font-semibold">Total:</span>
                                             <span className="text-2xl font-bold text-primary">{formatCurrency(getOrderTotal())}</span>
                                        </div>

                                        <Button
                                             className="w-full"
                                             size="lg"
                                             onClick={handleSendOrder}
                                             disabled={!selectedTableForOrder || currentOrder.length === 0}
                                        >
                                             <Send className="w-4 h-4 mr-2" />
                                             {language === 'es' ? 'Enviar Orden' : 'Send Order'}
                                        </Button>

                                        {!selectedTableForOrder && (
                                             <p className="text-xs text-center text-muted-foreground">
                                                  {language === 'es' ? 'Selecciona una mesa o barra primero' : 'Select a table or bar first'}
                                             </p>
                                        )}
                                   </div>
                              </>
                         )}
                    </Card>
               </div>
          </div>
     );
}
