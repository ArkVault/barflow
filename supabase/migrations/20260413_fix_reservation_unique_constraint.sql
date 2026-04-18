-- Fix: Allow multiple manual reservations
-- The old constraint UNIQUE NULLS NOT DISTINCT (source, external_id) blocked
-- all manual reservations after the first because external_id is always NULL
-- for manual sources.
-- Replace with a partial unique index that only applies when external_id IS NOT NULL.

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS unique_external_reservation;

DROP INDEX IF EXISTS idx_reservations_external;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_external
  ON public.reservations(source, external_id)
  WHERE external_id IS NOT NULL;
