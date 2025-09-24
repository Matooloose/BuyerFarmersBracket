-- Fix farms table RLS policies and add missing rating column if needed
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Anyone can view farms" ON public.farms;
DROP POLICY IF EXISTS "Farmers can manage their own farms" ON public.farms;

-- Add rating column if it doesn't exist
ALTER TABLE public.farms 
ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0;

-- Add review_count column if it doesn't exist
ALTER TABLE public.farms 
ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- Create simple RLS policies for farms
CREATE POLICY "Anyone can view farms" 
ON public.farms 
FOR SELECT 
USING (true);

CREATE POLICY "Farmers can create farms" 
ON public.farms 
FOR INSERT 
WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update their own farms" 
ON public.farms 
FOR UPDATE 
USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can delete their own farms" 
ON public.farms 
FOR DELETE 
USING (auth.uid() = farmer_id);

-- Admin policies
CREATE POLICY "Admins can manage all farms" 
ON public.farms 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;