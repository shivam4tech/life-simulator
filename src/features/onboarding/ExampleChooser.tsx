import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, InlineNotice, Sheet } from '@/components/ui'
import { EXAMPLE_PROFILES } from '@/data/example-profiles'
import { getCountryProfile } from '@/data/countries'
import { useProfileStore } from '@/app/store/profile'

/**
 * ExampleChooser — a sheet of clearly-fictional example lives so the interface
 * can be explored without onboarding.
 */
export function ExampleChooser({
  label,
  variant = 'secondary',
  size = 'lg',
}: {
  label?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'lg'
}) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const setProfile = useProfileStore((state) => state.setProfile)

  const load = (id: string) => {
    const example = EXAMPLE_PROFILES.find((entry) => entry.profile.id === id)
    if (!example) return
    setProfile(example.profile)
    setOpen(false)
    navigate('/my-life')
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        {label ?? 'Try an example'}
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Fictional example lives"
        description="None of these people exist. Load one to explore the simulator instantly."
      >
        <div className="flex flex-col gap-3">
          {EXAMPLE_PROFILES.map(({ profile, blurb }) => {
            const country = getCountryProfile(profile.demographics.countryOfResidence)
            return (
              <div
                key={profile.id}
                className="flex items-start justify-between gap-4 rounded-md border border-line p-3 transition-colors duration-150 hover:border-line-strong"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">{profile.displayName}</p>
                  <p className="mt-0.5 text-xs text-pretty text-muted">{blurb}</p>
                  <p className="mt-1.5 text-[11px] text-faint">
                    {country?.identity.name ?? profile.demographics.countryOfResidence} ·{' '}
                    {country?.identity.currency ?? '—'} ·{' '}
                    {profile.employment?.status?.replace(/-/g, ' ') ?? '—'}
                  </p>
                </div>
                <Button size="sm" onClick={() => load(profile.id)}>
                  Load
                </Button>
              </div>
            )
          })}
          <InlineNotice tone="info" className="mt-2">
            These examples exercise the simulator across different economies and household shapes —
            they encode no beliefs about any real nationality or group.
          </InlineNotice>
        </div>
      </Sheet>
    </>
  )
}
