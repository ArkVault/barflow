'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
     Plus, Trash2, Move, Edit2, Check, X,
     LayoutGrid, Users, Clock, DollarSign,
     ChevronRight, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { usePOS } from './pos-context';
import { Section, TableItem, BarItem, Status, statusColors, barStatusColors } from './types';
import { GlowButton } from '@/components/glow-button';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

// Single Responsibility: Only handles table/bar layout management
export function TablesTab() {
     const { t, language } = useLanguage();
     const { establishmentId } = useAuth();
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

     // Local state for drag and edit operations
     const [draggedItem, setDraggedItem] = useState<{ type: 'table' | 'bar' | 'section', sectionId: string, itemId: string } | null>(null);
     const [editingName, setEditingName] = useState<{ type: 'section' | 'table' | 'bar', sectionId: string, itemId?: string } | null>(null);
     const [isModalOpen, setIsModalOpen] = useState(false);
     const [dragOffset, setDragOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
     const [isDragging, setIsDragging] = useState(false);
     const [hasMoved, setHasMoved] = useState(false);
     const [resizingSection, setResizingSection] = useState<{ id: string, startX: number, startY: number, startWidth: number, startHeight: number } | null>(null);
     const [confirmFinalize, setConfirmFinalize] = useState<{ sectionId: string, itemId: string, accountId: string, type: 'table' | 'bar' } | null>(null);

     // Reservations state
     const [reservations, setReservations] = useState<any[]>([]);
     const [selectedReservation, setSelectedReservation] = useState<any | null>(null);
     const [showReservationModal, setShowReservationModal] = useState(false);
     const [showNewReservationModal, setShowNewReservationModal] = useState(false);
     const [newReservation, setNewReservation] = useState({
          customer_name: '',
          customer_phone: '',
          customer_email: '',
          table_id: '',
          party_size: 2,
          reservation_date: new Date().toISOString().split('T')[0],
          reservation_time: '19:00',
          notes: '',
          special_requests: '',
     });

     // Ref to track if we just finished dragging (prevents click after drop)
     const justDroppedRef = useRef(false);

     // Status labels
     const statusLabels = language === 'es' ? {
          libre: 'Libre',
          reservada: 'Reservada',
          ocupada: 'Ocupada',
          'por-pagar': 'Por Pagar',
     } : {
          libre: 'Free',
          reservada: 'Reserved',
          ocupada: 'Occupied',
          'por-pagar': 'Pending',
     };

     const accountStatusLabels = language === 'es' ? {
          'abierta': 'Cuenta abierta',
          'en-consumo': 'En consumo',
          'lista-para-cobrar': 'Lista para cobrar',
          'pagada': 'Pagada',
     } : {
          'abierta': 'Account open',
          'en-consumo': 'In consumption',
          'lista-para-cobrar': 'Ready to pay',
          'pagada': 'Paid',
     };

     // Helper to translate names
     const translateName = (name: string) => {
          if (language === 'es') return name;
          if (name.startsWith('Mesa ')) return 'Table ' + name.substring(5);
          if (name.startsWith('Barra ')) return 'Bar ' + name.substring(6);
          if (name.startsWith('Sección ')) return 'Section ' + name.substring(8);
          return name;
     };

     // Fetch today's reservations
     useEffect(() => {
          if (!establishmentId) return;

          const fetchReservations = async () => {
               const supabase = createClient();
               const today = new Date().toISOString().split('T')[0];

               const { data, error } = await supabase
                    .from('reservations')
                    .select('*')
                    .eq('establishment_id', establishmentId)
                    .eq('reservation_date', today)
                    .in('status', ['confirmed', 'seated'])
                    .order('reservation_time', { ascending: true });

               if (!error && data) {
                    setReservations(data);
               }
          };

          fetchReservations();

          // Refresh every minute
          const interval = setInterval(fetchReservations, 60000);
          return () => clearInterval(interval);
     }, [establishmentId]);

     // Get reservation for a table
     const getTableReservation = (tableName: string) => {
          return reservations.find(r => r.table_id === tableName || r.table_id === tableName.replace('Mesa ', '').replace('Table ', ''));
     };

     // Helper function to get the next available table number (total tables + 1)
     const getNextTableNumber = (): number => {
          let totalTables = 0;
          sections.forEach(section => {
               totalTables += section.tables.length;
          });
          return totalTables + 1;
     };

     // Section management
     const addSection = () => {
          // Get canvas dimensions (70% width, centered)
          const canvas = document.getElementById('pos-operations-canvas');
          const canvasWidth = canvas?.clientWidth || 900;
          const sectionWidth = Math.round(canvasWidth * 0.7);
          const sectionX = Math.round((canvasWidth - sectionWidth) / 2);

          // Calculate Y position: below the last section with some gap
          let newY = 30; // Default gap from top
          if (sections.length > 0) {
               const lastSection = sections[sections.length - 1];
               newY = lastSection.y + lastSection.height + 40; // 40px gap between sections
          }

          const newSection: Section = {
               id: `section-${Date.now()}`,
               name: language === 'es' ? `Sección ${sections.length + 1}` : `Section ${sections.length + 1}`,
               x: sectionX,
               y: newY,
               width: sectionWidth,
               height: 400,
               tables: [],
               bars: [],
          };

          setSections([...sections, newSection]);

          // Scroll to the new section after a brief delay
          setTimeout(() => {
               const newSectionElement = document.getElementById(`section-${newSection.id}`);
               if (newSectionElement) {
                    newSectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
               } else {
                    // Fallback: scroll the canvas container
                    const container = document.getElementById('pos-operations-canvas');
                    if (container) {
                         container.scrollTop = container.scrollHeight;
                    }
                    // Also try window scroll
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
               }
          }, 100);
     };

     const deleteSection = (sectionId: string) => {
          setSections(sections.filter(s => s.id !== sectionId));
     };

     // Table management
     const addTable = (sectionId: string) => {
          const nextNumber = getNextTableNumber();
          const updated = sections.map(section => {
               if (section.id === sectionId) {
                    const newTable: TableItem = {
                         id: `table-${Date.now()}`,
                         name: language === 'es' ? `Mesa ${nextNumber}` : `Table ${nextNumber}`,
                         x: 50 + (section.tables.length % 3) * 150,
                         y: 50 + Math.floor(section.tables.length / 3) * 120,
                         status: 'libre',
                         accounts: [],
                         currentAccountId: undefined,
                    };
                    return { ...section, tables: [...section.tables, newTable] };
               }
               return section;
          });
          setSections(updated);
     };

     const deleteTable = (sectionId: string, tableId: string) => {
          const updated = sections.map(section => {
               if (section.id === sectionId) {
                    return { ...section, tables: section.tables.filter(t => t.id !== tableId) };
               }
               return section;
          });

          // Renumber all tables sequentially (1, 2, 3...)
          let counter = 1;
          const renumbered = updated.map(section => ({
               ...section,
               tables: section.tables.map(table => ({
                    ...table,
                    name: language === 'es' ? `Mesa ${counter++}` : `Table ${counter++}`,
               })),
          }));

          setSections(renumbered);
     };

     // Bar management
     const addBar = (sectionId: string) => {
          const updated = sections.map(section => {
               if (section.id === sectionId) {
                    const barCount = section.bars.length + 1;
                    const newBar: BarItem = {
                         id: `bar-${Date.now()}`,
                         name: language === 'es' ? `Barra ${barCount}` : `Bar ${barCount}`,
                         x: 50,
                         y: section.height - 100,
                         status: 'libre',
                         accounts: [],
                         currentAccountId: undefined,
                         orientation: 'horizontal',
                    };
                    return { ...section, bars: [...section.bars, newBar] };
               }
               return section;
          });
          setSections(updated);
     };

     const deleteBar = (sectionId: string, barId: string) => {
          setSections(sections.map(section => {
               if (section.id === sectionId) {
                    return { ...section, bars: section.bars.filter(b => b.id !== barId) };
               }
               return section;
          }));
     };

     const toggleBarOrientation = (sectionId: string, barId: string) => {
          setSections(sections.map(section => {
               if (section.id === sectionId) {
                    return {
                         ...section,
                         bars: section.bars.map(bar =>
                              bar.id === barId
                                   ? { ...bar, orientation: bar.orientation === 'horizontal' ? 'vertical' : 'horizontal' }
                                   : bar
                         ),
                    };
               }
               return section;
          }));
     };

     // Update status
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

     // Handle item click
     const handleItemClick = (sectionId: string, itemId: string, type: 'table' | 'bar') => {
          setSelectedItem({ type, sectionId, itemId });
          setIsModalOpen(true);
     };

     // Go to orders tab with selected table - AUTO-SELECT the last opened
     const goToOrdersTab = (sectionId: string, itemId: string, type: 'table' | 'bar') => {
          setSelectedTableForOrder(`${sectionId}|${itemId}|${type}`);
          setActiveTab('comandas');
     };

     // Mouse drag handlers - FLUIDO siguiendo el mouse
     const handleMouseDown = (e: React.MouseEvent, type: 'table' | 'bar' | 'section', sectionId: string, itemId: string) => {
          e.preventDefault();
          e.stopPropagation();

          // Calculate offset from mouse to element's top-left corner
          const rect = e.currentTarget.getBoundingClientRect();
          const offsetX = e.clientX - rect.left;
          const offsetY = e.clientY - rect.top;

          setDraggedItem({ type, sectionId, itemId });
          setDragOffset({ x: offsetX, y: offsetY });
          setIsDragging(true);
          setHasMoved(false);
     };

     // Global mouse move handler
     const handleMouseMove = useCallback((e: MouseEvent) => {
          if (!draggedItem || !isDragging) return;

          setHasMoved(true);

          const canvas = document.getElementById('pos-operations-canvas');
          if (!canvas) return;

          const canvasRect = canvas.getBoundingClientRect();
          let x = e.clientX - canvasRect.left - dragOffset.x;
          let y = e.clientY - canvasRect.top - dragOffset.y;

          if (draggedItem.type === 'section') {
               // Dragging a section
               const section = sections.find(s => s.id === draggedItem.itemId);
               if (!section) return;

               x = Math.max(0, Math.min(x, canvasRect.width - section.width));
               y = Math.max(0, Math.min(y, canvasRect.height - section.height));

               setSections(prev => prev.map(sec =>
                    sec.id === draggedItem.itemId
                         ? { ...sec, x, y }
                         : sec
               ));
          } else {
               // Dragging table or bar within section
               const section = sections.find(s => s.id === draggedItem.sectionId);
               if (!section) return;

               // Calculate position relative to section
               const sectionRect = {
                    left: canvasRect.left + section.x,
                    top: canvasRect.top + section.y,
               };

               x = e.clientX - sectionRect.left - dragOffset.x;
               y = e.clientY - sectionRect.top - dragOffset.y;

               if (draggedItem.type === 'table') {
                    const tableWidth = 80;
                    const tableHeight = 80;
                    x = Math.max(0, Math.min(x, section.width - tableWidth));
                    y = Math.max(0, Math.min(y, section.height - tableHeight));

                    setSections(prev => prev.map(sec => {
                         if (sec.id === draggedItem.sectionId) {
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
                    const bar = section.bars.find(b => b.id === draggedItem.itemId);
                    const barWidth = bar?.orientation === 'vertical' ? 72 : 180;
                    const barHeight = bar?.orientation === 'vertical' ? 180 : 72;
                    x = Math.max(0, Math.min(x, section.width - barWidth));
                    y = Math.max(0, Math.min(y, section.height - barHeight));

                    setSections(prev => prev.map(sec => {
                         if (sec.id === draggedItem.sectionId) {
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
          }
     }, [draggedItem, isDragging, dragOffset, sections]);

     const handleMouseUp = useCallback(() => {
          if (isDragging && hasMoved) {
               saveLayout(sections);
               // Mark that we just dropped to prevent click from opening popup
               justDroppedRef.current = true;
               setTimeout(() => {
                    justDroppedRef.current = false;
               }, 100);
          }
          setDraggedItem(null);
          setIsDragging(false);
          setHasMoved(false);
     }, [isDragging, hasMoved, sections, saveLayout]);

     // Add global mouse event listeners for smooth dragging
     useEffect(() => {
          if (isDragging) {
               window.addEventListener('mousemove', handleMouseMove);
               window.addEventListener('mouseup', handleMouseUp);
               return () => {
                    window.removeEventListener('mousemove', handleMouseMove);
                    window.removeEventListener('mouseup', handleMouseUp);
               };
          }
     }, [isDragging, handleMouseMove, handleMouseUp]);

     // Resize handlers
     const handleResizeStart = (e: React.MouseEvent, sectionId: string) => {
          e.preventDefault();
          e.stopPropagation();

          const section = sections.find(s => s.id === sectionId);
          if (!section) return;

          setResizingSection({
               id: sectionId,
               startX: e.clientX,
               startY: e.clientY,
               startWidth: section.width,
               startHeight: section.height,
          });
     };

     useEffect(() => {
          if (!resizingSection) return;

          const handleResizeMove = (e: MouseEvent) => {
               const deltaX = e.clientX - resizingSection.startX;
               const deltaY = e.clientY - resizingSection.startY;

               const section = sections.find(s => s.id === resizingSection.id);
               if (!section) return;

               let minWidth = 400;
               let minHeight = 300;

               section.tables.forEach(table => {
                    minWidth = Math.max(minWidth, table.x + 100);
                    minHeight = Math.max(minHeight, table.y + 100);
               });

               section.bars.forEach(bar => {
                    const barWidth = bar.orientation === 'vertical' ? 72 : 180;
                    const barHeight = bar.orientation === 'vertical' ? 180 : 72;
                    minWidth = Math.max(minWidth, bar.x + barWidth + 20);
                    minHeight = Math.max(minHeight, bar.y + barHeight + 20);
               });

               const newWidth = Math.max(minWidth, resizingSection.startWidth + deltaX);
               const newHeight = Math.max(minHeight, resizingSection.startHeight + deltaY);

               setSections(prev => prev.map(sec =>
                    sec.id === resizingSection.id
                         ? { ...sec, width: newWidth, height: newHeight }
                         : sec
               ));
          };

          const handleResizeEnd = () => {
               saveLayout(sections);
               setResizingSection(null);
          };

          window.addEventListener('mousemove', handleResizeMove);
          window.addEventListener('mouseup', handleResizeEnd);

          return () => {
               window.removeEventListener('mousemove', handleResizeMove);
               window.removeEventListener('mouseup', handleResizeEnd);
          };
     }, [resizingSection, sections, saveLayout]);

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

               {/* Layout Canvas with dot grid background */}
               <div
                    id="pos-operations-canvas"
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
                              style={{
                                   left: section.x,
                                   top: section.y,
                                   width: section.width,
                                   height: section.height,
                              }}
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
                                             left: table.x,
                                             top: table.y,
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
                                                  // Only open popup on click, not after drag drop
                                                  if (!hasMoved && !justDroppedRef.current) {
                                                       handleItemClick(section.id, table.id, 'table');
                                                  }
                                             }}
                                        >
                                             {/* Delete button - top right */}
                                             <button
                                                  onClick={(e) => {
                                                       e.stopPropagation();
                                                       deleteTable(section.id, table.id);
                                                  }}
                                                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                             >
                                                  <X className="w-3 h-3" />
                                             </button>

                                             <span className="text-white font-bold text-xs">{translateName(table.name)}</span>

                                             {/* Status selector */}
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
                                                                 onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      setSelectedReservation(reservation);
                                                                      setShowReservationModal(true);
                                                                 }}
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
                                             left: bar.x,
                                             top: bar.y,
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
                                                  boxShadow: '0 0 20px rgba(0,0,0,0.3)'
                                             }}
                                             onClick={(e) => {
                                                  e.stopPropagation();
                                                  // Only open popup on click, not after drag drop
                                                  if (!hasMoved && !justDroppedRef.current) {
                                                       handleItemClick(section.id, bar.id, 'bar');
                                                  }
                                             }}
                                        >
                                             {/* Rotate button - top left */}
                                             <button
                                                  onClick={(e) => {
                                                       e.stopPropagation();
                                                       toggleBarOrientation(section.id, bar.id);
                                                  }}
                                                  className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                  title={language === 'es' ? 'Rotar barra' : 'Rotate bar'}
                                             >
                                                  ↻
                                             </button>

                                             {/* Delete button - top right */}
                                             <button
                                                  onClick={(e) => {
                                                       e.stopPropagation();
                                                       deleteBar(section.id, bar.id);
                                                  }}
                                                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                             >
                                                  <X className="w-3 h-3" />
                                             </button>

                                             <span className="text-white font-bold text-xs">{translateName(bar.name)}</span>

                                             {/* Status selector */}
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

                                             {/* Account badge */}
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
                                                                           ${account.total.toFixed(2)}
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
                                                                                <span className="text-muted-foreground">${item.total.toFixed(2)}</span>
                                                                                <Button
                                                                                     variant="ghost"
                                                                                     size="icon"
                                                                                     className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                                                                                     onClick={() => {
                                                                                          removeItemFromAccount(
                                                                                               selectedItem.sectionId,
                                                                                               selectedItem.itemId,
                                                                                               account.id,
                                                                                               item.id,
                                                                                               selectedItem.type
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
                                                                 size="sm"
                                                                 variant="outline"
                                                                 className="flex-1 h-9 text-xs"
                                                                 onClick={() => {
                                                                      goToOrdersTab(selectedItem.sectionId, selectedItem.itemId, selectedItem.type);
                                                                      setIsModalOpen(false);
                                                                 }}
                                                            >
                                                                 <Plus className="w-3 h-3 mr-1" />
                                                                 {language === 'es' ? 'Agregar' : 'Add'}
                                                            </Button>
                                                            <Button
                                                                 size="sm"
                                                                 variant="destructive"
                                                                 className="flex-1 h-9 text-xs"
                                                                 onClick={() => {
                                                                      cancelAccount(selectedItem.sectionId, selectedItem.itemId, account.id, selectedItem.type);
                                                                 }}
                                                            >
                                                                 <X className="w-3 h-3 mr-1" />
                                                                 {language === 'es' ? 'Cancelar' : 'Cancel'}
                                                            </Button>
                                                            <Button
                                                                 size="sm"
                                                                 className="flex-1 h-9 text-xs bg-green-600 hover:bg-green-700"
                                                                 onClick={() => {
                                                                      setConfirmFinalize({
                                                                           sectionId: selectedItem.sectionId,
                                                                           itemId: selectedItem.itemId,
                                                                           accountId: account.id,
                                                                           type: selectedItem.type
                                                                      });
                                                                 }}
                                                                 disabled={account.items.length === 0}
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
                                                  // Auto-select this table in Comandas after opening account
                                                  setSelectedTableForOrder(`${selectedItem.sectionId}|${selectedItem.itemId}|${selectedItem.type}`);
                                             }}
                                        >
                                             <Plus className="w-4 h-4 mr-2" />
                                             {language === 'es' ? 'Nueva Cuenta' : 'New Account'}
                                        </Button>
                                        <Button
                                             variant="outline"
                                             className="flex-1"
                                             onClick={() => {
                                                  goToOrdersTab(selectedItem.sectionId, selectedItem.itemId, selectedItem.type);
                                                  setIsModalOpen(false);
                                             }}
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
                                   {/* Customer Info */}
                                   <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                             <span className="text-sm text-muted-foreground">
                                                  {language === 'es' ? 'Cliente:' : 'Customer:'}
                                             </span>
                                             <span className="font-semibold">{selectedReservation.customer_name}</span>
                                        </div>

                                        {selectedReservation.customer_phone && (
                                             <div className="flex items-center justify-between">
                                                  <span className="text-sm text-muted-foreground">
                                                       {language === 'es' ? 'Teléfono:' : 'Phone:'}
                                                  </span>
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
                                             <span className="text-sm text-muted-foreground">
                                                  {language === 'es' ? 'Mesa:' : 'Table:'}
                                             </span>
                                             <span className="font-semibold">{selectedReservation.table_id}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                             <span className="text-sm text-muted-foreground">
                                                  {language === 'es' ? 'Personas:' : 'Party Size:'}
                                             </span>
                                             <Badge variant="secondary">
                                                  <Users className="w-3 h-3 mr-1" />
                                                  {selectedReservation.party_size}
                                             </Badge>
                                        </div>

                                        <div className="flex items-center justify-between">
                                             <span className="text-sm text-muted-foreground">
                                                  {language === 'es' ? 'Hora:' : 'Time:'}
                                             </span>
                                             <Badge variant="secondary">
                                                  <Clock className="w-3 h-3 mr-1" />
                                                  {selectedReservation.reservation_time.substring(0, 5)}
                                             </Badge>
                                        </div>

                                        <div className="flex items-center justify-between">
                                             <span className="text-sm text-muted-foreground">
                                                  {language === 'es' ? 'Estado:' : 'Status:'}
                                             </span>
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
                                                       <span className="text-sm text-muted-foreground block mb-1">
                                                            {language === 'es' ? 'Notas:' : 'Notes:'}
                                                       </span>
                                                       <p className="text-sm bg-muted p-2 rounded">{selectedReservation.notes}</p>
                                                  </div>
                                             )}
                                             {selectedReservation.special_requests && (
                                                  <div>
                                                       <span className="text-sm text-muted-foreground block mb-1">
                                                            {language === 'es' ? 'Solicitudes especiales:' : 'Special Requests:'}
                                                       </span>
                                                       <p className="text-sm bg-muted p-2 rounded">{selectedReservation.special_requests}</p>
                                                  </div>
                                             )}
                                        </div>
                                   )}

                                   {selectedReservation.status === 'confirmed' && (
                                        <Button
                                             className="w-full bg-green-600 hover:bg-green-700"
                                             onClick={async () => {
                                                  const supabase = createClient();
                                                  await supabase
                                                       .from('reservations')
                                                       .update({ status: 'seated' })
                                                       .eq('id', selectedReservation.id);

                                                  // Update table status to 'ocupada'
                                                  const tableName = selectedReservation.table_id;
                                                  setSections(prev => prev.map(section => ({
                                                       ...section,
                                                       tables: section.tables.map(table =>
                                                            table.name === tableName
                                                                 ? { ...table, status: 'ocupada' as Status }
                                                                 : table
                                                       )
                                                  })));

                                                  // Save layout with updated status
                                                  const updatedSections = sections.map(section => ({
                                                       ...section,
                                                       tables: section.tables.map(table =>
                                                            table.name === tableName
                                                                 ? { ...table, status: 'ocupada' as Status }
                                                                 : table
                                                       )
                                                  }));
                                                  saveLayout(updatedSections);

                                                  toast.success(language === 'es' ? '¡Cliente sentado!' : 'Customer seated!');
                                                  setShowReservationModal(false);

                                                  // Refresh reservations
                                                  const today = new Date().toISOString().split('T')[0];
                                                  const { data } = await supabase
                                                       .from('reservations')
                                                       .select('*')
                                                       .eq('establishment_id', establishmentId)
                                                       .eq('reservation_date', today)
                                                       .in('status', ['confirmed', 'seated'])
                                                       .order('reservation_time', { ascending: true });
                                                  if (data) setReservations(data);
                                             }}
                                        >
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
                                   {language === 'es'
                                        ? 'Crea una reservación manual para una mesa'
                                        : 'Create a manual reservation for a table'}
                              </DialogDescription>
                         </DialogHeader>

                         <div className="space-y-4">
                              {/* Customer Name */}
                              <div className="space-y-2">
                                   <label className="text-sm font-medium">
                                        {language === 'es' ? 'Nombre del Cliente *' : 'Customer Name *'}
                                   </label>
                                   <Input
                                        value={newReservation.customer_name}
                                        onChange={(e) => setNewReservation({ ...newReservation, customer_name: e.target.value })}
                                        placeholder={language === 'es' ? 'Juan Pérez' : 'John Doe'}
                                   />
                              </div>

                              {/* Phone */}
                              <div className="space-y-2">
                                   <label className="text-sm font-medium">
                                        {language === 'es' ? 'Teléfono' : 'Phone'}
                                   </label>
                                   <Input
                                        value={newReservation.customer_phone}
                                        onChange={(e) => setNewReservation({ ...newReservation, customer_phone: e.target.value })}
                                        placeholder="+52 55 1234 5678"
                                   />
                              </div>

                              {/* Email */}
                              <div className="space-y-2">
                                   <label className="text-sm font-medium">Email</label>
                                   <Input
                                        type="email"
                                        value={newReservation.customer_email}
                                        onChange={(e) => setNewReservation({ ...newReservation, customer_email: e.target.value })}
                                        placeholder="cliente@email.com"
                                   />
                              </div>

                              {/* Table Selection */}
                              <div className="space-y-2">
                                   <label className="text-sm font-medium">
                                        {language === 'es' ? 'Mesa *' : 'Table *'}
                                   </label>
                                   <select
                                        value={newReservation.table_id}
                                        onChange={(e) => setNewReservation({ ...newReservation, table_id: e.target.value })}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                   >
                                        <option value="">{language === 'es' ? 'Seleccionar mesa...' : 'Select table...'}</option>
                                        {sections.flatMap(section =>
                                             section.tables.map(table => (
                                                  <option key={table.id} value={table.name}>
                                                       {translateName(table.name)}
                                                  </option>
                                             ))
                                        )}
                                   </select>
                              </div>

                              {/* Party Size and Date/Time Row */}
                              <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                             {language === 'es' ? 'Personas *' : 'Party Size *'}
                                        </label>
                                        <Input
                                             type="number"
                                             min="1"
                                             max="20"
                                             value={newReservation.party_size}
                                             onChange={(e) => setNewReservation({ ...newReservation, party_size: parseInt(e.target.value) || 1 })}
                                        />
                                   </div>

                                   <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                             {language === 'es' ? 'Fecha *' : 'Date *'}
                                        </label>
                                        <Input
                                             type="date"
                                             value={newReservation.reservation_date}
                                             onChange={(e) => setNewReservation({ ...newReservation, reservation_date: e.target.value })}
                                        />
                                   </div>
                              </div>

                              {/* Time */}
                              <div className="space-y-2">
                                   <label className="text-sm font-medium">
                                        {language === 'es' ? 'Hora *' : 'Time *'}
                                   </label>
                                   <Input
                                        type="time"
                                        value={newReservation.reservation_time}
                                        onChange={(e) => setNewReservation({ ...newReservation, reservation_time: e.target.value })}
                                   />
                              </div>

                              {/* Notes */}
                              <div className="space-y-2">
                                   <label className="text-sm font-medium">
                                        {language === 'es' ? 'Notas' : 'Notes'}
                                   </label>
                                   <Input
                                        value={newReservation.notes}
                                        onChange={(e) => setNewReservation({ ...newReservation, notes: e.target.value })}
                                        placeholder={language === 'es' ? 'Información adicional...' : 'Additional information...'}
                                   />
                              </div>

                              {/* Special Requests */}
                              <div className="space-y-2">
                                   <label className="text-sm font-medium">
                                        {language === 'es' ? 'Solicitudes Especiales' : 'Special Requests'}
                                   </label>
                                   <Input
                                        value={newReservation.special_requests}
                                        onChange={(e) => setNewReservation({ ...newReservation, special_requests: e.target.value })}
                                        placeholder={language === 'es' ? 'Alergias, preferencias, etc.' : 'Allergies, preferences, etc.'}
                                   />
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-4">
                                   <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                             setShowNewReservationModal(false);
                                             setNewReservation({
                                                  customer_name: '',
                                                  customer_phone: '',
                                                  customer_email: '',
                                                  table_id: '',
                                                  party_size: 2,
                                                  reservation_date: new Date().toISOString().split('T')[0],
                                                  reservation_time: '19:00',
                                                  notes: '',
                                                  special_requests: '',
                                             });
                                        }}
                                   >
                                        {language === 'es' ? 'Cancelar' : 'Cancel'}
                                   </Button>
                                   <Button
                                        className="flex-1"
                                        disabled={!newReservation.customer_name || !newReservation.table_id}
                                        onClick={async () => {
                                             const supabase = createClient();
                                             const { error } = await supabase
                                                  .from('reservations')
                                                  .insert({
                                                       establishment_id: establishmentId,
                                                       table_id: newReservation.table_id,
                                                       source: 'manual',
                                                       customer_name: newReservation.customer_name,
                                                       customer_phone: newReservation.customer_phone || null,
                                                       customer_email: newReservation.customer_email || null,
                                                       party_size: newReservation.party_size,
                                                       reservation_date: newReservation.reservation_date,
                                                       reservation_time: newReservation.reservation_time + ':00',
                                                       status: 'confirmed',
                                                       notes: newReservation.notes || null,
                                                       special_requests: newReservation.special_requests || null,
                                                  });

                                             if (error) {
                                                  toast.error(language === 'es' ? 'Error al crear reservación' : 'Error creating reservation');
                                                  console.error(error);
                                                  return;
                                             }

                                             // Update table status to 'reservada' if reservation is for today
                                             const today = new Date().toISOString().split('T')[0];
                                             if (newReservation.reservation_date === today) {
                                                  setSections(prev => prev.map(section => ({
                                                       ...section,
                                                       tables: section.tables.map(table =>
                                                            table.name === newReservation.table_id
                                                                 ? { ...table, status: 'reservada' as Status }
                                                                 : table
                                                       )
                                                  })));
                                                  // Save layout with updated status
                                                  const updatedSections = sections.map(section => ({
                                                       ...section,
                                                       tables: section.tables.map(table =>
                                                            table.name === newReservation.table_id
                                                                 ? { ...table, status: 'reservada' as Status }
                                                                 : table
                                                       )
                                                  }));
                                                  saveLayout(updatedSections);
                                             }

                                             toast.success(language === 'es' ? '¡Reservación creada!' : 'Reservation created!');
                                             setShowNewReservationModal(false);

                                             // Reset form
                                             setNewReservation({
                                                  customer_name: '',
                                                  customer_phone: '',
                                                  customer_email: '',
                                                  table_id: '',
                                                  party_size: 2,
                                                  reservation_date: new Date().toISOString().split('T')[0],
                                                  reservation_time: '19:00',
                                                  notes: '',
                                                  special_requests: '',
                                             });

                                             // Refresh reservations
                                             const { data } = await supabase
                                                  .from('reservations')
                                                  .select('*')
                                                  .eq('establishment_id', establishmentId)
                                                  .eq('reservation_date', today)
                                                  .in('status', ['confirmed', 'seated'])
                                                  .order('reservation_time', { ascending: true });
                                             if (data) setReservations(data);
                                        }}
                                   >
                                        <Check className="w-4 h-4 mr-2" />
                                        {language === 'es' ? 'Crear Reservación' : 'Create Reservation'}
                                   </Button>
                              </div>
                         </div>
                    </DialogContent>
               </Dialog>

               {/* Confirmation Dialog for Finalizing Account */}
               <AlertDialog open={!!confirmFinalize} onOpenChange={(open) => !open && setConfirmFinalize(null)}>
                    <AlertDialogContent>
                         <AlertDialogHeader>
                              <AlertDialogTitle>
                                   {language === 'es' ? 'Confirmar Mesa Pagada' : 'Confirm Table Paid'}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                   {language === 'es'
                                        ? '¿Estás seguro de que deseas finalizar esta cuenta? Esta acción registrará la venta y liberará la mesa.'
                                        : 'Are you sure you want to finalize this account? This will record the sale and free the table.'}
                              </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                              <AlertDialogCancel>
                                   {language === 'es' ? 'Cancelar' : 'Cancel'}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                   className="bg-green-600 hover:bg-green-700"
                                   onClick={() => {
                                        if (confirmFinalize) {
                                             closeAccount(
                                                  confirmFinalize.sectionId,
                                                  confirmFinalize.itemId,
                                                  confirmFinalize.accountId,
                                                  confirmFinalize.type
                                             );
                                             setConfirmFinalize(null);
                                        }
                                   }}
                              >
                                   <Check className="w-4 h-4 mr-2" />
                                   {language === 'es' ? 'Confirmar' : 'Confirm'}
                              </AlertDialogAction>
                         </AlertDialogFooter>
                    </AlertDialogContent>
               </AlertDialog>
          </div>
     );
}
