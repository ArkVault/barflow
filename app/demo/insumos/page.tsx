"use client";

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DemoSidebar } from "@/components/demo-sidebar"
import { useState, useEffect } from "react"
import { useLanguage } from "@/hooks/use-language"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Trash2, Pencil, ShoppingCart, Package, Plus } from "lucide-react"
import { GlowButton } from "@/components/glow-button"
import { toast } from "sonner"
import { EditSupplyDialog } from "@/components/edit-supply-dialog"
import { calculateStockStatus } from "@/lib/stock-utils"
import { StockHalfCircle } from "@/components/stock-half-circle";
import { RestockSupplyDialog, type PurchaseItem } from "@/components/restock-supply-dialog";
import { PurchaseListDialog } from "@/components/purchase-list-dialog";

interface Supply {
  id: string;
  name: string;
  category: string;
  current_quantity: number;
  unit: string;
  min_threshold: number;
  optimal_quantity?: number;
  content_per_unit?: number;
  content_unit?: string;
  status: 'ok' | 'low' | 'critical';
}

type StatusFilter = 'all' | 'critical' | 'low' | 'ok';

export default function InsumosPage() {
  const { t } = useLanguage();
  const { establishmentId } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'low' | 'ok'>('all');
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Purchase system state
  const [restockingSupply, setRestockingSupply] = useState<Supply | null>(null);
  const [showRestockDialog, setShowRestockDialog] = useState(false);
  const [showPurchaseListDialog, setShowPurchaseListDialog] = useState(false);
  const [purchaseList, setPurchaseList] = useState<PurchaseItem[]>([]);

  // Load purchase list from localStorage on mount
  useEffect(() => {
    const savedList = localStorage.getItem('barflow_purchase_list');
    if (savedList) {
      try {
        setPurchaseList(JSON.parse(savedList));
      } catch (error) {
        console.error('Error loading purchase list:', error);
      }
    }
  }, []);

  // Save purchase list to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('barflow_purchase_list', JSON.stringify(purchaseList));
  }, [purchaseList]);

  useEffect(() => {
    if (establishmentId) {
      fetchSupplies();
    }
  }, [establishmentId]);

  const fetchSupplies = async () => {
    if (!establishmentId) return;

    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('supplies')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('name', { ascending: true });

      if (error) throw error;

      // Calculate status for each supply using shared utility
      const suppliesWithStatus = (data || []).map(supply => ({
        id: supply.id,
        name: supply.name,
        category: supply.category || 'Otros',
        current_quantity: supply.current_quantity,
        unit: supply.unit,
        min_threshold: supply.min_threshold,
        optimal_quantity: supply.optimal_quantity,
        content_per_unit: supply.content_per_unit,
        content_unit: supply.content_unit,
        status: calculateStockStatus(supply)
      }));

      setSupplies(suppliesWithStatus);
    } catch (error: any) {
      console.error('Error fetching supplies:', error);
      toast.error('Error al cargar insumos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supply: Supply) => {
    setEditingSupply(supply);
    setShowEditDialog(true);
  };

  const handleDelete = async (supply: Supply) => {
    if (!confirm(`¿Estás seguro de eliminar "${supply.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('supplies')
        .delete()
        .eq('id', supply.id);

      if (error) throw error;

      toast.success(`${supply.name} eliminado correctamente`);
      fetchSupplies(); // Reload list
    } catch (error: any) {
      console.error('Error deleting supply:', error);
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  const handleEditSuccess = () => {
    fetchSupplies(); // Reload list after edit
  };

  // Purchase system handlers
  const handleRestock = (supply: Supply) => {
    setRestockingSupply(supply);
    setShowRestockDialog(true);
  };

  const handleAddToCart = (item: PurchaseItem) => {
    // Check if item already exists in cart
    const existingIndex = purchaseList.findIndex(p => p.supplyId === item.supplyId);

    if (existingIndex >= 0) {
      // Update existing item quantity
      const updated = [...purchaseList];
      const existingItem = updated[existingIndex];

      // If item is already ordered, don't allow update
      if (existingItem.status === 'ordered') {
        toast.warning(`${item.supplyName} ya está en estado "Pedido". Confirma la recepción primero.`);
        return;
      }

      // Update the item
      updated[existingIndex] = {
        ...item,
        status: 'pending' // Reset to pending when updating
      };
      setPurchaseList(updated);
      toast.success(`${item.supplyName} actualizado en la lista de compras`);
    } else {
      // Add new item
      setPurchaseList([...purchaseList, item]);
      toast.success(`${item.supplyName} agregado a la lista de compras`);
    }
  };

  const handleRemoveFromCart = (supplyId: string) => {
    setPurchaseList(purchaseList.filter(item => item.supplyId !== supplyId));
    toast.success("Item eliminado de la lista de compras");
  };

  const handleMarkAsOrdered = (supplyId: string) => {
    setPurchaseList(purchaseList.map(item =>
      item.supplyId === supplyId
        ? { ...item, status: 'ordered' as const }
        : item
    ));
  };

  const handleConfirmReceived = async (supplyId: string, quantity: number) => {
    try {
      const supabase = createClient();

      // Find the supply to update
      const supply = supplies.find(s => s.id === supplyId);
      if (!supply) {
        toast.error("Insumo no encontrado");
        return;
      }

      // Update the supply quantity in database
      const newQuantity = supply.current_quantity + quantity;
      const { error } = await supabase
        .from('supplies')
        .update({ current_quantity: newQuantity })
        .eq('id', supplyId);

      if (error) throw error;

      // Remove from purchase list
      setPurchaseList(purchaseList.filter(item => item.supplyId !== supplyId));

      // Reload supplies
      await fetchSupplies();

      toast.success(`${supply.name} abastecido: +${quantity} ${supply.unit}`);
    } catch (error: any) {
      console.error('Error confirming receipt:', error);
      toast.error('Error al confirmar recepción: ' + error.message);
    }
  };

  // Helper function to translate category
  const translateCategory = (category: string) => {
    const categoryMap: Record<string, string> = {
      'Licores': t('liquors'),
      'Licores Dulces': t('liquors'),
      'Refrescos': t('refreshments'),
      'Especias': t('spices'),
      'Frutas': t('fruits'),
      'Hierbas': 'Hierbas',
      'Otros': 'Otros',
    };
    return categoryMap[category] || category;
  };

  const criticalCount = supplies.filter(s => s.status === 'critical').length;
  const lowCount = supplies.filter(s => s.status === 'low').length;
  const okCount = supplies.filter(s => s.status === 'ok').length;

  const filteredSupplies = statusFilter === 'all'
    ? supplies
    : supplies.filter(s => s.status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center">
        <DemoSidebar />
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando insumos...</p>
        </div>
      </div>
    );
  }

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
              <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>{t('supplyManagement')}</h2>
              <p className="text-muted-foreground">{t('inventoryControl')}</p>
            </div>
            <div className="flex gap-2">
              <GlowButton onClick={() => setShowPurchaseListDialog(true)} className="relative">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-inner">
                  <ShoppingCart className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="hidden sm:inline">Insumos a Comprar</span>
                {purchaseList.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 px-1.5 py-0 h-5 min-w-[20px] rounded-full"
                  >
                    {purchaseList.length}
                  </Badge>
                )}
              </GlowButton>
              <Link href="/demo/planner">
                <GlowButton>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-inner">
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="hidden sm:inline">Añadir Insumo</span>
                </GlowButton>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card
              className={`neumorphic border-0 p-6 cursor-pointer transition-all hover:scale-105 ${statusFilter === 'critical' ? 'ring-2 ring-destructive' : ''
                }`}
              onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
            >
              <div className="text-sm text-muted-foreground mb-1">{t('criticalStock')}</div>
              <div className="text-5xl font-black text-red-600" style={{ fontFamily: 'Satoshi, sans-serif' }}>{criticalCount}</div>
            </Card>
            <Card
              className={`neumorphic border-0 p-6 cursor-pointer transition-all hover:scale-105 ${statusFilter === 'low' ? 'ring-2 ring-amber-500' : ''
                }`}
              onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}
            >
              <div className="text-sm text-muted-foreground mb-1">{t('lowStock')}</div>
              <div className="text-5xl font-black text-amber-600" style={{ fontFamily: 'Satoshi, sans-serif' }}>{lowCount}</div>
            </Card>
            <Card
              className={`neumorphic border-0 p-6 cursor-pointer transition-all hover:scale-105 ${statusFilter === 'ok' ? 'ring-2 ring-green-500' : ''
                }`}
              onClick={() => setStatusFilter(statusFilter === 'ok' ? 'all' : 'ok')}
            >
              <div className="text-sm text-muted-foreground mb-1">{t('goodStock')}</div>
              <div className="text-5xl font-black text-green-600" style={{ fontFamily: 'Satoshi, sans-serif' }}>{okCount}</div>
            </Card>
            <Card
              className={`neumorphic border-0 p-6 cursor-pointer transition-all hover:scale-105 ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''
                }`}
              onClick={() => setStatusFilter('all')}
            >
              <div className="text-sm text-muted-foreground mb-1">{t('allSupplies')}</div>
              <div className="text-5xl font-black" style={{ fontFamily: 'Satoshi, sans-serif' }}>{supplies.length}</div>
            </Card>
          </div>

          {supplies.length === 0 ? (
            <Card className="neumorphic border-0 p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No tienes insumos registrados aún.
              </p>
              <Link href="/demo/planner">
                <Button>
                  Ir al Planner para agregar insumos
                </Button>
              </Link>
            </Card>
          ) : (
            <Card className="neumorphic border-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>{t('category')}</TableHead>
                    <TableHead>Cantidad Total</TableHead>
                    <TableHead>Óptimo</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSupplies.map((supply) => {
                    // Calculate display quantity based on content_per_unit and category
                    let displayValue: number;
                    let displayUnit: string;

                    if (supply.content_per_unit && supply.content_per_unit > 0) {
                      const units = supply.current_quantity / supply.content_per_unit;

                      const category = supply.category?.toLowerCase() || '';
                      const contentUnit = supply.content_unit?.toLowerCase() || supply.unit?.toLowerCase() || '';

                      // Check category first for more accurate unit determination
                      if (category.includes('otro') || category === 'otros') {
                        // Otros: always show in gramos
                        displayValue = supply.current_quantity;
                        displayUnit = 'g';
                      } else if (category.includes('fruta') || category.includes('fruit')) {
                        // Frutas: always show in kg
                        const kg = supply.current_quantity / 1000;
                        displayValue = kg;
                        displayUnit = 'kg';
                      } else if (category.includes('especia') || category.includes('spice')) {
                        // Especias: show in gramos if less than 1kg, otherwise kg
                        const kg = supply.current_quantity / 1000;
                        if (kg < 1) {
                          displayValue = supply.current_quantity;
                          displayUnit = 'g';
                        } else {
                          displayValue = kg;
                          displayUnit = 'kg';
                        }
                      } else if (category.includes('licor') || category.includes('alcohol') || (category.includes('bebida') && contentUnit.includes('ml'))) {
                        // Licores y bebidas alcohólicas: show in bottles
                        displayValue = units;
                        displayUnit = Math.floor(units) === 1 ? 'botella' : 'botellas';
                      } else if (category.includes('refresco') || category.includes('no alcohólica') || category.includes('agua')) {
                        // Refrescos y agua: show in bottles or liters
                        if (contentUnit === 'l' || supply.content_per_unit >= 1000) {
                          displayValue = supply.current_quantity / 1000;
                          displayUnit = displayValue === 1 ? 'litro' : 'litros';
                        } else {
                          displayValue = units;
                          displayUnit = Math.floor(units) === 1 ? 'botella' : 'botellas';
                        }
                      } else if (contentUnit === 'ml' || contentUnit === 'l') {
                        // Default for liquids: show in bottles
                        displayValue = units;
                        displayUnit = Math.floor(units) === 1 ? 'botella' : 'botellas';
                      } else if (contentUnit === 'g') {
                        // Weight in grams: convert to kg for display
                        const kg = supply.current_quantity / 1000;
                        displayValue = kg;
                        displayUnit = 'kg';
                      } else if (contentUnit === 'kg') {
                        displayValue = supply.current_quantity;
                        displayUnit = 'kg';
                      } else {
                        displayValue = units;
                        displayUnit = 'unidades';
                      }
                    } else {
                      displayValue = supply.current_quantity;
                      displayUnit = supply.unit;
                    }

                    // Format the display value
                    const formattedValue = displayValue % 1 === 0
                      ? displayValue.toFixed(0)
                      : displayValue.toFixed(1);

                    // Calculate optimal quantity with same logic as current quantity
                    let optimalDisplayValue: number | undefined;
                    let optimalDisplayUnit: string | undefined;

                    if (supply.optimal_quantity) {
                      if (supply.content_per_unit && supply.content_per_unit > 0) {
                        const optimalUnits = supply.optimal_quantity / supply.content_per_unit;

                        const category = supply.category?.toLowerCase() || '';
                        const contentUnit = supply.content_unit?.toLowerCase() || supply.unit?.toLowerCase() || '';

                        // Use same logic as current quantity
                        if (category.includes('otro') || category === 'otros') {
                          // Otros: always show in gramos
                          optimalDisplayValue = supply.optimal_quantity;
                          optimalDisplayUnit = 'g';
                        } else if (category.includes('fruta') || category.includes('fruit')) {
                          const kg = supply.optimal_quantity / 1000;
                          optimalDisplayValue = kg;
                          optimalDisplayUnit = 'kg';
                        } else if (category.includes('especia') || category.includes('spice')) {
                          const kg = supply.optimal_quantity / 1000;
                          if (kg < 1) {
                            optimalDisplayValue = supply.optimal_quantity;
                            optimalDisplayUnit = 'g';
                          } else {
                            optimalDisplayValue = kg;
                            optimalDisplayUnit = 'kg';
                          }
                        } else if (category.includes('licor') || category.includes('alcohol') || (category.includes('bebida') && contentUnit.includes('ml'))) {
                          optimalDisplayValue = optimalUnits;
                          optimalDisplayUnit = Math.floor(optimalUnits) === 1 ? 'botella' : 'botellas';
                        } else if (category.includes('refresco') || category.includes('no alcohólica') || category.includes('agua')) {
                          if (contentUnit === 'l' || supply.content_per_unit >= 1000) {
                            optimalDisplayValue = supply.optimal_quantity / 1000;
                            optimalDisplayUnit = optimalDisplayValue === 1 ? 'litro' : 'litros';
                          } else {
                            optimalDisplayValue = optimalUnits;
                            optimalDisplayUnit = Math.floor(optimalUnits) === 1 ? 'botella' : 'botellas';
                          }
                        } else if (contentUnit === 'ml' || contentUnit === 'l') {
                          optimalDisplayValue = optimalUnits;
                          optimalDisplayUnit = Math.floor(optimalUnits) === 1 ? 'botella' : 'botellas';
                        } else if (contentUnit === 'g') {
                          const kg = supply.optimal_quantity / 1000;
                          optimalDisplayValue = kg;
                          optimalDisplayUnit = 'kg';
                        } else if (contentUnit === 'kg') {
                          optimalDisplayValue = supply.optimal_quantity;
                          optimalDisplayUnit = 'kg';
                        } else {
                          optimalDisplayValue = optimalUnits;
                          optimalDisplayUnit = 'unidades';
                        }
                      } else {
                        optimalDisplayValue = supply.optimal_quantity;
                        optimalDisplayUnit = supply.unit;
                      }
                    }

                    const formattedOptimal = optimalDisplayValue
                      ? (optimalDisplayValue % 1 === 0
                        ? optimalDisplayValue.toFixed(0)
                        : optimalDisplayValue.toFixed(1))
                      : undefined;

                    return (
                      <TableRow key={supply.id}>
                        <TableCell className="font-medium">{supply.name}</TableCell>
                        <TableCell>{translateCategory(supply.category)}</TableCell>
                        <TableCell>
                          <span className="font-semibold">{formattedValue}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {displayUnit}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formattedOptimal ? (
                            <>
                              <span className="font-semibold">{formattedOptimal}</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                {optimalDisplayUnit}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StockHalfCircle
                            percentage={
                              supply.optimal_quantity
                                ? (supply.current_quantity / supply.optimal_quantity) * 100
                                : (supply.current_quantity / supply.min_threshold) * 100
                            }
                            status={supply.status}

                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestock(supply)}
                            className="mr-2 text-primary hover:text-primary"
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Abastecer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(supply)}
                            className="mr-2"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(supply)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Edit Dialog */}
          <EditSupplyDialog
            supply={editingSupply}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSuccess={handleEditSuccess}
          />

          {/* Restock Dialog */}
          <RestockSupplyDialog
            supply={restockingSupply}
            open={showRestockDialog}
            onOpenChange={setShowRestockDialog}
            onAddToCart={handleAddToCart}
          />

          {/* Purchase List Dialog */}
          <PurchaseListDialog
            open={showPurchaseListDialog}
            onOpenChange={setShowPurchaseListDialog}
            items={purchaseList}
            onRemoveItem={handleRemoveFromCart}
            onMarkAsOrdered={handleMarkAsOrdered}
            onConfirmReceived={handleConfirmReceived}
          />
        </div>
      </div>
    </div>
  )
}
