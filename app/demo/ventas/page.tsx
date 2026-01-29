'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DemoSidebar } from "@/components/demo-sidebar";
import { useLanguage } from "@/hooks/use-language";
import { GlowButton } from "@/components/glow-button";
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from '@/lib/supabase/client';
import { ProductImage } from '@/components/product-image';
import { useAuth } from '@/contexts/auth-context';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  menu_id: string;
  image_url?: string | null;
}

interface SaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Sale {
  id: string;
  order_number: string;
  table_name: string | null;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string | null;
  created_at: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function VentasPage() {
  const { t, language } = useLanguage();
  const { establishmentId } = useAuth();
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);

  // Helper to translate product categories
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

  // Helper to translate table/bar names
  const translateTableName = (name: string | null) => {
    if (!name) return '-';
    if (language === 'es') return name;
    // Translate "Mesa X" -> "Table X" and "Barra X" -> "Bar X"
    if (name.startsWith('Mesa ')) {
      return 'Table ' + name.substring(5);
    }
    if (name.startsWith('Barra ')) {
      return 'Bar ' + name.substring(6);
    }
    // Handle "Barra X - Asiento Y"
    if (name.includes(' - Asiento ')) {
      const parts = name.split(' - Asiento ');
      const barPart = parts[0].startsWith('Barra ') ? 'Bar ' + parts[0].substring(6) : parts[0];
      return `${barPart} - Seat ${parts[1]}`;
    }
    return name;
  };

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

  // Fetch sales when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && establishmentId) {
      const fetchSales = async () => {
        const supabase = createClient();

        const { data: salesData, error } = await supabase
          .from('sales')
          .select('*')
          .eq('establishment_id', establishmentId)
          .order('created_at', { ascending: false });

        if (!error && salesData) {
          setSales(salesData);
        }
      };

