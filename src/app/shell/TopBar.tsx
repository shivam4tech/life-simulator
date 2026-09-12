import { useThemeStore } from '@/app/store/theme'
import { IconButton, Moon, Sun } from '@/components/ui'

export function TopBar() {
  const { theme, toggle } = useThemeStore()
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4 md:px-6">
      <p className="font-display text-sm font-semibold text-fg md:hidden">Life Simulator</p>
      <p className="hidden text-xs text-faint md:block">
        Modelled scenarios · not predictions · not advice
      </p>
      <IconButton
        size="sm"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggle}
      >
        {theme === 'dark' ? <Sun /> : <Moon />}
      </IconButton>
    </header>
  )
}
