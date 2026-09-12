# Design system

Dark-first ("dark observatory × strategy game × scientific instrument"), with a
clean light mode. Design judgement is informed by
[ibelick/ui-skills](https://github.com/ibelick/ui-skills) (baseline UI, motion,
accessibility guidance) — its rules, not its look.

## Tokens

All semantic tokens are CSS custom properties on `:root` (dark default) swapped
by a `.light` class (`src/styles/global.css`), mapped into Tailwind via
`@theme inline`, so utilities like `bg-surface`, `text-muted`, `border-line`
work everywhere.

| Family | Tokens |
| ------ | ------ |
| Surfaces | `bg`, `sunken`, `surface`, `raised` |
| Foreground | `fg`, `muted`, `faint` |
| Lines | `line`, `line-strong` |
| Accent (one per view) | `accent`, `accent-strong`, `accent-soft`, `on-accent` |
| Semantic | `success`, `warning`, `danger`, `danger-soft` |
| Chart categories | `career`, `money`, `relationships`, `family`, `health`, `education`, `location`, `world` |
| Motion | `--duration-fast` 120ms, `--duration` 180ms, `--duration-slow` 280ms |

Type: **Inter Variable** for UI (tabular numerals for data via `.tnum` /
`tabular-nums`), **Space Grotesk** for display headings. Radii are restrained
(4/6/8px). No decorative gradients; depth comes from surface layering and
hairlines.

## Rules (enforced in review)

- Animations touch only `transform`/`opacity`, ≤200ms for interaction feedback,
  `ease-out` entrances, respect `prefers-reduced-motion` (global kill switch).
- `h-dvh`, never `h-screen`; fixed z-index scale (10/20/30/40/50 only);
  safe-area insets on fixed mobile chrome.
- `text-balance` headings, `text-pretty` body, `tabular-nums` for data.
- Icon-only controls always carry an `aria-label`.
- Empty states offer exactly one clear next action.
- One accent colour per view.

## Primitives (`src/components/ui`)

Button, IconButton, TextInput + Field (label/description/error wiring),
NumberInput, Toggle (switch), SegmentedControl, Slider (bipolar-label capable),
Select, Combobox (searchable, cmdk-based), Tooltip, ContextualHelp
(click-based, touch-friendly), Popover, Dialog, Sheet (bottom-sheet on mobile /
right dock on desktop), Tabs, Metric, Progress, InlineNotice, EmptyState,
Skeleton, and a 16px stroke icon set.

Behaviour comes from Radix primitives (focus management, keyboard, portals);
this layer applies the Life Simulator look. Build product features from these
instead of restyling raw elements.
