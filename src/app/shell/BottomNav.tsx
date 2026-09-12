import { NavLink } from 'react-router'
import { MOBILE_NAV_ITEMS } from './nav'
import { cn } from '@/utils/cn'

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-20 flex items-stretch justify-around border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {MOBILE_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            cn(
              'flex min-w-14 flex-col items-center gap-0.5 px-2 py-2 text-[10px] transition-colors duration-150',
              isActive ? 'text-accent' : 'text-muted hover:text-fg',
            )
          }
        >
          {item.icon}
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
