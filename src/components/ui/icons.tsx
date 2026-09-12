import type { SVGProps } from 'react'

/**
 * Minimal 16px stroke icon set — consistent weight, currentColor.
 * Icon-only usages must provide an accessible name (aria-label or sr-only text).
 */

type IconProps = SVGProps<SVGSVGElement>

const base = (props: IconProps) => ({
  viewBox: '0 0 16 16',
  width: 16,
  height: 16,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export const Home = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M2.5 6.5 8 2.5l5.5 4V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V6.5Z" />
    <path d="M6.5 13.5V9h3v4.5" />
  </svg>
)

export const Person = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="8" cy="5" r="2.5" />
    <path d="M3 13.5c.5-3 2.5-4.5 5-4.5s4.5 1.5 5 4.5" />
  </svg>
)

export const TimelineIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M3 2.5v11" />
    <circle cx="6.5" cy="5" r="1.2" />
    <circle cx="10" cy="8.5" r="1.2" />
    <circle cx="7" cy="12" r="1.2" />
    <path d="M7.7 5H12.5M11.2 8.5h1.3M8.2 12h4.3" />
  </svg>
)

export const Branch = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 13.5v-11" />
    <path d="M4 4.5c4 0 3 3.5 7 3.5" />
    <path d="M4 9.5c4 0 3 4 7 4" />
  </svg>
)

export const Flask = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 2.5h4M7 2.5v4L3.8 12a1 1 0 0 0 .9 1.5h6.6a1 1 0 0 0 .9-1.5L9 6.5v-4" />
    <path d="M5.2 10h5.6" />
  </svg>
)

export const Sliders = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M2.5 5h8M12.5 5h1M2.5 11h1M5.5 11h8" />
    <circle cx="11.5" cy="5" r="1.4" />
    <circle cx="4.5" cy="11" r="1.4" />
  </svg>
)

export const Info = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M8 7.5V11" />
    <path d="M8 5.2v.2" strokeWidth="1.8" />
  </svg>
)

export const Globe = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M2.5 8h11M8 2.5c1.8 1.6 2.6 3.4 2.6 5.5S9.8 11.9 8 13.5C6.2 11.9 5.4 10.1 5.4 8S6.2 4.1 8 2.5Z" />
  </svg>
)

export const Sparkle = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M8 2.5 9.4 6 13 7.4 9.4 8.8 8 12.4 6.6 8.8 3 7.4 6.6 6 8 2.5Z" />
  </svg>
)

export const Play = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M5.5 3.5v9l7-4.5-7-4.5Z" />
  </svg>
)

export const Sun = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M12.6 3.4l-1 1M4.4 11.6l-1 1" />
  </svg>
)

export const Moon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5Z" />
  </svg>
)

export const Compass = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="m10.5 5.5-1.6 3.4-3.4 1.6 1.6-3.4 3.4-1.6Z" />
  </svg>
)

export const Shield = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M8 2.5 13 4v4.2c0 2.8-2.1 4.6-5 5.3-2.9-.7-5-2.5-5-5.3V4l5-1.5Z" />
  </svg>
)
