interface RarityBadgeProps {
  rarity: string
  className?: string
}

export default function RarityBadge({ rarity, className = '' }: RarityBadgeProps) {
  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      COMMON: 'bg-gray-700 text-gray-300 border-gray-600',
      UNCOMMON: 'bg-green-900/50 text-green-300 border-green-700',
      RARE: 'bg-blue-900/50 text-blue-300 border-blue-700',
      EPIC: 'bg-purple-900/50 text-purple-300 border-purple-700',
      LEGENDARY: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
      MYTHIC: 'bg-pink-900/50 text-pink-300 border-pink-700',
      ANCIENT: 'bg-orange-900/50 text-orange-300 border-orange-700',
    }
    return colors[rarity] || colors.COMMON
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${getRarityColor(
        rarity
      )} ${className}`}
    >
      {rarity}
    </span>
  )
}
