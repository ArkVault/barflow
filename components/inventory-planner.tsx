"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { defaultBarSupplies, type PlanPeriod, type SupplyPlan } from "@/lib/default-supplies";
import { Plus, Check, X } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface InventoryPlannerProps {
  onComplete: (supplies: SupplyPlan[], period: PlanPeriod) => void;
}

export function InventoryPlanner({ onComplete }: InventoryPlannerProps) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<PlanPeriod>("week");
  const [supplies, setSupplies] = useState<SupplyPlan[]>(
    defaultBarSupplies.map(s => ({ ...s, quantity: s.defaultQuantity, selected: false }))
  );

  // Load existing plan if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const existingPlan = localStorage.getItem("barflow_plan");
      if (existingPlan) {
        try {
          const plan = JSON.parse(existingPlan);
          setPeriod(plan.period);
          
          // Merge existing plan with default supplies
          const mergedSupplies = defaultBarSupplies.map(defaultSupply => {
            const existingSupply = plan.supplies.find((s: SupplyPlan) => s.name === defaultSupply.name);
            if (existingSupply) {
              return existingSupply;
            }
            return { ...defaultSupply, quantity: defaultSupply.defaultQuantity, selected: false };
          });
          
          // Add custom supplies that aren't in defaults
          const customSupplies = plan.supplies.filter((s: SupplyPlan) => 
            !defaultBarSupplies.some(d => d.name === s.name)
          );
          
          setSupplies([...mergedSupplies, ...customSupplies]);
        } catch (error) {
          console.error("Error loading plan:", error);
        }
      }
    }
  }, []);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newSupply, setNewSupply] = useState({
    name: "",
    category: "Otros",
    unit: "L",
    quantity: 0
  });

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 ml-0 md:ml-20 lg:ml-72">
      <Card className="w-full max-w-5xl neumorphic border-0">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-3xl mb-2">📋 {t('inventoryPlanner')}</CardTitle>
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
                className={`px-4 py-2 rounded-full transition-colors ${
                  period === "week"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📅 {t('week')}
              </button>
              <button
                type="button"
                onClick={() => setPeriod("month")}
                className={`px-4 py-2 rounded-full transition-colors ${
                  period === "month"
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
                      className={`neumorphic-inset p-3 rounded-lg cursor-pointer transition-all ${
                        selected ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => toggleSupply(index)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{name}</p>
                          <p className="text-xs text-muted-foreground">{unit}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selected ? "bg-primary border-primary" : "border-muted-foreground"
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

          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={handleComplete}
              disabled={selectedCount === 0}
              className="w-full h-12 text-lg neumorphic-hover"
            >
              {t('completePlan')} →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
