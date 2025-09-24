-- Enhancement for orders table to support advanced checkout features
-- Add missing columns to orders table if they don't exist

-- Add delivery_instructions column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'delivery_instructions') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_instructions text;
    END IF;
END $$;

-- Add phone_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'phone_number') THEN
        ALTER TABLE public.orders ADD COLUMN phone_number text;
    END IF;
END $$;

-- Add estimated_delivery column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'estimated_delivery') THEN
        ALTER TABLE public.orders ADD COLUMN estimated_delivery text;
    END IF;
END $$;

-- Add delivery_slot column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'delivery_slot') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_slot text;
    END IF;
END $$;

-- Add gift_options column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'gift_options') THEN
        ALTER TABLE public.orders ADD COLUMN gift_options jsonb;
    END IF;
END $$;

-- Create orders table if it doesn't exist (fallback)
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    total numeric NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'pending',
    payment_status text NOT NULL DEFAULT 'pending',
    payment_method text,
    shipping_address text,
    delivery_instructions text,
    phone_number text,
    estimated_delivery text,
    delivery_slot text,
    gift_options jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create order_items table if it doesn't exist (fallback)
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id),
    quantity integer NOT NULL DEFAULT 1,
    unit_price numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'orders' AND rowsecurity = true) THEN
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'order_items' AND rowsecurity = true) THEN
        ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create basic policies if they don't exist
DO $$
BEGIN
    -- Orders policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can view their own orders') THEN
        CREATE POLICY "Users can view their own orders" 
        ON public.orders 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can create their own orders') THEN
        CREATE POLICY "Users can create their own orders" 
        ON public.orders 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can update their own orders') THEN
        CREATE POLICY "Users can update their own orders" 
        ON public.orders 
        FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;

    -- Order items policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Users can view order items for their orders') THEN
        CREATE POLICY "Users can view order items for their orders" 
        ON public.order_items 
        FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.orders o 
                WHERE o.id = order_id AND o.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Users can create order items for their orders') THEN
        CREATE POLICY "Users can create order items for their orders" 
        ON public.order_items 
        FOR INSERT 
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.orders o 
                WHERE o.id = order_id AND o.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON public.order_items(product_id);

-- Add updated_at triggers if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
        CREATE TRIGGER update_orders_updated_at
        BEFORE UPDATE ON public.orders
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;