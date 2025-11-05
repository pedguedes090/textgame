'use client'

import { useState } from 'react'
import { gachaApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Loader2, Sparkles, Star } from 'lucide-react'

export default function GachaPage() {
  const { refreshProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [clientSeed, setClientSeed] = useState('')

  const handlePull = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await gachaApi.pull('standard', clientSeed || undefined)
      setResult(response.data)
      await refreshProfile()
      toast.success(`Got ${response.data.rarity} item!`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gacha pull failed')
    } finally {
      setLoading(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      COMMON: 'from-gray-700 to-gray-800 border-gray-600',
      UNCOMMON: 'from-green-700 to-green-800 border-green-600',
      RARE: 'from-blue-700 to-blue-800 border-blue-600',
      EPIC: 'from-purple-700 to-purple-800 border-purple-600',
      LEGENDARY: 'from-yellow-700 to-yellow-800 border-yellow-600',
      MYTHIC: 'from-pink-700 to-pink-800 border-pink-600',
      ANCIENT: 'from-orange-700 to-orange-800 border-orange-600',
    }
    return colors[rarity] || colors.COMMON
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">Gacha System</h1>
        <p className="text-gray-300 mb-4">
          Summon powerful items! Each pull costs <span className="text-cyan-500">100 gems</span>.
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
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            onClick={handlePull}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 py-4 rounded font-bold transition flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Summoning...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Pull Gacha (100 💎)
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Summon Result</h2>
          
          <div className={`bg-gradient-to-r ${getRarityColor(result.rarity)} border-2 rounded-lg p-6 mb-4`}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star className="w-8 h-8 text-yellow-300" />
              <h3 className="text-3xl font-bold">{result.rarity}</h3>
              <Star className="w-8 h-8 text-yellow-300" />
            </div>
            <p className="text-center text-xl">Item ID: {result.item_id}</p>
            {result.hit_pity && (
              <div className="mt-4 bg-yellow-900/50 border border-yellow-700 rounded p-3 text-center">
                <p className="text-yellow-200 font-bold">🎉 PITY ACTIVATED!</p>
              </div>
            )}
          </div>

          <div className="bg-gray-900 p-4 rounded space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Pity Counter After:</span>
              <span className="font-bold">{result.pity_counter_after} / 50</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${(result.pity_counter_after / 50) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">
              Next guaranteed legendary+ in {50 - result.pity_counter_after} pulls
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded mt-4">
            <p className="text-xs text-gray-400 mb-2">Odds Information:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Adjusted Legendary+: {result.odds.adjusted_legendary_plus.toFixed(2)}%</div>
            </div>
          </div>

          <div className="bg-gray-900 p-4 rounded mt-4 text-xs">
            <p className="text-gray-400 mb-1">Provably Fair Data:</p>
            <p className="text-gray-500 break-all">Seed Commit: {result.seed_commit}</p>
            <p className="text-gray-500 break-all">Server Seed: {result.server_seed_reveal}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Drop Rates</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Common:</span><span>55%</span></div>
          <div className="flex justify-between"><span className="text-green-400">Uncommon:</span><span>25%</span></div>
          <div className="flex justify-between"><span className="text-blue-400">Rare:</span><span>12%</span></div>
          <div className="flex justify-between"><span className="text-purple-400">Epic:</span><span>6%</span></div>
          <div className="flex justify-between"><span className="text-yellow-400">Legendary:</span><span>2%</span></div>
          <div className="flex justify-between"><span className="text-pink-400">Mythic:</span><span>0.8%</span></div>
          <div className="flex justify-between"><span className="text-orange-400">Ancient:</span><span>0.2%</span></div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-300">
            <strong>Pity System:</strong> After 50 pulls without a Legendary or higher, your odds increase by +0.3% per pull.
          </p>
        </div>
      </div>
    </div>
  )
}
