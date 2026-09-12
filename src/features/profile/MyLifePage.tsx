import { useNavigate } from 'react-router'
import { Button, EmptyState } from '@/components/ui'
import { useProfileStore } from '@/app/store/profile'
import { ExampleChooser } from '@/features/onboarding/ExampleChooser'
import { ProfileSummary } from './ProfileSummary'

export function MyLifePage() {
  const navigate = useNavigate()
  const profile = useProfileStore((state) => state.profile)

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <EmptyState
          title="No life here yet"
          description="Create your starting state, or explore the simulator with a fictional example first."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="primary" onClick={() => navigate('/create')}>
                Create my life
              </Button>
              <ExampleChooser size="md" />
            </div>
          }
        />
      </div>
    )
  }

  return <ProfileSummary profile={profile} />
}
