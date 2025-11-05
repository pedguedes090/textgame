'use client'

import { useState } from 'react'
import { huntApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Loader2, Sparkles } from 'lucide-react'

export default function HuntPage() {
  const { refreshProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [clientSeed, setClientSeed] = useState('')

  const handleHunt = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await huntApi.start(clientSeed || undefined)
      setResult(response.data)
      await refreshProfile()
      if (response.data.success) {
        toast.success(`Caught ${response.data.creature_caught.species_name}!`)
      } else {
        toast('No creature encountered')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Hunt failed')
    } finally {
      setLoading(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      COMMON: 'text-gray-400',
      UNCOMMON: 'text-green-400',
      RARE: 'text-blue-400',
      EPIC: 'text-purple-400',
      LEGENDARY: 'text-yellow-400',
      MYTHIC: 'text-pink-400',
      ANCIENT: 'text-orange-400',
    }
    return colors[rarity] || 'text-gray-400'
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">Hunt Creatures</h1>
        <p className="text-gray-300 mb-4">
          Hunt wild creatures in the wilderness. Each hunt costs <span className="text-green-500">10 stamina</span>.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Client Seed (Optional - for provably fair RNG)
            </label>
            <input
              type="text"
              value={clientSeed}
              onChange={(e) => setClientSeed(e.target.value)}
              placeholder="Leave empty for random"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:border-green-500"
            />
          </div>

          <button
            onClick={handleHunt}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-3 rounded font-medium transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Hunting...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Start Hunt
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Hunt Result</h2>
          
          {result.success ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 border border-green-700 rounded p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-6 h-6 text-green-400" />
                  <h3 className="text-xl font-bold">Creature Caught!</h3>
                </div>
                <div className="space-y-2">
                  <p className={`text-lg font-bold ${getRarityColor(result.creature_caught.rarity)}`}>
                    {result.creature_caught.species_name}
                  </p>
                  <p className="text-sm text-gray-300">
                    Rarity: <span className={getRarityColor(result.creature_caught.rarity)}>
                      {result.creature_caught.rarity}
                    </span>
                  </p>
                  <p className="text-sm text-gray-300">
                    Power Score: <span className="text-cyan-400">{result.creature_caught.power_score}</span>
                  </p>
                  <div className="mt-2 bg-gray-900 p-3 rounded">
                    <p className="text-xs text-gray-400 mb-1">IV Rolls:</p>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>HP: {result.creature_caught.iv_rolls.hp}</div>
                      <div>ATK: {result.creature_caught.iv_rolls.atk}</div>
                      <div>DEF: {result.creature_caught.iv_rolls.def}</div>
                      <div>SPD: {result.creature_caught.iv_rolls.spd}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded text-xs">
                <p className="text-gray-400 mb-1">Provably Fair Data:</p>
                <p className="text-gray-500 break-all">Seed Commit: {result.seed_commit}</p>
                <p className="text-gray-500 break-all">Server Seed: {result.server_seed_reveal}</p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-900/50 border border-yellow-700 rounded p-4">
              <p className="text-yellow-200">{result.message}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Hunt Info</h2>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• 70% chance to encounter a creature</li>
          <li>• Random species from the available pool</li>
          <li>• Each creature has unique IV rolls (0-31 per stat)</li>
          <li>• Higher IVs = stronger creature</li>
          <li>• Provably fair RNG - you can verify results</li>
        </ul>
      </div>
    </div>
  )
}
