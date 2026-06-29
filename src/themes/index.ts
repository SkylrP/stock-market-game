export interface Theme {
  id: string
  name: string
  colors: { label: string; value: string }[]
}

const THEME_STORAGE_KEY = 'stock-market-game-theme'

export const THEMES: Theme[] = [
  {
    id: 'dark-neon',
    name: 'Dark Neon',
    colors: [
      { label: 'Background', value: '#0a0a1a' },
      { label: 'Card', value: '#1a1a3e' },
      { label: 'Cyan', value: '#00d4ff' },
      { label: 'Green', value: '#00e676' },
      { label: 'Red', value: '#ff5252' },
      { label: 'Purple', value: '#bb86fc' },
    ],
  },
  {
    id: 'classic',
    name: 'Classic 60\'s',
    colors: [
      { label: 'Paper', value: '#f5f0e1' },
      { label: 'Card', value: '#e0d5be' },
      { label: 'Blue', value: '#3a6b8c' },
      { label: 'Green', value: '#5d8a5c' },
      { label: 'Red', value: '#b85c4a' },
      { label: 'Mustard', value: '#c9a84c' },
    ],
  },
]

const DEFAULT_THEME_ID = 'dark-neon'

export function loadTheme(): string {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved && THEMES.some(t => t.id === saved)) return saved
  } catch {}
  return DEFAULT_THEME_ID
}

export function saveTheme(id: string) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id)
  } catch {}
}

export function applyTheme(id: string) {
  document.documentElement.dataset.theme = id
}
