'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Section, Status } from '../types';

interface DraggedItem {
     type: 'table' | 'bar' | 'section';
     sectionId: string;
     itemId: string;
}

interface ResizingSection {
     id: string;
     startX: number;
     startY: number;
     startWidth: number;
     startHeight: number;
}

interface UseDragAndDropOptions {
     sections: Section[];
     setSections: React.Dispatch<React.SetStateAction<Section[]>>;
     saveLayout: (sections: Section[]) => Promise<void>;
     canvasId: string;
}

/**
 * Custom hook for drag-and-drop and resize logic on the POS canvas.
 */
export function useDragAndDrop({ sections, setSections, saveLayout, canvasId }: UseDragAndDropOptions) {
     const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
     const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
     const [isDragging, setIsDragging] = useState(false);
     const [hasMoved, setHasMoved] = useState(false);
     const [resizingSection, setResizingSection] = useState<ResizingSection | null>(null);
     const justDroppedRef = useRef(false);

     // ------ Drag handlers ------

     const handleMouseDown = useCallback((e: React.MouseEvent, type: 'table' | 'bar' | 'section', sectionId: string, itemId: string) => {
          e.preventDefault();
          e.stopPropagation();

          const rect = e.currentTarget.getBoundingClientRect();
          const offsetX = e.clientX - rect.left;
          const offsetY = e.clientY - rect.top;

          setDraggedItem({ type, sectionId, itemId });
          setDragOffset({ x: offsetX, y: offsetY });
          setIsDragging(true);
          setHasMoved(false);
     }, []);

     const handleMouseMove = useCallback((e: MouseEvent) => {
          if (!draggedItem || !isDragging) return;

          setHasMoved(true);

          const canvas = document.getElementById(canvasId);
          if (!canvas) return;

          const canvasRect = canvas.getBoundingClientRect();
          let x = e.clientX - canvasRect.left - dragOffset.x;
          let y = e.clientY - canvasRect.top - dragOffset.y;

          if (draggedItem.type === 'section') {
               const section = sections.find(s => s.id === draggedItem.itemId);
               if (!section) return;

               x = Math.max(0, Math.min(x, canvasRect.width - section.width));
               y = Math.max(0, Math.min(y, canvasRect.height - section.height));

               setSections(prev => prev.map(sec =>
                    sec.id === draggedItem.itemId ? { ...sec, x, y } : sec
               ));
          } else {
               const section = sections.find(s => s.id === draggedItem.sectionId);
               if (!section) return;

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

                    setSections(prev => prev.map(sec =>
                         sec.id === draggedItem.sectionId
                              ? { ...sec, tables: sec.tables.map(table => table.id === draggedItem.itemId ? { ...table, x, y } : table) }
                              : sec
                    ));
               } else if (draggedItem.type === 'bar') {
                    const bar = section.bars.find(b => b.id === draggedItem.itemId);
                    const barWidth = bar?.orientation === 'vertical' ? 72 : 180;
                    const barHeight = bar?.orientation === 'vertical' ? 180 : 72;
                    x = Math.max(0, Math.min(x, section.width - barWidth));
                    y = Math.max(0, Math.min(y, section.height - barHeight));

                    setSections(prev => prev.map(sec =>
                         sec.id === draggedItem.sectionId
                              ? { ...sec, bars: sec.bars.map(bar => bar.id === draggedItem.itemId ? { ...bar, x, y } : bar) }
                              : sec
                    ));
               }
          }
     }, [draggedItem, isDragging, dragOffset, sections, canvasId, setSections]);

     const handleMouseUp = useCallback(() => {
          if (isDragging && hasMoved) {
               saveLayout(sections);
               justDroppedRef.current = true;
               setTimeout(() => { justDroppedRef.current = false; }, 100);
          }
          setDraggedItem(null);
          setIsDragging(false);
          setHasMoved(false);
     }, [isDragging, hasMoved, sections, saveLayout]);

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

     // ------ Resize handlers ------

     const handleResizeStart = useCallback((e: React.MouseEvent, sectionId: string) => {
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
     }, [sections]);

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
                    sec.id === resizingSection.id ? { ...sec, width: newWidth, height: newHeight } : sec
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
     }, [resizingSection, sections, saveLayout, setSections]);

     return {
          draggedItem,
          isDragging,
          hasMoved,
          justDroppedRef,
          handleMouseDown,
          handleResizeStart,
     };
}
