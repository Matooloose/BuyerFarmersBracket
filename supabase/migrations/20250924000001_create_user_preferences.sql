-- Create user preferences table for settings
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT '{
    "notifications": {
      "push": true,
      "email": true,
      "sms": false,
      "orderUpdates": true,
      "promotions": false,
      "newProducts": true,
      "priceDrops": true,
      "farmNews": false,
      "quietHours": {
        "enabled": false,
        "start": "22:00",
        "end": "08:00"
      }
    },
    "privacy": {
      "profileVisibility": "public",
      "showPurchaseHistory": false,
      "showReviews": true,
      "allowLocationTracking": true,
      "dataProcessing": true
    },
    "appearance": {
      "theme": "system",
      "language": "en",
      "region": "US",
      "currency": "USD",
      "dateFormat": "MM/DD/YYYY",
      "measurements": "metric"
    },
    "accessibility": {
      "highContrast": false,
      "largeText": false,
      "reduceMotion": false,
      "screenReader": false,
      "colorBlind": false
    },
    "communication": {
      "preferredContactMethod": "email",
      "marketingConsent": false,
      "surveyParticipation": true,
      "betaProgram": false
    }
  }'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create unique index to ensure one preference record per user
CREATE UNIQUE INDEX user_preferences_user_id_idx ON public.user_preferences(user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get user preferences with defaults
CREATE OR REPLACE FUNCTION public.get_user_preferences(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(preferences, '{
    "notifications": {
      "push": true,
      "email": true,
      "sms": false,
      "orderUpdates": true,
      "promotions": false,
      "newProducts": true,
      "priceDrops": true,
      "farmNews": false,
      "quietHours": {
        "enabled": false,
        "start": "22:00",
        "end": "08:00"
      }
    },
    "privacy": {
      "profileVisibility": "public",
      "showPurchaseHistory": false,
      "showReviews": true,
      "allowLocationTracking": true,
      "dataProcessing": true
    },
    "appearance": {
      "theme": "system",
      "language": "en",
      "region": "US",
      "currency": "USD",
      "dateFormat": "MM/DD/YYYY",
      "measurements": "metric"
    },
    "accessibility": {
      "highContrast": false,
      "largeText": false,
      "reduceMotion": false,
      "screenReader": false,
      "colorBlind": false
    },
    "communication": {
      "preferredContactMethod": "email",
      "marketingConsent": false,
      "surveyParticipation": true,
      "betaProgram": false
    }
  }'::jsonb)
  FROM public.user_preferences
  WHERE user_id = _user_id;
$$;