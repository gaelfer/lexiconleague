export interface CosmeticItem {
  id: string;
  label: string;
  price: number;
  category: "base" | "color" | "eyes" | "accessory" | "aura";
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
export const ACCESSORIES: CosmeticItem[] = [
  { id: "none", label: "None", price: 0, category: "accessory" },
  { id: "crown_01", label: "Crown", price: 400, category: "accessory" },
  { id: "wizard_01", label: "Wizard Hat", price: 300, category: "accessory" },
  { id: "tophat_01", label: "Top Hat", price: 250, category: "accessory" },
  { id: "bow_01", label: "Bow", price: 150, category: "accessory" },
  { id: "headband_01", label: "Headband", price: 100, category: "accessory" },
  { id: "halo_01", label: "Halo", price: 500, category: "accessory" },
  { id: "horns_01", label: "Horns", price: 200, category: "accessory" },
  { id: "glasses_01", label: "Glasses", price: 130, category: "accessory" },
  { id: "monocle_01", label: "Monocle", price: 220, category: "accessory" },
  { id: "quill_01", label: "Quill", price: 180, category: "accessory" },
  { id: "scarf_01", label: "Scarf", price: 140, category: "accessory" },
];

// ── Auras ───────────────────────────────────────────────────────────────────
export const AURAS: CosmeticItem[] = [
  { id: "none", label: "None", price: 0, category: "aura" },
  { id: "aura_glow_01", label: "Soft Glow", price: 200, category: "aura" },
  { id: "aura_glow_02", label: "Sparkle", price: 300, category: "aura" },
  { id: "aura_glow_03", label: "Flame", price: 450, category: "aura" },
];

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
  return item.price < 0;
}
