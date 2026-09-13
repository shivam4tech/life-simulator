import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, InlineNotice, TextInput } from '@/components/ui'
import { useProfileStore } from '@/app/store/profile'
import {
  useSaveSlotsStore,
  exportLifeJson,
  importLifeJson,
} from '@/simulation/save-slots'
import { getCountryProfile } from '@/data/countries'
import { Section } from '@/features/shared/Section'

/**
 * My Lives (Sprint 10) — save slots, export/import, privacy-first sharing.
 */
export function MyLivesPage() {
  const navigate = useNavigate()
  const currentProfile = useProfileStore((state) => state.profile)
  const setProfile = useProfileStore((state) => state.setProfile)
  const { slots, saveSlot, loadSlot, deleteSlot } = useSaveSlotsStore()

  const [slotName, setSlotName] = useState('')
  const [importJson, setImportJson] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const save = () => {
    if (!currentProfile) return
    saveSlot(slotName || currentProfile.displayName || 'My life', currentProfile)
    setSlotName('')
  }

  const downloadJson = (profile: Parameters<typeof exportLifeJson>[0], name: string) => {
    const blob = new Blob([exportLifeJson(profile)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${name.replace(/[^a-z0-9-_ ]/gi, '_')}.life.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const doImport = (json: string) => {
    const profile = importLifeJson(json)
    if (!profile) {
      setImportError('That doesn’t look like a Life Simulator share file. Check the content and try again.')
      return
    }
    setImportError(null)
    setProfile(profile)
    navigate('/my-life')
  }

  const open = (id: string) => {
    const profile = loadSlot(id)
    if (profile) {
      setProfile(profile)
      navigate('/my-life')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <p className="text-[11px] font-medium tracking-[0.2em] text-accent-strong uppercase">My Lives</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-fg">Save slots</h1>
        <p className="mt-1 text-sm text-muted">
          Multiple lives, stored locally in this browser. Export to share or back up.
        </p>
      </header>

      {currentProfile && (
        <Section title="Save the current life">
          <div className="flex flex-wrap items-center gap-3">
            <TextInput
              aria-label="Save slot name"
              value={slotName}
              onChange={(event) => setSlotName(event.target.value)}
              placeholder={currentProfile.displayName ?? 'My life'}
              className="max-w-xs flex-1"
            />
            <Button variant="primary" onClick={save}>Save slot</Button>
            <Button onClick={() => downloadJson(currentProfile, currentProfile.displayName ?? 'life')}>
              Export JSON
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-faint">
            Exported files strip your display name and city for privacy-safe sharing.
          </p>
        </Section>
      )}

      <Section title={`Saved lives (${slots.length})`} className="mt-6">
        {slots.length === 0 ? (
          <p className="text-xs text-faint">No saved lives yet. Create one and save it here.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {slots.map((slot) => {
              const country = getCountryProfile(slot.profile.demographics.countryOfResidence)
              return (
                <div key={slot.id} className="flex flex-wrap items-center gap-2 rounded-md border border-line px-3 py-2">
                  <span className="text-sm text-fg">{slot.name}</span>
                  <span className="text-[11px] text-faint tnum">
                    {country?.identity.name ?? '—'} · age {slot.profile.demographics.age?.kind === 'known' ? slot.profile.demographics.age.value : '?'} · {new Date(slot.savedAt).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-faint tnum">{slot.engineVersion.split('-')[0]}</span>
                  <span className="ml-auto flex gap-1.5">
                    <Button size="sm" onClick={() => open(slot.id)}>Open</Button>
                    <Button size="sm" variant="ghost" onClick={() => downloadJson(slot.profile, slot.name)}>Export</Button>
                    {confirmDeleteId === slot.id ? (
                      <>
                        <Button size="sm" variant="danger" onClick={() => { deleteSlot(slot.id); setConfirmDeleteId(null) }}>Confirm</Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>Keep</Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(slot.id)}>Delete</Button>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="Import a shared life" className="mt-6">
        <div className="flex flex-col gap-3">
          <TextInput
            aria-label="Import JSON"
            value={importJson}
            onChange={(event) => { setImportJson(event.target.value); setImportError(null) }}
            placeholder='Paste a .life.json payload here…'
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => doImport(importJson)} disabled={!importJson.trim()}>
              Import
            </Button>
            <Button variant="ghost" onClick={() => fileRef.current?.click()}>
              Choose file…
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => doImport(String(reader.result))
                reader.readAsText(file)
              }}
            />
          </div>
          {importError && (
            <InlineNotice tone="danger" title="Import failed">{importError}</InlineNotice>
          )}
          <p className="text-[11px] text-faint">
            Imports are validated against the current schema. Lives simulated with an older engine
            version may replay differently — the engine version is recorded in every share.
          </p>
        </div>
      </Section>
    </div>
  )
}
