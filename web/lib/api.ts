import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// API methods
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
}

export const huntApi = {
  start: (clientSeed?: string) =>
    api.post('/hunt/start', { client_seed: clientSeed }),
}

export const gachaApi = {
  pull: (bannerId: string, clientSeed?: string) =>
    api.post('/gacha/pull', { banner_id: bannerId, client_seed: clientSeed }),
}

export const dungeonApi = {
  list: () => api.get('/dungeons'),
  enter: (dungeonId: number, partyId: number) =>
    api.post('/dungeons/enter', { dungeon_id: dungeonId, party_id: partyId }),
}

export const creatureApi = {
  list: () => api.get('/creatures'),
  detail: (id: number) => api.get(`/creatures/${id}`),
  levelUp: (id: number) => api.post(`/creatures/${id}/level-up`),
}

export const partyApi = {
  list: () => api.get('/party'),
  create: (name: string, creatureIds: number[]) =>
    api.post('/party', { name, creature_ids: creatureIds }),
  update: (id: number, creatureIds: number[]) =>
    api.patch(`/party/${id}`, { creature_ids: creatureIds }),
  setActive: (id: number) => api.post(`/party/${id}/set-active`),
}

export const pvpApi = {
  queue: (season?: string) => api.get('/pvp/queue', { params: { season } }),
  submitResult: (matchId: string, result: string, proof?: string) =>
    api.post('/pvp/result', { match_id: matchId, result, proof }),
}

export const questApi = {
  list: () => api.get('/quests'),
  claim: (questId: number) => api.post(`/quests/${questId}/claim`),
}

export const shopApi = {
  list: () => api.get('/shop'),
  buy: (itemId: number, quantity: number) =>
    api.post('/shop/buy', { item_id: itemId, quantity }),
}

export const itemApi = {
  inventory: () => api.get('/items/inventory'),
  enhance: (itemId: number) => api.post(`/items/${itemId}/enhance`),
}

export const leaderboardApi = {
  getPvp: (season?: string) => api.get('/leaderboard/pvp', { params: { season } }),
  getPower: () => api.get('/leaderboard/power'),
}

export const userApi = {
  dailyReward: () => api.post('/user/daily-reward'),
}
