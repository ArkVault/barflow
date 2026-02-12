'use client';

import { useCallback } from 'react';
import { Section, TableItem, BarItem, Status } from '../types';

interface UseTableActionsOptions {
     sections: Section[];
     setSections: React.Dispatch<React.SetStateAction<Section[]>>;
     language: string;
}

/**
 * Custom hook for section / table / bar CRUD operations.
 * Extracted from tables-tab.tsx for separation of concerns.
 */
export function useTableActions({ sections, setSections, language }: UseTableActionsOptions) {

     // ---- Section management ----

     const addSection = useCallback(() => {
          const canvas = document.getElementById('pos-operations-canvas');
          const canvasWidth = canvas?.clientWidth || 900;
          const sectionWidth = Math.round(canvasWidth * 0.7);
          const sectionX = Math.round((canvasWidth - sectionWidth) / 2);

          let newY = 30;
          if (sections.length > 0) {
               const lastSection = sections[sections.length - 1];
               newY = lastSection.y + lastSection.height + 40;
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

          setTimeout(() => {
               const el = document.getElementById(`section-${newSection.id}`);
               if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
               } else {
                    const container = document.getElementById('pos-operations-canvas');
                    if (container) container.scrollTop = container.scrollHeight;
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
               }
          }, 100);
     }, [sections, setSections, language]);

     const deleteSection = useCallback((sectionId: string) => {
          setSections(sections.filter(s => s.id !== sectionId));
     }, [sections, setSections]);

     // ---- Table management ----

     const getNextTableNumber = useCallback((): number => {
          let totalTables = 0;
          sections.forEach(section => {
               totalTables += section.tables.length;
          });
          return totalTables + 1;
     }, [sections]);

     const addTable = useCallback((sectionId: string) => {
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
     }, [sections, setSections, language, getNextTableNumber]);

     const deleteTable = useCallback((sectionId: string, tableId: string) => {
          const updated = sections.map(section => {
               if (section.id === sectionId) {
                    return { ...section, tables: section.tables.filter(t => t.id !== tableId) };
               }
               return section;
          });

          // Renumber all tables sequentially
          let counter = 1;
          const renumbered = updated.map(section => ({
               ...section,
               tables: section.tables.map(table => ({
                    ...table,
                    name: language === 'es' ? `Mesa ${counter++}` : `Table ${counter++}`,
               })),
          }));

          setSections(renumbered);
     }, [sections, setSections, language]);

     // ---- Bar management ----

     const addBar = useCallback((sectionId: string) => {
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
     }, [sections, setSections, language]);

     const deleteBar = useCallback((sectionId: string, barId: string) => {
          setSections(sections.map(section => {
               if (section.id === sectionId) {
                    return { ...section, bars: section.bars.filter(b => b.id !== barId) };
               }
               return section;
          }));
     }, [sections, setSections]);

     const toggleBarOrientation = useCallback((sectionId: string, barId: string) => {
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
     }, [sections, setSections]);

     // ---- Status updates ----

     const updateTableStatus = useCallback((sectionId: string, tableId: string, status: Status) => {
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
     }, [sections, setSections]);

     const updateBarStatus = useCallback((sectionId: string, barId: string, status: Status) => {
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
     }, [sections, setSections]);

     return {
          addSection,
          deleteSection,
          addTable,
          deleteTable,
          addBar,
          deleteBar,
          toggleBarOrientation,
          updateTableStatus,
          updateBarStatus,
     };
}
