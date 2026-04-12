-- Fix products table structure
-- Add ingredients column if it doesn't exist

DO $$ 
BEGIN
    -- Check if ingredients column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'ingredients'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN ingredients JSONB DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN public.products.ingredients IS 'Product ingredients with quantities';
    END IF;
END $$;

-- Ensure all other columns exist
DO $$ 
BEGIN
    -- Add description if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'description'
    ) THEN
        ALTER TABLE public.products ADD COLUMN description TEXT;
    END IF;

    -- Add image_url if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.products ADD COLUMN image_url TEXT;
    END IF;

    -- Add is_active if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.products ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;