      fetchSales();
    }
  }, [activeTab, establishmentId]);

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
    const paymentLabel = language === 'es'
      ? (paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta')
      : (paymentMethod === 'cash' ? 'Cash' : 'Card');
    alert(`${language === 'es' ? 'Venta procesada con' : 'Sale processed with'} ${paymentLabel}: $${calculateTotal().toFixed(2)}`);
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
                alt="Flowstock"
                className="h-8 dark:hidden object-contain"
              />
              <img
                src="/modoclaro.png"
                alt="Flowstock"
                className="h-8 hidden dark:block object-contain dark:invert"
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
              {t('sales')}
            </h2>
            <p className="text-muted-foreground">{language === 'es' ? 'Punto de venta y registro de transacciones' : 'Point of sale and transaction records'}</p>
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
                {language === 'es' ? 'Punto de Venta' : 'Point of Sale'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-6 py-2.5 rounded-full transition-colors flex items-center gap-2 ${activeTab === 'history'
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                📊 {language === 'es' ? 'Registro de Ventas' : 'Sales History'}
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {loading ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <p>{language === 'es' ? 'Cargando productos...' : 'Loading products...'}</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <p>{language === 'es' ? 'No hay productos disponibles' : 'No products available'}</p>
                      <p className="text-sm mt-2">{language === 'es' ? 'Agrega productos en la sección de Productos' : 'Add products in the Products section'}</p>
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
                    <h3 className="text-lg font-bold">{language === 'es' ? 'Carrito' : 'Cart'}</h3>
                    {cart.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCart}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {language === 'es' ? 'Limpiar' : 'Clear'}
                      </Button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{language === 'es' ? 'Carrito vacío' : 'Empty cart'}</p>
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
                            <span className="text-sm">{language === 'es' ? 'Efectivo' : 'Cash'}</span>
                          </GlowButton>
                          <GlowButton onClick={() => handleCheckout('card')} className="w-full">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-inner">
                              <CreditCard className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm">{language === 'es' ? 'Tarjeta' : 'Card'}</span>
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
            <div className="space-y-4">
              {/* Stats Cards - Compact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="neumorphic border-0 p-4">
                  <div className="text-xs text-muted-foreground mb-1">{language === 'es' ? 'Ventas Hoy' : 'Sales Today'}</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${sales
                      .filter(s => {
                        const saleDate = new Date(s.created_at);
                        const today = new Date();
                        return saleDate.toDateString() === today.toDateString();
                      })
                      .reduce((sum, s) => sum + parseFloat(s.total.toString()), 0)
                      .toFixed(2)}
                  </div>
                </Card>
                <Card className="neumorphic border-0 p-4">
                  <div className="text-xs text-muted-foreground mb-1">{language === 'es' ? 'Transacciones Hoy' : 'Transactions Today'}</div>
                  <div className="text-2xl font-bold">
                    {sales.filter(s => {
                      const saleDate = new Date(s.created_at);
                      const today = new Date();
                      return saleDate.toDateString() === today.toDateString();
                    }).length}
                  </div>
                </Card>
                <Card className="neumorphic border-0 p-4">
                  <div className="text-xs text-muted-foreground mb-1">{language === 'es' ? 'Ticket Promedio' : 'Average Ticket'}</div>
                  <div className="text-2xl font-bold">
                    ${(() => {
                      const todaySales = sales.filter(s => {
                        const saleDate = new Date(s.created_at);
                        const today = new Date();
                        return saleDate.toDateString() === today.toDateString();
                      });
                      if (todaySales.length === 0) return '0.00';
                      const total = todaySales.reduce((sum, s) => sum + parseFloat(s.total.toString()), 0);
                      return (total / todaySales.length).toFixed(2);
                    })()}
                  </div>
                </Card>
              </div>

              {/* Sales Table */}
              <Card className="neumorphic border-0">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4">{language === 'es' ? 'Ventas Recientes' : 'Recent Sales'}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>{language === 'es' ? 'Ticket' : 'Ticket'}</TableHead>
                        <TableHead>{language === 'es' ? 'Mesa/Barra' : 'Table/Bar'}</TableHead>
                        <TableHead>{language === 'es' ? 'Fecha' : 'Date'}</TableHead>
                        <TableHead>{language === 'es' ? 'Hora' : 'Time'}</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            {language === 'es' ? 'No hay ventas registradas' : 'No sales recorded'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        sales.map((sale) => (
                          <Fragment key={sale.id}>
                            <TableRow
                              key={sale.id}
                              className="cursor-pointer hover:bg-accent/50"
                              onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                            >
                              <TableCell>
                                {expandedSale === sale.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{sale.order_number}</TableCell>
                              <TableCell>{translateTableName(sale.table_name)}</TableCell>
                              <TableCell>
                                {new Date(sale.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </TableCell>
                              <TableCell>
                                {new Date(sale.created_at).toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{sale.items.length} items</Badge>
                              </TableCell>
                              <TableCell className="text-right font-bold text-green-600">
                                ${sale.total.toFixed(2)}
                              </TableCell>
                            </TableRow>
                            {expandedSale === sale.id && (
                              <TableRow>
                                <TableCell colSpan={7} className="bg-muted/30">
                                  <div className="py-4 px-6">
                                    <h4 className="font-semibold mb-3 text-sm">{language === 'es' ? 'Detalles del Ticket:' : 'Ticket Details:'}</h4>
                                    <div className="space-y-2">
                                      {sale.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                          <div className="flex-1">
                                            <span className="font-medium">{item.productName}</span>
                                            <span className="text-muted-foreground text-sm ml-2">
                                              x{item.quantity}
                                            </span>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm text-muted-foreground">
                                              ${item.unitPrice.toFixed(2)} c/u
                                            </div>
                                            <div className="font-semibold">
                                              ${item.total.toFixed(2)}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                                      <span className="font-semibold">Total:</span>
                                      <span className="text-lg font-bold text-green-600">
                                        ${sale.total.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        ))
                      )}
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
