-- Add image_url column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment
COMMENT ON COLUMN public.products.image_url IS 'URL of the product image';
