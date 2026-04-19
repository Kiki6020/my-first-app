export const KATEGORIEN = [
  { id: 'Tiere',    emoji: '🐘', label: 'Tiere' },
  { id: 'Pflanzen', emoji: '🌿', label: 'Pflanzen' },
  { id: 'Körper',   emoji: '🫀', label: 'Körper' },
  { id: 'Welt',     emoji: '🌍', label: 'Welt' },
  { id: 'Weltraum', emoji: '🚀', label: 'Weltraum' },
  { id: 'MINT',     emoji: '🔬', label: 'MINT' },
  { id: 'Kultur',   emoji: '🎨', label: 'Kultur' },
  { id: 'Essen',    emoji: '🍎', label: 'Essen' },
] as const

export type KategorieId = typeof KATEGORIEN[number]['id']

export const ALLE_KATEGORIEN = { id: 'alle', emoji: '🌈', label: 'Alle Kategorien' } as const

export function getKategorie(id: string) {
  return KATEGORIEN.find((k) => k.id === id)
}

export function getKategorieEmoji(id: string): string {
  if (id === 'alle') return ALLE_KATEGORIEN.emoji
  return getKategorie(id)?.emoji ?? '❓'
}

export function getKategorieLabel(id: string): string {
  if (id === 'alle') return ALLE_KATEGORIEN.label
  return getKategorie(id)?.label ?? id
}
