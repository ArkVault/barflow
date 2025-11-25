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
import { Loader2, Trash2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { EditSupplyDialog } from "@/components/edit-supply-dialog"

type Supply = {
  id: string;
  name: string;
  category: string;
  current_quantity: number;
  unit: string;
  min_threshold: number;
  status: 'ok' | 'low' | 'critical';
}

type StatusFilter = 'all' | 'critical' | 'low' | 'ok';

export default function InsumosPage() {
  const { t } = useLanguage();
  const { establishmentId, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const [deletingSupply, setDeletingSupply] = useState<Supply | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && establishmentId) {
      fetchSupplies();
    }
  }, [establishmentId, authLoading]);

  const fetchSupplies = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('supplies')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('name', { ascending: true });

      if (error) throw error;

      // Calculate status for each supply
      const suppliesWithStatus = (data || []).map(supply => {
        const percentage = (supply.current_quantity / supply.min_threshold) * 100;
        let status: 'ok' | 'low' | 'critical' = 'ok';

        if (percentage < 50) {
          status = 'critical';
        } else if (percentage < 100) {
          status = 'low';
        }

        return {
          id: supply.id,
          name: supply.name,
          category: supply.category || 'Otros',
          current_quantity: supply.current_quantity,
          unit: supply.unit,
          min_threshold: supply.min_threshold,
          status
        };
      });

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

  if (authLoading || loading) {
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
            <Link href="/demo">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BarFlow
              </h1>
            </Link>
            <Link href="/demo"><Button variant="outline" className="neumorphic-hover border-0">← Dashboard</Button></Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 ml-0 md:ml-20 lg:ml-72">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>{t('supplyManagement')}</h2>
            <p className="text-muted-foreground">{t('inventoryControl')}</p>
          </div>
          <Link href="/demo/planner">
            <Button className="neumorphic-hover border-0">+ {t('addSupply')}</Button>
          </Link>
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
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead>{t('quantity')}</TableHead>
                  <TableHead>{t('minimum')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSupplies.map((supply) => (
                  <TableRow key={supply.id}>
                    <TableCell className="font-medium">{supply.name}</TableCell>
                    <TableCell>{translateCategory(supply.category)}</TableCell>
                    <TableCell>{supply.current_quantity} {supply.unit}</TableCell>
                    <TableCell>{supply.min_threshold} {supply.unit}</TableCell>
                    <TableCell>
                      {supply.status === 'ok' && <Badge className="bg-green-600">Bien</Badge>}
                      {supply.status === 'low' && <Badge className="bg-amber-600">Stock Bajo</Badge>}
                      {supply.status === 'critical' && <Badge variant="destructive">Crítico</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
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
                ))}
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
      </div>
    </div>
  )
}
