-- Migration: Enable RLS on inventory_logs table
-- Description: Enables RLS and creates policies for inventory_logs
-- Note: inventory_logs doesn't have direct establishment_id, so we use the JOIN through supplies

-- ========================================
-- ENABLE RLS ON INVENTORY_LOGS
-- ========================================
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- DROP EXISTING POLICIES (for idempotency)
-- ========================================
DROP POLICY IF EXISTS "inventory_logs_select_own" ON public.inventory_logs;
DROP POLICY IF EXISTS "inventory_logs_insert_own" ON public.inventory_logs;
DROP POLICY IF EXISTS "inventory_logs_update_own" ON public.inventory_logs;
DROP POLICY IF EXISTS "inventory_logs_delete_own" ON public.inventory_logs;

-- ========================================
-- SELECT POLICY
-- Users can only read inventory logs for supplies in their establishment
-- ========================================
CREATE POLICY "inventory_logs_select_own"
ON public.inventory_logs
FOR SELECT
TO authenticated
USING (
  supply_id IN (
    SELECT s.id FROM supplies s
    JOIN establishments e ON e.id = s.establishment_id
    WHERE e.user_id = auth.uid()
  )
);

-- ========================================
-- INSERT POLICY
-- Users can only insert logs for supplies in their establishment
-- Note: Most inserts are done via triggers with service_role, but this protects direct access
-- ========================================
CREATE POLICY "inventory_logs_insert_own"
ON public.inventory_logs
FOR INSERT
TO authenticated
WITH CHECK (
  supply_id IN (
    SELECT s.id FROM supplies s
    JOIN establishments e ON e.id = s.establishment_id
    WHERE e.user_id = auth.uid()
  )
);

-- ========================================
-- UPDATE POLICY
-- Users can only update logs for supplies in their establishment
-- ========================================
CREATE POLICY "inventory_logs_update_own"
ON public.inventory_logs
FOR UPDATE
TO authenticated
USING (
  supply_id IN (
    SELECT s.id FROM supplies s
    JOIN establishments e ON e.id = s.establishment_id
    WHERE e.user_id = auth.uid()
  )
)
WITH CHECK (
  supply_id IN (
    SELECT s.id FROM supplies s
    JOIN establishments e ON e.id = s.establishment_id
    WHERE e.user_id = auth.uid()
  )
);

-- ========================================
-- DELETE POLICY
-- Users can only delete logs for supplies in their establishment
-- ========================================
CREATE POLICY "inventory_logs_delete_own"
ON public.inventory_logs
FOR DELETE
TO authenticated
USING (
  supply_id IN (
    SELECT s.id FROM supplies s
    JOIN establishments e ON e.id = s.establishment_id
    WHERE e.user_id = auth.uid()
  )
);

-- ========================================
-- REVOKE ANON ACCESS
-- No anonymous access to inventory logs
-- ========================================
REVOKE ALL ON public.inventory_logs FROM anon;

-- ========================================
-- OPTIONAL: Add establishment_id directly for better performance
-- Uncomment and run if you want to denormalize for faster queries
-- ========================================
-- ALTER TABLE public.inventory_logs 
-- ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES establishments(id);

-- UPDATE public.inventory_logs il
-- SET establishment_id = s.establishment_id
-- FROM supplies s
-- WHERE il.supply_id = s.id AND il.establishment_id IS NULL;

-- CREATE INDEX IF NOT EXISTS idx_inventory_logs_establishment ON inventory_logs(establishment_id);

-- ========================================
-- VERIFICATION
-- ========================================
-- Run after applying migration to verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'inventory_logs';
-- 
-- Check policies:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'inventory_logs';
