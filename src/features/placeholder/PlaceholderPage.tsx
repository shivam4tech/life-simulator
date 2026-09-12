import { useNavigate } from 'react-router'
import { Button, EmptyState, Sparkle } from '@/components/ui'

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
      <Button onClick={() => navigate('/my-life')}>My Life</Button>
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
