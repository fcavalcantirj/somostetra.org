-- Fix increment_supporters and decrement_supporters functions to include WHERE clauses
-- These were missed in script 028 and cause "UPDATE requires a WHERE clause" errors

CREATE OR REPLACE FUNCTION increment_supporters()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE platform_statistics SET total_supporters = total_supporters + 1 WHERE true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_supporters()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE platform_statistics SET total_supporters = greatest(0, total_supporters - 1) WHERE true;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
