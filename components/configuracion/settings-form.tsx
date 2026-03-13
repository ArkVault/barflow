'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateEstablishmentSettings } from '@/app/dashboard/configuracion/actions';

interface Establishment {
     id: string;
     name: string | null;
     tax_rate: number | null;
}

interface SettingsFormProps {
     establishment: Establishment;
}

export function SettingsForm({ establishment }: SettingsFormProps) {
     const [name, setName] = useState(establishment.name ?? '');
     const [taxRate, setTaxRate] = useState(establishment.tax_rate ?? 16);
     const [isPending, startTransition] = useTransition();

     const handleSave = () => {
          startTransition(async () => {
               const result = await updateEstablishmentSettings(establishment.id, {
                    name,
                    taxRate,
               });

               if (result.success) {
                    toast.success('Configuración guardada correctamente');
               } else {
                    toast.error(result.error ?? 'Error al guardar los cambios');
               }
          });
     };

     const handleCancel = () => {
          setName(establishment.name ?? '');
          setTaxRate(establishment.tax_rate ?? 16);
     };

     return (
          <div className="grid gap-6">
               {/* General Settings */}
               <div className="neumorphic rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Configuración General</h2>
                    <div className="space-y-4">
                         <div>
                              <label className="block text-sm font-medium mb-2">
                                   Nombre del Establecimiento
                              </label>
                              <input
                                   type="text"
                                   value={name}
                                   onChange={(e) => setName(e.target.value)}
                                   className="w-full px-4 py-2 rounded-xl neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                         </div>
                         <div>
                              <label className="block text-sm font-medium mb-2">
                                   Tasa de Impuesto (%) — IVA
                              </label>
                              <input
                                   type="number"
                                   value={taxRate}
                                   onChange={(e) => setTaxRate(Number(e.target.value))}
                                   min={0}
                                   max={100}
                                   step={0.01}
                                   className="w-full px-4 py-2 rounded-xl neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                   Zona fronteriza: 8% · Estándar: 16% · Exportación / exento: 0%
                              </p>
                         </div>
                         <div>
                              <label className="block text-sm font-medium mb-2">Moneda</label>
                              <select className="w-full px-4 py-2 rounded-xl neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary">
                                   <option>MXN - Peso Mexicano</option>
                                   <option>USD - Dólar Americano</option>
                                   <option>EUR - Euro</option>
                              </select>
                         </div>
                         <div>
                              <label className="block text-sm font-medium mb-2">Zona Horaria</label>
                              <select className="w-full px-4 py-2 rounded-xl neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary">
                                   <option>América/Ciudad de México</option>
                                   <option>América/Monterrey</option>
                                   <option>América/Tijuana</option>
                              </select>
                         </div>
                    </div>
               </div>

               {/* Inventory Settings */}
               <div className="neumorphic rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Configuración de Inventario</h2>
                    <div className="space-y-4">
                         <div>
                              <label className="block text-sm font-medium mb-2">Umbral de Stock Bajo (%)</label>
                              <input
                                   type="number"
                                   defaultValue={20}
                                   min={0}
                                   max={100}
                                   className="w-full px-4 py-2 rounded-xl neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                   Porcentaje bajo el cual se considera stock crítico
                              </p>
                         </div>
                         <div className="flex items-center justify-between py-2">
                              <div>
                                   <p className="font-medium">Actualización Automática de Inventario</p>
                                   <p className="text-sm text-muted-foreground">Deducir insumos al registrar ventas</p>
                              </div>
                              <input type="checkbox" className="h-5 w-5" defaultChecked />
                         </div>
                         <div className="flex items-center justify-between py-2">
                              <div>
                                   <p className="font-medium">Alertas de Caducidad</p>
                                   <p className="text-sm text-muted-foreground">Notificar productos próximos a vencer</p>
                              </div>
                              <input type="checkbox" className="h-5 w-5" defaultChecked />
                         </div>
                    </div>
               </div>

               {/* AI & Projections Settings */}
               <div className="neumorphic rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Proyecciones e IA</h2>
                    <div className="space-y-4">
                         <div>
                              <label className="block text-sm font-medium mb-2">Período de Análisis (días)</label>
                              <input
                                   type="number"
                                   defaultValue={30}
                                   min={7}
                                   max={90}
                                   className="w-full px-4 py-2 rounded-xl neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                   Días de historial para calcular proyecciones
                              </p>
                         </div>
                         <div className="flex items-center justify-between py-2">
                              <div>
                                   <p className="font-medium">Proyecciones Automáticas</p>
                                   <p className="text-sm text-muted-foreground">Generar proyecciones diarias</p>
                              </div>
                              <input type="checkbox" className="h-5 w-5" defaultChecked />
                         </div>
                         <div className="flex items-center justify-between py-2">
                              <div>
                                   <p className="font-medium">Recomendaciones de Compra</p>
                                   <p className="text-sm text-muted-foreground">Sugerencias basadas en consumo</p>
                              </div>
                              <input type="checkbox" className="h-5 w-5" defaultChecked />
                         </div>
                    </div>
               </div>

               {/* Save / Cancel */}
               <div className="flex justify-end gap-4">
                    <button
                         type="button"
                         onClick={handleCancel}
                         disabled={isPending}
                         className="px-6 py-3 rounded-xl bg-accent hover:bg-accent/80 transition-colors disabled:opacity-50"
                    >
                         Cancelar
                    </button>
                    <button
                         type="button"
                         onClick={handleSave}
                         disabled={isPending}
                         className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
                    >
                         {isPending ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
               </div>
          </div>
     );
}
