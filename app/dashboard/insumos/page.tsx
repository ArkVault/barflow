"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, Suspense } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Trash2, Pencil, ShoppingCart, Plus } from "lucide-react";
import { GlowButton } from "@/components/glow-button";
import { toast } from "sonner";
import { EditSupplyDialog } from "@/components/edit-supply-dialog";
import { calculateStockStatus } from "@/lib/stock-utils";
import { StockHalfCircle } from "@/components/stock-half-circle";
import {
  RestockSupplyDialog,
  type PurchaseItem,
} from "@/components/restock-supply-dialog";
import { PurchaseListDialog } from "@/components/purchase-list-dialog";
import {
  getDisplayQuantity,
  getOptimalDisplayQuantity,
} from "@/lib/utils/supply-display";
import type { SupplyWithStatus } from "@/types/supply";
import { SuppliesService } from "@/lib/services/supplies.service";
import { ProdShell } from "@/components/shells";

function InsumosPageContent() {
  const { t, language } = useLanguage();
  const { establishmentId, establishmentName, user } = useAuth();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<
    "all" | "critical" | "low" | "ok"
  >("all");
  const [supplies, setSupplies] = useState<SupplyWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSupply, setEditingSupply] = useState<SupplyWithStatus | null>(
    null,
  );
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Purchase system state
  const [restockingSupply, setRestockingSupply] =
    useState<SupplyWithStatus | null>(null);
  const [showRestockDialog, setShowRestockDialog] = useState(false);
  const [showPurchaseListDialog, setShowPurchaseListDialog] = useState(false);
  const [purchaseList, setPurchaseList] = useState<PurchaseItem[]>([]);

  // Load purchase list from localStorage on mount
  useEffect(() => {
    const savedList = localStorage.getItem("barflow_purchase_list");
    if (savedList) {
      try {
        setPurchaseList(JSON.parse(savedList));
      } catch (error) {
        console.error("Error loading purchase list:", error);
      }
    }
  }, []);

  // Save purchase list to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("barflow_purchase_list", JSON.stringify(purchaseList));
  }, [purchaseList]);

  useEffect(() => {
    if (establishmentId) {
      fetchSupplies();
    }
  }, [establishmentId]);

  // Handle restock query param from /proyecciones
  useEffect(() => {
    const restockId = searchParams.get("restock");
    if (restockId && supplies.length > 0 && !loading) {
      const supplyToRestock = supplies.find((s) => s.id === restockId);
      if (supplyToRestock) {
        setRestockingSupply(supplyToRestock);
        setShowRestockDialog(true);
        window.history.replaceState({}, "", "/dashboard/insumos");
      }
    }
  }, [searchParams, supplies, loading]);

  const fetchSupplies = async () => {
    if (!establishmentId) return;

    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await SuppliesService.getAll(
        supabase,
        establishmentId,
        {
          orderBy: "name",
          ascending: true,
        },
      );

      if (error) throw error;

      const suppliesWithStatus = (data || []).map((supply) => ({
        id: supply.id,
        name: supply.name,
        category: supply.category || "Otros",
        current_quantity: supply.current_quantity,
        unit: supply.unit,
        min_threshold: supply.min_threshold,
        optimal_quantity: supply.optimal_quantity,
        content_per_unit: supply.content_per_unit,
        content_unit: supply.content_unit,
        status: calculateStockStatus(supply),
      }));

      setSupplies(suppliesWithStatus);
    } catch (error: any) {
      console.error("Error fetching supplies:", error);
      toast.error(`${t("errorLoadingSupplies")} ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supply: SupplyWithStatus) => {
    setEditingSupply(supply);
    setShowEditDialog(true);
  };

  const handleDelete = async (supply: SupplyWithStatus) => {
    const confirmMsg =
      language === "es"
        ? `¿Estás seguro de eliminar "${supply.name}"? Esta acción no se puede deshacer.`
        : `Are you sure you want to delete "${supply.name}"? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("supplies")
        .delete()
        .eq("id", supply.id);

      if (error) throw error;

      toast.success(
        language === "es"
          ? `${supply.name} eliminado correctamente`
          : `${supply.name} deleted successfully`,
      );
      fetchSupplies();
    } catch (error: any) {
      console.error("Error deleting supply:", error);
      toast.error(
        (language === "es" ? "Error al eliminar: " : "Error deleting: ") +
          error.message,
      );
    }
  };

  const handleEditSuccess = () => {
    fetchSupplies();
  };

  const handleRestock = (supply: SupplyWithStatus) => {
    setRestockingSupply(supply);
    setShowRestockDialog(true);
  };

  const handleAddToCart = (item: PurchaseItem) => {
    const existingIndex = purchaseList.findIndex(
      (p) => p.supplyId === item.supplyId,
    );

    if (existingIndex >= 0) {
      const updated = [...purchaseList];
      const existingItem = updated[existingIndex];

      if (existingItem.status === "ordered") {
        toast.warning(
          language === "es"
            ? `${item.supplyName} ya está en estado "Pedido". Confirma la recepción primero.`
            : `${item.supplyName} is already "Ordered". Confirm receipt first.`,
        );
        return;
      }

      updated[existingIndex] = { ...item, status: "pending" };
      setPurchaseList(updated);
      toast.success(
        language === "es"
          ? `${item.supplyName} actualizado en la lista de compras`
          : `${item.supplyName} updated in shopping list`,
      );
    } else {
      setPurchaseList([...purchaseList, item]);
      toast.success(
        language === "es"
          ? `${item.supplyName} agregado a la lista de compras`
          : `${item.supplyName} added to shopping list`,
      );
    }
  };

  const handleRemoveFromCart = (supplyId: string) => {
    setPurchaseList(purchaseList.filter((item) => item.supplyId !== supplyId));
    toast.success(
      language === "es"
        ? "Item eliminado de la lista de compras"
        : "Item removed from shopping list",
    );
  };

  const handleMarkAsOrdered = (supplyId: string) => {
    setPurchaseList(
      purchaseList.map((item) =>
        item.supplyId === supplyId
          ? { ...item, status: "ordered" as const }
          : item,
      ),
    );
  };

  const handleConfirmReceived = async (supplyId: string, quantity: number) => {
    try {
      const supabase = createClient();
      const supply = supplies.find((s) => s.id === supplyId);
      if (!supply) {
        toast.error(
          language === "es" ? "Insumo no encontrado" : "Supply not found",
        );
        return;
      }

      const newQuantity = supply.current_quantity + quantity;
      const { error } = await supabase
        .from("supplies")
        .update({ current_quantity: newQuantity })
        .eq("id", supplyId);

      if (error) throw error;

      setPurchaseList(
        purchaseList.filter((item) => item.supplyId !== supplyId),
      );
      await fetchSupplies();

      toast.success(
        language === "es"
          ? `${supply.name} abastecido: +${quantity} ${supply.unit}`
          : `${supply.name} restocked: +${quantity} ${supply.unit}`,
      );
    } catch (error: any) {
      console.error("Error confirming receipt:", error);
      toast.error(
        (language === "es"
          ? "Error al confirmar recepción: "
          : "Error confirming receipt: ") + error.message,
      );
    }
  };

  const translateCategory = (category?: string | null) => {
    if (!category) return "-";
    if (language === "es") return category;

    const categoryMap: Record<string, string> = {
      Licores: "Spirits",
      "Licores Dulces": "Sweet Liquors",
      "Bebidas alcohólicas": "Alcoholic Beverages",
      "Bebidas no alcohólicas": "Non-Alcoholic Beverages",
      Refrescos: "Soft Drinks",
      Especias: "Spices",
      Frutas: "Fruits",
      Hierbas: "Herbs",
      "Insumos para cócteles": "Cocktail Supplies",
      "Mezcladores y adornos": "Mixers & Garnishes",
      "Alimentos y aperitivos": "Food & Snacks",
      "Materiales desechables": "Disposable Materials",
      "Cristalería y utensilios": "Glassware & Utensils",
      Otros: "Other",
    };
    return categoryMap[category] || category;
  };

  const translateUnit = (unit: string) => {
    if (language === "es") return unit;

    const unitMap: Record<string, string> = {
      botella: "bottle",
      botellas: "bottles",
      litro: "liter",
      litros: "liters",
      unidades: "units",
      unidad: "unit",
    };
    return unitMap[unit] || unit;
  };

  const criticalCount = supplies.filter((s) => s.status === "critical").length;
  const lowCount = supplies.filter((s) => s.status === "low").length;
  const okCount = supplies.filter((s) => s.status === "ok").length;

  const filteredSupplies =
    statusFilter === "all"
      ? supplies
      : supplies.filter((s) => s.status === statusFilter);

  if (loading) {
    return (
      <ProdShell
        userName={user?.email || "Usuario"}
        establishmentName={establishmentName || "Mi Negocio"}
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {language === "es"
                ? "Cargando insumos..."
                : "Loading supplies..."}
            </p>
          </div>
        </div>
      </ProdShell>
    );
  }

  return (
    <ProdShell
      userName={user?.email || "Usuario"}
      establishmentName={establishmentName || "Mi Negocio"}
    >
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-4xl font-bold mb-2"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              {t("supplyManagement")}
            </h2>
            <p className="text-muted-foreground">{t("inventoryControl")}</p>
          </div>
          <div className="flex gap-2">
            <GlowButton
              onClick={() => setShowPurchaseListDialog(true)}
              className="relative"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-inner">
                <ShoppingCart className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="hidden sm:inline">{t("suppliesToBuy")}</span>
              {purchaseList.length > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 px-1.5 py-0 h-5 min-w-[20px] rounded-full"
                >
                  {purchaseList.length}
                </Badge>
              )}
            </GlowButton>
            <Link href="/dashboard/planner">
              <GlowButton>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-inner">
                  <Plus className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="hidden sm:inline">{t("addSupply")}</span>
              </GlowButton>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card
            className={`neumorphic border-0 p-6 cursor-pointer transition-all hover:scale-105 ${
              statusFilter === "critical" ? "ring-2 ring-destructive" : ""
            }`}
            onClick={() =>
              setStatusFilter(statusFilter === "critical" ? "all" : "critical")
            }
          >
            <div className="text-sm text-muted-foreground mb-1">
              {t("criticalStock")}
            </div>
            <div
              className="text-5xl font-black text-red-600"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              {criticalCount}
            </div>
          </Card>
          <Card
            className={`neumorphic border-0 p-6 cursor-pointer transition-all hover:scale-105 ${
              statusFilter === "low" ? "ring-2 ring-amber-500" : ""
            }`}
            onClick={() =>
              setStatusFilter(statusFilter === "low" ? "all" : "low")
            }
          >
            <div className="text-sm text-muted-foreground mb-1">
              {t("lowStock")}
            </div>
            <div
              className="text-5xl font-black text-amber-600"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              {lowCount}
            </div>
          </Card>
          <Card
            className={`neumorphic border-0 p-6 cursor-pointer transition-all hover:scale-105 ${
              statusFilter === "ok" ? "ring-2 ring-green-500" : ""
            }`}
            onClick={() =>
              setStatusFilter(statusFilter === "ok" ? "all" : "ok")
            }
          >
            <div className="text-sm text-muted-foreground mb-1">
              {t("goodStock")}
            </div>
            <div
              className="text-5xl font-black text-green-600"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              {okCount}
            </div>
          </Card>
          <Card
            className={`neumorphic border-0 p-6 cursor-pointer transition-all hover:scale-105 ${
              statusFilter === "all" ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setStatusFilter("all")}
          >
            <div className="text-sm text-muted-foreground mb-1">
              {t("allSupplies")}
            </div>
            <div
              className="text-5xl font-black"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              {supplies.length}
            </div>
          </Card>
        </div>

        {supplies.length === 0 ? (
          <Card className="neumorphic border-0 p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {language === "es"
                ? "No tienes insumos registrados aún."
                : "You have no registered supplies yet."}
            </p>
            <Link href="/dashboard/planner">
              <Button>
                {language === "es"
                  ? "Ir al Planner para agregar insumos"
                  : "Go to Planner to add supplies"}
              </Button>
            </Link>
          </Card>
        ) : (
          <Card className="neumorphic border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("category")}</TableHead>
                  <TableHead>
                    {language === "es" ? "Cantidad Total" : "Total Quantity"}
                  </TableHead>
                  <TableHead>{t("optimal")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSupplies.map((supply) => {
                  const displayQuantity = getDisplayQuantity(supply);
                  const optimalQuantity = getOptimalDisplayQuantity(supply);

                  return (
                    <TableRow key={supply.id}>
                      <TableCell className="font-medium">
                        {supply.name}
                      </TableCell>
                      <TableCell>
                        {translateCategory(supply.category)}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {displayQuantity.value % 1 === 0
                            ? displayQuantity.value.toFixed(0)
                            : displayQuantity.value.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {translateUnit(displayQuantity.unit)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {optimalQuantity ? (
                          <>
                            <span className="font-semibold">
                              {optimalQuantity.value % 1 === 0
                                ? optimalQuantity.value.toFixed(0)
                                : optimalQuantity.value.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">
                              {translateUnit(optimalQuantity.unit)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StockHalfCircle
                          percentage={
                            supply.optimal_quantity
                              ? (supply.current_quantity /
                                  supply.optimal_quantity) *
                                100
                              : (supply.current_quantity /
                                  supply.min_threshold) *
                                100
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
                          {t("restock")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(supply)}
                          className="mr-2"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          {t("edit")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(supply)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t("delete")}
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
    </ProdShell>
  );
}

export default function InsumosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      }
    >
      <InsumosPageContent />
    </Suspense>
  );
}
