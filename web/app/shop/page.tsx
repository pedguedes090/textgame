'use client'

import { useState, useEffect } from 'react'
import { shopApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Loader2, ShoppingCart } from 'lucide-react'

export default function ShopPage() {
  const { refreshProfile } = useAuthStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadShop()
  }, [])

  const loadShop = async () => {
    try {
      const response = await shopApi.list()
      setItems(response.data)
    } catch (error) {
      toast.error('Failed to load shop')
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async (itemId: number, price: number) => {
    try {
      await shopApi.buy(itemId, 1)
      toast.success('Item purchased!')
      await refreshProfile()
      loadShop()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Purchase failed')
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
        <h1 className="text-3xl font-bold mb-2">Shop</h1>
        <p className="text-gray-400">Purchase items with gold or gems</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item: any) => (
          <div key={item.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">{item.name}</h3>
            <p className="text-sm text-gray-400 mb-4">{item.description}</p>

            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">
                {item.currency === 'gold' ? '💰' : '💎'} {item.price}
              </div>
              <button
                onClick={() => handleBuy(item.id, item.price)}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded font-medium transition"
              >
                <ShoppingCart className="w-4 h-4" />
                Buy
              </button>
            </div>

            {item.stock && (
              <div className="mt-2 text-xs text-gray-500">
                Stock: {item.current_stock} / {item.max_stock}
              </div>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-400 text-lg">Shop is empty</p>
        </div>
      )}
    </div>
  )
}
