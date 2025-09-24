-- Add missing rating column to farms table
ALTER TABLE farms ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_farms_rating ON farms (rating DESC);
CREATE INDEX IF NOT EXISTS idx_farms_reviews_count ON farms (reviews_count DESC);

-- Update existing farms with sample ratings
UPDATE farms SET 
  rating = ROUND((3.5 + RANDOM() * 1.5)::DECIMAL, 1),  -- Random rating between 3.5 and 5.0
  reviews_count = FLOOR(RANDOM() * 100 + 10)::INTEGER  -- Random review count between 10 and 110
WHERE rating = 0.0 OR rating IS NULL;

-- Add constraints
ALTER TABLE farms 
ADD CONSTRAINT chk_rating CHECK (rating >= 0 AND rating <= 5.0),
ADD CONSTRAINT chk_reviews_count CHECK (reviews_count >= 0);

-- Create function to calculate farm rating from reviews
CREATE OR REPLACE FUNCTION update_farm_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the farm's rating and review count when reviews change
  UPDATE farms 
  SET 
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::DECIMAL, 1)
      FROM reviews 
      WHERE product_id IN (
        SELECT id FROM products WHERE farmer_id = (
          SELECT farmer_id FROM products WHERE id = NEW.product_id
        )
      )
    ), 0.0),
    reviews_count = COALESCE((
      SELECT COUNT(*)
      FROM reviews 
      WHERE product_id IN (
        SELECT id FROM products WHERE farmer_id = (
          SELECT farmer_id FROM products WHERE id = NEW.product_id
        )
      )
    ), 0)
  WHERE farmer_id = (
    SELECT farmer_id FROM products WHERE id = NEW.product_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update farm rating when reviews change
CREATE TRIGGER trigger_update_farm_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_farm_rating();