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
  {
    id: 'gilded-age',
    name: 'Gilded Age',
    colors: [
      { label: 'Background', value: '#0d0a02' },
      { label: 'Card', value: '#1e1810' },
      { label: 'Gold', value: '#c9a84c' },
      { label: 'Emerald', value: '#2d8a5e' },
      { label: 'Ruby', value: '#8c2a2a' },
      { label: 'Amethyst', value: '#7a4a8c' },
    ],
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    colors: [
      { label: 'Background', value: '#0a001a' },
      { label: 'Card', value: '#1a0033' },
      { label: 'Cyan', value: '#00e5ff' },
      { label: 'Neon', value: '#00ff7f' },
      { label: 'Pink', value: '#ff0066' },
      { label: 'Magenta', value: '#ff00ff' },
    ],
  },
  {
    id: 'canopy',
    name: 'Canopy',
    colors: [
      { label: 'Forest', value: '#1a2418' },
      { label: 'Card', value: '#243020' },
      { label: 'Teal', value: '#4a8a7a' },
      { label: 'Moss', value: '#5a8a4a' },
      { label: 'Rust', value: '#8a4a3a' },
      { label: 'Amber', value: '#c8a84a' },
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
