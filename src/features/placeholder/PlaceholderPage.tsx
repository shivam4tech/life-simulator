import { useNavigate } from 'react-router'
import { Button, EmptyState, Sparkle } from '@/components/ui'
import { loadDemoProfile } from '@/app/store/profile'

/**
 * PlaceholderPage — honest destinations for sprints that have not landed yet.
 * Each carries one clear next action instead of a dead end.
 */
export function PlaceholderPage({
  title,
  sprint,
  description,
}: {
  title: string
  sprint?: number
  description?: string
}) {
  const navigate = useNavigate()

  const action = (
    <div className="flex flex-wrap justify-center gap-3">
      <Button variant="primary" onClick={() => navigate('/create')}>
        Create my life
      </Button>
      <Button
        onClick={() => {
          loadDemoProfile()
          navigate('/my-life')
        }}
      >
        Try the example
      </Button>
    </div>
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <EmptyState
        title={sprint ? `${title} — arrives in Sprint ${sprint}` : title}
        description={
          description ??
          'This destination is reserved. The shell is in place so the product can grow without moving the furniture later.'
        }
        icon={<Sparkle className="size-6" />}
        action={title === 'Not found' ? <Button onClick={() => navigate('/')}>Back home</Button> : action}
      />
    </div>
  )
}

/** /create — character creation is Sprint 2's deliverable; invite experimentation now. */
export function CreatePage() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <EmptyState
        title="Build your present — arrives in Sprint 2"
        description="Chaptered character creation is next: who you are, where you live, education, work, money, household, relationships, health, behaviour and goals. For now, explore the simulator with a clearly fictional example."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => {
                loadDemoProfile()
                navigate('/my-life')
              }}
            >
              Explore the example life
            </Button>
          </div>
        }
      />
    </div>
  )
}
