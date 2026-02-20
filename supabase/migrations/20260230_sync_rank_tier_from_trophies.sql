-- Keep rank_tier in sync with trophies. Trophies is the source of truth.
-- Matches app RANK_THRESHOLDS: Bronze 0, Silver 100, Gold 350, Platinum 1000, Diamond 1500, Emerald 2500

CREATE OR REPLACE FUNCTION public.get_tier_from_trophies(trophies integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF trophies IS NULL OR trophies < 0 THEN
    RETURN 'Bronze';
  ELSIF trophies >= 2500 THEN
    RETURN 'Emerald';
  ELSIF trophies >= 1500 THEN
    RETURN 'Diamond';
  ELSIF trophies >= 1000 THEN
    RETURN 'Platinum';
  ELSIF trophies >= 350 THEN
    RETURN 'Gold';
  ELSIF trophies >= 100 THEN
    RETURN 'Silver';
  ELSE
    RETURN 'Bronze';
  END IF;
END;
$$;

-- Trigger: auto-set rank_tier whenever trophies changes (INSERT or UPDATE)
CREATE OR REPLACE FUNCTION public.sync_rank_tier_from_trophies()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.rank_tier := public.get_tier_from_trophies(COALESCE(NEW.trophies, 0));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_rank_tier_trigger ON public.profiles;
CREATE TRIGGER sync_rank_tier_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_rank_tier_from_trophies();

-- Fix existing rows where rank_tier is out of sync with trophies
UPDATE public.profiles
SET rank_tier = public.get_tier_from_trophies(COALESCE(trophies, 0))
WHERE rank_tier IS DISTINCT FROM public.get_tier_from_trophies(COALESCE(trophies, 0));
