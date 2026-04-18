-- ============================================================================
-- COMBINED MIGRATION SCRIPT — Run this in Supabase SQL Editor
-- Applies 3 pending migrations in order:
--   1. tax_rate column on establishments
--   2. onboarding columns on establishments
--   3. team_members + supply_movements tables with RLS
-- ============================================================================
-- Safe to run multiple times (all statements are idempotent with IF NOT EXISTS)
-- ============================================================================

-- ─── 1. Tax rate (20260312) ─────────────────────────────────────────────────

ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) NOT NULL DEFAULT 16.00;

-- ─── 2. Onboarding (20260327) ───────────────────────────────────────────────

ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT NULL;

COMMENT ON COLUMN public.establishments.onboarding_completed IS 'Whether the user has completed the onboarding wizard';
COMMENT ON COLUMN public.establishments.onboarding_data IS 'JSON data from onboarding: roles, branchType, inventoryMethod';

-- ─── 3. team_members table + RLS (20260412) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'jefe_de_piso', 'jefe_de_barra', 'mesero')),
  pin_hash TEXT NOT NULL,
  can_approve_cancellations BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_establishment
  ON public.team_members(establishment_id);
CREATE INDEX IF NOT EXISTS idx_team_members_active
  ON public.team_members(establishment_id, is_active);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own team_members" ON public.team_members;
DROP POLICY IF EXISTS "Users can insert own team_members" ON public.team_members;
DROP POLICY IF EXISTS "Users can update own team_members" ON public.team_members;
DROP POLICY IF EXISTS "Users can delete own team_members" ON public.team_members;

CREATE POLICY "Users can view own team_members"
  ON public.team_members FOR SELECT TO authenticated
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own team_members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own team_members"
  ON public.team_members FOR UPDATE TO authenticated
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own team_members"
  ON public.team_members FOR DELETE TO authenticated
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- ─── 4. supply_movements table + RLS (20260412) ─────────────────────────────

CREATE TABLE IF NOT EXISTS public.supply_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('received', 'consumed', 'wasted', 'adjustment')),
  quantity DECIMAL(12,4) NOT NULL,
  cost DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supply_movements_supply
  ON public.supply_movements(supply_id);
CREATE INDEX IF NOT EXISTS idx_supply_movements_type
  ON public.supply_movements(movement_type);

ALTER TABLE public.supply_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own supply_movements" ON public.supply_movements;
DROP POLICY IF EXISTS "Users can insert own supply_movements" ON public.supply_movements;
DROP POLICY IF EXISTS "Users can update own supply_movements" ON public.supply_movements;
DROP POLICY IF EXISTS "Users can delete own supply_movements" ON public.supply_movements;

CREATE POLICY "Users can view own supply_movements"
  ON public.supply_movements FOR SELECT TO authenticated
  USING (
    supply_id IN (
      SELECT id FROM public.supplies WHERE establishment_id IN (
        SELECT id FROM public.establishments WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own supply_movements"
  ON public.supply_movements FOR INSERT TO authenticated
  WITH CHECK (
    supply_id IN (
      SELECT id FROM public.supplies WHERE establishment_id IN (
        SELECT id FROM public.establishments WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own supply_movements"
  ON public.supply_movements FOR UPDATE TO authenticated
  USING (
    supply_id IN (
      SELECT id FROM public.supplies WHERE establishment_id IN (
        SELECT id FROM public.establishments WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    supply_id IN (
      SELECT id FROM public.supplies WHERE establishment_id IN (
        SELECT id FROM public.establishments WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own supply_movements"
  ON public.supply_movements FOR DELETE TO authenticated
  USING (
    supply_id IN (
      SELECT id FROM public.supplies WHERE establishment_id IN (
        SELECT id FROM public.establishments WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- Done! All 3 migrations applied.
-- ============================================================================
