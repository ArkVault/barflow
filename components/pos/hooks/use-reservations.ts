'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Section, Status } from '../types';

interface NewReservationData {
     customer_name: string;
     customer_phone: string;
     customer_email: string;
     table_id: string;
     party_size: number;
     reservation_date: string;
     reservation_time: string;
     notes: string;
     special_requests: string;
}

const emptyReservation: NewReservationData = {
     customer_name: '',
     customer_phone: '',
     customer_email: '',
     table_id: '',
     party_size: 2,
     reservation_date: new Date().toISOString().split('T')[0],
     reservation_time: '19:00',
     notes: '',
     special_requests: '',
};

interface UseReservationsOptions {
     establishmentId: string | null;
     sections: Section[];
     setSections: React.Dispatch<React.SetStateAction<Section[]>>;
     saveLayout: (sections: Section[]) => Promise<void>;
     language: string;
}

/**
 * Custom hook for reservation management — fetching, creating, and seating.
 */
export function useReservations({ establishmentId, sections, setSections, saveLayout, language }: UseReservationsOptions) {
     const [reservations, setReservations] = useState<any[]>([]);
     const [selectedReservation, setSelectedReservation] = useState<any | null>(null);
     const [showReservationModal, setShowReservationModal] = useState(false);
     const [showNewReservationModal, setShowNewReservationModal] = useState(false);
     const [newReservation, setNewReservation] = useState<NewReservationData>({ ...emptyReservation });

     // Fetch today's reservations and auto-refresh every minute
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
          const interval = setInterval(fetchReservations, 60000);
          return () => clearInterval(interval);
     }, [establishmentId]);

     /** Looks up today's reservation for a specific table name */
     const getTableReservation = useCallback((tableName: string) => {
          return reservations.find(r =>
               r.table_id === tableName ||
               r.table_id === tableName.replace('Mesa ', '').replace('Table ', '')
          );
     }, [reservations]);

     /** Marks a reservation as "seated" and updates the table status */
     const seatCustomer = useCallback(async (reservation: any) => {
          const supabase = createClient();
          await supabase
               .from('reservations')
               .update({ status: 'seated' })
               .eq('id', reservation.id);

          const tableName = reservation.table_id;
          setSections(prev => prev.map(section => ({
               ...section,
               tables: section.tables.map(table =>
                    table.name === tableName ? { ...table, status: 'ocupada' as Status } : table
               ),
          })));

          const updatedSections = sections.map(section => ({
               ...section,
               tables: section.tables.map(table =>
                    table.name === tableName ? { ...table, status: 'ocupada' as Status } : table
               ),
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
     }, [establishmentId, sections, setSections, saveLayout, language]);

     /** Creates a new manual reservation */
     const createReservation = useCallback(async () => {
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

          // Update table status if reservation is for today
          const today = new Date().toISOString().split('T')[0];
          if (newReservation.reservation_date === today) {
               setSections(prev => prev.map(section => ({
                    ...section,
                    tables: section.tables.map(table =>
                         table.name === newReservation.table_id
                              ? { ...table, status: 'reservada' as Status }
                              : table
                    ),
               })));

               const updatedSections = sections.map(section => ({
                    ...section,
                    tables: section.tables.map(table =>
                         table.name === newReservation.table_id
                              ? { ...table, status: 'reservada' as Status }
                              : table
                    ),
               }));
               saveLayout(updatedSections);
          }

          toast.success(language === 'es' ? '¡Reservación creada!' : 'Reservation created!');
          setShowNewReservationModal(false);
          setNewReservation({ ...emptyReservation });

          // Refresh reservations list
          const { data } = await supabase
               .from('reservations')
               .select('*')
               .eq('establishment_id', establishmentId)
               .eq('reservation_date', today)
               .in('status', ['confirmed', 'seated'])
               .order('reservation_time', { ascending: true });
          if (data) setReservations(data);
     }, [establishmentId, newReservation, sections, setSections, saveLayout, language]);

     const resetNewReservationForm = useCallback(() => {
          setNewReservation({ ...emptyReservation });
     }, []);

     return {
          reservations,
          selectedReservation,
          setSelectedReservation,
          showReservationModal,
          setShowReservationModal,
          showNewReservationModal,
          setShowNewReservationModal,
          newReservation,
          setNewReservation,
          getTableReservation,
          seatCustomer,
          createReservation,
          resetNewReservationForm,
     };
}
