'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DemoSidebar } from "@/components/demo-sidebar";
import { useLanguage } from "@/hooks/use-language";
import { GlowButton } from "@/components/glow-button";
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from '@/lib/supabase/client';
import { ProductImage } from '@/components/product-image';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  menu_id: string;
  image_url?: string | null;
}

const salesHistory = [
  { id: 1, date: '2024-11-25', time: '18:45', product: 'Mojito Clásico', unitPrice: 8.50, quantity: 2, total: 17.00 },
  { id: 2, date: '2024-11-25', time: '18:52', product: 'Margarita', unitPrice: 9.00, quantity: 1, total: 9.00 },
  { id: 3, date: '2024-11-25', time: '19:10', product: 'Cerveza Corona', unitPrice: 5.00, quantity: 4, total: 20.00 },
  { id: 4, date: '2024-11-25', time: '19:25', product: 'Piña Colada', unitPrice: 10.00, quantity: 2, total: 20.00 },
  { id: 5, date: '2024-11-25', time: '19:40', product: 'Cuba Libre', unitPrice: 7.50, quantity: 3, total: 22.50 },
  { id: 6, date: '2024-11-25', time: '20:05', product: 'Tequila Shot', unitPrice: 6.00, quantity: 6, total: 36.00 },
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function VentasPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from active menu
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const supabase = createClient();

      // Get active menu
      const { data: activeMenu } = await supabase
        .from('menus')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!activeMenu) {
        setLoading(false);
        return;
      }

      // Get products from active menu
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price, category, menu_id, image_url')
        .eq('menu_id', activeMenu.id)
        .eq('is_active', true);

      if (productsData) {
        setProducts(productsData);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  // Get unique categories
  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart functions
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = (paymentMethod: 'cash' | 'card') => {
    // TODO: Implement actual checkout logic
    alert(`Venta procesada con ${paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}: $${calculateTotal().toFixed(2)}`);
    clearCart();
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Ventas
            </h2>
            <p className="text-muted-foreground">Punto de venta y registro de transacciones</p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-sm w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('pos')}
                className={`px-6 py-2.5 rounded-full transition-colors flex items-center gap-2 ${activeTab === 'pos'
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Punto de Venta
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-6 py-2.5 rounded-full transition-colors flex items-center gap-2 ${activeTab === 'history'
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                📊 Registro de Ventas
              </button>
            </div>
          </div>

          {/* POS Tab */}
          {activeTab === 'pos' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Products Section */}
              <div className="lg:col-span-2 space-y-4">
                {/* Search and Filters */}
                <Card className="neumorphic border-0 p-4">
                  <div className="space-y-3">
                    <Input
                      placeholder="Buscar productos..."
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
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {loading ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <p>Cargando productos...</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <p>No hay productos disponibles</p>
                      <p className="text-sm mt-2">Agrega productos en la sección de Productos</p>
                    </div>
                  ) : (
                    filteredProducts.map(product => (
                      <Card
                        key={product.id}
                        className="neumorphic border-0 p-4 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => addToCart(product)}
                      >
                        <div className="text-center">
                          {/* Product Image */}
                          <div className="flex justify-center mb-3">
                            <ProductImage
                              src={product.image_url}
                              alt={product.name}
                              size={80}
                            />
                          </div>
                          <h4 className="font-semibold text-sm mb-1">{product.name}</h4>
                          <Badge variant="outline" className="text-xs mb-2">{product.category}</Badge>
                          <p className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Cart Section */}
              <div className="space-y-4">
                <Card className="neumorphic border-0 p-4 sticky top-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Carrito</h3>
                    {cart.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCart}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Limpiar
                      </Button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Carrito vacío</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                        {cart.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total:</span>
                          <span className="text-2xl font-bold text-primary">${calculateTotal().toFixed(2)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <GlowButton onClick={() => handleCheckout('cash')} className="w-full">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-inner">
                              <Banknote className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm">Efectivo</span>
                          </GlowButton>
                          <GlowButton onClick={() => handleCheckout('card')} className="w-full">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-inner">
                              <CreditCard className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm">Tarjeta</span>
                          </GlowButton>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="neumorphic border-0 p-6">
                  <div className="text-sm text-muted-foreground mb-1">Ventas Hoy</div>
                  <div className="text-3xl font-bold text-green-600">$4,250</div>
                  <div className="text-xs text-muted-foreground mt-1">+15% vs ayer</div>
                </Card>
                <Card className="neumorphic border-0 p-6">
                  <div className="text-sm text-muted-foreground mb-1">Transacciones</div>
                  <div className="text-3xl font-bold">87</div>
                  <div className="text-xs text-muted-foreground mt-1">Hoy</div>
                </Card>
                <Card className="neumorphic border-0 p-6">
                  <div className="text-sm text-muted-foreground mb-1">Ticket Promedio</div>
                  <div className="text-3xl font-bold">$48.85</div>
                  <div className="text-xs text-muted-foreground mt-1">+8% vs ayer</div>
                </Card>
              </div>

              {/* Sales Table */}
              <Card className="neumorphic border-0">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4">{t('recentTransactions')}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>{t('time')}</TableHead>
                        <TableHead>{t('product')}</TableHead>
                        <TableHead>Precio Unitario</TableHead>
                        <TableHead>{t('quantity')}</TableHead>
                        <TableHead className="text-right">{t('total')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesHistory.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{new Date(sale.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                          <TableCell>{sale.time}</TableCell>
                          <TableCell className="font-medium">{sale.product}</TableCell>
                          <TableCell>${sale.unitPrice.toFixed(2)}</TableCell>
                          <TableCell>{sale.quantity}x</TableCell>
                          <TableCell className="text-right font-bold">${sale.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
