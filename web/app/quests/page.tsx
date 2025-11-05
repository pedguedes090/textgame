'use client'

import { useState, useEffect } from 'react'
import { questApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Loader2, Gift, Check } from 'lucide-react'

export default function QuestsPage() {
  const { refreshProfile } = useAuthStore()
  const [quests, setQuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuests()
  }, [])

  const loadQuests = async () => {
    try {
      const response = await questApi.list()
      setQuests(response.data)
    } catch (error) {
      toast.error('Failed to load quests')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async (questId: number) => {
    try {
      await questApi.claim(questId)
      toast.success('Rewards claimed!')
      await refreshProfile()
      loadQuests()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Claim failed')
    }
  }

  const getQuestTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      DAILY: 'bg-blue-900/30 border-blue-700',
      WEEKLY: 'bg-purple-900/30 border-purple-700',
      STORY: 'bg-green-900/30 border-green-700',
      ACHIEVEMENT: 'bg-yellow-900/30 border-yellow-700',
    }
    return colors[type] || colors.DAILY
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
        <h1 className="text-3xl font-bold mb-2">Quests</h1>
        <p className="text-gray-400">Complete quests to earn rewards!</p>
      </div>

      <div className="space-y-4">
        {quests.map((quest: any) => (
          <div
            key={quest.id}
            className={`${getQuestTypeColor(quest.type)} border rounded-lg p-6`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">{quest.name}</h2>
                  <span className="text-xs bg-gray-900 px-2 py-1 rounded">{quest.type}</span>
                </div>
                <p className="text-sm text-gray-300">{quest.description}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Progress</span>
                <span className="font-bold">
                  {quest.current_progress || 0} / {quest.target_count}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      ((quest.current_progress || 0) / quest.target_count) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-400">Rewards: </span>
                {quest.rewards && (
                  <span className="text-yellow-400">
                    {JSON.parse(quest.rewards).gold && `${JSON.parse(quest.rewards).gold} 💰`}
                    {JSON.parse(quest.rewards).gems && ` ${JSON.parse(quest.rewards).gems} 💎`}
                  </span>
                )}
              </div>

              {quest.current_progress >= quest.target_count && !quest.claimed ? (
                <button
                  onClick={() => handleClaim(quest.id)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium transition"
                >
                  <Gift className="w-4 h-4" />
                  Claim
                </button>
              ) : quest.claimed ? (
                <div className="flex items-center gap-2 text-green-400">
                  <Check className="w-4 h-4" />
                  Claimed
                </div>
              ) : (
                <div className="text-sm text-gray-500">In Progress</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {quests.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-400 text-lg">No quests available</p>
        </div>
      )}
    </div>
  )
}
