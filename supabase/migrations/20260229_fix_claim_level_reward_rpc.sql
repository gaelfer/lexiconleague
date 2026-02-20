-- Update claim_level_reward RPC to match the current LEVEL_REWARDS table in levels.ts.
-- The previous version (20260226_enforce_level_reward_once.sql) had the old reward table
-- hardcoded. This replaces it with the correct mapping.

CREATE OR REPLACE FUNCTION public.claim_level_reward(p_level integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        uuid    := auth.uid();
  v_xp             integer;
  v_ink_drops      integer;
  v_unlocked_items text[];
  v_claimed        integer[];
  v_current_level  integer := 1;
  v_next_level     integer := 2;
  v_reward_exists  boolean := false;
  v_ink_reward     integer := 0;
  v_cosmetic_item  text    := NULL;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT
    COALESCE(xp, 0),
    COALESCE(ink_drops, 0),
    COALESCE(unlocked_items, ARRAY[]::text[]),
    COALESCE(claimed_level_rewards, ARRAY[]::integer[])
  INTO v_xp, v_ink_drops, v_unlocked_items, v_claimed
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Compute current level from XP: getXPForLevel(n) = 25 * n * (n - 1)
  WHILE (25 * v_next_level * (v_next_level - 1)) <= v_xp LOOP
    v_current_level := v_next_level;
    v_next_level    := v_next_level + 1;
  END LOOP;

  IF p_level = ANY(v_claimed) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already claimed');
  END IF;

  IF v_current_level < p_level THEN
    RETURN jsonb_build_object('success', false, 'error', 'Level not reached');
  END IF;

  -- Matches src/lib/user/levels.ts LEVEL_REWARDS array exactly
  CASE p_level
    WHEN 2  THEN v_reward_exists := true; v_ink_reward := 10;
    WHEN 3  THEN v_reward_exists := true; v_ink_reward := 25;
    WHEN 4  THEN v_reward_exists := true; v_ink_reward := 50;
    WHEN 5  THEN v_reward_exists := true; v_cosmetic_item := 'color_#FB7185';  -- Rose Ink
    WHEN 6  THEN v_reward_exists := true; v_ink_reward := 75;
    WHEN 7  THEN v_reward_exists := true; v_ink_reward := 100;
    WHEN 8  THEN v_reward_exists := true; v_cosmetic_item := 'color_#84CC16';  -- Lime Ink
    WHEN 9  THEN v_reward_exists := true; v_ink_reward := 150;
    WHEN 10 THEN v_reward_exists := true; v_cosmetic_item := 'aura_glow_01:#FB7185'; -- Soft Glow (Rose)
    WHEN 11 THEN v_reward_exists := true; v_ink_reward := 200;
    WHEN 12 THEN v_reward_exists := true; v_cosmetic_item := 'color_#0EA5E9';  -- Sky Ink
    WHEN 13 THEN v_reward_exists := true; v_ink_reward := 300;
    WHEN 14 THEN v_reward_exists := true; v_cosmetic_item := 'aura_glow_02:#FB7185'; -- Sparkle (Rose)
    WHEN 15 THEN v_reward_exists := true; v_ink_reward := 450;
    WHEN 17 THEN v_reward_exists := true; v_cosmetic_item := 'aura_glow_03:#0EA5E9'; -- Flame (Sky)
    WHEN 18 THEN v_reward_exists := true; v_ink_reward := 500;
    WHEN 20 THEN v_reward_exists := true; -- Word Warrior title (no item)
    WHEN 22 THEN v_reward_exists := true; v_cosmetic_item := 'color_#6366F1';  -- Indigo Ink
    WHEN 24 THEN v_reward_exists := true; v_ink_reward := 600;
    WHEN 25 THEN v_reward_exists := true; v_cosmetic_item := 'aura_glow_04:#84CC16'; -- Pulse (Lime)
    WHEN 27 THEN v_reward_exists := true; v_ink_reward := 750;
    WHEN 30 THEN v_reward_exists := true; v_cosmetic_item := 'aura_glow_05:#6366F1'; -- Frost (Indigo)
    WHEN 33 THEN v_reward_exists := true; v_ink_reward := 1000;
    WHEN 37 THEN v_reward_exists := true; v_ink_reward := 1250;
    WHEN 40 THEN v_reward_exists := true; -- Lexicon Legend badge (no item)
    WHEN 45 THEN v_reward_exists := true; v_ink_reward := 1500;
    WHEN 50 THEN v_reward_exists := true; v_ink_reward := 2000;
    ELSE v_reward_exists := false;
  END CASE;

  IF NOT v_reward_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unknown reward');
  END IF;

  IF v_ink_reward > 0 THEN
    v_ink_drops := v_ink_drops + v_ink_reward;
  END IF;

  IF v_cosmetic_item IS NOT NULL AND NOT (v_cosmetic_item = ANY(v_unlocked_items)) THEN
    v_unlocked_items := array_append(v_unlocked_items, v_cosmetic_item);
  END IF;

  v_claimed := array_append(v_claimed, p_level);

  UPDATE public.profiles
  SET
    ink_drops            = v_ink_drops,
    unlocked_items       = v_unlocked_items,
    claimed_level_rewards = v_claimed,
    updated_at           = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_level_reward(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_level_reward(integer) TO authenticated;
