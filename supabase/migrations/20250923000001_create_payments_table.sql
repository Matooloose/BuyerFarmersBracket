-- Create payments table for PayFast integration
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'ZAR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_method text NOT NULL DEFAULT 'payfast' CHECK (payment_method IN ('payfast', 'card', 'cash', 'eft')),
  transaction_id text, -- PayFast payment ID or other transaction reference
  gateway_response jsonb, -- Full response from payment gateway
  metadata jsonb DEFAULT '{}', -- Additional payment metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX idx_payments_created_at ON public.payments(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON public.payments
  FOR UPDATE USING (auth.uid() = user_id);

-- Add payment tracking to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('payfast', 'card', 'cash', 'eft'));

-- Create payment notifications table for webhook handling
CREATE TABLE public.payment_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- 'webhook', 'itn', 'redirect'
  raw_data jsonb NOT NULL, -- Full notification payload
  processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for payment notifications
CREATE INDEX idx_payment_notifications_payment_id ON public.payment_notifications(payment_id);
CREATE INDEX idx_payment_notifications_processed ON public.payment_notifications(processed);

-- Enable RLS for payment notifications
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;

-- Create function to update payment timestamp
CREATE OR REPLACE FUNCTION update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment updated_at
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

-- Create function to automatically create payment record when order is created
CREATE OR REPLACE FUNCTION create_initial_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create payment record if this is a new order (not an update)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.payments (
      order_id,
      user_id,
      amount,
      currency,
      status,
      payment_method
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.total,
      'ZAR',
      COALESCE(NEW.payment_status, 'pending'),
      COALESCE(NEW.payment_method, 'payfast')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create payment records
CREATE TRIGGER orders_create_payment
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_payment();

-- Insert sample payment statuses for existing orders (if any)
-- This is safe to run multiple times
INSERT INTO public.payments (order_id, user_id, amount, currency, status, payment_method)
SELECT 
  o.id,
  o.user_id,
  o.total,
  'ZAR',
  COALESCE(o.payment_status, 'pending'),
  COALESCE(o.payment_method, 'payfast')
FROM public.orders o
WHERE NOT EXISTS (
  SELECT 1 FROM public.payments p WHERE p.order_id = o.id
);