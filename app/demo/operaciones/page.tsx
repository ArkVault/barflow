'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DemoSidebar } from "@/components/demo-sidebar";
import { GlowButton } from "@/components/glow-button";
import { Plus, X, Grid3x3, Square, Minus, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
     Dialog,
     DialogContent,
     DialogDescription,
     DialogHeader,
     DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from '@/lib/supabase/client';
import { ProductImage } from '@/components/product-image';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

type Status = 'libre' | 'reservada' | 'ocupada' | 'por-pagar';

type AccountStatus = 'abierta' | 'en-consumo' | 'lista-para-cobrar' | 'pagada';

interface AccountItem {
     id: string;
     productName: string;
     quantity: number;
     unitPrice: number;
     total: number;
     timestamp: Date;
}

interface Account {
     id: string;
     status: AccountStatus;
     openedAt: Date;
     closedAt?: Date;
     items: AccountItem[];
     total: number;
}

interface Table {
     id: string;
     name: string;
     x: number;
     y: number;
     status: Status;
     accounts: Account[];
     currentAccountId?: string;
}

interface Bar {
     id: string;
     name: string;
     x: number;
     y: number;
     status: Status;
     accounts: Account[];
     currentAccountId?: string;
}

interface Section {
     id: string;
     name: string;
     x: number;
     y: number;
     width: number;
     height: number;
     tables: Table[];
     bars: Bar[];
}

interface Product {
     id: string;
     name: string;
     price: number;
     category: string;
     menu_id: string;
     image_url?: string | null;
}

const statusColors = {
     libre: 'from-green-400 to-green-600',
     reservada: 'from-yellow-400 to-yellow-600',
     ocupada: 'from-blue-400 to-blue-600',
     'por-pagar': 'from-orange-400 to-orange-600',
};

const statusLabels = {
     libre: 'Libre',
     reservada: 'Reservada',
     ocupada: 'Ocupada',
     'por-pagar': 'Por Pagar',
};

const accountStatusLabels = {
     'abierta': 'Cuenta abierta',
     'en-consumo': 'En consumo',
     'lista-para-cobrar': 'Lista para cobrar',
     'pagada': 'Pagada',
};

export default function OperacionesPage() {
     const { establishmentId } = useAuth();
     const [sections, setSections] = useState<Section[]>([
          {
               id: '1',
               name: 'Sección 1',
               x: 50,
               y: 50,
               width: 600,
               height: 450,
               tables: [],
               bars: [],
          },
     ]);

     const [draggedItem, setDraggedItem] = useState<{ type: 'table' | 'bar' | 'section', sectionId: string, itemId: string } | null>(null);
     const [editingName, setEditingName] = useState<{ type: 'section' | 'table' | 'bar', sectionId: string, itemId?: string } | null>(null);
     const [selectedItem, setSelectedItem] = useState<{ type: 'table' | 'bar', sectionId: string, itemId: string } | null>(null);
     const [isModalOpen, setIsModalOpen] = useState(false);
     const [dragOffset, setDragOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
     const [activeTab, setActiveTab] = useState<'mesas' | 'comandas'>('comandas');
     const [tableCounter, setTableCounter] = useState(1);
     const [isDragging, setIsDragging] = useState(false);

     // Comandas state
     const [selectedTableForOrder, setSelectedTableForOrder] = useState<string | null>(null);
     const [currentOrder, setCurrentOrder] = useState<AccountItem[]>([]);
     const [products, setProducts] = useState<Product[]>([]);
     const [categories, setCategories] = useState<string[]>([]);
     const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
     const [productQuantities, setProductQuantities] = useState<{ [key: string]: number }>({});
     const [loadingProducts, setLoadingProducts] = useState(true);

     // Fetch active menu products
     useEffect(() => {
          const fetchProducts = async () => {
               setLoadingProducts(true);
               const supabase = createClient();

               // Get active menu
               const { data: activeMenu } = await supabase
                    .from('menus')
                    .select('id')
                    .eq('is_active', true)
                    .single();

               if (!activeMenu) {
                    setLoadingProducts(false);
                    return;
               }

               // Get products from active menu (only active products)
               const { data: productsData } = await supabase
                    .from('products')
                    .select('id, name, price, category, menu_id, image_url')
                    .eq('menu_id', activeMenu.id)
                    .eq('is_active', true);

               if (productsData) {
                    setProducts(productsData);

                    // Extract unique categories
                    const uniqueCategories = Array.from(new Set(productsData.map(p => p.category)));
                    setCategories(['Todos', ...uniqueCategories]);
               }
               setLoadingProducts(false);
          };

          fetchProducts();
     }, []);

     // Load layout from Supabase on mount
     useEffect(() => {
          const loadLayout = async () => {
               const supabase = createClient();
               const { data: { user } } = await supabase.auth.getUser();

               if (!user) return;

               const { data, error } = await supabase
                    .from('operations_layout')
                    .select('sections, table_counter')
                    .eq('user_id', user.id)
                    .single();

               if (error) {
                    console.log('No saved layout found, using default');
                    return;
               }

               if (data?.sections) {
                    try {
                         // Convert date strings back to Date objects
                         const sectionsWithDates = data.sections.map((section: Section) => ({
                              ...section,
                              tables: section.tables.map(table => ({
                                   ...table,
                                   accounts: table.accounts.map(acc => ({
                                        ...acc,
                                        openedAt: new Date(acc.openedAt),
                                        closedAt: acc.closedAt ? new Date(acc.closedAt) : undefined,
                                        items: acc.items.map(item => ({
                                             ...item,
                                             timestamp: new Date(item.timestamp),
                                        })),
                                   })),
                              })),
                              bars: section.bars.map(bar => ({
                                   ...bar,
                                   accounts: bar.accounts.map(acc => ({
                                        ...acc,
                                        openedAt: new Date(acc.openedAt),
                                        closedAt: acc.closedAt ? new Date(acc.closedAt) : undefined,
                                        items: acc.items.map(item => ({
                                             ...item,
                                             timestamp: new Date(item.timestamp),
                                        })),
                                   })),
                              })),
                         }));
                         setSections(sectionsWithDates);
                    } catch (error) {
                         console.error('Error parsing sections:', error);
                    }
               }

               if (data?.table_counter) {
                    setTableCounter(data.table_counter);
               }
          };

          loadLayout();
     }, []);

     // Debounced save to Supabase
     useEffect(() => {
          const saveLayout = async () => {
               const supabase = createClient();
               const { data: { user } } = await supabase.auth.getUser();

               if (!user || sections.length === 0) return;

               const { error } = await supabase
                    .from('operations_layout')
                    .upsert({
                         user_id: user.id,
                         sections: sections,
                         table_counter: tableCounter,
                    }, {
                         onConflict: 'user_id'
                    });

               if (error) {
                    console.error('Error saving layout:', error.message, error.details, error.hint);
               } else {
                    console.log('Layout saved successfully');
               }
          };

          // Debounce the save operation (wait 1 second after last change)
          const timeoutId = setTimeout(() => {
               saveLayout();
          }, 1000);

          return () => clearTimeout(timeoutId);
     }, [sections, tableCounter]);

     const addProductToOrder = (product: Product, quantity: number = 1) => {
          const existingItem = currentOrder.find(item => item.productName === product.name);
          if (existingItem) {
               setCurrentOrder(currentOrder.map(item =>
                    item.productName === product.name
                         ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.unitPrice }
                         : item
               ));
          } else {
               const newItem: AccountItem = {
                    id: `item-${Date.now()}`,
                    productName: product.name,
                    quantity: quantity,
                    unitPrice: product.price,
                    total: product.price * quantity,
                    timestamp: new Date(),
               };
               setCurrentOrder([...currentOrder, newItem]);
          }
          // Reset quantity for this product
          setProductQuantities({ ...productQuantities, [product.id]: 1 });
     };

     const updateProductQuantity = (productId: string, quantity: number) => {
          if (quantity < 1) return;
          setProductQuantities({ ...productQuantities, [productId]: quantity });
     };

     const getProductQuantity = (productId: string) => {
          return productQuantities[productId] || 1;
     };

     const getFilteredProducts = () => {
          if (selectedCategory === 'Todos') {
               return products;
          }
          return products.filter(p => p.category === selectedCategory);
     };

     const removeProductFromOrder = (itemId: string) => {
          setCurrentOrder(currentOrder.filter(item => item.id !== itemId));
     };

     const updateOrderQuantity = (itemId: string, change: number) => {
          setCurrentOrder(currentOrder.map(item => {
               if (item.id === itemId) {
                    const newQuantity = item.quantity + change;
                    if (newQuantity <= 0) return item;
                    return { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice };
               }
               return item;
          }).filter(item => item.quantity > 0));
     };

     const sendOrderToTable = () => {
          if (!selectedTableForOrder || currentOrder.length === 0) return;

          // Find the table/bar
          let targetSection: Section | undefined;
          let targetTable: Table | undefined;
          let targetBar: Bar | undefined;

          for (const section of sections) {
               const table = section.tables.find(t => `${section.id}-${t.id}` === selectedTableForOrder);
               if (table) {
                    targetSection = section;
                    targetTable = table;
                    break;
               }
               const bar = section.bars.find(b => `${section.id}-${b.id}` === selectedTableForOrder);
               if (bar) {
                    targetSection = section;
                    targetBar = bar;
                    break;
               }
          }

          if (!targetSection) return;

          const total = currentOrder.reduce((sum, item) => sum + item.total, 0);

          setSections(sections.map(section => {
               if (section.id === targetSection!.id) {
                    if (targetTable) {
                         return {
                              ...section,
                              tables: section.tables.map(table => {
                                   if (table.id === targetTable!.id) {
                                        // If no account, create one
                                        if (!table.currentAccountId) {
                                             const newAccount: Account = {
                                                  id: `acc-${Date.now()}`,
                                                  status: 'en-consumo',
                                                  openedAt: new Date(),
                                                  items: currentOrder,
                                                  total: total,
                                             };
                                             return {
                                                  ...table,
                                                  accounts: [...table.accounts, newAccount],
                                                  currentAccountId: newAccount.id,
                                                  status: 'ocupada' as Status,
                                             };
                                        } else {
                                             // Add to existing account
                                             return {
                                                  ...table,
                                                  accounts: table.accounts.map(acc =>
                                                       acc.id === table.currentAccountId
                                                            ? {
                                                                 ...acc,
                                                                 items: [...acc.items, ...currentOrder],
                                                                 total: acc.total + total,
                                                                 status: 'en-consumo' as AccountStatus,
                                                            }
                                                            : acc
                                                  ),
                                             };
                                        }
                                   }
                                   return table;
                              }),
                         };
                    } else if (targetBar) {
                         return {
                              ...section,
                              bars: section.bars.map(bar => {
                                   if (bar.id === targetBar!.id) {
                                        // If no account, create one
                                        if (!bar.currentAccountId) {
                                             const newAccount: Account = {
                                                  id: `acc-${Date.now()}`,
                                                  status: 'en-consumo',
                                                  openedAt: new Date(),
                                                  items: currentOrder,
                                                  total: total,
                                             };
                                             return {
                                                  ...bar,
                                                  accounts: [...bar.accounts, newAccount],
                                                  currentAccountId: newAccount.id,
                                                  status: 'ocupada' as Status,
                                             };
                                        } else {
                                             // Add to existing account
                                             return {
                                                  ...bar,
                                                  accounts: bar.accounts.map(acc =>
                                                       acc.id === bar.currentAccountId
                                                            ? {
                                                                 ...acc,
                                                                 items: [...acc.items, ...currentOrder],
                                                                 total: acc.total + total,
                                                                 status: 'en-consumo' as AccountStatus,
                                                            }
                                                            : acc
                                                  ),
                                             };
                                        }
                                   }
                                   return bar;
                              }),
                         };
                    }
               }
               return section;
          }));

          // Clear order
          setCurrentOrder([]);
          setSelectedTableForOrder(null);
     };

     const getOrderTotal = () => {
          return currentOrder.reduce((sum, item) => sum + item.total, 0);
     };

     const getAllTablesAndBars = () => {
          const items: Array<{ id: string, name: string, status: Status, sectionName: string }> = [];
          sections.forEach(section => {
               section.tables.forEach(table => {
                    items.push({
                         id: `${section.id}-${table.id}`,
                         name: table.name,
                         status: table.status,
                         sectionName: section.name,
                    });
               });
               section.bars.forEach(bar => {
                    items.push({
                         id: `${section.id}-${bar.id}`,
                         name: bar.name,
                         status: bar.status,
                         sectionName: section.name,
                    });
               });
          });
          return items;
     };

     const addSection = () => {
          const newSection: Section = {
               id: `section-${Date.now()}`,
               name: `Sección ${sections.length + 1}`,
               x: 50 + (sections.length * 30),
               y: 50 + (sections.length * 30),
               width: 600,
               height: 450,
               tables: [],
               bars: [],
          };
          setSections([...sections, newSection]);
     };

     const addTable = (sectionId: string) => {
          setSections(sections.map(section => {
               if (section.id === sectionId) {
                    const newTable: Table = {
                         id: `table-${Date.now()}`,
                         name: `Mesa ${tableCounter}`,
                         x: 20,
                         y: 20,
                         status: 'libre',
                         accounts: [],
                    };
                    setTableCounter(tableCounter + 1);
                    return { ...section, tables: [...section.tables, newTable] };
               }
               return section;
          }));
     };

     const addBar = (sectionId: string) => {
          setSections(sections.map(section => {
               if (section.id === sectionId) {
                    const newBar: Bar = {
                         id: `bar-${Date.now()}`,
                         name: `Barra ${section.bars.length + 1}`,
                         x: 20,
                         y: 100,
                         status: 'libre',
                         accounts: [],
                    };
                    return { ...section, bars: [...section.bars, newBar] };
               }
               return section;
          }));
     };

     const openNewAccount = (sectionId: string, itemId: string, type: 'table' | 'bar') => {
          const newAccount: Account = {
               id: `acc-${Date.now()}`,
               status: 'abierta',
               openedAt: new Date(),
               items: [],
               total: 0,
          };

          setSections(sections.map(section => {
               if (section.id === sectionId) {
                    if (type === 'table') {
                         return {
                              ...section,
                              tables: section.tables.map(table =>
                                   table.id === itemId
                                        ? {
                                             ...table,
                                             accounts: [...table.accounts, newAccount],
                                             currentAccountId: newAccount.id,
                                             status: 'ocupada' as Status,
                                        }
                                        : table
                              ),
                         };
                    } else {
                         return {
                              ...section,
                              bars: section.bars.map(bar =>
                                   bar.id === itemId
                                        ? {
                                             ...bar,
                                             accounts: [...bar.accounts, newAccount],
                                             currentAccountId: newAccount.id,
                                             status: 'ocupada' as Status,
                                        }
                                        : bar
                              ),
                         };
                    }
               }
               return section;
          }));
     };

     const closeAccount = async (sectionId: string, itemId: string, accountId: string, type: 'table' | 'bar') => {
          // Find the account to get its details before closing
          let accountToClose: Account | undefined;
          let tableName = '';

          sections.forEach(section => {
               if (section.id === sectionId) {
                    if (type === 'table') {
                         const table = section.tables.find(t => t.id === itemId);
                         if (table) {
                              accountToClose = table.accounts.find(acc => acc.id === accountId);
                              tableName = table.name;
                         }
                    } else {
                         const bar = section.bars.find(b => b.id === itemId);
                         if (bar) {
                              accountToClose = bar.accounts.find(acc => acc.id === accountId);
                              tableName = bar.name;
                         }
                    }
               }
          });

          console.log('closeAccount called:', {
               accountToClose: accountToClose ? 'Found' : 'Not found',
               establishmentId: establishmentId || 'Missing',
               tableName,
               accountId,
               itemsCount: accountToClose?.items.length || 0,
               total: accountToClose?.total || 0
          });

          // Save to Supabase sales table
          if (accountToClose && establishmentId) {
               try {
                    const supabase = createClient();

                    const saleData = {
                         establishment_id: establishmentId,
                         order_number: `#${accountId.slice(0, 8)}`,
                         table_name: tableName,
                         items: accountToClose.items.map(item => ({
                              productName: item.productName,
                              quantity: item.quantity,
                              unitPrice: item.unitPrice,
                              total: item.total,
                         })),
                         subtotal: accountToClose.total,
                         tax: 0,
                         total: accountToClose.total,
                         payment_method: 'Efectivo',
                    };

                    console.log('Attempting to save sale:', saleData);

                    const { data, error } = await supabase
                         .from('sales')
                         .insert([saleData])
                         .select();

                    if (error) {
                         console.error('Error saving sale - Full error:', error);
                         console.error('Error saving sale - Stringified:', JSON.stringify(error, null, 2));
                         console.error('Error saving sale - Details:', {
                              message: error.message,
                              details: error.details,
                              hint: error.hint,
                              code: error.code,
                         });
                         toast.error(`Error al guardar la venta: ${error.message || 'Error desconocido'}`);
                    } else {
                         console.log('Sale saved successfully:', data);
                         toast.success('Venta registrada correctamente');
                    }
               } catch (error) {
                    console.error('Exception saving sale:', error);
                    toast.error('Error al guardar la venta');
               }
          } else {
               if (!accountToClose) {
                    console.error('No account found to close');
               }
               if (!establishmentId) {
                    console.error('No establishmentId available');
                    toast.error('No se pudo identificar el establecimiento');
               }
          }

          // Update local state
          setSections(sections.map(section => {
               if (section.id === sectionId) {
                    if (type === 'table') {
                         return {
                              ...section,
                              tables: section.tables.map(table => {
                                   if (table.id === itemId) {
                                        const updatedAccounts = table.accounts.map(acc =>
                                             acc.id === accountId
                                                  ? { ...acc, status: 'pagada' as AccountStatus, closedAt: new Date() }
                                                  : acc
                                        );
                                        return {
                                             ...table,
                                             accounts: updatedAccounts,
                                             currentAccountId: undefined,
                                             status: 'libre' as Status,
                                        };
                                   }
                                   return table;
                              }),
                         };
                    } else {
                         return {
                              ...section,
                              bars: section.bars.map(bar => {
                                   if (bar.id === itemId) {
                                        const updatedAccounts = bar.accounts.map(acc =>
                                             acc.id === accountId
                                                  ? { ...acc, status: 'pagada' as AccountStatus, closedAt: new Date() }
                                                  : acc
                                        );
                                        return {
                                             ...bar,
                                             accounts: updatedAccounts,
                                             currentAccountId: undefined,
                                             status: 'libre' as Status,
                                        };
                                   }
                                   return bar;
                              }),
                         };
                    }
               }
               return section;
          }));
          setIsModalOpen(false);
     };

     const handleItemClick = (sectionId: string, itemId: string, type: 'table' | 'bar') => {
          setSelectedItem({ type, sectionId, itemId });
          setIsModalOpen(true);
     };

     const getCurrentAccount = (): Account | null => {
          if (!selectedItem) return null;

          const section = sections.find(s => s.id === selectedItem.sectionId);
          if (!section) return null;

          if (selectedItem.type === 'table') {
               const table = section.tables.find(t => t.id === selectedItem.itemId);
               if (!table || !table.currentAccountId) return null;
               return table.accounts.find(acc => acc.id === table.currentAccountId) || null;
          } else {
               const bar = section.bars.find(b => b.id === selectedItem.itemId);
               if (!bar || !bar.currentAccountId) return null;
               return bar.accounts.find(acc => acc.id === bar.currentAccountId) || null;
          }
     };

     const getElapsedTime = (openedAt: Date): string => {
          const now = new Date();
          const diff = now.getTime() - openedAt.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          return `${hours}h ${minutes}m`;
     };

     const deleteSection = (sectionId: string) => {
          setSections(sections.filter(s => s.id !== sectionId));
     };

     const deleteTable = (sectionId: string, tableId: string) => {
          setSections(sections.map(section => {
               if (section.id === sectionId) {
                    return { ...section, tables: section.tables.filter(t => t.id !== tableId) };
               }
               return section;
          }));
     };

     const deleteBar = (sectionId: string, barId: string) => {
          setSections(sections.map(section => {
               if (section.id === sectionId) {
                    return { ...section, bars: section.bars.filter(b => b.id !== barId) };
               }
               return section;
          }));
     };

     const updateTableStatus = (sectionId: string, tableId: string, status: Status) => {
          setSections(sections.map(section => {
               if (section.id === sectionId) {
                    return {
                         ...section,
                         tables: section.tables.map(table =>
                              table.id === tableId ? { ...table, status } : table
                         ),
                    };
               }
               return section;
          }));
     };

     const updateBarStatus = (sectionId: string, barId: string, status: Status) => {
          setSections(sections.map(section => {
               if (section.id === sectionId) {
                    return {
                         ...section,
                         bars: section.bars.map(bar =>
                              bar.id === barId ? { ...bar, status } : bar
                         ),
                    };
               }
               return section;
          }));
     };

     const handleDragStart = (e: React.DragEvent, type: 'table' | 'bar' | 'section', sectionId: string, itemId: string) => {
          setDraggedItem({ type, sectionId, itemId });
          setIsDragging(true);

          // Calculate offset from mouse to element's top-left corner
          const rect = e.currentTarget.getBoundingClientRect();
          const offsetX = e.clientX - rect.left;
          const offsetY = e.clientY - rect.top;
          setDragOffset({ x: offsetX, y: offsetY });

          // Set drag image to be transparent for smoother visual feedback
          const dragImage = document.createElement('div');
          dragImage.style.opacity = '0';
          document.body.appendChild(dragImage);
          e.dataTransfer.setDragImage(dragImage, 0, 0);
          setTimeout(() => document.body.removeChild(dragImage), 0);
     };

     const handleDragOver = (e: React.DragEvent) => {
          e.preventDefault();
     };

     const handleDrop = (e: React.DragEvent, sectionId: string) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);

          if (!draggedItem) return;

          const rect = e.currentTarget.getBoundingClientRect();
          let x = e.clientX - rect.left - dragOffset.x;
          let y = e.clientY - rect.top - dragOffset.y;

          // Get section dimensions for boundary checking
          const section = sections.find(s => s.id === sectionId);
          if (!section) return;

          if (draggedItem.type === 'table') {
               // Constrain table within section boundaries (table is 80px wide, 80px tall)
               const tableWidth = 80;
               const tableHeight = 80;
               x = Math.max(0, Math.min(x, section.width - tableWidth));
               y = Math.max(0, Math.min(y, section.height - tableHeight));

               setSections(sections.map(sec => {
                    if (sec.id === sectionId) {
                         return {
                              ...sec,
                              tables: sec.tables.map(table =>
                                   table.id === draggedItem.itemId ? { ...table, x, y } : table
                              ),
                         };
                    }
                    return sec;
               }));
          } else if (draggedItem.type === 'bar') {
               // Constrain bar within section boundaries (bar is 128px wide, 64px tall)
               const barWidth = 128;
               const barHeight = 64;
               x = Math.max(0, Math.min(x, section.width - barWidth));
               y = Math.max(0, Math.min(y, section.height - barHeight));

               setSections(sections.map(sec => {
                    if (sec.id === sectionId) {
                         return {
                              ...sec,
                              bars: sec.bars.map(bar =>
                                   bar.id === draggedItem.itemId ? { ...bar, x, y } : bar
                              ),
                         };
                    }
                    return sec;
               }));
          }

          setDraggedItem(null);
     };

     const handleCanvasDrop = (e: React.DragEvent) => {
          e.preventDefault();
          setIsDragging(false);

          if (!draggedItem || draggedItem.type !== 'section') return;

          const rect = e.currentTarget.getBoundingClientRect();
          let x = e.clientX - rect.left - dragOffset.x;
          let y = e.clientY - rect.top - dragOffset.y;

          // Get section dimensions for boundary checking
          const section = sections.find(s => s.id === draggedItem.itemId);
          if (!section) return;

          // Constrain section within canvas boundaries
          const canvasWidth = rect.width;
          const canvasHeight = rect.height;
          x = Math.max(0, Math.min(x, canvasWidth - section.width));
          y = Math.max(0, Math.min(y, canvasHeight - section.height));

          setSections(sections.map(sec =>
               sec.id === draggedItem.itemId
                    ? { ...sec, x, y }
                    : sec
          ));

          setDraggedItem(null);
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
                    <div className="max-w-[1400px] mx-auto">
                         {/* Header */}
                         <div className="mb-6">
                              <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                                   Operaciones
                              </h2>
                              <p className="text-muted-foreground">Gestión de mesas y comandas</p>
                         </div>

                         {/* Tabs */}
                         <div className="mb-6">
                              <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-sm w-fit">
                                   <button
                                        type="button"
                                        onClick={() => setActiveTab('comandas')}
                                        className={`px-6 py-2.5 rounded-full transition-colors flex items-center gap-2 ${activeTab === 'comandas'
                                             ? 'bg-background text-foreground shadow-sm font-medium'
                                             : 'text-muted-foreground hover:text-foreground'
                                             }`}
                                   >
                                        📋 Comandas
                                   </button>
                                   <button
                                        type="button"
                                        onClick={() => setActiveTab('mesas')}
                                        className={`px-6 py-2.5 rounded-full transition-colors flex items-center gap-2 ${activeTab === 'mesas'
                                             ? 'bg-background text-foreground shadow-sm font-medium'
                                             : 'text-muted-foreground hover:text-foreground'
                                             }`}
                                   >
                                        <Grid3x3 className="w-4 h-4" />
                                        Mesas
                                   </button>
                              </div>
                         </div>

                         {/* Mesas Tab */}
                         {activeTab === 'mesas' && (
                              <>
                                   {/* Action Buttons */}
                                   <div className="flex gap-3 mb-6">
                                        <GlowButton onClick={addSection}>
                                             <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-inner">
                                                  <Grid3x3 className="w-3.5 h-3.5 text-white" />
                                             </div>
                                             <span className="hidden sm:inline">Agregar Sección</span>
                                        </GlowButton>
                                   </div>

                                   {/* Legend */}
                                   <div className="flex gap-3 mb-6 flex-wrap">
                                        {Object.entries(statusLabels).map(([status, label]) => (
                                             <div key={status} className="flex items-center gap-2">
                                                  <div className={cn(
                                                       "w-4 h-4 rounded-full bg-gradient-to-br",
                                                       statusColors[status as Status]
                                                  )} style={{ boxShadow: '0 0 8px rgba(0,0,0,0.3)' }} />
                                                  <span className="text-sm text-muted-foreground">{label}</span>
                                             </div>
                                        ))}
                                   </div>
                              </>
                         )}

                         {/* Comandas Tab */}
                         {activeTab === 'comandas' && (
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                   {/* Products Section */}
                                   <div className="lg:col-span-2 space-y-4">
                                        {/* Category Filters */}
                                        <div className="flex gap-2 flex-wrap">
                                             {categories.map(category => (
                                                  <Button
                                                       key={category}
                                                       variant={selectedCategory === category ? "default" : "outline"}
                                                       size="sm"
                                                       onClick={() => setSelectedCategory(category)}
                                                       className={cn(
                                                            "transition-all",
                                                            selectedCategory === category && "bg-primary text-primary-foreground shadow-lg"
                                                       )}
                                                  >
                                                       {category}
                                                  </Button>
                                             ))}
                                        </div>

                                        {/* Products Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                             {loadingProducts ? (
                                                  <div className="col-span-full text-center py-12 text-muted-foreground">
                                                       <p>Cargando productos...</p>
                                                  </div>
                                             ) : getFilteredProducts().length === 0 ? (
                                                  <div className="col-span-full text-center py-12 text-muted-foreground">
                                                       <p>No hay productos disponibles</p>
                                                       <p className="text-sm mt-2">
                                                            {products.length === 0
                                                                 ? 'Agrega productos en la sección de Productos'
                                                                 : 'No hay productos en esta categoría'}
                                                       </p>
                                                  </div>
                                             ) : (
                                                  getFilteredProducts().map(product => (
                                                       <div
                                                            key={product.id}
                                                            className="neumorphic rounded-2xl p-4"
                                                       >
                                                            <div className="space-y-3">
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

                                                                 {/* Quantity Selector */}
                                                                 <div className="flex items-center justify-center gap-2">
                                                                      <Button
                                                                           variant="outline"
                                                                           size="icon"
                                                                           className="h-8 w-8"
                                                                           onClick={() => updateProductQuantity(product.id, getProductQuantity(product.id) - 1)}
                                                                      >
                                                                           <Minus className="w-3 h-3" />
                                                                      </Button>
                                                                      <Input
                                                                           type="number"
                                                                           min="1"
                                                                           value={getProductQuantity(product.id)}
                                                                           onChange={(e) => updateProductQuantity(product.id, parseInt(e.target.value) || 1)}
                                                                           className="w-16 h-8 text-center"
                                                                      />
                                                                      <Button
                                                                           variant="outline"
                                                                           size="icon"
                                                                           className="h-8 w-8"
                                                                           onClick={() => updateProductQuantity(product.id, getProductQuantity(product.id) + 1)}
                                                                      >
                                                                           <Plus className="w-3 h-3" />
                                                                      </Button>
                                                                 </div>

                                                                 {/* Add Button */}
                                                                 <GlowButton
                                                                      className="w-full"
                                                                      onClick={() => addProductToOrder(product, getProductQuantity(product.id))}
                                                                 >
                                                                      <Plus className="w-4 h-4 mr-2" />
                                                                      Agregar
                                                                 </GlowButton>
                                                            </div>
                                                       </div>
                                                  ))
                                             )}
                                        </div>
                                   </div>

                                   {/* Order Section */}
                                   <div className="space-y-4">
                                        <div className="neumorphic rounded-2xl p-4 sticky top-4">
                                             <h3 className="text-lg font-bold mb-4">Comanda Actual</h3>

                                             {/* Table Selection */}
                                             <div className="mb-4">
                                                  <label className="text-sm text-muted-foreground mb-2 block">Seleccionar Mesa/Barra:</label>
                                                  <select
                                                       value={selectedTableForOrder || ''}
                                                       onChange={(e) => setSelectedTableForOrder(e.target.value)}
                                                       className="w-full p-2 rounded-lg border bg-background"
                                                  >
                                                       <option value="">-- Seleccionar --</option>
                                                       {getAllTablesAndBars().map(item => (
                                                            <option key={item.id} value={item.id}>
                                                                 {item.sectionName} - {item.name} ({statusLabels[item.status]})
                                                            </option>
                                                       ))}
                                                  </select>
                                             </div>

                                             {/* Order Items */}
                                             {currentOrder.length === 0 ? (
                                                  <div className="text-center py-8 text-muted-foreground">
                                                       <p className="text-sm">Selecciona productos para agregar</p>
                                                  </div>
                                             ) : (
                                                  <>
                                                       <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                                                            {currentOrder.map(item => (
                                                                 <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                                                      <div className="flex-1 min-w-0">
                                                                           <p className="font-medium text-sm truncate">{item.productName}</p>
                                                                           <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)}</p>
                                                                      </div>
                                                                      <div className="flex items-center gap-2">
                                                                           <Button
                                                                                variant="outline"
                                                                                size="icon"
                                                                                className="h-7 w-7"
                                                                                onClick={() => updateOrderQuantity(item.id, -1)}
                                                                           >
                                                                                <Minus className="w-3 h-3" />
                                                                           </Button>
                                                                           <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                                           <Button
                                                                                variant="outline"
                                                                                size="icon"
                                                                                className="h-7 w-7"
                                                                                onClick={() => updateOrderQuantity(item.id, 1)}
                                                                           >
                                                                                <Plus className="w-3 h-3" />
                                                                           </Button>
                                                                           <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-7 w-7 text-destructive"
                                                                                onClick={() => removeProductFromOrder(item.id)}
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
                                                                 <span className="text-2xl font-bold text-primary">${getOrderTotal().toFixed(2)}</span>
                                                            </div>

                                                            <GlowButton
                                                                 onClick={sendOrderToTable}
                                                                 className="w-full"
                                                                 disabled={!selectedTableForOrder || currentOrder.length === 0}
                                                            >
                                                                 <DollarSign className="w-4 h-4 mr-2" />
                                                                 Aprobar Comanda
                                                            </GlowButton>
                                                       </div>
                                                  </>
                                             )}
                                        </div>
                                   </div>
                              </div>
                         )}

                         {/* Main Canvas Container - Only in Mesas Tab */}
                         {activeTab === 'mesas' && (
                              <div className="neumorphic border-0 rounded-3xl p-8">
                                   {/* Canvas with dotted grid background */}
                                   <div
                                        className="relative w-full min-h-[800px] rounded-2xl overflow-hidden"
                                        style={{
                                             backgroundImage: 'radial-gradient(circle, rgba(128, 128, 128, 0.2) 1px, transparent 1px)',
                                             backgroundSize: '20px 20px',
                                             backgroundColor: 'var(--background)',
                                        }}
                                        onDragOver={handleDragOver}
                                        onDrop={handleCanvasDrop}
                                   >
                                        {sections.map(section => (
                                             <div
                                                  key={section.id}
                                                  draggable
                                                  onDragStart={(e) => handleDragStart(e, 'section', section.id, section.id)}
                                                  className="absolute neumorphic rounded-2xl bg-background/50 backdrop-blur-sm border-2 border-primary/20 cursor-move"
                                                  style={{
                                                       left: section.x,
                                                       top: section.y,
                                                       width: section.width,
                                                       height: section.height,
                                                  }}
                                                  onDragOver={handleDragOver}
                                                  onDrop={(e) => handleDrop(e, section.id)}
                                             >
                                                  {/* Section Header */}
                                                  <div className="absolute -top-10 left-0 right-0 flex items-center justify-between px-2">
                                                       {editingName?.type === 'section' && editingName.sectionId === section.id ? (
                                                            <Input
                                                                 value={section.name}
                                                                 onChange={(e) => setSections(sections.map(s =>
                                                                      s.id === section.id ? { ...s, name: e.target.value } : s
                                                                 ))}
                                                                 onBlur={() => setEditingName(null)}
                                                                 onKeyDown={(e) => e.key === 'Enter' && setEditingName(null)}
                                                                 className="h-8 text-sm font-bold w-48"
                                                                 autoFocus
                                                            />
                                                       ) : (
                                                            <h3
                                                                 className="text-lg font-bold cursor-pointer hover:text-primary"
                                                                 onClick={() => setEditingName({ type: 'section', sectionId: section.id })}
                                                            >
                                                                 {section.name}
                                                            </h3>
                                                       )}
                                                       <div className="flex gap-2">
                                                            <Button
                                                                 size="sm"
                                                                 variant="outline"
                                                                 onClick={() => addTable(section.id)}
                                                                 className="h-8"
                                                            >
                                                                 <Square className="w-3 h-3 mr-1" />
                                                                 Mesa
                                                            </Button>
                                                            <Button
                                                                 size="sm"
                                                                 variant="outline"
                                                                 onClick={() => addBar(section.id)}
                                                                 className="h-8"
                                                            >
                                                                 <Minus className="w-3 h-3 mr-1" />
                                                                 Barra
                                                            </Button>
                                                            <Button
                                                                 size="sm"
                                                                 variant="destructive"
                                                                 onClick={() => deleteSection(section.id)}
                                                                 className="h-8"
                                                            >
                                                                 <X className="w-3 h-3" />
                                                            </Button>
                                                       </div>
                                                  </div>

                                                  {/* Tables */}
                                                  {section.tables.map(table => (
                                                       <div
                                                            key={table.id}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, 'table', section.id, table.id)}
                                                            className={cn(
                                                                 "absolute cursor-move group",
                                                                 !isDragging && "transition-all duration-200 ease-out"
                                                            )}
                                                            style={{
                                                                 left: table.x,
                                                                 top: table.y,
                                                                 opacity: isDragging && draggedItem?.itemId === table.id ? 0.5 : 1
                                                            }}
                                                       >
                                                            <div
                                                                 className={cn(
                                                                      "relative w-20 h-20 rounded-2xl flex flex-col items-center justify-center",
                                                                      "bg-gradient-to-br shadow-lg transition-all hover:scale-110",
                                                                      statusColors[table.status]
                                                                 )}
                                                                 style={{ boxShadow: '0 0 20px rgba(0,0,0,0.3)' }}
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      handleItemClick(section.id, table.id, 'table');
                                                                 }}
                                                            >
                                                                 <button
                                                                      onClick={(e) => {
                                                                           e.stopPropagation();
                                                                           deleteTable(section.id, table.id);
                                                                      }}
                                                                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                                 >
                                                                      <X className="w-3 h-3" />
                                                                 </button>
                                                                 <span className="text-white font-bold text-xs">{table.name}</span>
                                                                 <select
                                                                      value={table.status}
                                                                      onChange={(e) => {
                                                                           e.stopPropagation();
                                                                           updateTableStatus(section.id, table.id, e.target.value as Status);
                                                                      }}
                                                                      className="mt-1 text-[10px] bg-white/20 text-white rounded px-1 cursor-pointer"
                                                                      onClick={(e) => e.stopPropagation()}
                                                                 >
                                                                      {Object.entries(statusLabels).map(([value, label]) => (
                                                                           <option key={value} value={value} className="text-black">{label}</option>
                                                                      ))}
                                                                 </select>
                                                            </div>
                                                       </div>
                                                  ))}

                                                  {/* Bars */}
                                                  {section.bars.map(bar => (
                                                       <div
                                                            key={bar.id}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, 'bar', section.id, bar.id)}
                                                            className={cn(
                                                                 "absolute cursor-move group",
                                                                 !isDragging && "transition-all duration-200 ease-out"
                                                            )}
                                                            style={{
                                                                 left: bar.x,
                                                                 top: bar.y,
                                                                 opacity: isDragging && draggedItem?.itemId === bar.id ? 0.5 : 1
                                                            }}
                                                       >
                                                            <div
                                                                 className={cn(
                                                                      "relative w-32 h-16 rounded-2xl flex flex-col items-center justify-center",
                                                                      "bg-gradient-to-br shadow-lg transition-all hover:scale-110",
                                                                      statusColors[bar.status]
                                                                 )}
                                                                 style={{ boxShadow: '0 0 20px rgba(0,0,0,0.3)' }}
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      handleItemClick(section.id, bar.id, 'bar');
                                                                 }}
                                                            >
                                                                 <button
                                                                      onClick={(e) => {
                                                                           e.stopPropagation();
                                                                           deleteBar(section.id, bar.id);
                                                                      }}
                                                                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                                 >
                                                                      <X className="w-3 h-3" />
                                                                 </button>
                                                                 <span className="text-white font-bold text-xs">{bar.name}</span>
                                                                 <select
                                                                      value={bar.status}
                                                                      onChange={(e) => {
                                                                           e.stopPropagation();
                                                                           updateBarStatus(section.id, bar.id, e.target.value as Status);
                                                                      }}
                                                                      className="mt-1 text-[10px] bg-white/20 text-white rounded px-1 cursor-pointer"
                                                                      onClick={(e) => e.stopPropagation()}
                                                                 >
                                                                      {Object.entries(statusLabels).map(([value, label]) => (
                                                                           <option key={value} value={value} className="text-black">{label}</option>
                                                                      ))}
                                                                 </select>
                                                            </div>
                                                       </div>
                                                  ))}
                                             </div>
                                        ))}
                                   </div>
                              </div>
                         )}
                    </div>
               </div>

               {/* Account Modal */}
               < Dialog open={isModalOpen} onOpenChange={setIsModalOpen} >
                    <DialogContent className="max-w-md">
                         <DialogHeader>
                              <DialogTitle className="text-2xl font-bold">
                                   {selectedItem && sections.find(s => s.id === selectedItem.sectionId)?.tables.find(t => t.id === selectedItem.itemId)?.name}
                                   {selectedItem && sections.find(s => s.id === selectedItem.sectionId)?.bars.find(b => b.id === selectedItem.itemId)?.name}
                              </DialogTitle>
                              <DialogDescription>
                                   Gestión de cuenta
                              </DialogDescription>
                         </DialogHeader>

                         {(() => {
                              const currentAccount = getCurrentAccount();

                              if (!currentAccount && selectedItem) {
                                   return (
                                        <div className="space-y-4">
                                             <div className="text-center py-8">
                                                  <p className="text-muted-foreground mb-4">No hay cuenta activa</p>
                                                  <GlowButton onClick={() => {
                                                       openNewAccount(selectedItem.sectionId, selectedItem.itemId, selectedItem.type);
                                                       setIsModalOpen(false);
                                                  }}>
                                                       <Plus className="w-4 h-4 mr-2" />
                                                       Abrir Nueva Cuenta
                                                  </GlowButton>
                                             </div>
                                        </div>
                                   );
                              }

                              if (!currentAccount) return null;

                              return (
                                   <div className="space-y-4">
                                        {/* Account Status */}
                                        <div className="neumorphic rounded-2xl p-4">
                                             <div className="flex items-center justify-between mb-3">
                                                  <span className="text-sm text-muted-foreground">Estado:</span>
                                                  <Badge className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                                                       {accountStatusLabels[currentAccount.status]}
                                                  </Badge>
                                             </div>
                                             <div className="flex items-center justify-between mb-3">
                                                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                                                       <Clock className="w-4 h-4" />
                                                       Hora de apertura:
                                                  </span>
                                                  <span className="font-medium">{currentAccount.openedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                             </div>
                                             <div className="flex items-center justify-between mb-3">
                                                  <span className="text-sm text-muted-foreground">Tiempo transcurrido:</span>
                                                  <span className="font-medium">{getElapsedTime(currentAccount.openedAt)}</span>
                                             </div>
                                             <div className="flex items-center justify-between pt-3 border-t">
                                                  <span className="text-lg font-bold flex items-center gap-2">
                                                       <DollarSign className="w-5 h-5" />
                                                       Total:
                                                  </span>
                                                  <span className="text-2xl font-bold text-primary">${currentAccount.total.toFixed(2)}</span>
                                             </div>
                                        </div>

                                        {/* Items List */}
                                        {currentAccount.items.length > 0 && (
                                             <div className="neumorphic rounded-2xl p-4">
                                                  <h4 className="font-semibold mb-3">Productos:</h4>
                                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                                       {currentAccount.items.map(item => (
                                                            <div key={item.id} className="flex justify-between text-sm">
                                                                 <span>{item.quantity}x {item.productName}</span>
                                                                 <span className="font-medium">${item.total.toFixed(2)}</span>
                                                            </div>
                                                       ))}
                                                  </div>
                                             </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                             <Button
                                                  variant="outline"
                                                  className="flex-1"
                                                  onClick={() => setIsModalOpen(false)}
                                             >
                                                  Cancelar
                                             </Button>
                                             <GlowButton
                                                  className="flex-1"
                                                  onClick={() => {
                                                       if (selectedItem) {
                                                            closeAccount(selectedItem.sectionId, selectedItem.itemId, currentAccount.id, selectedItem.type);
                                                       }
                                                  }}
                                             >
                                                  <DollarSign className="w-4 h-4 mr-2" />
                                                  Marcar como Pagada
                                             </GlowButton>
                                        </div>
                                   </div>
                              );
                         })()}
                    </DialogContent>
               </Dialog >
          </div >
     );
}
