'use client'

import { useState } from 'react'
import { pvpApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Loader2, Trophy, Swords } from 'lucide-react'

export default function PvpPage() {
  const { refreshProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [matchResult, setMatchResult] = useState<any>(null)
  const [queueResult, setQueueResult] = useState<any>(null)

  const handleQueue = async () => {
    setLoading(true)
    try {
      const response = await pvpApi.queue()
      setQueueResult(response.data)
      if (response.data.status === 'matched') {
        toast.success('Match found!')
      } else {
        toast.info('Queued for matchmaking')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Queue failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitResult = async (result: string) => {
    try {
      const response = await pvpApi.submitResult(
        queueResult?.match_id || 'test',
        result
      )
      setMatchResult(response.data)
      await refreshProfile()
      toast.success('Match result submitted!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Submit failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">PvP Arena</h1>
        <p className="text-gray-300 mb-4">
          Battle other players! Each match costs <span className="text-green-500">5 stamina</span>.
        </p>

        <button
          onClick={handleQueue}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 py-3 rounded font-medium transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Finding match...
            </>
          ) : (
            <>
              <Swords className="w-5 h-5" />
              Queue for Match
            </>
          )}
        </button>
      </div>

      {queueResult && queueResult.status === 'matched' && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Match Found!</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-400">Opponent ID:</span>
              <span className="font-bold">{queueResult.opponent_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Your Rating:</span>
              <span className="text-cyan-400">{queueResult.your_rating}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Opponent Rating:</span>
              <span className="text-cyan-400">{queueResult.opponent_rating}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400 mb-2">Submit Match Result:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSubmitResult('A')}
                className="bg-green-600 hover:bg-green-700 py-2 rounded font-medium transition"
              >
                Victory
              </button>
              <button
                onClick={() => handleSubmitResult('B')}
                className="bg-red-600 hover:bg-red-700 py-2 rounded font-medium transition"
              >
                Defeat
              </button>
            </div>
          </div>
        </div>
      )}

      {queueResult && queueResult.status === 'queued' && (
        <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-6">
          <p className="text-yellow-200">
            Waiting for opponent... Queue position: {queueResult.queue_position}
          </p>
        </div>
      )}

      {matchResult && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Match Result</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded">
              <p className="text-sm text-gray-400 mb-2">You</p>
              <div className="space-y-1">
                <p className="text-xs">
                  Old Rating: <span className="font-bold">{matchResult.player_a.old_rating}</span>
                </p>
                <p className="text-xs">
                  New Rating: <span className="font-bold">{matchResult.player_a.new_rating}</span>
                </p>
                <p className={`font-bold ${matchResult.player_a.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {matchResult.player_a.delta >= 0 ? '+' : ''}{matchResult.player_a.delta}
                </p>
              </div>
            </div>

            <div className="bg-gray-900 p-4 rounded">
              <p className="text-sm text-gray-400 mb-2">Opponent</p>
              <div className="space-y-1">
                <p className="text-xs">
                  Old Rating: <span className="font-bold">{matchResult.player_b.old_rating}</span>
                </p>
                <p className="text-xs">
                  New Rating: <span className="font-bold">{matchResult.player_b.new_rating}</span>
                </p>
                <p className={`font-bold ${matchResult.player_b.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {matchResult.player_b.delta >= 0 ? '+' : ''}{matchResult.player_b.delta}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">PvP Info</h2>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• Uses Elo rating system (K-factor: 32)</li>
          <li>• Matchmaking finds opponents within ±200 rating</li>
          <li>• Win to increase your rating</li>
          <li>• Climb the leaderboard for rewards</li>
        </ul>
      </div>
    </div>
  )
}
