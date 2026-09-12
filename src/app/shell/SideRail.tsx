import { NavLink } from 'react-router'
import { NAV_ITEMS, type NavItem } from './nav'
import { cn } from '@/utils/cn'

const RailLink = ({ item }: { item: NavItem }) => (
  <NavLink
    to={item.to}
    end={item.to === '/'}
    className={({ isActive }) =>
      cn(
        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150',
        isActive
          ? 'bg-accent-soft text-fg'
          : 'text-muted hover:bg-raised hover:text-fg',
      )
    }
  >
    <span className={cn('shrink-0', 'text-inherit')}>{item.icon}</span>
    <span className="truncate">{item.label}</span>
    {item.arrivesInSprint && (
      <span className="ml-auto rounded-sm border border-line px-1 py-px text-[10px] text-faint">
        S{item.arrivesInSprint}
      </span>
    )}
  </NavLink>
)

export function SideRail() {
  return (
    <nav
      aria-label="Primary"
      className="hidden w-56 shrink-0 flex-col gap-1 border-r border-line bg-sunken/60 p-3 md:flex"
    >
      <div className="mb-4 flex items-center gap-2.5 px-2 pt-1">
        <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
          <rect width="32" height="32" rx="7" className="fill-sunken" />
          <path
            d="M6 24 C 12 22, 13 14, 16 12 C 19 10, 22 9, 26 5"
            fill="none"
            className="stroke-accent"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M16 12 C 18 14, 21 17, 26 18"
            fill="none"
            className="stroke-line-strong"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="16" cy="12" r="2.2" className="fill-fg" />
        </svg>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold text-fg">Life Simulator</p>
          <p className="text-[10px] text-faint">possibility space</p>
        </div>
      </div>
      {NAV_ITEMS.map((item) => (
        <RailLink key={item.to} item={item} />
      ))}
      <div className="mt-auto px-3 pt-4">
        <p className="text-[10px] leading-relaxed text-faint">
          Modelled scenarios, not predictions or advice.
        </p>
      </div>
    </nav>
  )
}
