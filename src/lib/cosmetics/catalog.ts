export interface CosmeticItem {
  id: string;
  label: string;
  price: number;
  category: "base" | "color" | "eyes" | "accessory" | "aura";
  /** Optional collection grouping for accessories */
  collection?: string;
}

// ── Bases ───────────────────────────────────────────────────────────────────
export const BASES: CosmeticItem[] = [
  { id: "droplet_01", label: "Classic", price: 0, category: "base" },
  { id: "droplet_02", label: "Blobby", price: 0, category: "base" },
  { id: "droplet_03", label: "Pointed", price: 120, category: "base" },
  { id: "droplet_04", label: "Ghost", price: 200, category: "base" },
  { id: "droplet_05", label: "Splat", price: 300, category: "base" },
];

// ── Colors ──────────────────────────────────────────────────────────────────
export interface ColorItem {
  id: string;
  hex: string;
  label: string;
  price: number;
  category: "color";
}

export const COLORS: ColorItem[] = [
  { id: "color_#1E293B", hex: "#1E293B", label: "Ink Black", price: 0, category: "color" },
  { id: "color_#3B82F6", hex: "#3B82F6", label: "Blue", price: 0, category: "color" },
  { id: "color_#8B5CF6", hex: "#8B5CF6", label: "Violet", price: 80, category: "color" },
  { id: "color_#EC4899", hex: "#EC4899", label: "Pink", price: 80, category: "color" },
  { id: "color_#EF4444", hex: "#EF4444", label: "Red", price: 80, category: "color" },
  { id: "color_#F97316", hex: "#F97316", label: "Orange", price: 80, category: "color" },
  { id: "color_#22C55E", hex: "#22C55E", label: "Green", price: 80, category: "color" },
  { id: "color_#06B6D4", hex: "#06B6D4", label: "Cyan", price: 80, category: "color" },
  { id: "color_#F8FAFC", hex: "#F8FAFC", label: "Ghost White", price: 250, category: "color" },
  // Rank rewards (price -1 = unlock via ranked only)
  { id: "color_#CD7F32", hex: "#CD7F32", label: "Bronze Ink", price: -1, category: "color" },
  { id: "color_#C0C0C0", hex: "#C0C0C0", label: "Silver Ink", price: -1, category: "color" },
  { id: "color_#D4AF37", hex: "#D4AF37", label: "Gold Ink", price: -1, category: "color" },
  { id: "color_#7DD3FC", hex: "#7DD3FC", label: "Platinum Ink", price: -1, category: "color" },
  { id: "color_#A78BFA", hex: "#A78BFA", label: "Diamond Ink", price: -1, category: "color" },
  { id: "color_#10B981", hex: "#10B981", label: "Emerald Ink", price: -1, category: "color" },
];

// ── Eyes ─────────────────────────────────────────────────────────────────────
export const EYES: CosmeticItem[] = [
  { id: "eyes_01", label: "Friendly", price: 0, category: "eyes" },
  { id: "eyes_02", label: "Determined", price: 60, category: "eyes" },
  { id: "eyes_03", label: "Happy", price: 60, category: "eyes" },
  { id: "eyes_04", label: "Cool", price: 100, category: "eyes" },
  { id: "eyes_05", label: "Sparkle", price: 150, category: "eyes" },
  { id: "eyes_06", label: "Wink", price: 100, category: "eyes" },
  { id: "eyes_07", label: "Dizzy", price: 120, category: "eyes" },
  { id: "eyes_08", label: "Sleepy", price: 90, category: "eyes" },
];

// ── Accessories ─────────────────────────────────────────────────────────────
// General (no collection)
const GENERAL_ACCESSORIES: CosmeticItem[] = [
  { id: "none", label: "None", price: 0, category: "accessory" },
  { id: "halo_01", label: "Halo", price: 500, category: "accessory" },
  { id: "horns_01", label: "Horns", price: 200, category: "accessory" },
  { id: "bow_01", label: "Bow", price: 150, category: "accessory" },
  { id: "scarf_01", label: "Scarf", price: 140, category: "accessory" },
  { id: "quill_01", label: "Quill", price: 180, category: "accessory" },
];

