-- Create ticket counter table for sequential ticket IDs
CREATE TABLE IF NOT EXISTS public.ticket_counter (
  establishment_id UUID PRIMARY KEY REFERENCES public.establishments(id) ON DELETE CASCADE,
  last_ticket_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ticket_counter ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing ticket counter
CREATE POLICY "Users can view their establishment ticket counter"
  ON public.ticket_counter FOR SELECT
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Create policy for inserting ticket counter
CREATE POLICY "Users can insert ticket counter for their establishment"
  ON public.ticket_counter FOR INSERT
  WITH CHECK (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Create policy for updating ticket counter
CREATE POLICY "Users can update their establishment ticket counter"
  ON public.ticket_counter FOR UPDATE
  USING (
    establishment_id IN (
      SELECT id FROM public.establishments WHERE user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.ticket_counter
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to get next ticket number
CREATE OR REPLACE FUNCTION get_next_ticket_number(p_establishment_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_number INTEGER;
BEGIN
  -- Insert or update ticket counter
  INSERT INTO public.ticket_counter (establishment_id, last_ticket_number)
  VALUES (p_establishment_id, 1)
  ON CONFLICT (establishment_id)
  DO UPDATE SET 
    last_ticket_number = public.ticket_counter.last_ticket_number + 1,
    updated_at = now()
  RETURNING last_ticket_number INTO v_next_number;
  
  RETURN v_next_number;
END;
$$;

COMMENT ON TABLE public.ticket_counter IS 'Stores sequential ticket counter per establishment';
COMMENT ON FUNCTION get_next_ticket_number IS 'Returns next sequential ticket number for an establishment';
