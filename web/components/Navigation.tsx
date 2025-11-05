'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { 
  Home, 
  Swords, 
  Zap, 
  Package, 
  Trophy, 
  Sparkles, 
  ShoppingBag,
  ClipboardList,
  LogOut,
  User
} from 'lucide-react'
import { useEffect } from 'react'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { token, user, logout, refreshProfile } = useAuthStore()

  useEffect(() => {
    if (token && !user) {
      refreshProfile()
    }
  }, [token, user, refreshProfile])

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  if (!token) {
    return null
  }

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/hunt', icon: Swords, label: 'Hunt' },
    { href: '/dungeons', icon: Zap, label: 'Dungeons' },
    { href: '/gacha', icon: Sparkles, label: 'Gacha' },
    { href: '/creatures', icon: Package, label: 'Creatures' },
    { href: '/pvp', icon: Trophy, label: 'PvP' },
    { href: '/shop', icon: ShoppingBag, label: 'Shop' },
    { href: '/quests', icon: ClipboardList, label: 'Quests' },
  ]

  return (
    <nav className="bg-gray-900 border-b border-gray-700">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-cyan-400">
            Text RPG
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded transition ${
                    isActive
                      ? 'bg-cyan-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-4 text-sm">
                <div className="hidden sm:flex items-center gap-2 text-yellow-500">
                  <span>💰</span>
                  <span>{user.gold.toLocaleString()}</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-cyan-500">
                  <span>💎</span>
                  <span>{user.gems.toLocaleString()}</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-green-500">
                  <span>⚡</span>
                  <span>{user.stamina}/100</span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded bg-red-600 hover:bg-red-700 transition text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden pb-3 flex gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-3 py-1.5 rounded transition whitespace-nowrap text-xs ${
                  isActive
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 bg-gray-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
