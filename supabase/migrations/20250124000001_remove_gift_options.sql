-- Remove gift_options column from orders table
-- This migration removes the gift wrap functionality from the application

-- Remove gift_options column if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'gift_options') THEN
        ALTER TABLE public.orders DROP COLUMN gift_options;
    END IF;
END $$;

-- Add comment to orders table documenting the change
COMMENT ON TABLE public.orders IS 'Orders table - gift options functionality removed for simplified checkout experience';