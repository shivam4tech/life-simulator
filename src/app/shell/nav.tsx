import type { ReactNode } from 'react'
import { Branch, Compass, Flask, Globe, Home, Person, Shield, Sliders, TimelineIcon } from '@/components/ui'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  /** Sprint in which this destination becomes fully real (present = live now). */
  arrivesInSprint?: number
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Home', icon: <Home /> },
  { to: '/my-life', label: 'My Life', icon: <Person /> },
  { to: '/timeline', label: 'Timeline', icon: <TimelineIcon /> },
  { to: '/futures', label: 'Futures', icon: <Branch /> },
  { to: '/scenario-lab', label: 'Scenario Lab', icon: <Flask /> },
  { to: '/multiverse', label: 'Multiverse', icon: <Globe /> },
  { to: '/lives', label: 'My Lives', icon: <Shield /> },
  { to: '/assumptions', label: 'Assumptions', icon: <Sliders /> },
] as const

/** Compact variant for the mobile bottom bar (drop one to keep taps comfortable). */
export const MOBILE_NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Home', icon: <Home /> },
  { to: '/my-life', label: 'My Life', icon: <Person /> },
  { to: '/timeline', label: 'Timeline', icon: <TimelineIcon /> },
  { to: '/futures', label: 'Futures', icon: <Branch /> },
  { to: '/assumptions', label: 'Assumptions', icon: <Compass /> },
] as const
