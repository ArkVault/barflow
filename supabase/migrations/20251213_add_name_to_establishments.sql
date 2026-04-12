-- Add name column to establishments table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'establishments' AND column_name = 'name'
    ) THEN
        ALTER TABLE public.establishments ADD COLUMN name TEXT;
    END IF;
END $$;

COMMENT ON COLUMN public.establishments.name IS 'Business name of the establishment';
