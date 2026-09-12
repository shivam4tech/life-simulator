import { create } from 'zustand'
import { THEME_STORAGE_KEY } from '@/data/demo-constants'

export type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('light', theme === 'light')
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = theme === 'light' ? '#f8f9fb' : '#0c0f14'
}

const readStoredTheme = (): Theme => {
  if (typeof localStorage === 'undefined') return 'dark'
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

const persistTheme = (theme: Theme) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* storage unavailable — theme stays session-only */
  }
}

const initialTheme = readStoredTheme()
applyTheme(initialTheme)

export const useThemeStore = create<ThemeState>()((set, get) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    applyTheme(theme)
    persistTheme(theme)
    set({ theme })
  },
  toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}))