// Medieval Collection
const MEDIEVAL_ACCESSORIES: CosmeticItem[] = [
  { id: "crown_01", label: "Crown", price: 400, category: "accessory", collection: "medieval" },
  { id: "helmet_01", label: "Knight Helm", price: 280, category: "accessory", collection: "medieval" },
  { id: "sword_01", label: "Sword", price: 320, category: "accessory", collection: "medieval" },
  { id: "shield_01", label: "Shield", price: 300, category: "accessory", collection: "medieval" },
  { id: "axe_01", label: "Battle Axe", price: 350, category: "accessory", collection: "medieval" },
];

// Fancy Collection
const FANCY_ACCESSORIES: CosmeticItem[] = [
  { id: "tophat_01", label: "Top Hat", price: 250, category: "accessory", collection: "fancy" },
  { id: "monocle_01", label: "Monocle", price: 220, category: "accessory", collection: "fancy" },
  { id: "bowtie_01", label: "Bowtie", price: 180, category: "accessory", collection: "fancy" },
  { id: "cane_01", label: "Cane", price: 200, category: "accessory", collection: "fancy" },
  { id: "suit_01", label: "Tailored Suit", price: 320, category: "accessory", collection: "fancy" },
  { id: "glasses_01", label: "Glasses", price: 130, category: "accessory", collection: "fancy" },
];

// Track Collection
const TRACK_ACCESSORIES: CosmeticItem[] = [
  { id: "headband_01", label: "Headband", price: 100, category: "accessory", collection: "track" },
  { id: "sweatband_01", label: "Sweatband", price: 120, category: "accessory", collection: "track" },
  { id: "whistle_01", label: "Whistle", price: 160, category: "accessory", collection: "track" },
  { id: "medal_01", label: "Medal", price: 240, category: "accessory", collection: "track" },
  { id: "wizard_01", label: "Wizard Hat", price: 300, category: "accessory", collection: "track" },
];

export const ACCESSORIES: CosmeticItem[] = [
  ...GENERAL_ACCESSORIES,
  ...MEDIEVAL_ACCESSORIES,
  ...FANCY_ACCESSORIES,
  ...TRACK_ACCESSORIES,
];

export interface GearCollection {
  id: string;
  label: string;
  emoji: string;
  items: CosmeticItem[];
}

export const GEAR_COLLECTIONS: GearCollection[] = [
  { id: "general", label: "General", emoji: "🎒", items: GENERAL_ACCESSORIES },
  { id: "medieval", label: "Medieval", emoji: "⚔️", items: MEDIEVAL_ACCESSORIES },
  { id: "fancy", label: "Fancy", emoji: "🎩", items: FANCY_ACCESSORIES },
  { id: "track", label: "Track", emoji: "🏃", items: TRACK_ACCESSORIES },
];

// ── Auras ───────────────────────────────────────────────────────────────────
// Auras are NO LONGER directly purchasable — they drop from packs.
// price = -2 means "pack-only".
export const AURAS: CosmeticItem[] = [
  { id: "none", label: "None", price: 0, category: "aura" },
  { id: "aura_glow_01", label: "Soft Glow", price: -2, category: "aura" },
  { id: "aura_glow_02", label: "Sparkle", price: -2, category: "aura" },
  { id: "aura_glow_03", label: "Flame", price: -2, category: "aura" },
  { id: "aura_glow_04", label: "Pulse", price: -2, category: "aura" },
  { id: "aura_glow_05", label: "Frost", price: -2, category: "aura" },
];

export type AuraRarity = "common" | "uncommon" | "rare" | "legendary";

export interface AuraVariant {
  id: string;          // e.g. "aura_glow_01:#3B82F6"
  auraId: string;      // e.g. "aura_glow_01"
  color: string;       // hex
  colorLabel: string;  // e.g. "Blue"
  label: string;       // e.g. "Soft Glow (Blue)"
  rarity: AuraRarity;
}

export const AURA_COLORS: { hex: string; label: string }[] = [
  { hex: "#3B82F6", label: "Blue" },
  { hex: "#EF4444", label: "Red" },
  { hex: "#22C55E", label: "Green" },
  { hex: "#8B5CF6", label: "Purple" },
  { hex: "#EC4899", label: "Pink" },
  { hex: "#06B6D4", label: "Cyan" },
  { hex: "#EAB308", label: "Gold" },
  { hex: "#F8FAFC", label: "Prismatic" },
];

const AURA_RARITY_MAP: Record<string, AuraRarity> = {
  aura_glow_01: "common",
  aura_glow_02: "uncommon",
  aura_glow_03: "rare",
  aura_glow_04: "uncommon",
  aura_glow_05: "rare",
};

const LEGENDARY_COLORS = new Set(["#EAB308", "#F8FAFC"]);

