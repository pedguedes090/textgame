import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getRarityColor = (rarity: string): string => {
  const colors: Record<string, string> = {
    COMMON: 'text-gray-400',
    UNCOMMON: 'text-green-400',
    RARE: 'text-blue-400',
    EPIC: 'text-purple-400',
    LEGENDARY: 'text-yellow-400',
    MYTHIC: 'text-pink-400',
    ANCIENT: 'text-orange-400',
  }
  return colors[rarity] || colors.COMMON
}

export const getElementEmoji = (element: string): string => {
  const emojis: Record<string, string> = {
    FIRE: '🔥',
    WATER: '💧',
    WOOD: '🌿',
    LIGHT: '✨',
    DARK: '🌙',
    NEUTRAL: '⚪',
  }
  return emojis[element] || '⚪'
}
