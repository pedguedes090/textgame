'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Swords, Zap, Package, Trophy, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const { token, user } = useAuthStore()

  useEffect(() => {
    if (!token) {
      router.push('/auth/login')
    }
  }, [token, router])

  if (!token || !user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Player Stats */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">Welcome, {user.username}!</h1>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-900 p-4 rounded">
            <div className="text-gray-400 text-sm">Level</div>
            <div className="text-2xl font-bold">{user.level}</div>
          </div>
          <div className="bg-gray-900 p-4 rounded">
            <div className="text-gray-400 text-sm">Gold</div>
            <div className="text-2xl font-bold text-yellow-500">{user.gold.toLocaleString()}</div>
          </div>
          <div className="bg-gray-900 p-4 rounded">
            <div className="text-gray-400 text-sm">Gems</div>
            <div className="text-2xl font-bold text-cyan-500">{user.gems.toLocaleString()}</div>
          </div>
          <div className="bg-gray-900 p-4 rounded">
            <div className="text-gray-400 text-sm">Stamina</div>
            <div className="text-2xl font-bold text-green-500">{user.stamina}/100</div>
          </div>
          <div className="bg-gray-900 p-4 rounded">
            <div className="text-gray-400 text-sm">EXP</div>
            <div className="text-2xl font-bold">{user.exp.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/hunt">
          <div className="bg-gradient-to-br from-green-900 to-green-800 border border-green-700 rounded-lg p-6 hover:from-green-800 hover:to-green-700 transition cursor-pointer">
            <div className="flex items-center gap-4">
              <Swords className="w-12 h-12 text-green-300" />
              <div>
                <h2 className="text-xl font-bold">Hunt Creatures</h2>
                <p className="text-green-200 text-sm">Catch wild creatures</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/dungeons">
          <div className="bg-gradient-to-br from-red-900 to-red-800 border border-red-700 rounded-lg p-6 hover:from-red-800 hover:to-red-700 transition cursor-pointer">
            <div className="flex items-center gap-4">
              <Zap className="w-12 h-12 text-red-300" />
              <div>
                <h2 className="text-xl font-bold">Dungeons</h2>
                <p className="text-red-200 text-sm">Challenge dungeons</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/gacha">
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-700 rounded-lg p-6 hover:from-purple-800 hover:to-purple-700 transition cursor-pointer">
            <div className="flex items-center gap-4">
              <Sparkles className="w-12 h-12 text-purple-300" />
              <div>
                <h2 className="text-xl font-bold">Gacha</h2>
                <p className="text-purple-200 text-sm">Summon rare items</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/creatures">
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-700 rounded-lg p-6 hover:from-blue-800 hover:to-blue-700 transition cursor-pointer">
            <div className="flex items-center gap-4">
              <Package className="w-12 h-12 text-blue-300" />
              <div>
                <h2 className="text-xl font-bold">My Creatures</h2>
                <p className="text-blue-200 text-sm">View collection</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/pvp">
          <div className="bg-gradient-to-br from-orange-900 to-orange-800 border border-orange-700 rounded-lg p-6 hover:from-orange-800 hover:to-orange-700 transition cursor-pointer">
            <div className="flex items-center gap-4">
              <Trophy className="w-12 h-12 text-orange-300" />
              <div>
                <h2 className="text-xl font-bold">PvP Arena</h2>
                <p className="text-orange-200 text-sm">Battle players</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/quests">
          <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 border border-yellow-700 rounded-lg p-6 hover:from-yellow-800 hover:to-yellow-700 transition cursor-pointer">
            <div className="flex items-center gap-4">
              <Package className="w-12 h-12 text-yellow-300" />
              <div>
                <h2 className="text-xl font-bold">Quests</h2>
                <p className="text-yellow-200 text-sm">Complete missions</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Game Tips */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Game Tips</h2>
        <ul className="space-y-2 text-gray-300">
          <li>• Stamina regenerates 1 point every 5 minutes</li>
          <li>• Hunt creatures to build your collection</li>
          <li>• Complete daily quests for bonus rewards</li>
          <li>• Gacha has a pity system - guaranteed legendary after 50 pulls</li>
          <li>• Enhance your items to increase their power</li>
        </ul>
      </div>
    </div>
  )
}