function buildAuraVariants(): AuraVariant[] {
  const variants: AuraVariant[] = [];
  for (const aura of AURAS) {
    if (aura.id === "none") continue;
    for (const color of AURA_COLORS) {
      const baseRarity = AURA_RARITY_MAP[aura.id] ?? "common";
      const rarity: AuraRarity = LEGENDARY_COLORS.has(color.hex) ? "legendary" : baseRarity;
      variants.push({
        id: `${aura.id}:${color.hex}`,
        auraId: aura.id,
        color: color.hex,
        colorLabel: color.label,
        label: `${aura.label} (${color.label})`,
        rarity,
      });
    }
  }
  return variants;
}

export const AURA_VARIANTS: AuraVariant[] = buildAuraVariants();

export function getAuraVariant(id: string): AuraVariant | undefined {
  return AURA_VARIANTS.find((v) => v.id === id);
}

export function getOwnedAuraVariants(unlockedItems: string[]): AuraVariant[] {
  return AURA_VARIANTS.filter((v) => unlockedItems.includes(v.id));
}

/** Decode an aura variant ID into its shape and color. */
export function parseAuraVariantId(id: string): { auraId: string; color: string } | null {
  const idx = id.indexOf(":");
  if (idx === -1) return null;
  return { auraId: id.slice(0, idx), color: id.slice(idx + 1) };
}

// ── Aura Packs ──────────────────────────────────────────────────────────────
export interface AuraPack {
  id: string;
  label: string;
  price: number;
  description: string;
  /** Chance weights per rarity (will be normalized) */
  weights: Record<AuraRarity, number>;
  /** Visual accent color */
  accent: string;
}

export const AURA_PACKS: AuraPack[] = [
  {
    id: "pack_standard",
    label: "Standard Pack",
    price: 350,
    description: "A chance at any aura. Mostly commons.",
    weights: { common: 55, uncommon: 30, rare: 12, legendary: 3 },
    accent: "#3B82F6",
  },
  {
    id: "pack_premium",
    label: "Premium Pack",
    price: 750,
    description: "Better odds. Uncommon guaranteed or higher.",
    weights: { common: 0, uncommon: 50, rare: 35, legendary: 15 },
    accent: "#8B5CF6",
  },
  {
    id: "pack_ultimate",
    label: "Ultimate Pack",
    price: 1400,
    description: "Top-tier odds. Rare guaranteed or higher.",
    weights: { common: 0, uncommon: 0, rare: 55, legendary: 45 },
    accent: "#EAB308",
  },
];

export const RARITY_COLORS: Record<AuraRarity, string> = {
  common: "#94A3B8",
  uncommon: "#22C55E",
  rare: "#3B82F6",
  legendary: "#EAB308",
};

export const RARITY_LABELS: Record<AuraRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
};

/** Roll a random aura variant from a pack. */
export function rollAuraPack(pack: AuraPack): AuraVariant {
  const entries = Object.entries(pack.weights) as [AuraRarity, number][];
  const totalWeight = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * totalWeight;
  let selectedRarity: AuraRarity = "common";
  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      selectedRarity = rarity;
      break;
    }
  }
  const pool = AURA_VARIANTS.filter((v) => v.rarity === selectedRarity);
  if (pool.length === 0) {
    return AURA_VARIANTS[Math.floor(Math.random() * AURA_VARIANTS.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── All items flat list ─────────────────────────────────────────────────────
export const ALL_ITEMS: (CosmeticItem | ColorItem)[] = [
  ...BASES,
  ...COLORS,
  ...EYES,
  ...ACCESSORIES,
  ...AURAS,
];

export const FREE_ITEM_IDS: string[] = ALL_ITEMS
  .filter((item) => item.price === 0)
  .map((item) => item.id);

export function getItemById(id: string): (CosmeticItem | ColorItem) | undefined {
  return ALL_ITEMS.find((item) => item.id === id);
}

export function colorHexToId(hex: string): string {
  return `color_${hex}`;
}

export function colorIdToHex(id: string): string {
  return id.replace("color_", "");
}

/** Rank-exclusive cosmetic rewards. Price -1 = unlock via ranked only. */
export function isRankReward(item: CosmeticItem | ColorItem): boolean {
  return item.price === -1;
}

/** Pack-only items (auras). Price -2. */
export function isPackOnly(item: CosmeticItem | ColorItem): boolean {
  return item.price === -2;
}
