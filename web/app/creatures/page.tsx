'use client'

import { useState, useEffect } from 'react'
import { creatureApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { Loader2, TrendingUp, Star } from 'lucide-react'

interface Creature {
  id: number
  species: {
    name: string
    rarity: string
    element: string
  }
  level: number
  exp: number
  power_score: number
  iv_rolls: any
}

export default function CreaturesPage() {
  const [creatures, setCreatures] = useState<Creature[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null)

  useEffect(() => {
    loadCreatures()
  }, [])

  const loadCreatures = async () => {
    try {
      const response = await creatureApi.list()
      setCreatures(response.data)
    } catch (error) {
      toast.error('Failed to load creatures')
    } finally {
      setLoading(false)
    }
  }

  const handleLevelUp = async (id: number) => {
    try {
      await creatureApi.levelUp(id)
      toast.success('Creature leveled up!')
      loadCreatures()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Level up failed')
    }
  }

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      COMMON: 'text-gray-400 bg-gray-900',
      UNCOMMON: 'text-green-400 bg-green-900/30',
      RARE: 'text-blue-400 bg-blue-900/30',
      EPIC: 'text-purple-400 bg-purple-900/30',
      LEGENDARY: 'text-yellow-400 bg-yellow-900/30',
      MYTHIC: 'text-pink-400 bg-pink-900/30',
      ANCIENT: 'text-orange-400 bg-orange-900/30',
    }
    return colors[rarity] || colors.COMMON
  }

  const getElementEmoji = (element: string) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">My Creatures</h1>
        <p className="text-gray-400">Total: {creatures.length} creatures</p>
      </div>

      {creatures.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-400 text-lg">No creatures yet. Go hunting!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creatures.map((creature) => (
            <div
              key={creature.id}
              className={`${getRarityColor(creature.species.rarity)} border border-gray-700 rounded-lg p-4 hover:border-cyan-500 transition cursor-pointer`}
              onClick={() => setSelectedCreature(creature)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg">{creature.species.name}</h3>
                  <p className="text-sm opacity-80">{creature.species.rarity}</p>
                </div>
                <span className="text-2xl">{getElementEmoji(creature.species.element)}</span>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Level:</span>
                  <span className="font-bold">{creature.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Power:</span>
                  <span className="font-bold text-cyan-400">{creature.power_score}</span>
                </div>
              </div>

              {creature.iv_rolls && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">IVs:</p>
                  <div className="grid grid-cols-4 gap-1 text-xs">
                    <div>HP: {JSON.parse(creature.iv_rolls).hp}</div>
                    <div>ATK: {JSON.parse(creature.iv_rolls).atk}</div>
                    <div>DEF: {JSON.parse(creature.iv_rolls).def}</div>
                    <div>SPD: {JSON.parse(creature.iv_rolls).spd}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedCreature && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedCreature(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">{selectedCreature.species.name}</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Rarity:</span>
                <span className={getRarityColor(selectedCreature.species.rarity).split(' ')[0]}>
                  {selectedCreature.species.rarity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Element:</span>
                <span>{getElementEmoji(selectedCreature.species.element)} {selectedCreature.species.element}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Level:</span>
                <span className="font-bold">{selectedCreature.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">EXP:</span>
                <span>{selectedCreature.exp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Power Score:</span>
                <span className="font-bold text-cyan-400">{selectedCreature.power_score}</span>
              </div>
            </div>

            {selectedCreature.iv_rolls && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Individual Values (IVs):</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-900 p-2 rounded">
                    <span className="text-gray-400 text-sm">HP:</span>{' '}
                    <span className="font-bold">{JSON.parse(selectedCreature.iv_rolls).hp}/31</span>
                  </div>
                  <div className="bg-gray-900 p-2 rounded">
                    <span className="text-gray-400 text-sm">ATK:</span>{' '}
                    <span className="font-bold">{JSON.parse(selectedCreature.iv_rolls).atk}/31</span>
                  </div>
                  <div className="bg-gray-900 p-2 rounded">
                    <span className="text-gray-400 text-sm">DEF:</span>{' '}
                    <span className="font-bold">{JSON.parse(selectedCreature.iv_rolls).def}/31</span>
                  </div>
                  <div className="bg-gray-900 p-2 rounded">
                    <span className="text-gray-400 text-sm">SPD:</span>{' '}
                    <span className="font-bold">{JSON.parse(selectedCreature.iv_rolls).spd}/31</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => handleLevelUp(selectedCreature.id)}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 py-2 rounded font-medium transition flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Level Up
              </button>
              <button
                onClick={() => setSelectedCreature(null)}
                className="px-6 bg-gray-700 hover:bg-gray-600 py-2 rounded font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
