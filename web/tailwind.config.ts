import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        rarity: {
          common: '#9ca3af',
          uncommon: '#4ade80',
          rare: '#3b82f6',
          epic: '#a855f7',
          legendary: '#eab308',
          mythic: '#ec4899',
          ancient: '#f97316',
        },
      },
    },
  },
  plugins: [],
}
export default config
