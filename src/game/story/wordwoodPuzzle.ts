export const WORDS = ['hollow', 'sturdy', 'winding'] as const;
export type Word = typeof WORDS[number];
export const CLUES = [
  'Surveyor’s note: The trail twists around the oldest trees. Its word describes a route that bends.',
  'Bridge keeper: My crossing must bear a loaded cart. A word meaning empty inside would be a dangerous choice.',
  'Burrow sketch: The tunnel’s word is not the one meaning strong and well-built. Each word belongs to exactly one sign.',
] as const;
export function checkWordwood(words: readonly Word[]): string | null {
  if (new Set(words).size !== 3) return 'Each word belongs to one sign. You have used a word twice; compare all three signs.';
  if (words[2] !== 'winding') return 'The trail still cuts straight into the trees. Which word describes a route that bends?';
  if (words[0] !== 'sturdy') return 'The bridge creaks beneath the keeper’s cart. It needs a word that promises strength.';
  if (words[1] !== 'hollow') return 'The burrow has no room inside. Think about the space a tunnel needs.';
  return null;
}
