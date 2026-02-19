-- Enforce one-time level reward claiming at the database layer.
-- This prevents duplicate claims from stale/tampered clients.

CREATE OR REPLACE FUNCTION public.claim_level_reward(p_level integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_xp integer;
  v_ink_drops integer;
  v_unlocked_items text[];
  v_claimed integer[];
  v_current_level integer := 1;
  v_next_level integer := 2;
  v_reward_exists boolean := false;
  v_ink_reward integer := 0;
  v_cosmetic_item text := NULL;
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

  -- Level from XP using getXPForLevel(level) = 25 * level * (level - 1)
  WHILE (25 * v_next_level * (v_next_level - 1)) <= v_xp LOOP
    v_current_level := v_next_level;
    v_next_level := v_next_level + 1;
  END LOOP;

  IF p_level = ANY(v_claimed) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already claimed');
  END IF;

  IF v_current_level < p_level THEN
    RETURN jsonb_build_object('success', false, 'error', 'Level not reached');
  END IF;

  -- Match app reward table
  CASE p_level
    WHEN 2 THEN v_reward_exists := true; v_ink_reward := 10;
    WHEN 3 THEN v_reward_exists := true; v_ink_reward := 25;
    WHEN 5 THEN v_reward_exists := true; v_cosmetic_item := 'color_#8B5CF6';
    WHEN 7 THEN v_reward_exists := true; v_ink_reward := 50;
    WHEN 10 THEN v_reward_exists := true; v_cosmetic_item := 'droplet_03';
    WHEN 12 THEN v_reward_exists := true; v_ink_reward := 75;
    WHEN 15 THEN v_reward_exists := true; v_cosmetic_item := 'droplet_04';
    WHEN 18 THEN v_reward_exists := true; v_ink_reward := 100;
    WHEN 20 THEN v_reward_exists := true; -- title only
    WHEN 25 THEN v_reward_exists := true; v_cosmetic_item := 'droplet_05';
    WHEN 30 THEN v_reward_exists := true; v_ink_reward := 200;
    WHEN 40 THEN v_reward_exists := true; -- badge only
    WHEN 50 THEN v_reward_exists := true; v_ink_reward := 500;
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
    ink_drops = v_ink_drops,
    unlocked_items = v_unlocked_items,
    claimed_level_rewards = v_claimed,
    updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_level_reward(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_level_reward(integer) TO authenticated;
