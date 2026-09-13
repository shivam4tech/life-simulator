import { Routes, Route } from 'react-router'
import { AppShell } from './shell/AppShell'
import { LandingPage } from '@/features/landing/LandingPage'
import { MyLifePage } from '@/features/profile/MyLifePage'
import { AssumptionsPage } from '@/features/assumptions/AssumptionsPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { SimulationPage } from '@/features/futures/SimulationPage'
import { TimelinePage } from '@/features/timeline/TimelinePage'
import { ScenarioLabPage } from '@/features/scenario-lab/ScenarioLabPage'
import { MultiversePage } from '@/features/multiverse/MultiversePage'
import { MyLivesPage } from '@/features/lives/MyLivesPage'
import { PlaceholderPage } from '@/features/placeholder/PlaceholderPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<LandingPage />} />
        <Route path="/my-life" element={<MyLifePage />} />
        <Route path="/assumptions" element={<AssumptionsPage />} />
        <Route path="/create" element={<OnboardingPage />} />
        <Route path="/futures" element={<SimulationPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/scenario-lab" element={<ScenarioLabPage />} />
        <Route path="/multiverse" element={<MultiversePage />} />
        <Route path="/lives" element={<MyLivesPage />} />
        <Route path="*" element={<PlaceholderPage title="Not found" />} />
      </Route>
    </Routes>
  )
}
