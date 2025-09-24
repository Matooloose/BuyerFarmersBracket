-- Add latitude and longitude columns to farms table
ALTER TABLE farms 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN farm_size VARCHAR(50);

-- Add some sample coordinates for existing farms (Cape Town area)
-- You can update these with actual farm coordinates later
UPDATE farms SET 
  latitude = -33.9249 + (RANDOM() * 0.5 - 0.25),  -- Cape Town area with some variation
  longitude = 18.4241 + (RANDOM() * 0.5 - 0.25),  -- Cape Town area with some variation
  farm_size = CASE 
    WHEN RANDOM() < 0.3 THEN 'Small (1-5 hectares)'
    WHEN RANDOM() < 0.7 THEN 'Medium (5-20 hectares)'
    ELSE 'Large (20+ hectares)'
  END
WHERE latitude IS NULL;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_farms_location ON farms (latitude, longitude);

-- Add constraint to ensure valid coordinates
ALTER TABLE farms 
ADD CONSTRAINT chk_latitude CHECK (latitude >= -90 AND latitude <= 90),
ADD CONSTRAINT chk_longitude CHECK (longitude >= -180 AND longitude <= 180);