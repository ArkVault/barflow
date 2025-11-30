"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
     Dialog,
     DialogContent,
     DialogDescription,
     DialogFooter,
     DialogHeader,
     DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Check, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface Menu {
     id: string;
     name: string;
     is_active: boolean;
     created_at: string;
}

interface MenuManagerProps {
     onMenuChange?: (menuId: string) => void;
}

export function MenuManager({ onMenuChange }: MenuManagerProps) {
     const { establishmentId } = useAuth();

     // Initialize with Los Clásicos menu for demo
     const defaultMenu: Menu = {
          id: 'los-clasicos',
          name: 'Los Clásicos',
          is_active: false,
          created_at: new Date().toISOString()
     };

     const [menus, setMenus] = useState<Menu[]>([defaultMenu]);
     const [selectedMenuId, setSelectedMenuId] = useState<string>("");
     const [showCreateDialog, setShowCreateDialog] = useState(false);
     const [newMenuName, setNewMenuName] = useState("");
     const [loading, setLoading] = useState(false);

     useEffect(() => {
          loadMenus();
     }, [establishmentId]);


     const loadMenus = async () => {
          console.log('MenuManager - Loading menus:', { establishmentId });

          // Check if we're in demo mode
          const isDemo = !establishmentId || establishmentId === 'demo';

          // In demo mode, just use the default menu
          if (isDemo) {
               console.log('MenuManager - Demo mode, using default Los Clásicos menu');
               const losClasicosMenu: Menu = {
                    id: 'los-clasicos',
                    name: 'Los Clásicos',
                    is_active: false,
                    created_at: new Date().toISOString()
               };
               setMenus([losClasicosMenu]);
               return;
          }

          // Production mode - load from Supabase
          try {
               setLoading(true);
               const supabase = createClient();

               const { data, error } = await supabase
                    .from("menus")
                    .select("*")
                    .eq("establishment_id", establishmentId)
                    .order("created_at", { ascending: false });

               if (error) throw error;

               console.log('MenuManager - Loaded from Supabase:', data?.length || 0, 'menus');
               console.log('MenuManager - Menu details:', data?.map(m => ({ id: m.id, name: m.name, active: m.is_active })));

               setMenus(data || []);

               // Set active menu as selected
               const activeMenu = data?.find((m) => m.is_active);
               if (activeMenu) {
                    setSelectedMenuId(activeMenu.id);
                    onMenuChange?.(activeMenu.id);
               }
          } catch (error: any) {
               console.error("Error loading menus:", error);
               // Fallback to empty array on error in production
               setMenus([]);
          } finally {
               setLoading(false);
          }
     };


     const createMenu = async () => {
          if (!newMenuName.trim()) {
               toast.error("Por favor ingresa un nombre para el menú");
               return;
          }

          try {
               const supabase = createClient();

               const { data, error } = await supabase
                    .from("menus")
                    .insert({
                         establishment_id: establishmentId,
                         name: newMenuName,
                         is_active: false,
                    })
                    .select()
                    .single();

               if (error) throw error;

               toast.success("Menú creado exitosamente");
               setNewMenuName("");
               setShowCreateDialog(false);
               loadMenus();
          } catch (error: any) {
               console.error("Error creating menu:", error);
               toast.error("Error al crear menú");
          }
     };

     const activateMenu = async (menuId: string) => {
          try {
               const supabase = createClient();

               const { error } = await supabase
                    .from("menus")
                    .update({ is_active: true, updated_at: new Date().toISOString() })
                    .eq("id", menuId);

               if (error) throw error;

               toast.success("Menú activado");
               setSelectedMenuId(menuId);
               onMenuChange?.(menuId);
               loadMenus();
          } catch (error: any) {
               console.error("Error activating menu:", error);
               toast.error("Error al activar menú");
          }
     };

     const deleteMenu = async (menuId: string) => {
          const menu = menus.find((m) => m.id === menuId);
          if (menu?.is_active) {
               toast.error("No puedes eliminar el menú activo");
               return;
          }

          if (!confirm("¿Estás seguro de eliminar este menú?")) {
               return;
          }

          try {
               const supabase = createClient();

               const { error } = await supabase.from("menus").delete().eq("id", menuId);

               if (error) throw error;

               toast.success("Menú eliminado");
               loadMenus();
          } catch (error: any) {
               console.error("Error deleting menu:", error);
               toast.error("Error al eliminar menú");
          }
     };

     const activeMenu = menus.find((m) => m.is_active);
     const inactiveMenus = menus.filter((m) => !m.is_active);

     console.log('MenuManager - All menus:', menus.length);
     console.log('MenuManager - Active menu:', activeMenu?.name, activeMenu?.id);
     console.log('MenuManager - Inactive menus:', inactiveMenus.map(m => `${m.name} (${m.id})`));


     return (
          <div className="space-y-4">
               {/* Header with New Menu Button */}
               <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">
                         Gestión de Menús
                    </Label>
                    <Button
                         onClick={() => setShowCreateDialog(true)}
                         className="neumorphic-hover"
                    >
                         <Plus className="w-4 h-4 mr-2" />
                         Nuevo Menú
                    </Button>
               </div>

               {/* Menus List */}
               {menus.length > 0 && (
                    <div className="space-y-3">
                         <Label className="text-sm font-medium">
                              Menús
                         </Label>
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {/* Active Menu First (if exists) */}
                              {activeMenu && (
                                   <div
                                        key={activeMenu.id}
                                        className="group relative rounded-lg p-3 active-menu-card"
                                   >
                                        {/* Menú Activo Badge - Top Right Corner */}
                                        <div
                                             className="absolute z-20"
                                             style={{ top: '8px', right: '8px' }}
                                        >
                                             <span className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg whitespace-nowrap">
                                                  Menú Activo
                                             </span>
                                        </div>

                                        <div className="space-y-2 relative z-10">
                                             <div>
                                                  <p className="font-semibold text-foreground text-sm pr-24">
                                                       {activeMenu.name}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground mt-0.5">
                                                       {new Date(activeMenu.created_at).toLocaleDateString('es-ES', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                       })}
                                                  </p>
                                             </div>
                                        </div>
                                   </div>
                              )}


                              {/* Inactive Menus */}
                              {inactiveMenus.map((menu) => (
                                   <div
                                        key={menu.id}
                                        className="group relative overflow-hidden rounded-lg p-3 bg-gradient-to-br from-white/10 via-white/5 to-gray-500/10 border border-white/20 hover:border-white/30 transition-all hover:scale-[1.02] cursor-pointer"
                                        onClick={() => activateMenu(menu.id)}
                                   >
                                        <div className="space-y-2">
                                             <div>
                                                  <p className="font-semibold text-foreground text-sm">
                                                       {menu.name}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground mt-0.5">
                                                       {new Date(menu.created_at).toLocaleDateString('es-ES', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                       })}
                                                  </p>
                                             </div>

                                             <div className="flex gap-1.5">
                                                  <Button
                                                       size="sm"
                                                       className="flex-1 h-7 text-xs neumorphic-hover"
                                                       onClick={(e) => {
                                                            e.stopPropagation();
                                                            activateMenu(menu.id);
                                                       }}
                                                  >
                                                       Activar
                                                  </Button>
                                                  <Button
                                                       size="sm"
                                                       variant="ghost"
                                                       className="h-7 w-7 p-0"
                                                       onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteMenu(menu.id);
                                                       }}
                                                  >
                                                       <Trash2 className="w-3 h-3" />
                                                  </Button>
                                             </div>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    </div>
               )}




               {/* Create Menu Dialog */}
               <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogContent>
                         <DialogHeader>
                              <DialogTitle>Crear Nuevo Menú</DialogTitle>
                              <DialogDescription>
                                   Dale un nombre a tu nuevo menú (ej: "Menú Verano 2025", "Menú Especial Navidad")
                              </DialogDescription>
                         </DialogHeader>

                         <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                   <Label htmlFor="menu-name">Nombre del Menú</Label>
                                   <Input
                                        id="menu-name"
                                        value={newMenuName}
                                        onChange={(e) => setNewMenuName(e.target.value)}
                                        placeholder="Ej: Menú Verano 2025"
                                   />
                              </div>
                         </div>

                         <DialogFooter>
                              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                   Cancelar
                              </Button>
                              <Button onClick={createMenu}>Crear Menú</Button>
                         </DialogFooter>
                    </DialogContent>
               </Dialog>
          </div>
     );
}
