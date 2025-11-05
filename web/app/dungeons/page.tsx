'use client'

import { useState, useEffect } from 'react'
import { dungeonApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Loader2, Zap } from 'lucide-react'

export default function DungeonsPage() {
  const { refreshProfile } = useAuthStore()
  const [dungeons, setDungeons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDungeons()
  }, [])

  const loadDungeons = async () => {
    try {
      const response = await dungeonApi.list()
      setDungeons(response.data)
    } catch (error) {
      toast.error('Failed to load dungeons')
    } finally {
      setLoading(false)
    }
  }

  const handleEnter = async (dungeonId: number) => {
    try {
      const response = await dungeonApi.enter(dungeonId, 1) // Using party ID 1
      toast.success('Dungeon cleared!')
      await refreshProfile()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Dungeon failed')
    }
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
        <h1 className="text-3xl font-bold mb-4">Dungeons</h1>
        <p className="text-gray-300">
          Challenge dungeons to earn valuable loot and experience!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dungeons.map((dungeon: any) => (
          <div key={dungeon.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{dungeon.name}</h2>
                <p className="text-sm text-gray-400">{dungeon.description}</p>
              </div>
              <Zap className="w-6 h-6 text-red-400" />
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Difficulty:</span>
                <span className="font-bold">{dungeon.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Stamina Cost:</span>
                <span className="text-green-500">{dungeon.stamina_cost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Min Level:</span>
                <span>{dungeon.min_level}</span>
              </div>
            </div>

            <button
              onClick={() => handleEnter(dungeon.id)}
              className="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-medium transition"
            >
              Enter Dungeon
            </button>
          </div>
        ))}
      </div>

      {dungeons.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-400 text-lg">No dungeons available yet</p>
        </div>
      )}
    </div>
  )
}
