import { ACCESSORIES, AURAS, BASES, EYES } from '@/lib/cosmetics/catalog';
import { DEFAULT_AVATAR_CONFIG, type InkAvatarConfig } from '@/types';

const VALID_BASES = new Set(BASES.map((item) => item.id));
const VALID_EYES = new Set(EYES.map((item) => item.id));
const VALID_ACCESSORIES = new Set(ACCESSORIES.map((item) => item.id));
const VALID_AURAS = new Set(AURAS.map((item) => item.id));
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export interface StoryAvatarConfig extends InkAvatarConfig {
  accessory2: string;
}

export interface AvatarBodyOffsets {
  eyesY: number;
  accessoryY: number;
  accessoryScale: number;
}

export const AVATAR_BODY_OFFSETS: Record<string, AvatarBodyOffsets> = {
  droplet_01: { eyesY: 0, accessoryY: 0, accessoryScale: 1 },
  droplet_02: { eyesY: -4, accessoryY: -5, accessoryScale: 1.08 },
  droplet_03: { eyesY: -1, accessoryY: -3, accessoryScale: 0.95 },
  droplet_04: { eyesY: -5, accessoryY: -7, accessoryScale: 1.02 },
  droplet_05: { eyesY: -3, accessoryY: -4, accessoryScale: 1.05 },
};

/**
 * Profiles are persisted client-side, so validate cosmetic IDs before turning
 * them into asset URLs. Invalid or stale values gracefully use the defaults.
 */
export function normalizeStoryAvatar(config?: Partial<InkAvatarConfig>): StoryAvatarConfig {
  const merged = { ...DEFAULT_AVATAR_CONFIG, ...config };
  const color = HEX_COLOR.test(merged.color) ? merged.color : DEFAULT_AVATAR_CONFIG.color;

  return {
    base: VALID_BASES.has(merged.base) ? merged.base : DEFAULT_AVATAR_CONFIG.base,
    color,
    eyes: VALID_EYES.has(merged.eyes) ? merged.eyes : DEFAULT_AVATAR_CONFIG.eyes,
    accessory: VALID_ACCESSORIES.has(merged.accessory)
      ? merged.accessory
      : DEFAULT_AVATAR_CONFIG.accessory,
    accessory2: VALID_ACCESSORIES.has(merged.accessory2 ?? 'none')
      ? merged.accessory2 ?? 'none'
      : 'none',
    aura: VALID_AURAS.has(merged.aura) ? merged.aura : DEFAULT_AVATAR_CONFIG.aura,
    aura_color: HEX_COLOR.test(merged.aura_color ?? '') ? merged.aura_color : color,
  };
}

export function hexToNumber(hex: string): number {
  return Number.parseInt(hex.slice(1), 16);
}
