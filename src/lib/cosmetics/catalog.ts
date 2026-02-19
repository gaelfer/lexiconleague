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
  { id: "droplet_03", label: "Pointed", price: 50, category: "base" },
  { id: "droplet_04", label: "Ghost", price: 80, category: "base" },
  { id: "droplet_05", label: "Splat", price: 120, category: "base" },
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
  { id: "color_#8B5CF6", hex: "#8B5CF6", label: "Violet", price: 30, category: "color" },
  { id: "color_#EC4899", hex: "#EC4899", label: "Pink", price: 30, category: "color" },
  { id: "color_#EF4444", hex: "#EF4444", label: "Red", price: 30, category: "color" },
  { id: "color_#F97316", hex: "#F97316", label: "Orange", price: 30, category: "color" },
  { id: "color_#EAB308", hex: "#EAB308", label: "Gold", price: 60, category: "color" },
  { id: "color_#22C55E", hex: "#22C55E", label: "Green", price: 30, category: "color" },
  { id: "color_#06B6D4", hex: "#06B6D4", label: "Cyan", price: 30, category: "color" },
  { id: "color_#F8FAFC", hex: "#F8FAFC", label: "Ghost White", price: 100, category: "color" },
];

// ── Eyes ─────────────────────────────────────────────────────────────────────
export const EYES: CosmeticItem[] = [
  { id: "eyes_01", label: "Friendly", price: 0, category: "eyes" },
  { id: "eyes_02", label: "Determined", price: 25, category: "eyes" },
  { id: "eyes_03", label: "Happy", price: 25, category: "eyes" },
  { id: "eyes_04", label: "Cool", price: 40, category: "eyes" },
  { id: "eyes_05", label: "Sparkle", price: 60, category: "eyes" },
  { id: "eyes_06", label: "Wink", price: 40, category: "eyes" },
  { id: "eyes_07", label: "Dizzy", price: 50, category: "eyes" },
  { id: "eyes_08", label: "Sleepy", price: 35, category: "eyes" },
];

// ── Accessories ─────────────────────────────────────────────────────────────
export const ACCESSORIES: CosmeticItem[] = [
  { id: "none", label: "None", price: 0, category: "accessory" },
  { id: "crown_01", label: "Crown", price: 150, category: "accessory" },
  { id: "wizard_01", label: "Wizard Hat", price: 120, category: "accessory" },
  { id: "tophat_01", label: "Top Hat", price: 100, category: "accessory" },
  { id: "bow_01", label: "Bow", price: 60, category: "accessory" },
  { id: "headband_01", label: "Headband", price: 40, category: "accessory" },
  { id: "halo_01", label: "Halo", price: 200, category: "accessory" },
  { id: "horns_01", label: "Horns", price: 80, category: "accessory" },
  { id: "glasses_01", label: "Glasses", price: 50, category: "accessory" },
  { id: "monocle_01", label: "Monocle", price: 90, category: "accessory" },
  { id: "quill_01", label: "Quill", price: 70, category: "accessory" },
  { id: "scarf_01", label: "Scarf", price: 55, category: "accessory" },
];

// ── Auras ───────────────────────────────────────────────────────────────────
export const AURAS: CosmeticItem[] = [
  { id: "none", label: "None", price: 0, category: "aura" },
  { id: "aura_glow_01", label: "Soft Glow", price: 80, category: "aura" },
  { id: "aura_glow_02", label: "Sparkle", price: 120, category: "aura" },
  { id: "aura_glow_03", label: "Flame", price: 180, category: "aura" },
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
