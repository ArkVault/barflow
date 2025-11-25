"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { defaultBarSupplies, type PlanPeriod, type SupplyPlan } from "@/lib/default-supplies";
import { Plus, Check, X, Upload, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { MenuUpload } from "@/components/menu-upload";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface InventoryPlannerProps {
  onComplete: (supplies: SupplyPlan[], period: PlanPeriod) => void;
}

export function InventoryPlanner({ onComplete }: InventoryPlannerProps) {
  const { t } = useLanguage();
  const { establishmentId, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<PlanPeriod>("week");
  const [supplies, setSupplies] = useState<SupplyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Load existing supplies from Supabase
  useEffect(() => {
    if (!authLoading && establishmentId) {
      loadSuppliesFromDatabase();
    }
  }, [establishmentId, authLoading]);

  const loadSuppliesFromDatabase = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('supplies')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('name', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Convert database supplies to SupplyPlan format
        const loadedSupplies: SupplyPlan[] = data.map(supply => ({
          name: supply.name,
          category: supply.category || 'Otros',
          unit: supply.unit,
          quantity: supply.current_quantity,
          selected: true, // Mark as selected since they exist
        }));

        setSupplies(loadedSupplies);
        toast.success(`${data.length} insumos cargados desde tu inventario`);
      } else {
        // No supplies yet, use defaults
        setSupplies(
          defaultBarSupplies.map(s => ({ ...s, quantity: s.defaultQuantity, selected: false }))
        );
      }
    } catch (error: any) {
      console.error('Error loading supplies:', error);
      toast.error('Error al cargar insumos: ' + error.message);
      // Fallback to defaults
      setSupplies(
        defaultBarSupplies.map(s => ({ ...s, quantity: s.defaultQuantity, selected: false }))
      );
    } finally {
      setLoading(false);
    }
  };
  const [showAddNew, setShowAddNew] = useState(false);
  const [newSupply, setNewSupply] = useState({
    name: "",
    category: "Otros",
    unit: "L",
    quantity: 0
  });
  const [inputMethod, setInputMethod] = useState<'none' | 'manual' | 'import'>('none');

  const toggleSupply = (index: number) => {
    const updated = [...supplies];
    updated[index].selected = !updated[index].selected;
    setSupplies(updated);
  };

  const updateQuantity = (index: number, quantity: number) => {
    const updated = [...supplies];
    updated[index].quantity = quantity;
    setSupplies(updated);
  };

  const addNewSupply = () => {
    if (newSupply.name && newSupply.quantity > 0) {
      setSupplies([...supplies, { ...newSupply, selected: true }]);
      setNewSupply({ name: "", category: "Otros", unit: "L", quantity: 0 });
      setShowAddNew(false);
    }
  };

  const handleImportedSupplies = (importedSupplies: any[]) => {
    // Merge imported supplies with existing supplies
    const mergedSupplies = [...supplies, ...importedSupplies];
    setSupplies(mergedSupplies);
  };

  const handleComplete = () => {
    const selectedSupplies = supplies.filter(s => s.selected);
    if (selectedSupplies.length > 0) {
      onComplete(selectedSupplies, period);
    }
  };

  const selectedCount = supplies.filter(s => s.selected).length;

  // Group supplies by category
  const groupedSupplies = supplies.reduce((acc, supply, index) => {
    if (!acc[supply.category]) {
      acc[supply.category] = [];
    }
    acc[supply.category].push({ ...supply, index });
    return acc;
  }, {} as Record<string, (SupplyPlan & { index: number })[]>);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 ml-0 md:ml-20 lg:ml-72">
        <Card className="w-full max-w-5xl neumorphic border-0 p-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg text-muted-foreground">Cargando tu inventario...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 ml-0 md:ml-20 lg:ml-72">
      <Card className="w-full max-w-5xl neumorphic border-0">
        <CardHeader>
          <div className="flex items-start justify-between mb-6">
            <div>
              <CardTitle className="text-3xl font-bold mb-2">
                {supplies.length > 0 && supplies.some(s => s.selected)
                  ? `Plan ${period === 'month' ? 'Mensual' : 'Semanal'} Actual`
                  : t('inventoryPlanner')
                }
              </CardTitle>
              <CardDescription className="text-base">
                {t('configureInventory')}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {selectedCount} {t('selectedSupplies')}
            </Badge>
          </div>

          {/* Period Selector */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t('planPeriod')}</p>
            <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1 text-sm w-fit">
              <button
                type="button"
                onClick={() => setPeriod("week")}
                className={`px-4 py-2 rounded-full transition-colors ${period === "week"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                📅 {t('week')}
              </button>
              <button
                type="button"
                onClick={() => setPeriod("month")}
                className={`px-4 py-2 rounded-full transition-colors ${period === "month"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                📆 {t('month')}
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Method Selection */}
          {inputMethod === 'none' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold mb-2">¿Cómo deseas agregar tu inventario?</h3>
                <p className="text-muted-foreground">Elige el método que prefieras para configurar tu plan</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manual Entry Option */}
                <div className="btn-glow-wrapper">
                  <button
                    onClick={() => setInputMethod('manual')}
                    className="group neumorphic rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 text-left relative overflow-hidden w-full"
                  >
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="h-8 w-8 text-primary" />
                      </div>
                      <h4 className="text-lg font-semibold mb-2">Introducir Manualmente</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Selecciona items de nuestro catálogo predefinido o agrega insumos personalizados uno por uno
                      </p>
                      <div className="flex items-center text-sm text-primary font-medium">
                        <span>Continuar</span>
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                {/* Import Option */}
                <div className="btn-glow-wrapper btn-glow-secondary">
                  <button
                    onClick={() => setInputMethod('import')}
                    className="group neumorphic rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 text-left relative overflow-hidden w-full"
                  >
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-3xl bg-secondary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="h-8 w-8 text-secondary" />
                      </div>
                      <h4 className="text-lg font-semibold mb-2">Importar desde Archivo</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Sube tu menú en formato CSV o Excel y nuestro AI lo parseará automáticamente
                      </p>
                      <div className="flex items-center text-sm text-secondary font-medium">
                        <span>Continuar</span>
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Import Method */}
          {inputMethod === 'import' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Importar desde Archivo</h3>
                  <p className="text-sm text-muted-foreground">Sube tu archivo y nuestro AI lo procesará</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setInputMethod('none')}
                  className="neumorphic-hover"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cambiar método
                </Button>
              </div>

              <MenuUpload onSuppliesParsed={handleImportedSupplies} />

              {supplies.filter(s => s.selected).length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Items Importados ({supplies.filter(s => s.selected).length})</h4>
                    <p className="text-sm text-muted-foreground">
                      Revisa los items importados y ajusta cantidades si es necesario
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto pr-2">
                    {supplies.filter(s => s.selected).map((supply: any, index) => (
                      <div
                        key={index}
                        className={`neumorphic-inset p-3 rounded-lg ${supply.matchedExisting ? 'ring-1 ring-green-500/30' : 'ring-1 ring-blue-500/30'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">{supply.name}</p>
                              {supply.matchedExisting ? (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                                  En DB
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                                  Nuevo
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{supply.category}</p>
                            {supply.matchConfidence > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Confianza: {Math.round(supply.matchConfidence * 100)}%
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const updated = supplies.filter((_, i) => i !== supplies.findIndex(s => s.name === supply.name));
                              setSupplies(updated);
                            }}
                            className="text-destructive hover:bg-destructive/10 p-1 rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={supply.quantity}
                            onChange={(e) => {
                              const updated = [...supplies];
                              const idx = updated.findIndex(s => s.name === supply.name);
                              if (idx !== -1) {
                                updated[idx].quantity = Number(e.target.value);
                                setSupplies(updated);
                              }
                            }}
                            className="h-8 text-sm"
                            min="0"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{supply.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleComplete}
                    disabled={supplies.filter(s => s.selected).length === 0}
                    className="w-full h-12 text-lg neumorphic-hover mt-6"
                  >
                    {t('completePlan')} →
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Manual Method */}
          {inputMethod === 'manual' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Introducción Manual</h3>
                  <p className="text-sm text-muted-foreground">Selecciona items del catálogo o agrega personalizados</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setInputMethod('none')}
                  className="neumorphic-hover"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cambiar método
                </Button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {Object.entries(groupedSupplies).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <span className="h-1 w-8 bg-primary rounded" />
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map(({ index, name, unit, quantity, selected }) => (
                        <div
                          key={index}
                          className={`neumorphic-inset p-3 rounded-lg cursor-pointer transition-all ${selected ? "ring-2 ring-primary" : ""
                            }`}
                          onClick={() => toggleSupply(index)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{name}</p>
                              <p className="text-xs text-muted-foreground">{unit}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? "bg-primary border-primary" : "border-muted-foreground"
                              }`}>
                              {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                          </div>
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateQuantity(index, Number(e.target.value));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 text-sm"
                            min="0"
                            disabled={!selected}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add New Supply */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="h-1 w-8 bg-emerald-500 rounded" />
                    Personalizado
                  </h3>
                  {!showAddNew ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowAddNew(true)}
                      className="w-full neumorphic-hover border-dashed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar nuevo insumo
                    </Button>
                  ) : (
                    <div className="neumorphic-inset p-4 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Nombre del insumo"
                          value={newSupply.name}
                          onChange={(e) => setNewSupply({ ...newSupply, name: e.target.value })}
                        />
                        <Input
                          placeholder="Categoría"
                          value={newSupply.category}
                          onChange={(e) => setNewSupply({ ...newSupply, category: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Unidad (L, kg, etc.)"
                          value={newSupply.unit}
                          onChange={(e) => setNewSupply({ ...newSupply, unit: e.target.value })}
                        />
                        <Input
                          type="number"
                          placeholder="Cantidad"
                          value={newSupply.quantity || ""}
                          onChange={(e) => setNewSupply({ ...newSupply, quantity: Number(e.target.value) })}
                          min="0"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={addNewSupply} className="flex-1">
                          <Check className="w-4 h-4 mr-2" />
                          Agregar
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddNew(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Complete Plan Button for Manual Mode */}
          {inputMethod === 'manual' && (
            <div className="mt-6 pt-6 border-t">
              <Button
                onClick={handleComplete}
                disabled={selectedCount === 0}
                className="w-full h-12 text-lg neumorphic-hover"
              >
                {t('completePlan')} →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
