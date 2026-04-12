-- OpenTable Integration Tables
-- This migration creates the infrastructure for multi-tenant OpenTable integration

-- Table to store OpenTable OAuth credentials per establishment
CREATE TABLE IF NOT EXISTS public.opentable_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE UNIQUE,
  
  -- OAuth tokens (encrypted)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  
  -- OpenTable restaurant info
  opentable_restaurant_id TEXT NOT NULL,
  opentable_restaurant_name TEXT,
  
  -- Webhook configuration
  webhook_id TEXT,
  webhook_secret TEXT NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to map OpenTable tables to internal table IDs
CREATE TABLE IF NOT EXISTS public.opentable_table_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.opentable_integrations(id) ON DELETE CASCADE,
  
  -- Mapping
  opentable_table_id TEXT NOT NULL,
  opentable_table_name TEXT NOT NULL,
  internal_table_id TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(integration_id, opentable_table_id)
);

-- Table to store reservations from all sources
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  table_id TEXT NOT NULL,
  
  -- Reservation source
  source TEXT CHECK (source IN ('opentable', 'manual', 'phone', 'website', 'walkin')) NOT NULL,
  external_id TEXT, -- OpenTable reservation ID
  
  -- Customer information
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  
  -- Reservation details
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  
  -- Status
  status TEXT CHECK (status IN ('confirmed', 'seated', 'completed', 'cancelled', 'no-show')) NOT NULL DEFAULT 'confirmed',
  
  -- Notes
  notes TEXT,
  special_requests TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique external reservations
  CONSTRAINT unique_external_reservation UNIQUE NULLS NOT DISTINCT (source, external_id)
);

-- Indexes for performance
CREATE INDEX idx_opentable_integrations_establishment ON public.opentable_integrations(establishment_id);
CREATE INDEX idx_opentable_table_mappings_integration ON public.opentable_table_mappings(integration_id);
CREATE INDEX idx_reservations_establishment ON public.reservations(establishment_id);
CREATE INDEX idx_reservations_date ON public.reservations(reservation_date);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_table ON public.reservations(table_id);
CREATE INDEX idx_reservations_external ON public.reservations(external_id) WHERE external_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.opentable_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opentable_table_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for opentable_integrations
CREATE POLICY "Users can view their establishment's integration"
  ON public.opentable_integrations FOR SELECT
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their establishment's integration"
  ON public.opentable_integrations FOR ALL
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for opentable_table_mappings
CREATE POLICY "Users can view their table mappings"
  ON public.opentable_table_mappings FOR SELECT
  USING (
    integration_id IN (
      SELECT id FROM public.opentable_integrations 
      WHERE establishment_id IN (
        SELECT id FROM public.establishments WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their table mappings"
  ON public.opentable_table_mappings FOR ALL
  USING (
    integration_id IN (
      SELECT id FROM public.opentable_integrations 
      WHERE establishment_id IN (
        SELECT id FROM public.establishments WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for reservations
CREATE POLICY "Users can view their establishment's reservations"
  ON public.reservations FOR SELECT
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their establishment's reservations"
  ON public.reservations FOR ALL
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at on opentable_integrations
CREATE TRIGGER set_opentable_integrations_updated_at
  BEFORE UPDATE ON public.opentable_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for updated_at on reservations
CREATE TRIGGER set_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
