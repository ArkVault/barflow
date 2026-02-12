'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
     Plus, Trash2, Move, Edit2, Check, X,
     LayoutGrid, Users, Clock, DollarSign,
     ChevronRight, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { usePOS } from './pos-context';
import { Status, statusColors, barStatusColors } from './types';
import { GlowButton } from '@/components/layout/glow-button';
import { useAuth } from '@/contexts/auth-context';
import { ReceiptGenerator, ReceiptData } from './receipt-generator';
import { formatCurrency } from '@/lib/format';
import { useDragAndDrop } from './hooks/use-drag-and-drop';
import { useReservations } from './hooks/use-reservations';
import { useTableActions } from './hooks/use-table-actions';

const CANVAS_ID = 'pos-operations-canvas';

// Single Responsibility: Only handles table/bar layout management
export function TablesTab() {
     const { t, language } = useLanguage();
     const { establishmentId, establishmentName } = useAuth();
     const {
          sections,
          setSections,
          selectedItem,
          setSelectedItem,
          openNewAccount,
          closeAccount,
          cancelAccount,
          removeItemFromAccount,
          getCurrentAccount,
          getElapsedTime,
          saveLayout,
          setActiveTab,
          setSelectedTableForOrder,
     } = usePOS();

     // Local UI state
     const [editingName, setEditingName] = useState<{ type: 'section' | 'table' | 'bar', sectionId: string, itemId?: string } | null>(null);
     const [isModalOpen, setIsModalOpen] = useState(false);
     const [confirmFinalize, setConfirmFinalize] = useState<{ sectionId: string, itemId: string, accountId: string, type: 'table' | 'bar' } | null>(null);
     const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

     // Composed hooks
     const {
          draggedItem, isDragging, hasMoved, justDroppedRef,
          handleMouseDown, handleResizeStart,
     } = useDragAndDrop({ sections, setSections, saveLayout, canvasId: CANVAS_ID });

     const {
          addSection, deleteSection,
          addTable, deleteTable,
          addBar, deleteBar,
          toggleBarOrientation,
          updateTableStatus, updateBarStatus,
     } = useTableActions({ sections, setSections, language });

     const {
          selectedReservation, setSelectedReservation,
          showReservationModal, setShowReservationModal,
          showNewReservationModal, setShowNewReservationModal,
          newReservation, setNewReservation,
          getTableReservation, seatCustomer, createReservation, resetNewReservationForm,
     } = useReservations({ establishmentId, sections, setSections, saveLayout, language });

     // Status labels
     const statusLabels = language === 'es' ? {
          libre: 'Libre', reservada: 'Reservada', ocupada: 'Ocupada', 'por-pagar': 'Por Pagar',
     } : {
          libre: 'Free', reservada: 'Reserved', ocupada: 'Occupied', 'por-pagar': 'Pending',
     };

     const accountStatusLabels = language === 'es' ? {
          'abierta': 'Cuenta abierta', 'en-consumo': 'En consumo', 'lista-para-cobrar': 'Lista para cobrar', 'pagada': 'Pagada',
     } : {
          'abierta': 'Account open', 'en-consumo': 'In consumption', 'lista-para-cobrar': 'Ready to pay', 'pagada': 'Paid',
     };

     const translateName = (name: string) => {
          if (language === 'es') return name;
          if (name.startsWith('Mesa ')) return 'Table ' + name.substring(5);
          if (name.startsWith('Barra ')) return 'Bar ' + name.substring(6);
          if (name.startsWith('Sección ')) return 'Section ' + name.substring(8);
          return name;
     };

     const handleItemClick = (sectionId: string, itemId: string, type: 'table' | 'bar') => {
          setSelectedItem({ type, sectionId, itemId });
          setIsModalOpen(true);
     };

     const goToOrdersTab = (sectionId: string, itemId: string, type: 'table' | 'bar') => {
          setSelectedTableForOrder(`${sectionId}|${itemId}|${type}`);
          setActiveTab('comandas');
     };

     // Get selected item data
     const getSelectedItemData = () => {
          if (!selectedItem) return null;
          for (const section of sections) {
               if (section.id === selectedItem.sectionId) {
                    const items = selectedItem.type === 'table' ? section.tables : section.bars;
                    return items.find(i => i.id === selectedItem.itemId);
               }
          }
          return null;
     };

     const selectedItemData = getSelectedItemData();
     const currentAccount = getCurrentAccount();

     return (
          <div className="space-y-4">
               {/* Action Buttons */}
               <div className="flex gap-3 mb-6">
                    <GlowButton onClick={addSection}>
                         <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-inner">
                              <LayoutGrid className="w-3.5 h-3.5 text-white" />
                         </div>
                         <span className="hidden sm:inline">{language === 'es' ? 'Agregar Sección' : 'Add Section'}</span>
                    </GlowButton>
                    <GlowButton onClick={() => setShowNewReservationModal(true)}>
                         <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-inner">
                              <Calendar className="w-3.5 h-3.5 text-white" />
                         </div>
                         <span className="hidden sm:inline">{language === 'es' ? 'Nueva Reservación' : 'New Reservation'}</span>
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

               {/* Layout Canvas */}
               <div
                    id={CANVAS_ID}
                    className="relative min-h-[600px] rounded-xl border-2 border-dashed border-border/50 overflow-visible"
                    style={{
                         height: Math.max(600, ...sections.map(s => s.y + s.height + 80)),
                         backgroundColor: 'hsl(var(--muted) / 0.08)',
                         backgroundImage: 'radial-gradient(circle, #a1a1aa40 1px, transparent 1px)',
                         backgroundSize: '20px 20px',
                    }}
               >
                    {sections.map(section => (
                         <div
                              key={section.id}
                              id={`section-${section.id}`}
                              className="absolute bg-background/90 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg"
                              style={{ left: section.x, top: section.y, width: section.width, height: section.height }}
                         >
                              {/* Section Header */}
                              <div
                                   className="flex items-center justify-between p-3 border-b border-border/30 cursor-move bg-muted/30 rounded-t-xl"
                                   onMouseDown={(e) => handleMouseDown(e, 'section', section.id, section.id)}
                              >
                                   <div className="flex items-center gap-2">
                                        <Move className="w-4 h-4 text-muted-foreground" />
                                        {editingName?.type === 'section' && editingName.sectionId === section.id ? (
                                             <Input
                                                  defaultValue={section.name}
                                                  className="h-6 w-32 text-sm"
                                                  autoFocus
                                                  onBlur={(e) => {
                                                       setSections(sections.map(s => s.id === section.id ? { ...s, name: e.target.value } : s));
                                                       setEditingName(null);
                                                  }}
                                                  onKeyDown={(e) => {
                                                       if (e.key === 'Enter') {
                                                            setSections(sections.map(s => s.id === section.id ? { ...s, name: (e.target as HTMLInputElement).value } : s));
                                                            setEditingName(null);
                                                       }
                                                  }}
                                             />
                                        ) : (
                                             <span className="font-semibold text-sm">{translateName(section.name)}</span>
                                        )}
                                        <Button
                                             variant="ghost"
                                             size="icon"
                                             className="h-6 w-6"
                                             onClick={() => setEditingName({ type: 'section', sectionId: section.id })}
                                        >
                                             <Edit2 className="w-3 h-3" />
                                        </Button>
                                   </div>

                                   <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => addTable(section.id)}>
                                             <Plus className="w-3 h-3 mr-1" />
                                             {language === 'es' ? 'Mesa' : 'Table'}
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => addBar(section.id)}>
                                             <Plus className="w-3 h-3 mr-1" />
                                             {language === 'es' ? 'Barra' : 'Bar'}
                                        </Button>
                                        <Button
                                             variant="ghost"
                                             size="icon"
                                             className="h-6 w-6 text-destructive"
                                             onClick={() => deleteSection(section.id)}
                                        >
                                             <Trash2 className="w-3 h-3" />
                                        </Button>
                                   </div>
                              </div>

                              {/* Tables */}
                              {section.tables.map(table => (
                                   <div
                                        key={table.id}
                                        onMouseDown={(e) => handleMouseDown(e, 'table', section.id, table.id)}
                                        className="absolute cursor-move group"
                                        style={{
                                             left: table.x, top: table.y,
                                             opacity: isDragging && draggedItem?.itemId === table.id ? 0.7 : 1,
                                             userSelect: 'none',
                                        }}
                                   >
                                        <div
                                             className={cn(
                                                  "w-[80px] h-[80px] rounded-2xl flex flex-col items-center justify-center",
                                                  "bg-gradient-to-br shadow-lg transition-all hover:scale-110",
                                                  statusColors[table.status]
                                             )}
                                             style={{ boxShadow: '0 0 20px rgba(0,0,0,0.3)' }}
                                             onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (!hasMoved && !justDroppedRef.current) handleItemClick(section.id, table.id, 'table');
                                             }}
                                        >
                                             <button
                                                  onClick={(e) => { e.stopPropagation(); deleteTable(section.id, table.id); }}
                                                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                             >
                                                  <X className="w-3 h-3" />
                                             </button>

                                             <span className="text-white font-bold text-xs">{translateName(table.name)}</span>

                                             <select
                                                  value={table.status}
                                                  onChange={(e) => { e.stopPropagation(); updateTableStatus(section.id, table.id, e.target.value as Status); }}
                                                  className="mt-1 text-[10px] bg-white/20 text-white rounded px-1 cursor-pointer"
                                                  onClick={(e) => e.stopPropagation()}
                                             >
                                                  {Object.entries(statusLabels).map(([value, label]) => (
                                                       <option key={value} value={value} className="text-black">{label}</option>
                                                  ))}
                                             </select>

                                             {/* Account badge */}
                                             {table.accounts.length > 0 && (
                                                  <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-4 px-1 text-[9px] bg-white text-black">
                                                       {table.accounts.length} {language === 'es' ? 'ctas' : 'accs'}
                                                  </Badge>
                                             )}

                                             {/* Reservation badge */}
                                             {(() => {
                                                  const reservation = getTableReservation(table.name);
                                                  if (reservation) {
                                                       return (
                                                            <Badge
                                                                 className="absolute -top-1 -left-1 h-5 px-1.5 text-[9px] bg-orange-500 text-white flex items-center gap-0.5 cursor-pointer hover:bg-orange-600"
                                                                 onClick={(e) => { e.stopPropagation(); setSelectedReservation(reservation); setShowReservationModal(true); }}
                                                            >
                                                                 <Calendar className="w-2.5 h-2.5" />
                                                                 {reservation.customer_name.split(' ')[0]}
                                                            </Badge>
                                                       );
                                                  }
                                                  return null;
                                             })()}
                                        </div>
                                   </div>
                              ))}

                              {/* Bars */}
                              {section.bars.map(bar => (
                                   <div
                                        key={bar.id}
                                        onMouseDown={(e) => handleMouseDown(e, 'bar', section.id, bar.id)}
                                        className="absolute cursor-move group"
                                        style={{
                                             left: bar.x, top: bar.y,
                                             opacity: isDragging && draggedItem?.itemId === bar.id ? 0.7 : 1,
                                             userSelect: 'none',
                                        }}
                                   >
                                        <div
                                             className={cn(
                                                  "relative rounded-2xl flex flex-col items-center justify-center",
                                                  "bg-gradient-to-br shadow-lg transition-all hover:scale-110",
                                                  barStatusColors[bar.status]
                                             )}
                                             style={{
                                                  width: bar.orientation === 'vertical' ? '72px' : '180px',
                                                  height: bar.orientation === 'vertical' ? '180px' : '72px',
                                                  boxShadow: '0 0 20px rgba(0,0,0,0.3)',
                                             }}
                                             onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (!hasMoved && !justDroppedRef.current) handleItemClick(section.id, bar.id, 'bar');
                                             }}
                                        >
                                             <button
                                                  onClick={(e) => { e.stopPropagation(); toggleBarOrientation(section.id, bar.id); }}
                                                  className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                  title={language === 'es' ? 'Rotar barra' : 'Rotate bar'}
                                             >
                                                  ↻
                                             </button>

                                             <button
                                                  onClick={(e) => { e.stopPropagation(); deleteBar(section.id, bar.id); }}
                                                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                             >
                                                  <X className="w-3 h-3" />
                                             </button>

                                             <span className="text-white font-bold text-xs">{translateName(bar.name)}</span>

                                             <select
                                                  value={bar.status}
                                                  onChange={(e) => { e.stopPropagation(); updateBarStatus(section.id, bar.id, e.target.value as Status); }}
                                                  className="mt-1 text-[10px] bg-white/20 text-white rounded px-1 cursor-pointer"
                                                  onClick={(e) => e.stopPropagation()}
                                             >
                                                  {Object.entries(statusLabels).map(([value, label]) => (
                                                       <option key={value} value={value} className="text-black">{label}</option>
                                                  ))}
                                             </select>

                                             {bar.accounts.length > 0 && (
                                                  <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-4 px-1 text-[9px] bg-white text-black">
                                                       {bar.accounts.length} {language === 'es' ? 'ctas' : 'accs'}
                                                  </Badge>
                                             )}
                                        </div>
                                   </div>
                              ))}

                              {/* Resize Handle */}
                              <div
                                   className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
                                   onMouseDown={(e) => handleResizeStart(e, section.id)}
                              >
                                   <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-muted-foreground/50"></div>
                              </div>
                         </div>
                    ))}

                    {sections.length === 0 && (
                         <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                   <LayoutGrid className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                                   <p className="text-muted-foreground mb-4">
                                        {language === 'es' ? 'No hay secciones. Crea una para comenzar.' : 'No sections. Create one to start.'}
                                   </p>
                                   <GlowButton onClick={addSection}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        {language === 'es' ? 'Crear Sección' : 'Create Section'}
                                   </GlowButton>
                              </div>
                         </div>
                    )}
               </div>

               {/* Table/Bar Detail Modal */}
               <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                         <DialogHeader>
                              <DialogTitle>{selectedItemData ? translateName(selectedItemData.name) : ''}</DialogTitle>
                              <DialogDescription>
                                   {selectedItemData && (
                                        <Badge className={`${statusColors[selectedItemData.status].replace('from-', 'bg-').split(' ')[0]}`}>
                                             {statusLabels[selectedItemData.status]}
                                        </Badge>
                                   )}
                              </DialogDescription>
                         </DialogHeader>

                         {selectedItemData && selectedItem && (
                              <div className="space-y-4">
                                   {/* Accounts list */}
                                   {selectedItemData.accounts.length > 0 ? (
                                        <div className="space-y-3">
                                             {selectedItemData.accounts.map(account => (
                                                  <Card key={account.id} className="p-3">
                                                       <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                 <div className="flex items-center gap-2">
                                                                      <Users className="w-4 h-4 text-muted-foreground" />
                                                                      <span className="font-medium text-sm">
                                                                           {account.seatLabel || (language === 'es' ? 'Cuenta Principal' : 'Main Account')}
                                                                      </span>
                                                                 </div>
                                                                 <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                                                      <span className="flex items-center gap-1">
                                                                           <Clock className="w-3 h-3" />
                                                                           {getElapsedTime(account.openedAt)}
                                                                      </span>
                                                                      <span className="flex items-center gap-1 font-semibold text-foreground">
                                                                           <DollarSign className="w-3 h-3" />
                                                                           {formatCurrency(account.total)}
                                                                      </span>
                                                                 </div>
                                                            </div>
                                                       </div>

                                                       {/* Items list with delete option */}
                                                       {account.items.length > 0 && (
                                                            <div className="mt-3 pt-3 border-t space-y-1">
                                                                 <h5 className="text-xs font-medium text-muted-foreground mb-2">
                                                                      {language === 'es' ? 'Items de la cuenta:' : 'Account items:'}
                                                                 </h5>
                                                                 {account.items.map((item) => (
                                                                      <div key={item.id} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50 group">
                                                                           <span>{item.quantity}x {item.productName}</span>
                                                                           <div className="flex items-center gap-2">
                                                                                <span className="text-muted-foreground">{formatCurrency(item.total)}</span>
                                                                                <Button
                                                                                     variant="ghost"
                                                                                     size="icon"
                                                                                     className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                                                                                     onClick={() => {
                                                                                          removeItemFromAccount(
                                                                                               selectedItem.sectionId, selectedItem.itemId,
                                                                                               account.id, item.id, selectedItem.type
                                                                                          );
                                                                                     }}
                                                                                >
                                                                                     <Trash2 className="w-3 h-3" />
                                                                                </Button>
                                                                           </div>
                                                                      </div>
                                                                 ))}
                                                            </div>
                                                       )}

                                                       {/* Account actions */}
                                                       <div className="flex gap-4 mt-3 pt-3 border-t justify-between">
                                                            <Button
                                                                 size="sm" variant="outline" className="flex-1 h-9 text-xs"
                                                                 onClick={() => { goToOrdersTab(selectedItem.sectionId, selectedItem.itemId, selectedItem.type); setIsModalOpen(false); }}
                                                            >
                                                                 <Plus className="w-3 h-3 mr-1" />
                                                                 {language === 'es' ? 'Agregar' : 'Add'}
                                                            </Button>
                                                            <Button
                                                                 size="sm" variant="destructive" className="flex-1 h-9 text-xs"
                                                                 onClick={() => cancelAccount(selectedItem.sectionId, selectedItem.itemId, account.id, selectedItem.type)}
                                                            >
                                                                 <X className="w-3 h-3 mr-1" />
                                                                 {language === 'es' ? 'Cancelar' : 'Cancel'}
                                                            </Button>
                                                            <Button
                                                                 size="sm" className="flex-1 h-9 text-xs bg-green-600 hover:bg-green-700"
                                                                 disabled={account.items.length === 0}
                                                                 onClick={() => {
                                                                      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
                                                                      const subtotal = account.total;
                                                                      const tax = subtotal * 0.16;
                                                                      const total = subtotal + tax;
                                                                      const tableName = account.seatLabel
                                                                           ? `${selectedItemData.name} - ${account.seatLabel}`
                                                                           : selectedItemData.name;

                                                                      setReceiptData({
                                                                           orderNumber, tableName,
                                                                           items: account.items.map(item => ({
                                                                                productName: item.productName,
                                                                                quantity: item.quantity,
                                                                                unitPrice: item.unitPrice,
                                                                                total: item.total,
                                                                           })),
                                                                           subtotal, tax, total,
                                                                           date: new Date(),
                                                                           establishmentName: establishmentName || 'Flowstock',
                                                                      });

                                                                      setConfirmFinalize({
                                                                           sectionId: selectedItem.sectionId,
                                                                           itemId: selectedItem.itemId,
                                                                           accountId: account.id,
                                                                           type: selectedItem.type,
                                                                      });
                                                                 }}
                                                            >
                                                                 <Check className="w-3 h-3 mr-1" />
                                                                 {language === 'es' ? 'Finalizar' : 'Finalize'}
                                                            </Button>
                                                       </div>
                                                  </Card>
                                             ))}
                                        </div>
                                   ) : (
                                        <div className="text-center py-4 text-muted-foreground">
                                             <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                             <p className="text-sm">{language === 'es' ? 'Sin cuentas activas' : 'No active accounts'}</p>
                                        </div>
                                   )}

                                   {/* Bottom Actions */}
                                   <div className="flex gap-2 pt-2">
                                        <Button
                                             className="flex-1"
                                             onClick={() => {
                                                  openNewAccount(selectedItem.sectionId, selectedItem.itemId, selectedItem.type);
                                                  setSelectedTableForOrder(`${selectedItem.sectionId}|${selectedItem.itemId}|${selectedItem.type}`);
                                             }}
                                        >
                                             <Plus className="w-4 h-4 mr-2" />
                                             {language === 'es' ? 'Nueva Cuenta' : 'New Account'}
                                        </Button>
                                        <Button
                                             variant="outline" className="flex-1"
                                             onClick={() => { goToOrdersTab(selectedItem.sectionId, selectedItem.itemId, selectedItem.type); setIsModalOpen(false); }}
                                        >
                                             <ChevronRight className="w-4 h-4 mr-2" />
                                             {language === 'es' ? 'Ir a Comandas' : 'Go to Orders'}
                                        </Button>
                                   </div>
                              </div>
                         )}
                    </DialogContent>
               </Dialog>

               {/* Reservation Details Modal */}
               <Dialog open={showReservationModal} onOpenChange={setShowReservationModal}>
                    <DialogContent className="max-w-md">
                         <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                   <Calendar className="w-5 h-5 text-blue-500" />
                                   {language === 'es' ? 'Detalles de Reservación' : 'Reservation Details'}
                              </DialogTitle>
                         </DialogHeader>

                         {selectedReservation && (
                              <div className="space-y-4">
                                   <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                             <span className="text-sm text-muted-foreground">{language === 'es' ? 'Cliente:' : 'Customer:'}</span>
                                             <span className="font-semibold">{selectedReservation.customer_name}</span>
                                        </div>
                                        {selectedReservation.customer_phone && (
                                             <div className="flex items-center justify-between">
                                                  <span className="text-sm text-muted-foreground">{language === 'es' ? 'Teléfono:' : 'Phone:'}</span>
                                                  <span>{selectedReservation.customer_phone}</span>
                                             </div>
                                        )}
                                        {selectedReservation.customer_email && (
                                             <div className="flex items-center justify-between">
                                                  <span className="text-sm text-muted-foreground">Email:</span>
                                                  <span className="text-sm">{selectedReservation.customer_email}</span>
                                             </div>
                                        )}
                                   </div>

                                   <div className="border-t pt-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                             <span className="text-sm text-muted-foreground">{language === 'es' ? 'Mesa:' : 'Table:'}</span>
                                             <span className="font-semibold">{selectedReservation.table_id}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                             <span className="text-sm text-muted-foreground">{language === 'es' ? 'Personas:' : 'Party Size:'}</span>
                                             <Badge variant="secondary"><Users className="w-3 h-3 mr-1" />{selectedReservation.party_size}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                             <span className="text-sm text-muted-foreground">{language === 'es' ? 'Hora:' : 'Time:'}</span>
                                             <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{selectedReservation.reservation_time.substring(0, 5)}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                             <span className="text-sm text-muted-foreground">{language === 'es' ? 'Estado:' : 'Status:'}</span>
                                             <Badge className={selectedReservation.status === 'seated' ? 'bg-green-500' : 'bg-blue-500'}>
                                                  {selectedReservation.status === 'confirmed'
                                                       ? (language === 'es' ? 'Confirmada' : 'Confirmed')
                                                       : (language === 'es' ? 'Sentados' : 'Seated')}
                                             </Badge>
                                        </div>
                                   </div>

                                   {(selectedReservation.notes || selectedReservation.special_requests) && (
                                        <div className="border-t pt-4 space-y-2">
                                             {selectedReservation.notes && (
                                                  <div>
                                                       <span className="text-sm text-muted-foreground block mb-1">{language === 'es' ? 'Notas:' : 'Notes:'}</span>
                                                       <p className="text-sm bg-muted p-2 rounded">{selectedReservation.notes}</p>
                                                  </div>
                                             )}
                                             {selectedReservation.special_requests && (
                                                  <div>
                                                       <span className="text-sm text-muted-foreground block mb-1">{language === 'es' ? 'Solicitudes especiales:' : 'Special Requests:'}</span>
                                                       <p className="text-sm bg-muted p-2 rounded">{selectedReservation.special_requests}</p>
                                                  </div>
                                             )}
                                        </div>
                                   )}

                                   {selectedReservation.status === 'confirmed' && (
                                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => seatCustomer(selectedReservation)}>
                                             <Check className="w-4 h-4 mr-2" />
                                             {language === 'es' ? '¡Llegó! Sentar Cliente' : 'Arrived! Seat Customer'}
                                        </Button>
                                   )}
                              </div>
                         )}
                    </DialogContent>
               </Dialog>

               {/* New Reservation Modal */}
               <Dialog open={showNewReservationModal} onOpenChange={setShowNewReservationModal}>
                    <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                         <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                   <Calendar className="w-5 h-5 text-blue-500" />
                                   {language === 'es' ? 'Nueva Reservación' : 'New Reservation'}
                              </DialogTitle>
                              <DialogDescription>
                                   {language === 'es' ? 'Crea una reservación manual para una mesa' : 'Create a manual reservation for a table'}
                              </DialogDescription>
                         </DialogHeader>

                         <div className="space-y-4">
                              <div className="space-y-2">
                                   <label className="text-sm font-medium">{language === 'es' ? 'Nombre del Cliente *' : 'Customer Name *'}</label>
                                   <Input value={newReservation.customer_name} onChange={(e) => setNewReservation({ ...newReservation, customer_name: e.target.value })} placeholder={language === 'es' ? 'Juan Pérez' : 'John Doe'} />
                              </div>
                              <div className="space-y-2">
                                   <label className="text-sm font-medium">{language === 'es' ? 'Teléfono' : 'Phone'}</label>
                                   <Input value={newReservation.customer_phone} onChange={(e) => setNewReservation({ ...newReservation, customer_phone: e.target.value })} placeholder="+52 55 1234 5678" />
                              </div>
                              <div className="space-y-2">
                                   <label className="text-sm font-medium">Email</label>
                                   <Input type="email" value={newReservation.customer_email} onChange={(e) => setNewReservation({ ...newReservation, customer_email: e.target.value })} placeholder="cliente@email.com" />
                              </div>
                              <div className="space-y-2">
                                   <label className="text-sm font-medium">{language === 'es' ? 'Mesa *' : 'Table *'}</label>
                                   <select
                                        value={newReservation.table_id}
                                        onChange={(e) => setNewReservation({ ...newReservation, table_id: e.target.value })}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                   >
                                        <option value="">{language === 'es' ? 'Seleccionar mesa...' : 'Select table...'}</option>
                                        {sections.flatMap(section =>
                                             section.tables.map(table => (
                                                  <option key={table.id} value={table.name}>{translateName(table.name)}</option>
                                             ))
                                        )}
                                   </select>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-2">
                                        <label className="text-sm font-medium">{language === 'es' ? 'Personas *' : 'Party Size *'}</label>
                                        <Input type="number" min="1" max="20" value={newReservation.party_size} onChange={(e) => setNewReservation({ ...newReservation, party_size: parseInt(e.target.value) || 1 })} />
                                   </div>
                                   <div className="space-y-2">
                                        <label className="text-sm font-medium">{language === 'es' ? 'Fecha *' : 'Date *'}</label>
                                        <Input type="date" value={newReservation.reservation_date} onChange={(e) => setNewReservation({ ...newReservation, reservation_date: e.target.value })} />
                                   </div>
                              </div>
                              <div className="space-y-2">
                                   <label className="text-sm font-medium">{language === 'es' ? 'Hora *' : 'Time *'}</label>
                                   <Input type="time" value={newReservation.reservation_time} onChange={(e) => setNewReservation({ ...newReservation, reservation_time: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                   <label className="text-sm font-medium">{language === 'es' ? 'Notas' : 'Notes'}</label>
                                   <Input value={newReservation.notes} onChange={(e) => setNewReservation({ ...newReservation, notes: e.target.value })} placeholder={language === 'es' ? 'Información adicional...' : 'Additional information...'} />
                              </div>
                              <div className="space-y-2">
                                   <label className="text-sm font-medium">{language === 'es' ? 'Solicitudes Especiales' : 'Special Requests'}</label>
                                   <Input value={newReservation.special_requests} onChange={(e) => setNewReservation({ ...newReservation, special_requests: e.target.value })} placeholder={language === 'es' ? 'Alergias, preferencias, etc.' : 'Allergies, preferences, etc.'} />
                              </div>

                              <div className="flex gap-2 pt-4">
                                   <Button variant="outline" className="flex-1" onClick={() => { setShowNewReservationModal(false); resetNewReservationForm(); }}>
                                        {language === 'es' ? 'Cancelar' : 'Cancel'}
                                   </Button>
                                   <Button
                                        className="flex-1"
                                        disabled={!newReservation.customer_name || !newReservation.table_id}
                                        onClick={createReservation}
                                   >
                                        <Check className="w-4 h-4 mr-2" />
                                        {language === 'es' ? 'Crear Reservación' : 'Create Reservation'}
                                   </Button>
                              </div>
                         </div>
                    </DialogContent>
               </Dialog>

               {/* Receipt Generator Dialog with Print Option */}
               <ReceiptGenerator
                    open={!!confirmFinalize}
                    onOpenChange={(open) => {
                         if (!open) { setConfirmFinalize(null); setReceiptData(null); }
                    }}
                    receiptData={receiptData}
                    onConfirm={() => {
                         if (confirmFinalize) {
                              closeAccount(confirmFinalize.sectionId, confirmFinalize.itemId, confirmFinalize.accountId, confirmFinalize.type);
                              setConfirmFinalize(null);
                              setReceiptData(null);
                         }
                    }}
               />
          </div>
     );
}
